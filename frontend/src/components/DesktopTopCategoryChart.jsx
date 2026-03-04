import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;
const formatNumber = (value) => Number(value || 0).toLocaleString('es-AR');
const formatPercent = (value) =>
  `${Number(value || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;

const PIE_COLORS = [
  'rgb(var(--app-accent-main))',
  'rgb(var(--app-text-primary))',
  'rgb(var(--app-text-muted))',
  'rgb(var(--app-input-border))',
  'rgb(var(--app-accent-soft))',
  'rgb(var(--app-status-online-text))',
];

export default function DesktopTopCategoryChart({
  type = 'verticalBar',
  data = [],
  xKey = 'name',
  series = [],
  valueFormat = 'currency',
  showZeroReference = false,
}) {
  const resolvedSeries = useMemo(() => (Array.isArray(series) ? series : []), [series]);
  const [activePieIndex, setActivePieIndex] = useState(0);

  const formatValue = useMemo(() => {
    if (typeof valueFormat === 'function') return valueFormat;
    if (valueFormat === 'percent') return formatPercent;
    if (valueFormat === 'number') return formatNumber;
    return formatCurrency;
  }, [valueFormat]);

  const chartMargin = { top: 8, right: 16, left: 18, bottom: 8 };
  const yAxisProps = {
    width: 92,
    tickMargin: 8,
    stroke: 'rgb(var(--app-text-muted))',
    tick: { fill: 'rgb(var(--app-text-muted))', fontSize: 12 },
    tickFormatter: formatValue,
  };

  const responsiveProps = {
    width: '100%',
    height: '100%',
    minWidth: 1,
    minHeight: 1,
  };

  const tooltipStyle = {
    background: 'rgb(var(--app-panel))',
    border: '1px solid rgb(var(--app-input-border) / 0.35)',
    color: 'rgb(var(--app-text-primary))',
    borderRadius: '0.75rem',
  };

  const pieData = useMemo(() => {
    if (type !== 'activePie') return [];
    const valueKey = resolvedSeries[0]?.key || 'total';
    return (data || [])
      .map((item, index) => ({
        name: String(item?.[xKey] || item?.name || `Categoria ${index + 1}`),
        value: Number(item?.[valueKey] || 0),
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [data, resolvedSeries, type, xKey]);

  if (resolvedSeries.length === 0) return null;

  const renderActivePieShape = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  }) => {
    const RADIAN = Math.PI / 180;
    const safeMidAngle = Number(midAngle || 0);
    const safeOuterRadius = Number(outerRadius || 0);
    const safeCx = Number(cx || 0);
    const safeCy = Number(cy || 0);
    const sin = Math.sin(-RADIAN * safeMidAngle);
    const cos = Math.cos(-RADIAN * safeMidAngle);
    const sx = safeCx + (safeOuterRadius + 10) * cos;
    const sy = safeCy + (safeOuterRadius + 10) * sin;
    const mx = safeCx + (safeOuterRadius + 30) * cos;
    const my = safeCy + (safeOuterRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={safeCx} y={safeCy} dy={8} textAnchor="middle" fill={fill} className="text-xs font-semibold">
          {payload?.name || '-'}
        </text>
        <Sector
          cx={safeCx}
          cy={safeCy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={safeCx}
          cy={safeCy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={safeOuterRadius + 6}
          outerRadius={safeOuterRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          textAnchor={textAnchor}
          fill="rgb(var(--app-text-primary))"
          className="text-xs font-semibold"
        >
          {`Valor ${formatValue(value)}`}
        </text>
        <text
          x={ex + (cos >= 0 ? 1 : -1) * 12}
          y={ey}
          dy={16}
          textAnchor={textAnchor}
          fill="rgb(var(--app-text-muted))"
          className="text-xs"
        >
          {`(${(Number(percent || 0) * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  };

  if (type === 'activePie') {
    return (
      <ResponsiveContainer {...responsiveProps}>
        <PieChart margin={{ top: 20, right: 120, bottom: 8, left: 120 }}>
          <Pie
            activeIndex={Math.min(activePieIndex, Math.max(pieData.length - 1, 0))}
            activeShape={renderActivePieShape}
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            onMouseEnter={(_, index) => setActivePieIndex(Number(index))}
            isAnimationActive
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={() => null} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'stackedBar') {
    return (
      <ResponsiveContainer {...responsiveProps}>
        <BarChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
          <XAxis dataKey={xKey} stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} />
          <YAxis {...yAxisProps} />
          <Tooltip formatter={(value) => [formatValue(value), 'Valor']} contentStyle={tooltipStyle} />
          <Legend />
          {resolvedSeries.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId="total"
              fill={item.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'stackedArea') {
    return (
      <ResponsiveContainer {...responsiveProps}>
        <AreaChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
          <XAxis dataKey={xKey} stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} />
          <YAxis {...yAxisProps} />
          {showZeroReference ? <ReferenceLine y={0} stroke="rgb(var(--app-input-border) / 0.6)" /> : null}
          <Tooltip formatter={(value) => [formatValue(value), 'Valor']} contentStyle={tooltipStyle} />
          <Legend />
          {resolvedSeries.map((item) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stackId="total"
              stroke={item.color}
              fill={item.color}
              fillOpacity={0.42}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'horizontalBar') {
    return (
      <ResponsiveContainer {...responsiveProps}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
          <XAxis
            type="number"
            stroke="rgb(var(--app-text-muted))"
            tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }}
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            width={144}
            stroke="rgb(var(--app-text-muted))"
            tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }}
          />
          {showZeroReference ? <ReferenceLine x={0} stroke="rgb(var(--app-input-border) / 0.6)" /> : null}
          <Tooltip formatter={(value) => [formatValue(value), 'Valor']} contentStyle={tooltipStyle} />
          <Legend />
          {resolvedSeries.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              fill={item.color}
              radius={[0, 6, 6, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer {...responsiveProps}>
        <LineChart data={data} margin={chartMargin}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
          <XAxis dataKey={xKey} stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} />
          <YAxis {...yAxisProps} />
          {showZeroReference ? <ReferenceLine y={0} stroke="rgb(var(--app-input-border) / 0.6)" /> : null}
          <Tooltip formatter={(value) => [formatValue(value), 'Valor']} contentStyle={tooltipStyle} />
          {resolvedSeries.length > 1 ? <Legend /> : null}
          {resolvedSeries.map((item) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer {...responsiveProps}>
      <BarChart data={data} margin={chartMargin}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
        <XAxis
          dataKey={xKey}
          stroke="rgb(var(--app-text-muted))"
          tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }}
        />
        <YAxis {...yAxisProps} />
        <Tooltip formatter={(value) => [formatValue(value), 'Valor']} contentStyle={tooltipStyle} />
        {resolvedSeries.map((item) => (
          <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
