import { useMemo } from 'react';
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
  'rgb(var(--app-accent-soft))',
  'rgb(var(--app-payment-method-1-bg))',
  'rgb(var(--app-payment-method-2-bg))',
  'rgb(var(--app-payment-method-3-bg))',
  'rgb(var(--app-input-border))',
];
const RADIAN = Math.PI / 180;
const PIE_LABEL_FILL = 'rgb(var(--app-text-primary))';

const getPieFillByName = (name, fallbackIndex) => {
  const normalizedName = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (normalizedName.includes('efectivo')) {
    return 'rgb(var(--app-payment-method-1-bg))';
  }
  if (normalizedName.includes('debito')) {
    return 'rgb(var(--app-payment-method-3-bg))';
  }
  if (normalizedName.includes('credito')) {
    return 'rgb(var(--app-payment-method-2-bg))';
  }
  return PIE_COLORS[Number(fallbackIndex || 0) % PIE_COLORS.length];
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (cx == null || cy == null || innerRadius == null || outerRadius == null) return null;
  const safeCx = Number(cx);
  const safeCy = Number(cy);
  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.52;
  const x = safeCx + radius * Math.cos(-Number(midAngle || 0) * RADIAN);
  const y = safeCy + radius * Math.sin(-Number(midAngle || 0) * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill={PIE_LABEL_FILL}
      textAnchor={x > safeCx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-[11px] font-extrabold"
    >
      {`${(Number(percent || 0) * 100).toFixed(0)}%`}
    </text>
  );
};

const renderPieSlice = (props) => (
  <Sector
    {...props}
    fill={props?.payload?.fill || PIE_COLORS[Number(props?.index || 0) % PIE_COLORS.length]}
    stroke="none"
  />
);

export default function DesktopTopCategoryChart({
  type = 'verticalBar',
  data = [],
  xKey = 'name',
  series = [],
  valueFormat = 'currency',
  showZeroReference = false,
  lineType = 'monotone',
  lineConnectNulls = false,
}) {
  const resolvedSeries = useMemo(() => (Array.isArray(series) ? series : []), [series]);

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
        fill: getPieFillByName(item?.[xKey] || item?.name, index),
      }))
      .filter((item) => item.value > 0);
  }, [data, resolvedSeries, type, xKey]);

  const renderActivePieTooltip = ({ active, payload }) => {
    if (!active || !Array.isArray(payload) || payload.length === 0) return null;

    const point = payload[0];
    const labelColor = point?.payload?.fill || 'rgb(var(--app-text-primary))';

    return (
      <div style={{ ...tooltipStyle, padding: '0.55rem 0.65rem' }}>
        <p
          className="text-[11px] font-extrabold uppercase tracking-wide"
          style={{ color: labelColor }}
        >
          {point?.name || '-'}
        </p>
        <p className="mt-1 text-xs font-semibold" style={{ color: 'rgb(var(--app-text-primary))' }}>
          {formatValue(point?.value)}
        </p>
      </div>
    );
  };

  if (resolvedSeries.length === 0) return null;

  if (type === 'activePie') {
    return (
      <ResponsiveContainer {...responsiveProps}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            labelLine={false}
            label={renderPieLabel}
            shape={renderPieSlice}
            dataKey="value"
            isAnimationActive
          >
            {pieData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={renderActivePieTooltip} />
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
              type={lineType}
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={2}
              connectNulls={lineConnectNulls}
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
