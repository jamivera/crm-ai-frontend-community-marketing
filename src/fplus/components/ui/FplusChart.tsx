import { useRef, useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

interface FplusChartProps {
  tipo: 'area' | 'line';
  data: any[];
  series: ChartSeries[];
}

export function FplusChart({ tipo, data, series }: FplusChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 230 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      // Get the stable inner width and height from parent container
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.floor(width) || 300,
        height: Math.floor(height) || 230,
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-800 text-white p-3 rounded-2xl shadow-xl text-xs space-y-1 z-50">
          <p className="font-bold text-slate-400">{label}</p>
          {payload.map((p: any) => {
            const val = p.value !== undefined && p.value !== null ? p.value : 0;
            return (
              <p key={p.name} className="flex justify-between gap-4 font-semibold">
                <span style={{ color: p.color }}>{p.name}:</span>
                <span>{val.toLocaleString('es')}</span>
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div ref={containerRef} className="w-full h-full min-h-[230px] relative flex items-center justify-center">
      {dimensions.width > 0 && (
        tipo === 'area' ? (
          <AreaChart
            width={dimensions.width}
            height={dimensions.height}
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {series.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {series.map(s => (
              <Area
                key={s.key}
                name={s.name}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#grad-${s.key})`}
              />
            ))}
          </AreaChart>
        ) : (
          <LineChart
            width={dimensions.width}
            height={dimensions.height}
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            {series.map(s => (
              <Line
                key={s.key}
                name={s.name}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                activeDot={{ r: 5 }}
                dot={{ r: 3 }}
              />
            ))}
          </LineChart>
        )
      )}
    </div>
  );
}
