import React from 'react';
import { Line } from '@react-three/drei';
import { useSimulation } from '../context/SimulationContext';
import { Drone } from './Drone';
import { useSwarm } from '../hooks/useSwarm';

const SwarmComponent = () => {
  const { drones: simulationDrones, rfMode, isOpticalMode } = useSimulation();
  const { drones: swarmPositions } = useSwarm();

  // Generate communication links based on real-time positions
  const links = [];
  
  // We use the persistent simulation drones for the Drone components
  // but use the swarmPositions for high-frequency link calculations
  for (let i = 0; i < swarmPositions.length; i++) {
    for (let j = i + 1; j < swarmPositions.length; j++) {
      const d1 = swarmPositions[j]; // The drones in swarmPositions are {id, position, isAI, trust}
      const d2 = swarmPositions[i];
      
      const dx = d1.position[0] - d2.position[0];
      const dy = d1.position[1] - d2.position[1];
      const dz = d1.position[2] - d2.position[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (dist < 15) {
        if (d1.trust < 0.3 || d2.trust < 0.3) continue;
        
        const isRFRammed = rfMode !== 'NORMAL';
        const bothAI = d1.isAI && d2.isAI;
        
        if (isOpticalMode) {
          // 🔴 OPTICAL MODE LOGIC
          const isValid = bothAI && d1.trust > 0.5 && d2.trust > 0.5;
          const time = Date.now() * 0.001;
          const pulse = 1 + Math.sin(time * 5) * 0.1;

          if (isValid) {
            // ✅ Valid signal: Solid red beam, steady glow, pulsing
            links.push({
              key: `opt-${d1.id}-${d2.id}`,
              points: [d1.position, d2.position],
              color: '#ff0000',
              opacity: 0.8,
              lineWidth: 3 * pulse,
              dashed: false,
              glow: true
            });
          } else {
            // ❌ Invalid signal: Flicker, dashed, disappears
            const isVisible = Math.random() > 0.3;
            if (isVisible) {
              links.push({
                key: `opt-fail-${d1.id}-${d2.id}`,
                points: [d1.position, d2.position],
                color: '#ff3333',
                opacity: 0.5,
                lineWidth: 1,
                dashed: true,
                dashSize: 0.2,
                gapSize: 0.1
              });
            }
          }
        } else {
          // 🔵 NORMAL / RF MODE LOGIC
          let color = '#2563eb'; // royal blue
          let opacity = 0.4;
          let dashSize = 0.5;
          let gapSize = 0.1;
          let isVisible = true;

          if (isRFRammed) {
            if (bothAI) {
              color = '#1d4ed8';
              opacity = 0.7;
              dashSize = 0.8;
            } else {
              color = '#ef4444';
              isVisible = Math.random() > 0.4;
              opacity = isVisible ? 0.8 : 0;
              dashSize = 0.1;
              gapSize = 0.2;
            }
          }

          if (isVisible) {
            links.push({
              key: `rf-${d1.id}-${d2.id}`,
              points: [d1.position, d2.position],
              color: color,
              opacity: opacity,
              dashSize: dashSize,
              gapSize: gapSize,
              dashed: true,
              lineWidth: 1.5
            });
          }
        }
      }
    }
  }

  return (
    <group>
      {simulationDrones.map(drone => (
        <Drone key={drone.id} drone={drone} />
      ))}
      
      {links.map(link => (
        <Line 
          key={link.key}
          points={link.points}
          color={link.color}
          lineWidth={link.lineWidth}
          transparent
          opacity={link.opacity}
          dashed={link.dashed}
          dashScale={2}
          dashSize={link.dashSize}
          dashGap={link.gapSize}
        />
      ))}
    </group>
  );
};

export const Swarm = React.memo(SwarmComponent);

