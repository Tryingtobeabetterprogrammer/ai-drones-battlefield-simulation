import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { useLogs } from '../hooks/useLogs';
import { LogPanel, Alerts } from './BlockchainHUD';
import TrustChart from './TrustChart';
import { DroneAnalysisPanel } from './DroneAnalysisPanel';

const TrustAnalysisPanel = ({ drones, history, onClose }) => {
  const aiDrones = drones.filter(d => d.isAI);
  const legacyDrones = drones.filter(d => !d.isAI);

  const avgAiTrust = aiDrones.reduce((acc, d) => acc + d.trustScore, 0) / (aiDrones.length || 1);
  const avgLegacyTrust = legacyDrones.reduce((acc, d) => acc + d.trustScore, 0) / (legacyDrones.length || 1);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-50 pointer-events-auto">
      <div className="bg-[#111418] border border-blue-500/30 w-[700px] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-blue-600/10 border-b border-white/10 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">Tactical Trust Analysis</h2>
            <p className="text-[10px] text-gray-500 uppercase mt-0.5">Real-time Bayesian Trust Metrics</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <TrustChart history={history} />

          <div className="grid grid-cols-2 gap-8">
            {/* AI Drones Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">AI-Enabled Swarm</span>
                  <h3 className="text-xl font-mono font-bold text-white">{(avgAiTrust * 100).toFixed(1)}%</h3>
                </div>
                <span className="text-[10px] text-green-500 font-bold uppercase">Resilient</span>
              </div>
              <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all duration-500"
                  style={{ width: `${avgAiTrust * 100}%` }}
                />
              </div>
            </div>

            {/* Legacy Drones Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legacy Nodes Cluster</span>
                  <h3 className="text-xl font-mono font-bold text-white">{(avgLegacyTrust * 100).toFixed(1)}%</h3>
                </div>
                <span className={`text-[10px] font-bold uppercase ${avgLegacyTrust < 0.5 ? 'text-red-500 animate-pulse' : 'text-orange-400'}`}>
                  {avgLegacyTrust < 0.5 ? 'Critical' : 'Vulnerable'}
                </span>
              </div>
              <div className="h-2 bg-gray-800/50 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-500 ${avgLegacyTrust < 0.5 ? 'bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]'}`}
                  style={{ width: `${avgLegacyTrust * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { 
    drones, 
    rfMode, setRfMode, 
    isOpticalMode, setOpticalMode,
    addLog,
    missionTime,
    trustHistory,
    resetSimulation
  } = useSimulation();
  
  const addBlock = useLogs((s) => s.addBlock);

  const [activeView, setActiveView] = useState('Follow View');
  const [showTrustPanel, setShowTrustPanel] = useState(false);
  const [selectedDroneId, setSelectedDroneId] = useState(null);

  React.useEffect(() => {
    if (!selectedDroneId && drones.length > 0) {
      setSelectedDroneId(drones[0].id);
    }
  }, [drones, selectedDroneId]);
  const [activeChannel, setActiveChannel] = useState(1);

  // Logic to determine if a specific channel index is jammed
  const isChannelIndexJammed = React.useCallback((idx) => {
    if (rfMode === 'NORMAL') return false;
    if (rfMode === 'FULL') return idx !== 5; // AI stays on CH5 in full spectrum
    if (rfMode === 'RF' && [1, 2].includes(idx)) return true;
    if (rfMode === 'CONTROL' && idx === 1) return true;
    if (rfMode === 'DATA' && idx === 2) return true;
    if (rfMode === 'GPS' && idx === 4) return true;
    return false;
  }, [rfMode]);

  // Autonomous Hopping Logic
  React.useEffect(() => {
    if (isChannelIndexJammed(activeChannel)) {
      const safeChannel = [1, 2, 3, 4, 5].find(ch => !isChannelIndexJammed(ch));
      if (safeChannel) {
        const timer = setTimeout(() => setActiveChannel(safeChannel), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [activeChannel, isChannelIndexJammed]);

  // Helper to format mission time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleViewChange = (label) => {
    if (label === 'Graph Representation') {
      setShowTrustPanel(true);
    } else {
      setActiveView(label);
      setShowTrustPanel(false);
    }
  };

  const getChannelStatus = (name) => {
    if (rfMode === 'NORMAL') return 'SAFE';
    if (rfMode === 'FULL') {
      return name === 'AI Mesh' ? 'RESILIENT' : 'JAMMED';
    }
    
    const statusMap = {
      'RF': ['Control Link', 'Data Link'],
      'GPS': ['GPS/NAV'],
      'CONTROL': ['Control Link'],
      'DATA': ['Data Link', 'Video Stream'],
    };

    return statusMap[rfMode]?.includes(name) ? 'JAMMED' : 'SAFE';
  };

  const channels = [
    { name: 'Control Link', freq: '2.4 GHz' },
    { name: 'Data Link', freq: '2.45 GHz' },
    { name: 'Video Stream', freq: '5.8 GHz' },
    { name: 'GPS/NAV', freq: '1.5 GHz' },
    { name: 'AI Mesh', freq: 'Encrypted' },
  ];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none text-white font-sans overflow-hidden select-none p-6">
      
      {/* TRUST GRAPH PANEL */}
      {showTrustPanel && <TrustAnalysisPanel drones={drones} history={trustHistory} onClose={() => setShowTrustPanel(false)} />}

      {/* TOP CENTER: HEADER */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 px-10 py-2 rounded-lg shadow-2xl flex flex-col items-center">
          <h1 className="text-lg font-bold tracking-widest uppercase text-white">AI Drone Battlefield Simulation</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">System Online</span>
          </div>
        </div>
        {isOpticalMode && (
          <div className="bg-red-600/20 border border-red-500 px-6 py-1 rounded shadow-[0_0_20px_rgba(220,38,38,0.3)] animate-pulse">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-red-500">
              MODE: OPTICAL (Quantum-Inspired Validation)
            </span>
          </div>
        )}
      </div>

      {/* TOP RIGHT: MISSION TIME */}
      <div className="absolute top-6 right-6">
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl flex flex-col items-center min-w-[140px]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Mission Time</span>
          <span className="text-2xl font-mono font-bold leading-none">{formatTime(missionTime)}</span>
        </div>
      </div>

      {/* LEFT: DRONE STATUS */}
      <div className="absolute top-6 left-6 space-y-4">
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl w-[220px]">
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-4 border-b border-white/10 pb-1">Drone Status</h2>
          
          <div className="space-y-4">
            {drones.map((drone) => (
              <div key={drone.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold tracking-widest uppercase">{drone.id}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${drone.isAI ? 'text-blue-400 border-blue-400/30 bg-blue-400/10' : 'text-gray-400 border-gray-400/30 bg-gray-400/10'}`}>
                    {drone.isAI ? 'AI' : 'Non-AI'}
                  </span>
                </div>
                
                {/* Battery */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-gray-400 w-12 uppercase font-bold">Battery:</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${drone.battery > 30 ? 'bg-gray-500' : 'bg-red-500'}`}
                      style={{ width: `${drone.battery}%` }}
                    />
                  </div>
                  <span className="text-[8px] text-gray-400 font-bold w-6">{Math.round(drone.battery)}%</span>
                </div>

                {/* Trust */}
                <div className="flex items-center gap-2">
                  <span className="text-[8px] text-gray-400 w-12 uppercase font-bold">Trust:</span>
                  <span className="text-[10px] text-green-500 font-mono font-bold">{drone.trustScore.toFixed(2)}</span>
                  <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: `${drone.trustScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LEFT BOTTOM: LEGEND & CAMERA CONTROLS */}
      <div className="absolute bottom-6 left-6 space-y-4">

        {/* RF Channels Status */}
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl w-[200px]">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-white flex justify-between items-center">
            RF Channels
            {rfMode !== 'NORMAL' && <span className="text-[8px] text-red-500 animate-pulse">● Interference</span>}
          </h2>
          <div className="space-y-2">
            {channels.map((ch) => {
              const status = getChannelStatus(ch.name);
              return (
                <div key={ch.name} className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-300 font-bold uppercase">{ch.name}</span>
                    <span className="text-[7px] text-gray-500 font-mono">{ch.freq}</span>
                  </div>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                    status === 'SAFE' ? 'text-green-500 bg-green-500/10' : 
                    status === 'RESILIENT' ? 'text-blue-400 bg-blue-400/10 border border-blue-400/30' :
                    'text-red-500 bg-red-500/10 animate-pulse'
                  }`}>
                    {status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: VIEW NAVIGATION */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center bg-[#1a1c20]/95 border border-white/10 rounded-md overflow-hidden p-0.5 shadow-2xl">
          {['Top View', 'Follow View', 'Graph Representation', 'Drone Analysis'].map((label) => (
            <button
              key={label}
              onClick={() => handleViewChange(label)}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                activeView === label && !showTrustPanel
                  ? 'bg-[#254160] text-white' 
                  : (showTrustPanel && label === 'Graph Representation')
                    ? 'bg-[#254160] text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT: STATUS & LOGS */}
      <div className="absolute top-6 right-6 bottom-6 flex flex-col gap-4 pointer-events-none pt-24 pb-4">
        <div className="pointer-events-auto space-y-3">
          {/* RF ENVIRONMENT / ATTACK TRIGGER */}
          <div className={`bg-[#1a1c20]/90 backdrop-blur-md border p-4 rounded-lg flex flex-col w-[240px] transition-all ${
            rfMode !== 'NORMAL' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Electronic Warfare Mode</span>
            <select 
              value={rfMode}
              onChange={(e) => {
                setRfMode(e.target.value);
                if (e.target.value !== 'NORMAL') {
                  addLog('JAMMING_DETECTED', `Adversarial ${e.target.value} interference active.`);
                }
              }}
              className="bg-black/40 border border-white/20 text-white text-[11px] font-mono p-2 rounded outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="NORMAL">NORMAL OPERATION</option>
              <option value="RF">RF COMM JAMMING</option>
              <option value="GPS">GPS NAVIGATION JAMMING</option>
              <option value="CONTROL">CONTROL LINK JAMMING</option>
              <option value="DATA">DATA/VIDEO TELEMETRY JAMMING</option>
              <option value="FULL">FULL SPECTRUM (EXTREME)</option>
            </select>
          </div>

          {/* OPTICAL MODE TOGGLE */}
          <div className={`bg-[#1a1c20]/90 backdrop-blur-md border p-4 rounded-lg flex flex-col w-[240px] transition-all ${
            isOpticalMode ? 'border-red-600 bg-red-600/10 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'border-white/10'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Optical Channel</span>
              <div className={`w-2 h-2 rounded-full ${isOpticalMode ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`} />
            </div>
            <button 
              onClick={() => {
                const newState = !isOpticalMode;
                setOpticalMode(newState);
                if (newState) {
                  addLog('OPTICAL_CHANNEL_INIT', 'Quantum-Inspired Optical Validation enabled.');
                  addBlock({ type: 'SYSTEM', message: 'Optical Channel Active: Verifying signal correlation.' });
                }
              }}
              className={`w-full py-2 rounded text-[11px] font-bold uppercase tracking-wider transition-all ${
                isOpticalMode 
                  ? 'bg-red-600 text-white border border-red-400' 
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {isOpticalMode ? 'DEACTIVATE OPTICAL' : 'ACTIVATE OPTICAL'}
            </button>
            {isOpticalMode && (
              <p className="text-[8px] text-red-400/80 mt-2 font-mono leading-tight">
                VALIDATING SIGNALS VIA TIMING & CONSENSUS...
              </p>
            )}
          </div>

          {/* DEMO SEQUENCE */}
          <button 
            onClick={() => {
              addLog('DEMO_SEQUENCE', 'Starting Resilience Showcase...');
              setRfMode('NORMAL');
              setOpticalMode(false);
              
              setTimeout(() => {
                setRfMode('FULL');
                addLog('JAMMING_ATTACK', 'Full Spectrum Jamming Initiated.');
              }, 2000);

              setTimeout(() => {
                setOpticalMode(true);
                addLog('RESILIENCE_MODE', 'Switching to Quantum-Inspired Optical Layer.');
              }, 5000);
            }}
            className="group bg-blue-600/20 border border-blue-500/50 px-4 py-2.5 rounded flex justify-between items-center w-[240px] hover:bg-blue-500/30 transition-all"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Run Resilience Demo</span>
            <span className="text-[14px]">🚀</span>
          </button>

          {/* RESET SYSTEM */}
          <button 
            onClick={resetSimulation}
            className="group bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded flex justify-between items-center w-[240px] hover:bg-red-500/20 hover:border-red-500/50 transition-all mt-2"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Reset</span>
            <span className="text-[14px] text-gray-500 group-hover:text-red-500 transition-colors">🔄</span>
          </button>

          {/* AI FREQUENCY HOPPING PANEL */}
          <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg flex flex-col w-[240px] mt-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Frequency Hopping</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[8px] text-blue-400 font-bold uppercase">Active</span>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((ch) => {
                const jammed = isChannelIndexJammed(ch);
                const active = activeChannel === ch;
                return (
                  <div 
                    key={ch}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded border transition-all duration-500 ${
                      active 
                        ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' 
                        : jammed 
                          ? 'bg-red-900/20 border-red-900/50 grayscale'
                          : 'bg-black/20 border-white/5'
                    }`}
                  >
                    <span className={`text-[8px] font-bold ${active ? 'text-blue-400' : jammed ? 'text-red-900' : 'text-gray-600'}`}>
                      CH{ch.toString().padStart(2, '0')}
                    </span>
                    <div className={`w-full h-1 rounded-full ${
                      active 
                        ? 'bg-blue-500' 
                        : jammed 
                          ? 'bg-red-900' 
                          : 'bg-gray-800'
                    }`} />
                  </div>
                );
              })}
            </div>
            <p className="text-[8px] text-gray-500 uppercase font-bold mt-3 text-center tracking-tighter">
              {isChannelIndexJammed(activeChannel) 
                ? '⚠️ Interference Detected - Searching...' 
                : `Secured Link established on Channel ${activeChannel.toString().padStart(2, '0')}`}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden pointer-events-auto flex flex-col justify-end">
          <Alerts />
        </div>

        <LogPanel />
      </div>
      {/* DRONE ANALYSIS PANEL */}
      {activeView === 'Drone Analysis' && (
        <DroneAnalysisPanel 
          selectedDrone={drones.find(d => d.id === selectedDroneId)}
          allDrones={drones}
          onSelectDrone={setSelectedDroneId}
          onClose={() => setActiveView('Follow View')}
        />
      )}
      
    </div>
  );
};

