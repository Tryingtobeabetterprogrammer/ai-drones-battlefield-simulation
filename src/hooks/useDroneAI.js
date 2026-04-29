import { useEffect, useRef } from 'react';
import { useSimulation } from '../context/SimulationContext';

export const useDroneAI = () => {
  const { drones, setDrones, rfStatus, addLog } = useSimulation();
  const dronesRef = useRef(drones);

  // Sync ref with state
  useEffect(() => {
    dronesRef.current = drones;
  }, [drones]);

  useEffect(() => {
    if (drones.length === 0) return;

    const interval = setInterval(() => {
      // Use the ref to get the absolute latest state within the interval
      const currentDrones = dronesRef.current;
      if (currentDrones.length === 0) return;

      setDrones(prevDrones => {
        return prevDrones.map(drone => {
          let updatedDrone = { ...drone };

          // 1. Waypoint Logic: Pick new target when current one is reached
          const dx = drone.target[0] - drone.position[0];
          const dy = drone.target[1] - drone.position[1];
          const dz = drone.target[2] - drone.position[2];
          
          const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          // If the drone is visually close to target, pick a new one
          if (dist < 1.5 && updatedDrone.status !== 'COMPROMISED') {
             updatedDrone.target = [
               (Math.random() - 0.5) * 30, // Wider boundary
               Math.random() * 8 + 4,      // Higher flight
               (Math.random() - 0.5) * 30
             ];
             addLog('WAYPOINT', `${drone.id} reached waypoint. Recalculating path.`);
          }

          // 2. Anomaly Detection and Trust Update
          if (rfStatus === 'JAMMING') {
             const isAffected = Math.random() < 0.05;
             
             if (isAffected) {
                if (!drone.isAI) {
                   // ❌ Non-AI Failure Path
                   updatedDrone.beta += 0.2;
                } else {
                   // 🤖 AI Response: Detected interference, re-routing
                   updatedDrone.beta += 0.01;
                   if (Math.random() < 0.05) { 
                      updatedDrone.target = [
                        (Math.random() - 0.5) * 30,
                        Math.random() * 8 + 4,
                        (Math.random() - 0.5) * 30
                      ];
                      addLog('AI_EVASION', `${drone.id} detecting RF interference. Re-routing to secure waypoint.`);
                   }
                }
             } else if (drone.isAI) {
                  updatedDrone.alpha += 0.05; 
             }
          }

          // 3. Bayesian Trust Model Calculation (Simplified Sync)
          // The actual trust calculation and status are handled inside Drone.js for smoothness,
          // but we sync waypoint changes here.

          return updatedDrone;
        });
      });
    }, 500); 

    return () => clearInterval(interval);
  }, [drones.length, rfStatus, setDrones, addLog]);
};
