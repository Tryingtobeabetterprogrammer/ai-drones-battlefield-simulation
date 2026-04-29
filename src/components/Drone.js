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
  const { setDrones, rfStatus } = useSimulation();
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

  // 🚀 SMOOTH MOVEMENT LOGIC
  const targetVec = useMemo(() => new THREE.Vector3(...drone.target), [drone.target]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const isJammed = rfStatus === 'JAMMING';
    const isAI = drone.isAI;
    
    // 🔹 2. Update Swarm Store (Real-time tracking)
    updateDrone(drone.id, [groupRef.current.position.x, groupRef.current.position.y, groupRef.current.position.z], isAI, trust.current);

    // 🔹 3. Update Trust Logic (Throttled to 0.2s)
    if (t - lastUpdate.current > 0.2) {
      lastUpdate.current = t;

      if (isJammed) {
        if (!isAI) {
          // ❌ Non-AI behaving badly
          beta.current += 0.05;
        } else {
          // 🤖 AI adapting well
          alpha.current += 0.02;
          beta.current += 0.005; // slight penalty for realism
        }
      } else {
        // normal behavior builds trust
        alpha.current += 0.01;
      }

      // 🔹 3. Calculate Trust Score
      trust.current = alpha.current / (alpha.current + beta.current);
      
      // 🔥 3. Blockchain Logs / Status transitions
      // 1. WARNING: Trust dropping
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

      // 2. ISOLATION: High risk
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

      // 3. CRASH: Mission failure
      if (trust.current < 0.3 && status.current !== "CRASHED") {
        status.current = "CRASHED";

        addBlock({
          droneId: drone.id,
          type: "CRASH",
          message: `${drone.id} Crashed: System critical.`,
          trust: trust.current.toFixed(2),
        });
        
        // Also sync to legacy logs
        addLog('DRONE_CRASHED', `${drone.id} isolated and terminated.`);
      } else if (trust.current < 0.6 && status.current === "NORMAL") {
        status.current = "COMPROMISED";
      } else if (trust.current >= 0.6 && status.current !== "NORMAL") {
        status.current = "NORMAL";
      }

      // Update display state
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
      // falling animation
      groupRef.current.position.y -= 0.05;
      groupRef.current.rotation.z += 0.1;
      groupRef.current.rotation.x += 0.05;
      
      // Stop falling at ground level
      if (groupRef.current.position.y < -0.8) {
        groupRef.current.position.y = -0.8;
      }
      return;
    }

    // Normal lerp movement
    let baseSpeed = status.current === "COMPROMISED" ? 0.01 : 0.03;
    const personalitySpeed = baseSpeed + (idSeed % 0.02);
    
    // Add slight "organic" deviation
    const jitterX = Math.sin(t * 0.5 + idSeed) * 0.1;
    const jitterZ = Math.cos(t * 0.5 + idSeed) * 0.1;
    const adjustedTarget = targetVec.clone().add(new THREE.Vector3(jitterX, 0, jitterZ));

    // Movement Logic
    if (isJammed && !isAI) {
      // ❌ Non-AI instability during jam
      groupRef.current.position.x += Math.sin(t * 5 + idSeed) * 0.05;
      groupRef.current.position.z += Math.cos(t * 4 + idSeed) * 0.05;
      groupRef.current.position.y -= 0.01;
      groupRef.current.rotation.z += 0.02;
    } else {
      groupRef.current.position.lerp(adjustedTarget, personalitySpeed);
      
      // 🔥 AI Swarm Cooperation Logic
      if (isAI && isJammed) {
        // Find other active AI drones
        const activeAIs = swarmDrones.filter(d => d.isAI && d.trust > 0.3 && d.id !== drone.id);
        
        if (activeAIs.length > 0) {
          const aiCenter = new THREE.Vector3();
          activeAIs.forEach(d => aiCenter.add(new THREE.Vector3(...d.position)));
          aiCenter.divideScalar(activeAIs.length);
          
          // Move toward AI center for resilience
          groupRef.current.position.lerp(aiCenter, 0.01);
          
          // Stabilize rotation
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
    const shouldRotate = !isJammed || isAI;
    
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

  const droneStatus = status.current === "CRASHED" ? 'COMPROMISED' : status.current === "COMPROMISED" ? 'WARNING' : 'NORMAL';

  return (
    <group ref={groupRef}>
      <DroneModel color={color} status={droneStatus} />

      {/* 🔥 BONUS: Show Trust Value above drone */}
      <Text 
        position={[0, 1.2, 0]} 
        fontSize={0.2} 
        color={color}
        anchorY="bottom"
      >
        {displayTrust.toFixed(2)}
      </Text>
      
      {/* Tactical Spotlight beneath the drone - pointed down */}
      <spotLight 
        position={[0, -0.2, 0]} 
        target-position={[0, -10, 0]}
        angle={0.8} 
        penumbra={0.5} 
        intensity={drone.status === 'COMPROMISED' ? 0 : 20} 
        color={color} 
        castShadow
      />

      {/* Label - Tactical HUD with ID */}
      <Html distanceFactor={20} center position={[0, 1.8, 0]}>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 mb-1">
             <span className={`px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-tighter rounded ${drone.isAI ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'}`}>
               {drone.isAI ? '🤖 AI' : '❌ Non-AI'}
             </span>
          </div>
          <div className="px-3 py-1 text-[10px] font-bold font-sans rounded bg-black/80 backdrop-blur-md border border-white/20 text-white shadow-2xl whitespace-nowrap uppercase tracking-widest flex items-center gap-2">
            <span>{drone.id}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${color === '#33ff55' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
          </div>
        </div>
      </Html>
    </group>
  );
};

export const Drone = React.memo(DroneComponent);


