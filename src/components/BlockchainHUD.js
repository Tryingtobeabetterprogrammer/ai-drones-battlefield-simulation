import React from 'react';
import { useLogs } from '../hooks/useLogs';

export const LogPanel = () => {
  const chain = useLogs((s) => s.chain);

  return (
    <div className="bg-[#1a1c20]/90 backdrop-blur-md border border-white/10 p-4 rounded-lg shadow-xl w-[320px] h-[240px] flex flex-col pointer-events-auto">
      <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 border-b border-white/10 pb-1 text-blue-400">Blockchain Forensic Log</h3>
      <div className="flex-1 overflow-y-auto font-mono text-[9px] space-y-1.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-1">
        {chain.slice(-15).reverse().map((b, i) => (
          <div key={i} className="text-gray-400 border-l border-blue-500/30 pl-2 py-0.5">
            <div className="flex justify-between items-center text-[8px] text-gray-500 mb-0.5">
              <span>[{new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}]</span>
              <span className="font-bold text-blue-500/50 uppercase">Hash: {b.hash.slice(0, 8)}...</span>
            </div>
            <div className={`text-[9px] ${b.type === 'CRASH' ? 'text-red-400' : b.type === 'ALERT' ? 'text-orange-400' : 'text-gray-300'}`}>
              {b.message}
            </div>
          </div>
        ))}
        {chain.length === 0 && <div className="text-gray-600 italic">Waiting for telemetry...</div>}
      </div>
      <div className="mt-3 pt-2 border-t border-white/5">
        <p className="text-[7px] text-gray-500 italic leading-tight">
          Each event is cryptographically linked to the previous, ensuring tamper-proof audit trails for forensic analysis.
        </p>
      </div>
    </div>
  );
};

export const Alerts = () => {
  const alerts = useLogs((s) => s.alerts);

  return (
    <div className="flex flex-col gap-1.5 max-w-[240px]">
      {alerts.map((a, i) => (
        <div 
          key={i} 
          className="bg-red-500/10 backdrop-blur-md border border-red-500/30 px-3 py-1.5 rounded flex items-center gap-2 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.1)]"
        >
          <span className="text-red-500 text-[10px]">⚠️</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-red-400 truncate">
            {a}
          </span>
        </div>
      ))}
    </div>
  );
};
