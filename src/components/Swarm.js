import React from 'react';
import { Line } from '@react-three/drei';
import { useSimulation } from '../context/SimulationContext';
import { Drone } from './Drone';
import { useSwarm } from '../hooks/useSwarm';

const SwarmComponent = () => {
  const { drones: simulationDrones, rfStatus } = useSimulation();
  const { drones: swarmPositions } = useSwarm();

  // Generate communication links based on real-time positions
  const links = [];
  
  // We use the persistent simulation drones for the Drone components
  // but use the swarmPositions for high-frequency link calculations
  for (let i = 0; i < swarmPositions.length; i++) {
    for (let j = i + 1; j < swarmPositions.length; j++) {
      const d1 = swarmPositions[i];
      const d2 = swarmPositions[j];
      
      // Distance check
      const dx = d1.position[0] - d2.position[0];
      const dy = d1.position[1] - d2.position[1];
      const dz = d1.position[2] - d2.position[2];
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (dist < 15) {
        // Only connect healthy drones (trust > 0.3)
        if (d1.trust < 0.3 || d2.trust < 0.3) continue;
        
        const isJammed = rfStatus === 'JAMMING';
        const bothAI = d1.isAI && d2.isAI;
        
        // Visual state of the link
        let color = '#2563eb'; // royal blue
        let opacity = 0.4;
        let dashSize = 0.5;
        let gapSize = 0.1;
        let isVisible = true;

        if (isJammed) {
          if (bothAI) {
            // 🤖 AI-AI: Re-routing / Stable Network
            color = '#1d4ed8';
            opacity = 0.7;
            dashSize = 0.8;
          } else {
            // ❌ Involved Non-AI: Red, flickering, unstable
            color = '#ef4444';
            isVisible = Math.random() > 0.5; // High failure rate
            opacity = isVisible ? 0.8 : 0;
            dashSize = 0.1;
            gapSize = 0.2;
          }
        }

        if (isVisible) {
          links.push({
            key: `${d1.id}-${d2.id}`,
            points: [d1.position, d2.position],
            color: color,
            opacity: opacity,
            dashSize: dashSize,
            gapSize: gapSize,
            dashed: true
          });
        }
      }
    }
  }

  return (
    <group>
      {simulationDrones.map(drone => (
        <Drone key={drone.id} drone={drone} />
      ))}
      
      {/* Communication Network Links */}
      {links.map(link => (
        <Line 
          key={link.key}
          points={link.points}
          color={link.color}
          lineWidth={1.5}
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

