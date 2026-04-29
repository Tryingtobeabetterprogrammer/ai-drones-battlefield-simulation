import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { DroneModel } from './DroneModel';

const StatCard = ({ title, value, subValue, trend, type = 'default' }) => (
  <div className="bg-[#111418] border border-white/5 p-4 rounded-lg flex flex-col gap-1 relative overflow-hidden group hover:border-blue-500/30 transition-all">
    <div className="flex justify-between items-start">
      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{title}</span>
      <span className="text-[10px] text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity">↗</span>
    </div>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-2xl font-mono font-bold text-white tracking-tighter">{value}</span>
      {subValue && <span className="text-[10px] text-gray-500 font-mono">{subValue}</span>}
    </div>
    {trend && (
      <div className={`text-[9px] font-bold uppercase mt-1 ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
        {trend} vs last cycle
      </div>
    )}
    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
  </div>
);

const ProgressBar = ({ label, value, max = 100, color = 'blue' }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[8px] font-bold uppercase tracking-tighter">
      <span className="text-gray-400">{label}</span>
      <span className="text-white">{value.toFixed(0)}%</span>
    </div>
    <div className="h-1 bg-gray-800 rounded-full overflow-hidden border border-white/5">
      <div 
        className={`h-full transition-all duration-1000 ${
          color === 'blue' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 
          color === 'red' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
          'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
        }`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

export const DroneAnalysisPanel = ({ selectedDrone, allDrones, onSelectDrone, onClose }) => {
  const drone = selectedDrone || allDrones[0];
  
  // Mock historical data for charts (stable randomness)
  const perfData = useMemo(() => Array.from({ length: 12 }).map(() => Math.random() * 100), []);

  if (!drone) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0c10] text-white flex flex-col font-sans pointer-events-auto animate-in fade-in duration-500">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0d0f14]/80 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 border border-blue-500/30 flex items-center justify-center rounded bg-blue-500/5">
            <span className="text-blue-500 text-xl font-bold">⋓</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-widest uppercase">Autonomous Recon Unit</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">/MODE SURVEILLANCE</span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded">
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-green-500 font-bold uppercase tracking-tighter">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* DRONE SELECTION BUTTONS */}
        <div className="flex bg-black/40 border border-white/5 rounded p-1 gap-1">
          {allDrones.map((d, i) => (
            <button
              key={d.id}
              onClick={() => onSelectDrone(d.id)}
              className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                drone.id === d.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              Drone {i + 1}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button className="w-8 h-8 border border-white/10 flex items-center justify-center rounded text-gray-500 hover:text-white transition-colors">▢</button>
            <button 
              onClick={onClose}
              className="w-8 h-8 border border-white/10 flex items-center justify-center rounded text-gray-500 hover:text-white transition-colors"
            >✕</button>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID CONTENT */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-6 p-6">
        
        {/* LEFT COLUMN: Performance & Stats */}
        <div className="col-span-3 space-y-6 overflow-y-auto pr-2 scrollbar-none">
          <div className="bg-[#0d0f14] border border-white/5 p-5 rounded-lg">
             <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 flex justify-between items-center">
               Performance Index
               <span className="w-4 h-4 text-white opacity-20">↗</span>
             </h2>
             <div className="grid grid-cols-2 gap-4 mb-8">
               <div>
                 <p className="text-[8px] text-gray-600 uppercase font-bold mb-1">Missions</p>
                 <p className="text-xl font-mono font-bold">72</p>
               </div>
               <div>
                 <p className="text-[8px] text-gray-600 uppercase font-bold mb-1">Success</p>
                 <p className="text-xl font-mono font-bold text-blue-400">35</p>
               </div>
               <div>
                 <p className="text-[8px] text-gray-600 uppercase font-bold mb-1">Failed</p>
                 <p className="text-xl font-mono font-bold text-red-500">10</p>
               </div>
               <div>
                 <p className="text-[8px] text-gray-600 uppercase font-bold mb-1">On Going</p>
                 <p className="text-xl font-mono font-bold text-green-500">27</p>
               </div>
             </div>

             <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                   <span className="text-[9px] text-gray-400 font-bold uppercase">Recon Sweep</span>
                 </div>
                 <span className="text-[9px] font-mono">9.82 %</span>
               </div>
               <div className="flex justify-between items-center text-[9px]">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                   <span className="text-gray-400 font-bold uppercase">Thermal Mapping</span>
                 </div>
                 <span className="font-mono">7.22 %</span>
               </div>
               <div className="flex justify-between items-center text-[9px]">
                 <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                   <span className="text-gray-400 font-bold uppercase">Signal Relay</span>
                 </div>
                 <span className="font-mono">5.28 %</span>
               </div>
             </div>

             {/* Mini Bar Chart */}
             <div className="mt-10 flex items-end justify-between h-20 gap-1 px-1">
               {perfData.map((v, i) => (
                 <div 
                   key={i} 
                   className="flex-1 bg-white/10 hover:bg-blue-500 transition-all rounded-t-sm"
                   style={{ height: `${v}%` }}
                 />
               ))}
             </div>
          </div>

          <StatCard 
            title="OPS Performance Delta" 
            value="+26%" 
            trend="+5%"
          />
        </div>

        {/* CENTER COLUMN: 3D WIREFRAME PREVIEW */}
        <div className="col-span-6 flex flex-col relative rounded-xl border border-white/5 bg-gradient-to-b from-[#0d0f14] to-black shadow-2xl overflow-hidden">
          
          {/* Coordinates Overlay */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 font-mono">
            <div className="text-[10px] text-blue-400/50 uppercase font-bold tracking-widest mb-2">:: Real-time Matrix</div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-[10px]">X:</span>
              <span className="text-white text-xs font-bold w-16">{drone.position[0].toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-[10px]">Y:</span>
              <span className="text-white text-xs font-bold w-16">{drone.position[1].toFixed(3)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-[10px]">Z:</span>
              <span className="text-white text-xs font-bold w-16">{drone.position[2].toFixed(3)}</span>
            </div>
            <div className="mt-4 text-[9px] text-blue-500 font-bold animate-pulse">
              SYNCING TELEMETRY...
            </div>
          </div>

          <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
            <button className="w-8 h-8 bg-black/50 border border-white/10 rounded flex items-center justify-center text-white hover:bg-white/10">+</button>
            <button className="w-8 h-8 bg-black/50 border border-white/10 rounded flex items-center justify-center text-white hover:bg-white/10">-</button>
          </div>

          <div className="flex-1">
            <Canvas shadows>
              <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={40} />
              <OrbitControls 
                enableZoom={false} 
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.5}
                maxPolarAngle={Math.PI / 2.1}
                minPolarAngle={Math.PI / 4}
              />
              
              <ambientLight intensity={0.2} />
              <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
              <spotLight position={[5, 5, 5]} angle={0.5} penumbra={1} intensity={2} color="#00ffff" />
              
              <DroneModel color="#00f2ff" status="NORMAL" wireframe={true} />
              
              {/* Floor grid for depth */}
              <gridHelper args={[20, 40, '#111', '#111']} position={[0, -1, 0]} />
              
              <Environment preset="night" />
            </Canvas>
          </div>

          {/* Bottom Data Overlay */}
          <div className="absolute bottom-6 right-6 z-10 text-right space-y-1">
            <div className="flex items-center justify-end gap-2 text-blue-400">
               <span className="w-3 h-3 border border-blue-400 rounded-sm flex items-center justify-center text-[7px]">◈</span>
               <span className="text-[10px] font-bold uppercase tracking-widest">Data packets received: 12,756,803</span>
            </div>
            <p className="text-[8px] text-gray-600 font-mono italic">Encrypted P2P Protocol v.4.02-SENTRYX</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Health & Efficiency */}
        <div className="col-span-3 space-y-6 overflow-y-auto pr-2 scrollbar-none">
          <div className="bg-[#0d0f14] border border-white/5 p-5 rounded-lg">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 flex justify-between items-center">
              Battery & Charge
              <span className="text-orange-500">● 30.1%</span>
            </h2>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl font-mono font-bold">{Math.floor(drone.battery / 10)}</span>
              <span className="text-xs text-gray-500 font-bold uppercase">hr</span>
              <span className="text-3xl font-mono font-bold ml-2">{(drone.battery % 10 * 6).toFixed(0)}</span>
              <span className="text-xs text-gray-500 font-bold uppercase">min</span>
            </div>

            <div className="space-y-6">
              <ProgressBar label="Unit Core Systems" value={92} color="blue" />
              <ProgressBar label="Thermal Ops" value={68} color="green" />
              <ProgressBar label="Flight Readiness" value={drone.trustScore * 100} color={drone.trustScore > 0.6 ? 'green' : 'red'} />
              <ProgressBar label="Navigation Matrix" value={84} color="blue" />
            </div>
          </div>

          <div className="bg-[#0d0f14] border border-white/5 p-5 rounded-lg">
             <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Signal Efficiency Shift</h2>
             <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-mono font-bold">+326%</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase">Daily/Weekly Avg</span>
             </div>
             {/* Signal Scatter Plot Mock */}
             <div className="h-24 relative overflow-hidden flex items-end gap-[2px]">
               {Array.from({ length: 40 }).map((_, i) => (
                 <div 
                   key={i} 
                   className="w-[2px] bg-white/20"
                   style={{ height: `${20 + Math.random() * 60}%`, opacity: Math.random() }}
                 />
               ))}
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-full h-[1px] bg-blue-500/30 dashed" />
               </div>
             </div>
          </div>

          <div className="bg-[#0d0f14] border border-white/5 p-5 rounded-lg relative overflow-hidden">
             <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2 font-mono">Critical Error Count</h2>
             <div className="flex justify-center py-4">
                <div className="relative w-32 h-32 flex flex-col items-center justify-center">
                   <svg className="w-full h-full -rotate-90">
                     <circle cx="64" cy="64" r="50" fill="none" stroke="#222" strokeWidth="8" strokeDasharray="157 314" />
                     <circle cx="64" cy="64" r="50" fill="none" stroke="#f97316" strokeWidth="8" strokeDasharray="100 314" className="animate-in fade-in duration-1000" />
                   </svg>
                   <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold font-mono">326</span>
                      <span className="text-[7px] text-gray-500 uppercase font-bold tracking-tighter">Details ⋁</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM FOOTER STATUS */}
      <div className="px-6 py-3 bg-black border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-gray-500 tracking-[0.3em] uppercase">
        <div className="flex gap-8">
          <span>SECURED TERMINAL: NODE_A2</span>
          <span>LAT: 34.0522° N / LONG: 118.2437° W</span>
          <span className="text-blue-500 animate-pulse">● DATA ENCRYPTION: AES-256</span>
        </div>
        <div>
          <span>SENTRIX v4.0.2</span>
        </div>
      </div>
    </div>
  );
};
