import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatCurrency = (value) => `$${Number(value || 0).toLocaleString('es-AR')}`;

export default function DesktopTopCategoryChart({
  type = 'verticalBar',
  data = [],
  xKey = 'name',
  series = [],
}) {
  if (!Array.isArray(series) || series.length === 0) return null;

  const tooltipStyle = {
    background: 'rgb(var(--app-panel))',
    border: '1px solid rgb(var(--app-input-border) / 0.35)',
    color: 'rgb(var(--app-text-primary))',
    borderRadius: '0.75rem',
  };

  if (type === 'stackedBar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
          <XAxis dataKey={xKey} stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} />
          <YAxis stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} tickFormatter={formatCurrency} />
          <Tooltip formatter={(value) => [formatCurrency(value), 'Monto']} contentStyle={tooltipStyle} />
          <Legend />
          {series.map((item) => (
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

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
          <XAxis dataKey={xKey} stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} />
          <YAxis stroke="rgb(var(--app-text-muted))" tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }} tickFormatter={formatCurrency} />
          <Tooltip formatter={(value) => [formatCurrency(value), 'Monto']} contentStyle={tooltipStyle} />
          {series.length > 1 ? <Legend /> : null}
          {series.map((item) => (
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
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--app-input-border) / 0.25)" />
        <XAxis
          dataKey={xKey}
          stroke="rgb(var(--app-text-muted))"
          tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }}
        />
        <YAxis
          stroke="rgb(var(--app-text-muted))"
          tick={{ fill: 'rgb(var(--app-text-muted))', fontSize: 12 }}
          tickFormatter={formatCurrency}
        />
        <Tooltip formatter={(value) => [formatCurrency(value), 'Monto']} contentStyle={tooltipStyle} />
        {series.map((item) => (
          <Bar key={item.key} dataKey={item.key} name={item.label} fill={item.color} radius={[6, 6, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
