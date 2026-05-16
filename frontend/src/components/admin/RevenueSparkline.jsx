import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

// Ultra-épuré: pas d'axes, pas de grille, pas de tooltip. Juste la courbe.
export const RevenueSparkline = ({ data = [], color = '#22c55e', height = 40 }) => {
  if (!data || data.length === 0 || data.every(v => v === 0)) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div style={{ width: '100%', height }} data-testid="revenue-sparkline">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill="url(#sparklineFill)" dot={false} isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueSparkline;
