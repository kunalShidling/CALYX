import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export interface ScoreHistogramProps {
  distribution: {
    top_tier: number;
    strong: number;
    average: number;
    below_50: number;
  };
}

export const ScoreHistogram: React.FC<ScoreHistogramProps> = ({ distribution }) => {
  const data = [
    { name: 'Top Tier (85-100%)', count: distribution.top_tier || 0, color: '#10B981' },
    { name: 'Strong (70-84%)', count: distribution.strong || 0, color: '#6366F1' },
    { name: 'Average (50-69%)', count: distribution.average || 0, color: '#F59E0B' },
    { name: 'Below 50%', count: distribution.below_50 || 0, color: '#F43F5E' },
  ];

  const total = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="w-full">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F172A',
                borderColor: '#1E293B',
                borderRadius: '0.75rem',
                fontSize: '12px',
                color: '#F8FAFC',
              }}
              formatter={(value: any) => [`${value} candidate(s)`, 'Count']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-surface-800 text-center">
        {data.map((item, idx) => (
          <div key={idx} className="bg-surface-950 p-2 rounded-lg border border-surface-800">
            <span className="text-[10px] text-surface-400 block truncate">{item.name}</span>
            <span className="text-sm font-bold text-white mt-0.5 block">{item.count}</span>
            <span className="text-[10px] font-mono text-surface-500">
              {total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
