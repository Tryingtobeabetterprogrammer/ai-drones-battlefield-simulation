import { useSimulation } from '../context/SimulationContext';
import { LogPanel, Alerts } from './BlockchainHUD';

export const Dashboard = () => {
  const { 
    drones, 
    rfStatus, setRfStatus, 
    missionTime, 
    threats,
    simulateAttack,
    resetSimulation,
    viewMode, setViewMode
  } = useSimulation();

  // Helper to format mission time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none text-white font-sans overflow-hidden select-none p-6">
      
      {/* TOP CENTER: HEADER */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 px-10 py-2 rounded-lg shadow-2xl flex flex-col items-center">
          <h1 className="text-lg font-bold tracking-widest uppercase text-white">AI Drone Battlefield Simulation</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-green-500 font-bold tracking-widest uppercase">System Online</span>
          </div>
        </div>
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
        {/* Legend */}
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl w-[180px]">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3 text-white">Legend</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-0.5 border-t border-dashed border-blue-600" />
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Active Link</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-0.5 border-t border-dashed border-red-500 relative flex items-center justify-center">
                <span className="text-[8px] text-red-500 absolute">×</span>
              </div>
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Jammed Link</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider">Drone</span>
            </div>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl w-[180px]">
          <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 text-white">Camera Controls</h2>
          <div className="space-y-1">
            <div className="text-[8px] text-gray-400 font-bold uppercase"><span className="text-gray-500">•</span> Left Mouse - Rotate</div>
            <div className="text-[8px] text-gray-400 font-bold uppercase"><span className="text-gray-500">•</span> Right Mouse - Pan</div>
            <div className="text-[8px] text-gray-400 font-bold uppercase"><span className="text-gray-500">•</span> Scroll - Zoom</div>
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: VIEW NAVIGATION */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center bg-[#1a1c20]/95 border border-white/10 rounded-md overflow-hidden p-0.5 shadow-2xl">
          {['Top View', 'Follow View', 'Graph Rep', 'Drone Cam'].map((label) => (
            <button
              key={label}
              onClick={() => setViewMode(label)}
              className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                viewMode === label 
                  ? 'bg-[#254160] text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TRUST GRAPH PANEL */}
      {viewMode === 'Graph Rep' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
          <div className="bg-[#1a1c20]/95 backdrop-blur-xl border border-blue-500/30 p-8 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-[600px] relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-[0.2em] uppercase text-white">Trust Analysis</h2>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Autonomous vs Legacy Systems</p>
              </div>
              <button 
                onClick={() => setViewMode('Follow View')}
                className="text-gray-500 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* AI Drones Trust */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-blue-400">AI Trust Level</h3>
                </div>
                
                <div className="relative h-40 flex items-end justify-around bg-white/5 rounded-lg p-4 border border-white/5">
                  {drones.filter(d => d.isAI).map((drone, idx) => (
                    <div key={drone.id} className="flex flex-col items-center gap-2 w-full">
                      <div 
                        className="w-12 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        style={{ height: `${drone.trustScore * 100}%` }}
                      />
                      <span className="text-[10px] font-mono text-blue-300">{(drone.trustScore * 100).toFixed(1)}%</span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{drone.id}</span>
                    </div>
                  ))}
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none border-b border-white/10" />
                  <div className="absolute inset-x-0 bottom-1/2 pointer-events-none border-b border-white/5" />
                </div>
              </div>

              {/* Non-AI Drones Trust */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <h3 className="text-[12px] font-bold uppercase tracking-widest text-gray-400">Non-AI Trust Level</h3>
                </div>
                
                <div className="relative h-40 flex items-end justify-around bg-white/5 rounded-lg p-4 border border-white/5">
                  {drones.filter(d => !d.isAI).map((drone, idx) => (
                    <div key={drone.id} className="flex flex-col items-center gap-2 w-full">
                      <div 
                        className={`w-12 rounded-t-sm transition-all duration-500 ${
                          drone.trustScore > 0.5 
                            ? 'bg-gradient-to-t from-gray-600 to-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.2)]' 
                            : 'bg-gradient-to-t from-red-900 to-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)] animate-pulse'
                        }`}
                        style={{ height: `${drone.trustScore * 100}%` }}
                      />
                      <span className={`text-[10px] font-mono ${drone.trustScore > 0.5 ? 'text-gray-300' : 'text-red-400 font-bold'}`}>
                        {(drone.trustScore * 100).toFixed(1)}%
                      </span>
                      <span className="text-[8px] text-gray-500 font-bold uppercase">{drone.id}</span>
                    </div>
                  ))}
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none border-b border-white/10" />
                  <div className="absolute inset-x-0 bottom-1/2 pointer-events-none border-b border-white/5" />
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white/5 rounded border border-white/10">
              <p className="text-[9px] text-gray-400 leading-relaxed uppercase tracking-wider">
                <span className="text-blue-400 font-bold">Analysis:</span> AI-enabled units utilize Bayesian inference to filter RF noise, maintaining higher trust coefficients during jamming events. Non-AI units rely on static frequency hops, making them susceptible to isolation and signal degradation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT: STATUS & LOGS */}
      <div className="absolute top-6 right-6 bottom-6 flex flex-col gap-4 pointer-events-none pt-24 pb-4">
        <div className="pointer-events-auto space-y-3">
          {/* SYSTEM MODE INDICATOR */}
          <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-blue-500/30 px-4 py-3 rounded flex justify-between items-center w-[240px] shadow-[0_0_15px_rgba(37,99,235,0.1)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">System Mode</span>
            <span className="text-[10px] font-bold uppercase text-blue-400">Hybrid Swarm</span>
          </div>

          {/* RF ENVIRONMENT / ATTACK TRIGGER */}
          <button 
            onClick={() => rfStatus === 'NORMAL' ? simulateAttack() : setRfStatus('NORMAL')}
            className={`group bg-[#1a1c20]/90 backdrop-blur-md border px-4 py-3 rounded flex justify-between items-center w-[240px] transition-all ${
              rfStatus === 'JAMMING' ? 'border-red-500/50 bg-red-500/10' : 'border-white/10 hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">RF Status</span>
            <span className={`text-[10px] font-bold uppercase ${rfStatus === 'JAMMING' ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
              {rfStatus === 'JAMMING' ? 'JAMMED' : 'Normal'}
            </span>
          </button>

          {/* THREATS DETECTED */}
          <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded flex justify-between items-center w-[240px]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Threats Detected</span>
            <span className="text-[10px] font-bold uppercase text-white font-mono">{threats}</span>
          </div>

          {/* RESET SYSTEM */}
          <button 
            onClick={resetSimulation}
            className="group bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded flex justify-between items-center w-[240px] hover:bg-red-500/20 hover:border-red-500/50 transition-all mt-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">System Reset</span>
            <span className="text-[14px] text-gray-500 group-hover:text-red-500 transition-colors">🔄</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden pointer-events-auto flex flex-col justify-end">
          <Alerts />
        </div>

        <LogPanel />
      </div>
      
    </div>
  );
};
