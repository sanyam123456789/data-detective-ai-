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

const COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-950/95 border border-white/10 backdrop-blur-md p-3 rounded-lg text-xs space-y-1 shadow-xl">
        <p className="font-bold text-white truncate max-w-[180px]">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color || p.fill }} className="font-medium">
            <span className="capitalize">{p.name}</span>: {typeof p.value === 'number' && (p.name.includes('percentage') || p.name.includes('Completeness')) ? `${p.value.toFixed(1)}%` : p.value}
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
    'Null Count': stats.null_count || 0,
  }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -25, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Null Count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
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
    <div className="h-[280px] w-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-[11px] text-gray-400 capitalize font-medium">{value}</span>} 
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
      'Completeness Ratio': completeness,
    };
  });

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -25, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Completeness Ratio" fill="#10b981" radius={[4, 4, 0, 0]} />
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
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 15, right: 10, left: -25, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
          <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="Occurrences" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
