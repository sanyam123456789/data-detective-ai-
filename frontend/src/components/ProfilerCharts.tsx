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

const FORENSIC_COLORS = ['#38BDF8', '#E59500', '#D9383A', '#10B981', '#94A3B8', '#64748B', '#F59E0B'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink-950 border border-ruling p-2.5 rounded shadow-lg text-xs font-mono space-y-1">
        <p className="font-bold text-paper-100 truncate max-w-[200px] border-b border-ruling pb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-evidence-amber" />
          <span>{label}</span>
        </p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-paper-300 flex items-center justify-between gap-3 text-[11px]">
            <span className="capitalize">{p.name}:</span>
            <span className="font-bold text-paper-100">
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

// 1. Missing Values Bar Chart (Forensic Anomaly Bar)
export function MissingValuesChart({ columnsData }: { columnsData: Record<string, any> }) {
  const data = Object.entries(columnsData).map(([colName, stats]) => ({
    name: colName,
    'Null Cells': stats.null_count || 0,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 25 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="#2A3442" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748B" 
            fontSize={10} 
            fontFamily="monospace" 
            tickLine={false} 
            angle={-30} 
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#64748B" fontSize={10} fontFamily="monospace" tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Null Cells" fill="#D9383A" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Data Type Distribution Pie Chart (Forensic Schema Distribution)
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
            stroke="#13171F"
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
            formatter={(value) => <span className="text-[11px] font-mono text-paper-300 capitalize">{value}</span>} 
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
          <CartesianGrid strokeDasharray="2 2" stroke="#2A3442" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748B" 
            fontSize={10} 
            fontFamily="monospace" 
            tickLine={false} 
            angle={-30} 
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#64748B" fontSize={10} fontFamily="monospace" tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Completeness" fill="#38BDF8" radius={[2, 2, 0, 0]} />
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
          <CartesianGrid strokeDasharray="2 2" stroke="#2A3442" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#64748B" 
            fontSize={10} 
            fontFamily="monospace" 
            tickLine={false} 
            angle={-30} 
            textAnchor="end"
            interval={0}
          />
          <YAxis stroke="#64748B" fontSize={10} fontFamily="monospace" tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Occurrences" fill="#E59500" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
