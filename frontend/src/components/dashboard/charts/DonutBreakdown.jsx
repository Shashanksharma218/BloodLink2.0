import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const BLOOD_GROUP_COLORS = {
  'A+': '#be123c', 'A-': '#9f1239',
  'B+': '#2563eb', 'B-': '#1d4ed8',
  'O+': '#059669', 'O-': '#065f46',
  'AB+': '#7c3aed', 'AB-': '#6d28d9',
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-slate-900">{d.name}</p>
      <p className="text-slate-500">{d.value} request{d.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

const renderLegend = (props) => {
  const { payload } = props
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
      {payload.map((entry, i) => (
        <li key={i} className="flex items-center gap-1 text-xs text-slate-600">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  )
}

export function DonutBreakdown({ data = [], height = 220 }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-32 text-sm text-slate-400">No data</div>
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius="45%"
          outerRadius="65%"
          paddingAngle={3}
          dataKey="value"
          isAnimationActive
          animationDuration={800}
        >
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={BLOOD_GROUP_COLORS[entry.name] ?? '#94a3b8'}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  )
}
