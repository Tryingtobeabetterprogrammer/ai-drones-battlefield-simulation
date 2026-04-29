import React from 'react';

const TrustChart = ({ history }) => {
  const width = 600;
  const height = 300;
  const paddingX = 50;
  const paddingY = 40;
  
  // Display only what we have, or pad slightly for a full view
  const displayHistory = history.length < 2 ? [{ aiTrust: 1, legacyTrust: 1, time: 0 }, { aiTrust: 1, legacyTrust: 1, time: 1 }] : history;

  const xScale = (index) => paddingX + (index * (width - 2 * paddingX) / (displayHistory.length - 1 || 1));
  const yScale = (value) => (height - paddingY) - (value * (height - 2 * paddingY));

  const aiPoints = displayHistory.map((d, i) => ({ x: xScale(i), y: yScale(d.aiTrust) }));
  const legacyPoints = displayHistory.map((d, i) => ({ x: xScale(i), y: yScale(d.legacyTrust) }));

  const aiPath = aiPoints.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");
  const legacyPath = legacyPoints.reduce((acc, p, i) => acc + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`), "");

  return (
    <div className="flex flex-col items-center bg-[#1a1c20] p-6 rounded-xl border border-white/5 w-full">
      <div className="relative w-full flex flex-col items-center">
        <svg width={width} height={height} className="overflow-visible">
          {/* Axes */}
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#333" strokeWidth="1" />
          <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#333" strokeWidth="1" />

          {/* Horizontal Grid lines (subtle) */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((v, i) => (
            <React.Fragment key={`grid-y-${i}`}>
              <line 
                x1={paddingX} y1={yScale(v)} 
                x2={width - paddingX} y2={yScale(v)} 
                stroke="#222" strokeWidth="1" 
              />
              <text x={paddingX - 10} y={yScale(v) + 4} textAnchor="end" fontSize="10" fill="#666" fontWeight="bold">
                {Math.round(v * 100)}%
              </text>
            </React.Fragment>
          ))}

          {/* Lines */}
          <path d={legacyPath} fill="none" stroke="#ff4d4d" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(255,77,77,0.3)]" />
          <path d={aiPath} fill="none" stroke="#4da6ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(77,166,255,0.3)]" />

          {/* X-axis labels */}
          <text x={paddingX} y={height - paddingY + 20} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">T-Minus</text>
          <text x={width - paddingX} y={height - paddingY + 20} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">Now</text>
        </svg>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#4da6ff]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Swarm Intelligence</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#ff4d4d]" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legacy Node Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustChart;
