'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

const FORENSIC_COLORS = ['#C89D66', '#E08D9D', '#5FA788', '#D97762', '#D4A373', '#F4A6B6', '#B88950'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#181216] border border-[#382A34] p-2.5 rounded-lg shadow-xl text-xs font-mono space-y-1">
        <p className="font-bold text-[#FAF5F6] truncate max-w-[200px] border-b border-[#382A34] pb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C89D66]" />
          <span>{label}</span>
        </p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-[#D6C7C2] flex items-center justify-between gap-3 text-[11px]">
            <span className="capitalize font-medium">{p.name}:</span>
            <span className="font-bold text-[#FAF5F6]">
              {typeof p.value === 'number' && (p.name.includes('percentage') || p.name.includes('Ratio') || p.name.includes('Completeness')) 
                ? `${p.value.toFixed(1)}%` 
                : p.value.toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Missing Values Bar Chart
export function MissingValuesChart({ columnsData }: { columnsData: Record<string, any> }) {
  const data = Object.entries(columnsData).map(([colName, stats]) => ({
    name: colName,
    'Null Cells': stats.null_count || 0,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#382A34" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9E8B95" 
            fontSize={10} 
            fontFamily="monospace" 
            tickLine={false} 
            angle={-30} 
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#9E8B95" fontSize={10} fontFamily="monospace" tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Null Cells" fill="#D96B60" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Data Type Distribution Pie Chart
export function DataTypeDistributionChart({ detectedTypes }: { detectedTypes: Record<string, string> }) {
  const counts: Record<string, number> = {};
  Object.values(detectedTypes).forEach((t) => {
    counts[t] = (counts[t] || 0) + 1;
  });

  const data = Object.entries(counts).map(([type, count]) => ({
    name: type,
    value: count,
  }));

  return (
    <div className="h-[260px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
            dataKey="value"
            stroke="#141013"
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={FORENSIC_COLORS[index % FORENSIC_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-[11px] font-mono text-[#D6C7C2] capitalize font-medium">{value}</span>} 
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Column Completeness Level Chart
export function ColumnCompletenessChart({ columnsData }: { columnsData: Record<string, any> }) {
  const data = Object.entries(columnsData).map(([colName, stats]) => {
    const completeness = 100 - (stats.missing_percentage || 0);
    return {
      name: colName,
      'Completeness': completeness,
    };
  });

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#382A34" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9E8B95" 
            fontSize={10} 
            fontFamily="monospace" 
            tickLine={false} 
            angle={-30} 
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#9E8B95" fontSize={10} fontFamily="monospace" tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Completeness" fill="#C89D66" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Category Frequency Bar Chart
export function CategoryDistributionChart({ categories }: { categories: Array<{ value: string; count: number }> }) {
  const data = categories.map((c) => ({
    name: c.value,
    'Occurrences': c.count,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#382A34" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#9E8B95" 
            fontSize={10} 
            fontFamily="monospace" 
            tickLine={false} 
            angle={-30} 
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#9E8B95" fontSize={10} fontFamily="monospace" tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Occurrences" fill="#E08D9D" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
