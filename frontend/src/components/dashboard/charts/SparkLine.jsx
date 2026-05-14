import { AreaChart, Area, ResponsiveContainer } from 'recharts'

export function SparkLine({ data = [], color = '#be123c', positive = true }) {
  const normalized = data.map((v, i) => ({ i, v: typeof v === 'number' ? v : (v?.value ?? 0) }))
  const fill = positive ? color : '#ef4444'

  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={normalized} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fill} stopOpacity={0.25} />
            <stop offset="95%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={fill}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
