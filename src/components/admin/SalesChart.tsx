'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { getOrders } from '@/data/account';
import { formatPriceToman } from '@/data/products';

export default function SalesChart() {
  const [data, setData] = useState<{ date: string; sales: number; fullDate: string }[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    // Ensure this runs only on client
    const orders = getOrders();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const chartData = last7Days.map(date => {
      const dateStr = date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
      const fullDate = date.toLocaleDateString('fa-IR');
      
      const dayOrders = orders.filter(o => {
        const oDate = new Date(o.createdAt);
        return oDate.getDate() === date.getDate() &&
               oDate.getMonth() === date.getMonth() &&
               oDate.getFullYear() === date.getFullYear() &&
               o.status !== 'cancelled';
      });
      
      const total = dayOrders.reduce((acc, curr) => acc + curr.total, 0);
      return {
        date: dateStr,
        fullDate,
        sales: total
      };
    });

    setTimeout(() => {
      setData(chartData);
    }, 0);
  }, []);

  // Calculate chart dimensions and points
  const { points, areaPath, maxSales, width, height, padding } = useMemo(() => {
    if (data.length === 0) return { points: '', areaPath: '', maxSales: 0, width: 0, height: 0, padding: 0 };

    const width = 100; // 100% relative width for calculations
    const height = 100; // 100% relative height
    const padding = 10;
    
    const max = Math.max(...data.map(d => d.sales));
    const maxSales = max === 0 ? 1000000 : max * 1.2; // Add some headroom

    const pointsArray = data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - (d.sales / maxSales) * (height - 2 * padding);
      return { x, y };
    });

    const pointsStr = pointsArray.map(p => `${p.x},${p.y}`).join(' ');
    
    // Create area path (close the loop at the bottom)
    const areaPath = `
      ${pointsArray[0].x},${height - padding} 
      ${pointsStr} 
      ${pointsArray[pointsArray.length - 1].x},${height - padding}
    `;

    return { points: pointsStr, areaPath, pointsArray, maxSales, width, height, padding };
  }, [data]);

  if (data.length === 0) {
      return <div className="h-[300px] flex items-center justify-center text-gray-400">در حال بارگذاری نمودار...</div>;
  }

  return (
    <div className="w-full h-[350px] mt-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-lg font-bold text-gray-800">فروش ۷ روز گذشته</h3>
        <div className="text-sm text-gray-500">
           مجموع: <span className="text-[#83b735] font-bold">{formatPriceToman(data.reduce((a, b) => a + b.sales, 0))}</span>
        </div>
      </div>
      
      <div className="relative w-full h-[200px]" onMouseLeave={() => setHoveredIndex(null)}>
        {/* Y-Axis Labels (approximate) */}
        <div className="absolute right-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pointer-events-none -mr-8" style={{ height: 'calc(100% - 20px)' }}>
          <span>{formatPriceToman(maxSales)}</span>
          <span>{formatPriceToman(maxSales / 2)}</span>
          <span>0</span>
        </div>

        {/* SVG Chart */}
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible" 
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f3f4f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#f3f4f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#f3f4f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />

          {/* Area Gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#83b735" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#83b735" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Path */}
          <path
            d={`M ${areaPath} Z`}
            fill="url(#chartGradient)"
            stroke="none"
          />

          {/* Line Path */}
          <polyline
            fill="none"
            stroke="#83b735"
            strokeWidth="3"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Interactive Points */}
          {data.map((_, i) => {
             const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
             const y = height - padding - (data[i].sales / maxSales) * (height - 2 * padding);
             return (
               <circle
                 key={i}
                 cx={x}
                 cy={y}
                 r="1.5"
                 className="fill-white stroke-[#83b735] stroke-2 hover:r-2 transition-all cursor-pointer"
                 vectorEffect="non-scaling-stroke"
                 onMouseEnter={() => setHoveredIndex(i)}
               />
             );
          })}
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute bottom-0 w-full flex justify-between px-2 translate-y-6">
          {data.map((d, i) => (
            <span key={i} className="text-xs text-gray-400 transform -translate-x-1/2" style={{ width: '40px', textAlign: 'center' }}>
              {d.date}
            </span>
          ))}
        </div>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div 
            className="absolute bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{ 
              left: `${(hoveredIndex / (data.length - 1)) * 100}%`, 
              top: `${100 - padding - (data[hoveredIndex].sales / maxSales) * (100 - 2 * padding)}%`,
              marginTop: '-10px'
            }}
          >
            <div className="font-bold mb-0.5">{data[hoveredIndex].fullDate}</div>
            <div>{formatPriceToman(data[hoveredIndex].sales)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
