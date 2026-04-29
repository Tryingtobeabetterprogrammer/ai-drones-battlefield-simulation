import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { DroneModel } from './DroneModel';
import { useSimulation } from '../context/SimulationContext';
import { useLogs } from '../hooks/useLogs';
import { useSwarm } from '../hooks/useSwarm';

const DroneComponent = ({ drone }) => {
  const groupRef = useRef();
  const { setDrones, rfMode } = useSimulation();
  const addBlock = useLogs((s) => s.addBlock);
  const { drones: swarmDrones, updateDrone, removeDrone } = useSwarm();

  // 🔹 1. Add Trust State to Drone
  const alpha = useRef(drone.isAI ? 10 : 5);  // start with some trust
  const beta = useRef(1);
  const trust = useRef(0.8);
  const lastUpdate = useRef(0);
  
  const status = useRef("NORMAL"); // NORMAL | COMPROMISED | CRASHED
  const hasLoggedWarning = useRef(false);
  const hasLoggedIsolation = useRef(false);
  
  const { addLog } = useSimulation();
  const [displayTrust, setDisplayTrust] = useState(0.8);

  // Clean up from swarm store on unmount
  useEffect(() => {
    return () => removeDrone(drone.id);
  }, [drone.id, removeDrone]);

  // 🔹 RESET LOGIC: Restore internal state when simulation resets
  useEffect(() => {
    if (drone.trustScore === 1.0) {
      alpha.current = drone.isAI ? 10 : 5;
      beta.current = 1;
      trust.current = 1.0;
      status.current = "NORMAL";
      hasLoggedWarning.current = false;
      hasLoggedIsolation.current = false;
      setDisplayTrust(1.0);
    }
  }, [drone.trustScore, drone.isAI]);

  // 🚀 SMOOTH MOVEMENT LOGIC
  const targetVec = useMemo(() => new THREE.Vector3(...drone.target), [drone.target]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const isJammed = rfMode !== 'NORMAL';
    const isAI = drone.isAI;
    
    // Jamming Flags
    const isRF = rfMode === 'RF' || rfMode === 'FULL';
    const isGPS = rfMode === 'GPS' || rfMode === 'FULL';
    const isControl = rfMode === 'CONTROL' || rfMode === 'FULL';
    const isData = rfMode === 'DATA' || rfMode === 'FULL';

    // 🔹 2. Update Swarm Store (Real-time tracking)
    updateDrone(drone.id, [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z], isAI, trust.current);

    // 🔹 3. Update Trust Logic (Throttled to 0.2s)
    if (t - lastUpdate.current > 0.2) {
      lastUpdate.current = t;

      if (isJammed) {
        if (!isAI) {
          // ❌ Non-AI behaving badly
          let penalty = 0.05;
          if (rfMode === 'FULL') penalty = 0.15; // Faster crash in Full Spectrum
          beta.current += penalty;
        } else {
          // 🤖 AI adapting well
          alpha.current += 0.02;
          beta.current += (rfMode === 'FULL' ? 0.02 : 0.005); 
        }
      } else {
        // normal behavior builds trust
        alpha.current += 0.01;
      }

      // 🔹 3. Calculate Trust Score
      trust.current = alpha.current / (alpha.current + beta.current);
      
      // 🔥 3. Blockchain Logs / Status transitions
      if (trust.current < 0.65 && !hasLoggedWarning.current) {
        addBlock({
          droneId: drone.id,
          type: "WARNING",
          message: `${drone.id} Trust dropped below threshold (${(trust.current * 100).toFixed(0)}%)`,
          trust: trust.current.toFixed(2),
        });
        hasLoggedWarning.current = true;
      } else if (trust.current >= 0.65) {
        hasLoggedWarning.current = false;
      }

      if (trust.current < 0.45 && !hasLoggedIsolation.current) {
        addBlock({
          droneId: drone.id,
          type: "ALERT",
          message: `${drone.id} Isolated: Network severed.`,
          trust: trust.current.toFixed(2),
        });
        hasLoggedIsolation.current = true;
      } else if (trust.current >= 0.45) {
        hasLoggedIsolation.current = false;
      }

      if (trust.current < 0.3 && status.current !== "CRASHED") {
        status.current = "CRASHED";
        addBlock({
          droneId: drone.id,
          type: "CRASH",
          message: `${drone.id} Crashed: System critical.`,
          trust: trust.current.toFixed(2),
        });
        addLog('DRONE_CRASHED', `${drone.id} isolated and terminated.`);
      } else if (trust.current < 0.6 && status.current === "NORMAL") {
        status.current = "COMPROMISED";
      } else if (trust.current >= 0.6 && status.current !== "NORMAL") {
        status.current = "NORMAL";
      }

      setDisplayTrust(trust.current);
      
      // Sync back to simulation state
      setDrones(prevDrones => prevDrones.map(d => 
        d.id === drone.id ? { 
          ...d, 
          position: [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z],
          trustScore: trust.current,
          status: status.current === "CRASHED" ? 'COMPROMISED' : status.current === "COMPROMISED" ? 'WARNING' : 'NORMAL'
        } : d
      ));
    }

    // --- Movement / Behavior ---
    const idSeed = drone.id.length * 0.1;
    
    if (status.current === "CRASHED") {
      groupRef.current.position.y -= 0.05;
      groupRef.current.rotation.z += 0.1;
      groupRef.current.rotation.x += 0.05;
      if (groupRef.current.position.y < -0.8) groupRef.current.position.y = -0.8;
      return;
    }

    // Normal lerp movement
    let baseSpeed = status.current === "COMPROMISED" ? 0.01 : 0.03;
    let personalitySpeed = baseSpeed + (idSeed % 0.02);
    
    // Apply DATA/VIDEO Jamming effect (Jitter/Lag)
    if (isData && !isAI) {
      personalitySpeed *= 0.3; // Dramatic lag
      groupRef.current.position.x += Math.sin(t * 20) * 0.02; // Jitter
      groupRef.current.position.z += Math.cos(t * 20) * 0.02;
    }

    // Apply CONTROL SIGNAL Jamming (Freeze/Failure)
    if (isControl && !isAI) {
      // Frozen in place with slight wobble
      groupRef.current.position.x += Math.sin(t * 2) * 0.005;
      groupRef.current.position.z += Math.cos(t * 2) * 0.005;
      groupRef.current.position.y -= 0.001; // slow sink
      return; // Stop processing further movement
    }

    // GPS Jamming (Random drift)
    let jitterX = Math.sin(t * 0.5 + idSeed) * 0.1;
    let jitterZ = Math.cos(t * 0.5 + idSeed) * 0.1;
    
    if (isGPS && !isAI) {
      jitterX += Math.sin(t * 0.2) * 4; // Large drift
      jitterZ += Math.cos(t * 0.3) * 4;
    }

    const adjustedTarget = targetVec.clone().add(new THREE.Vector3(jitterX, 0, jitterZ));

    // RF Jamming Instability
    if (isRF && !isAI) {
      groupRef.current.position.x += Math.sin(t * 5 + idSeed) * 0.05;
      groupRef.current.position.z += Math.cos(t * 4 + idSeed) * 0.05;
      groupRef.current.position.y -= 0.01;
      groupRef.current.rotation.z += 0.02;
    } else {
      groupRef.current.position.lerp(adjustedTarget, personalitySpeed);
      
      // AI Swarm Cooperation Logic
      if (isAI && isJammed) {
        const activeAIs = swarmDrones.filter(d => d.isAI && d.trust > 0.3 && d.id !== drone.id);
        if (activeAIs.length > 0) {
          const aiCenter = new THREE.Vector3();
          activeAIs.forEach(d => aiCenter.add(new THREE.Vector3(...d.position)));
          aiCenter.divideScalar(activeAIs.length);
          groupRef.current.position.lerp(aiCenter, 0.015);
          groupRef.current.rotation.z *= 0.9;
          groupRef.current.rotation.x *= 0.9;
        }
      }

      // Hover bobbing
      const bobbing = Math.sin(t * (1.5 + idSeed % 1) + idSeed) * 0.002;
      groupRef.current.position.y += bobbing;
    }

    // Tilting/Rotation
    const dx = adjustedTarget.x - groupRef.current.position.x;
    const dz = adjustedTarget.z - groupRef.current.position.z;
    const shouldRotate = !isControl && (!isRF || isAI);
    
    if (shouldRotate) {
      const targetRotation = Math.atan2(dx, dz);
      let deltaAngle = targetRotation - groupRef.current.rotation.y;
      while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
      while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      groupRef.current.rotation.y += deltaAngle * 0.05;

      const dist = Math.sqrt(dx*dx + dz*dz);
      const tiltAmount = Math.min(dist * 0.02, 0.15);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tiltAmount, 0.1);
    }
  });

  // --- Color states ---
  let color = "#33ff55"; // green
  if (displayTrust < 0.6) color = "#ffaa00"; // yellow
  if (displayTrust < 0.3) color = "#ff1111"; // red
  
  // AI Drones get a cyan/blue glow when healthy
  if (drone.isAI && displayTrust > 0.6) color = "#00f2ff"; 
  // Failed drones are dark red
  if (displayTrust < 0.3) color = "#880000";

  const { isOpticalMode } = useSimulation();
  const droneStatus = status.current === "CRASHED" ? 'COMPROMISED' : status.current === "COMPROMISED" ? 'WARNING' : 'NORMAL';

  return (
    <group ref={groupRef}>
      <DroneModel color={color} status={droneStatus} />

      {/* 🧠 DRONE FEEDBACK: Show AI status and Trust */}
      <group position={[0, 1.4, 0]}>
        <Text 
          fontSize={0.15} 
          color={drone.isAI ? "#00f2ff" : "#aaaaaa"}
          anchorY="bottom"
          position={[0, 0.25, 0]}
          font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff"
        >
          {drone.isAI ? "AI ✓" : "NON-AI ✕"}
        </Text>
        
        {isOpticalMode && (
          <Text 
            fontSize={0.18} 
            color={drone.isAI && displayTrust > 0.5 ? "#ff3333" : "#ff0000"}
            anchorY="bottom"
            position={[0, 0.5, 0]}
            fontWeight="bold"
          >
            {drone.isAI && displayTrust > 0.5 ? "✔ VALID" : "✖ REJECTED"}
          </Text>
        )}

        <Text 
          fontSize={0.12} 
          color={color}
          anchorY="bottom"
        >
          TRUST: {(displayTrust * 100).toFixed(0)}%
        </Text>
      </group>
      
      {/* Tactical Spotlight */}
      <spotLight 
        position={[0, -0.2, 0]} 
        target-position={[0, -10, 0]}
        angle={0.8} 
        penumbra={0.5} 
        intensity={status.current === 'CRASHED' ? 0 : 20} 
        color={color} 
        castShadow
      />

      {/* Label - Tactical HUD */}
      <Html distanceFactor={20} center position={[0, 2.2, 0]}>
        <div className="flex flex-col items-center gap-1">
          <div className="px-3 py-1 text-[10px] font-bold font-sans rounded bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-2xl whitespace-nowrap uppercase tracking-widest flex items-center gap-2">
            <span>{drone.id}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${displayTrust > 0.3 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          </div>
        </div>
      </Html>
    </group>
  );
};

export const Drone = React.memo(DroneComponent);


