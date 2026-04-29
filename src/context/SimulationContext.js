import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLogs } from '../hooks/useLogs';

const SimulationContext = createContext();

const INITIAL_DRONES_COUNT = 4;
const BOUNDARY = 15;

export const SimulationProvider = ({ children }) => {
  const [drones, setDrones] = useState([]);
  const [rfMode, setRfMode] = useState('NORMAL'); // 'NORMAL', 'RF', 'GPS', 'CONTROL', 'DATA', 'FULL'
  const [isOpticalMode, setOpticalMode] = useState(false);
  const [logs, setLogs] = useState([]);
  const [missionTime, setMissionTime] = useState(0);
  const [threats, setThreats] = useState(0);
  const [trustHistory, setTrustHistory] = useState([]); // Array of { time, aiTrust, legacyTrust }
  const addBlock = useLogs(s => s.addBlock);

  // Add a log to the "blockchain"
  const addLog = useCallback((action, details) => {
    setLogs(prev => [...prev, {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      action,
      details
    }].slice(-50)); // keep last 50 logs
  }, []);

  // Initialize swarm
  const resetSimulation = useCallback(() => {
    const initialDrones = Array.from({ length: INITIAL_DRONES_COUNT }).map((_, i) => ({
      id: `DRONE ${i + 1}`,
      isAI: i >= 2, // Drone 1,2 = Non-AI, Drone 3,4 = AI
      position: [0, 2, 0],
      target: [
        (Math.random() - 0.5) * BOUNDARY,
        Math.random() * 5 + 2,
        (Math.random() - 0.5) * BOUNDARY
      ],
      trustScore: 1.0, // Initial trust 100%
      alpha: 10, // success
      beta: 0,   // suspicious
      status: 'NORMAL', // 'NORMAL', 'WARNING', 'COMPROMISED'
      frequency: 2.4, // GHz
      battery: 80 + Math.random() * 20, // Initial battery between 80-100%
    }));
    setDrones(initialDrones);
    setRfMode('NORMAL');
    setOpticalMode(false);
    setLogs([]);
    setMissionTime(0);
    setThreats(0);
    setTrustHistory([]);
    addLog('SYSTEM_INIT', 'Hybrid Swarm initialized: 2 AI Nodes, 2 Legacy Nodes.');
    addBlock({ type: 'SYSTEM', message: 'System Re-initialized: Hybrid swarm nodes secured.' });
  }, [addLog, addBlock]);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Mission Timer & History Tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setMissionTime(prev => prev + 1);
      
      // Update History
      setDrones(currentDrones => {
        const aiDrones = currentDrones.filter(d => d.isAI);
        const legacyDrones = currentDrones.filter(d => !d.isAI);
        const avgAiTrust = aiDrones.reduce((acc, d) => acc + d.trustScore, 0) / (aiDrones.length || 1);
        const avgLegacyTrust = legacyDrones.reduce((acc, d) => acc + d.trustScore, 0) / (legacyDrones.length || 1);

        setTrustHistory(prev => [...prev, {
          time: missionTime,
          aiTrust: avgAiTrust,
          legacyTrust: avgLegacyTrust
        }].slice(-30)); // Keep last 30 data points

        // Slowly drain battery
        return currentDrones.map(d => ({
          ...d,
          battery: Math.max(0, d.battery - 0.05 * Math.random())
        }));
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [missionTime]);

  const setDronesState = useCallback((newDrones) => {
    setDrones(newDrones);
  }, []);

  return (
    <SimulationContext.Provider value={{
      drones, setDrones: setDronesState,
      rfMode, setRfMode,
      isOpticalMode, setOpticalMode,
      logs, addLog,
      missionTime,
      trustHistory,
      threats,
      resetSimulation
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => useContext(SimulationContext);
