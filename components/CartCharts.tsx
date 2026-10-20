import React, { useState } from 'react';

interface PieDataItem {
  name: string;
  value: number;
}

interface InteractivePieChartProps {
  data: PieDataItem[];
  colors: string[];
  selectedItems?: string[];
  onItemClick?: (name: string) => void;
  formatTooltip?: (value: number) => string;
  height?: number;
}

export const InteractivePieChart: React.FC<InteractivePieChartProps> = ({
  data,
  colors,
  selectedItems = [],
  onItemClick,
  formatTooltip = (val) => `${val}`,
  height = 240
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center text-gray-400 text-xs italic bg-white/50 rounded-lg border border-dashed border-gray-200"
        style={{ height }}
      >
        <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <span>Sin datos</span>
      </div>
    );
  }

  // Calculate SVG arc paths
  const size = 160;
  const center = size / 2;
  const radius = 62;
  const innerRadius = 32; // Donut style for modern NB look

  let currentAngle = -Math.PI / 2;

  const slices = data.map((item, index) => {
    const fraction = item.value / total;
    const angle = fraction * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Outer arc points
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    // Inner arc points
    const ix1 = center + innerRadius * Math.cos(endAngle);
    const iy1 = center + innerRadius * Math.sin(endAngle);
    const ix2 = center + innerRadius * Math.cos(startAngle);
    const iy2 = center + innerRadius * Math.sin(startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const pathData = data.length === 1
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 0 ${center} ${center + radius} A ${radius} ${radius} 0 1 0 ${center} ${center - radius} M ${center} ${center - innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center + innerRadius} A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center - innerRadius} Z`
      : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

    const color = colors[index % colors.length];
    const isSelected = selectedItems.length > 0 && selectedItems.includes(item.name);
    const isDimmed = selectedItems.length > 0 && !selectedItems.includes(item.name);
    const isHovered = hoveredIndex === index;

    return {
      item,
      index,
      pathData,
      color,
      fraction,
      percentage: Math.round(fraction * 100),
      isSelected,
      isDimmed,
      isHovered
    };
  });

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center justify-between" style={{ minHeight: height }}>
      {/* SVG Container with Tooltip Overlay */}
      <div className="relative flex items-center justify-center">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`} 
          className="overflow-visible select-none"
        >
          {slices.map((slice) => (
            <path
              key={`slice-${slice.index}`}
              d={slice.pathData}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth={slice.isHovered ? 2.5 : 1.5}
              className="cursor-pointer transition-all duration-150"
              style={{
                opacity: slice.isDimmed ? 0.28 : slice.isHovered ? 0.95 : 0.85,
                transformOrigin: `${center}px ${center}px`,
                transform: slice.isHovered ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={() => setHoveredIndex(slice.index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onItemClick && onItemClick(slice.item.name)}
            />
          ))}

          {/* Center text for donut */}
          <text
            x={center}
            y={center - 3}
            textAnchor="middle"
            className="text-[11px] font-bold fill-gray-900"
            style={{ pointerEvents: 'none' }}
          >
            {activeSlice ? `${activeSlice.percentage}%` : total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </text>
          <text
            x={center}
            y={center + 10}
            textAnchor="middle"
            className="text-[8px] font-semibold fill-gray-500 uppercase tracking-tight"
            style={{ pointerEvents: 'none' }}
          >
            {activeSlice ? activeSlice.item.name.slice(0, 8) : 'Total'}
          </text>
        </svg>

        {/* Hover Tooltip Popup */}
        {activeSlice && (
          <div 
            className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none z-30 bg-gray-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap flex items-center gap-1.5"
          >
            <span 
              className="w-2 h-2 rounded-full inline-block" 
              style={{ backgroundColor: activeSlice.color }} 
            />
            <span className="font-semibold">{activeSlice.item.name}:</span>
            <span>{formatTooltip(activeSlice.item.value)}</span>
            <span className="text-gray-300 font-light">({activeSlice.percentage}%)</span>
          </div>
        )}
      </div>

      {/* Interactive Legend with click toggle */}
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-2 w-full px-1">
        {slices.map((slice) => (
          <button
            key={`legend-${slice.index}`}
            type="button"
            onClick={() => onItemClick && onItemClick(slice.item.name)}
            onMouseEnter={() => setHoveredIndex(slice.index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded transition-all cursor-pointer ${
              slice.isSelected
                ? 'bg-red-50 text-[#CF0A2C] font-bold border border-red-200 shadow-2xs'
                : slice.isDimmed
                ? 'opacity-40 text-gray-500'
                : 'text-gray-700 hover:bg-gray-100 font-medium'
            }`}
            title={`Filtrar por ${slice.item.name} (${formatTooltip(slice.item.value)})`}
          >
            <span 
              className="w-2 h-2 rounded-sm shrink-0" 
              style={{ backgroundColor: slice.color }} 
            />
            <span className="truncate max-w-[70px]">{slice.item.name}</span>
            <span className="text-[9px] text-gray-500 font-mono">
              ({slice.percentage}%)
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface BarDataItem {
  model: string;
  units: number;
}

interface InteractiveBarChartProps {
  data: BarDataItem[];
  colors: string[];
  selectedModel?: string | null;
  onModelClick?: (model: string) => void;
  height?: number;
}

export const InteractiveBarChart: React.FC<InteractiveBarChartProps> = ({
  data,
  colors,
  selectedModel = null,
  onModelClick,
  height = 240
}) => {
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const maxUnits = data.reduce((max, d) => Math.max(max, d.units || 0), 1);

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center text-gray-400 text-xs italic bg-white/50 rounded-lg border border-dashed border-gray-200"
        style={{ height }}
      >
        <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Sin productos en la selección</span>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col justify-center space-y-1.5 w-full overflow-y-auto px-1 py-1"
      style={{ maxHeight: height }}
    >
      {data.map((item, index) => {
        const percent = Math.min(100, Math.max(8, (item.units / maxUnits) * 100));
        const color = colors[index % colors.length];
        const isSelected = selectedModel === item.model;
        const isHovered = hoveredModel === item.model;

        return (
          <div
            key={`bar-${item.model}-${index}`}
            onClick={() => onModelClick && onModelClick(item.model)}
            onMouseEnter={() => setHoveredModel(item.model)}
            onMouseLeave={() => setHoveredModel(null)}
            className={`group cursor-pointer rounded p-1 transition-all ${
              isSelected 
                ? 'bg-red-50 border-l-2 border-[#CF0A2C]' 
                : isHovered 
                ? 'bg-gray-100/70' 
                : 'hover:bg-gray-50'
            }`}
            title={`Modelo: ${item.model} (${item.units} uds) - Clic para filtrar`}
          >
            <div className="flex items-center justify-between text-[10px] mb-0.5 leading-tight">
              <span className={`truncate font-medium max-w-[130px] ${isSelected ? 'text-[#CF0A2C] font-bold' : 'text-gray-800'}`}>
                {item.model}
              </span>
              <span className="font-mono text-gray-700 text-[9px] font-bold shrink-0 ml-1">
                {item.units} uds
              </span>
            </div>

            {/* Bar progress track */}
            <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${percent}%`,
                  backgroundColor: color,
                  opacity: selectedModel && !isSelected ? 0.35 : 0.9
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
