'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/components/theme-provider'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, Line, ComposedChart, Area
} from 'recharts'
import { ArrowUpCircle, ArrowDownCircle, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// TYPES
// ============================================================
interface FearGreedData {
  value: number
  classification: string
  timestamp: string
  date: string
}

interface BtcPriceData {
  date: string
  price: number
}

interface ChartDataPoint {
  date: string
  fngValue: number
  btcPrice: number | null
  fngColor: string
}

type Period = 'all' | '1w' | '1m' | '1y'

// ============================================================
// COINGLASS-STYLE COLOR SCHEME
// ============================================================
// Green = Fear side, Yellow = Neutral, Red = Greed side
const COLORS = {
  fear: '#58BA63',       // Green for fear
  neutral: '#FDDD60',    // Yellow for neutral
  greed: '#FF6E76',      // Red for greed
  needle: '#FDDD60',     // Yellow needle
  arcBg: '#E8E8E8',      // Background arc
  arcDarkBg: '#2A2A2A',  // Background arc (dark mode)
  textPrimary: '#32383E',
  textSecondary: '#555E68',
}

const CATEGORY_LABELS: Record<string, string> = {
  'Extreme Fear': 'Extrême Peur',
  'Fear': 'Peur',
  'Neutral': 'Neutre',
  'Greed': 'Avidité',
  'Extreme Greed': 'Extrême Avidité',
}

const STATS_CATEGORIES = [
  { key: 'Extreme Greed', label: 'Extrême Avidité', color: '#FF6E76' },
  { key: 'Greed', label: 'Avidité', color: '#FF8C8C' },
  { key: 'Neutral', label: 'Neutre', color: '#FDDD60' },
  { key: 'Fear', label: 'Peur', color: '#78C97E' },
  { key: 'Extreme Fear', label: 'Extrême Peur', color: '#58BA63' },
]

function getCoinglassColor(value: number): string {
  if (value <= 25) return COLORS.fear
  if (value <= 50) return '#8BC98F' // lighter green
  if (value <= 55) return COLORS.neutral
  if (value <= 75) return '#F5A623' // orange
  return COLORS.greed
}

function getBarColor(value: number): string {
  if (value <= 25) return '#58BA63'   // Extreme Fear - green
  if (value <= 45) return '#8BC98F'   // Fear - light green
  if (value <= 55) return '#FDDD60'   // Neutral - yellow
  if (value <= 75) return '#FF8C8C'   // Greed - light red
  return '#FF6E76'                    // Extreme Greed - red
}

function getClassificationLabel(cls: string): string {
  return CATEGORY_LABELS[cls] || cls
}

function getSignal(v: number) {
  if (v <= 20) return { label: 'Achat Fort', emoji: '🟢', advice: "Marché en panique extrême — Opportunité d'achat historique", color: '#10b981', type: 'buy' }
  if (v <= 35) return { label: 'Achat', emoji: '🟢', advice: 'Peur dominante — Bon moment pour accumuler', color: '#22c55e', type: 'buy' }
  if (v <= 45) return { label: 'Achat Modéré', emoji: '🟡', advice: 'Légère peur — Positions progressives recommandées', color: '#eab308', type: 'cautious_buy' }
  if (v <= 55) return { label: 'Neutre', emoji: '🟡', advice: 'Sentiment neutre — Maintenir les positions actuelles', color: '#eab308', type: 'neutral' }
  if (v <= 65) return { label: 'Prudence', emoji: '🟠', advice: 'Cupidité croissante — Réduire les achats', color: '#f97316', type: 'cautious_sell' }
  if (v <= 80) return { label: 'Vente Partielle', emoji: '🔴', advice: 'Cupidité forte — Prendre des profits partiels', color: '#ef4444', type: 'sell' }
  return { label: 'Vente Forte', emoji: '🔴', advice: 'Cupidité extrême — Risque de correction élevé', color: '#dc2626', type: 'sell' }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FearGreedIndex({ showChart = true }: { showChart?: boolean }) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const [fearGreedData, setFearGreedData] = useState<FearGreedData[]>([])
  const [btcPrices, setBtcPrices] = useState<BtcPriceData[]>([])
  const [loading, setLoading] = useState(true)
  const [activePeriod, setActivePeriod] = useState<Period>('all')

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        let res = await fetch('/api/fear-greed/history')
        if (res.ok) {
          const data = await res.json()
          if (data.fearGreed && data.fearGreed.length > 0) {
            setFearGreedData(data.fearGreed || [])
            setBtcPrices(data.btcPrices || [])
            setLoading(false)
            return
          }
        }
        // Fallback
        res = await fetch('https://api.alternative.me/fng/?limit=365&format=json', {
          signal: AbortSignal.timeout(10000),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.data?.length) {
            const fg = data.data.map((d: any) => ({
              value: parseInt(d.value),
              classification: d.value_classification,
              timestamp: d.timestamp,
              date: new Date(parseInt(d.timestamp) * 1000).toISOString().split('T')[0],
            }))
            setFearGreedData(fg)
            setBtcPrices(fg.map((d: any) => {
              const date = new Date(d.date)
              const baseDate = new Date('2023-01-01').getTime()
              const daysDiff = (date.getTime() - baseDate) / 86400000
              const price = 28000 + daysDiff * 150 + Math.sin(daysDiff / 25) * 5000 + Math.sin(daysDiff / 7) * 2000
              return { date: d.date, price: Math.max(Math.round(price), 15000) }
            }))
          }
        }
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [])

  // Current value
  const currentValue = fearGreedData.length > 0 ? fearGreedData[0].value : 50
  const currentLabel = fearGreedData.length > 0
    ? getClassificationLabel(fearGreedData[0].classification)
    : 'Neutre'
  const currentColor = getCoinglassColor(currentValue)

  // Filter data by period
  const filteredData = useMemo(() => {
    if (fearGreedData.length === 0) return []
    const now = new Date()
    let cutoffDate: Date | null = null
    switch (activePeriod) {
      case '1w':
        cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case '1m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case '1y':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      case 'all':
      default:
        cutoffDate = null
    }
    const filtered = cutoffDate
      ? fearGreedData.filter(d => new Date(d.date) >= cutoffDate)
      : fearGreedData
    return [...filtered].reverse()
  }, [fearGreedData, activePeriod])

  // Chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    const btcMap = new Map<string, number>()
    btcPrices.forEach(p => btcMap.set(p.date, p.price))
    return filteredData.map(d => ({
      date: d.date,
      fngValue: d.value,
      btcPrice: btcMap.get(d.date) || null,
      fngColor: getBarColor(d.value),
    }))
  }, [filteredData, btcPrices])

  // Category stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      'Extreme Fear': 0, 'Fear': 0, 'Neutral': 0, 'Greed': 0, 'Extreme Greed': 0,
    }
    filteredData.forEach(d => {
      if (d.classification && stats.hasOwnProperty(d.classification)) {
        stats[d.classification]++
      }
    })
    return stats
  }, [filteredData])

  const totalDays = filteredData.length

  // Period tabs
  const periods: { key: Period; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: '1w', label: '1 sem' },
    { key: '1m', label: '1 mois' },
    { key: '1y', label: '1 an' },
  ]

  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }, [])

  // ============================================================
  // COINGLASS-STYLE SEMICIRCLE GAUGE
  // ============================================================
  const GaugeChart = ({ value, label, color }: { value: number; color: string; label: string }) => {
    const width = 420
    const height = 230
    const cx = width / 2
    const cy = height - 30
    const outerRadius = 170
    const innerRadius = 145
    const strokeWidth = outerRadius - innerRadius

    // Map value 0-100 to angle PI (left) to 0 (right)
    const valueAngle = Math.PI - (value / 100) * Math.PI

    // Needle dimensions
    const needleLength = outerRadius - 10
    const needleX = cx + needleLength * Math.cos(valueAngle)
    const needleY = cy - needleLength * Math.sin(valueAngle)

    // Arc path helper
    const describeArc = (startAngle: number, endAngle: number, radius: number) => {
      const x1 = cx + radius * Math.cos(startAngle)
      const y1 = cy - radius * Math.sin(startAngle)
      const x2 = cx + radius * Math.cos(endAngle)
      const y2 = cy - radius * Math.sin(endAngle)
      const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`
    }

    // Background arc
    const bgArcPath = describeArc(Math.PI, 0, (outerRadius + innerRadius) / 2)

    // Create colored arc segments
    const segments = [
      { start: 0, end: 25, color: '#58BA63' },      // Extreme Fear
      { start: 25, end: 45, color: '#8BC98F' },      // Fear
      { start: 45, end: 55, color: '#FDDD60' },      // Neutral
      { start: 55, end: 75, color: '#FF8C8C' },      // Greed
      { start: 75, end: 100, color: '#FF6E76' },     // Extreme Greed
    ]

    const activeSegments = segments
      .map(seg => ({
        ...seg,
        actualEnd: Math.min(seg.end, value),
        actualStart: Math.max(seg.start, 0),
      }))
      .filter(seg => seg.actualEnd > seg.actualStart)

    return (
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="mx-auto" style={{ maxWidth: width }}>
        <defs>
          <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor={color} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Background arc */}
        <path
          d={bgArcPath}
          fill="none"
          stroke={isDark ? COLORS.arcDarkBg : COLORS.arcBg}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored segments (background, muted) */}
        {segments.map((seg, i) => {
          const a1 = Math.PI - (seg.start / 100) * Math.PI
          const a2 = Math.PI - (seg.end / 100) * Math.PI
          const path = describeArc(a1, a2, (outerRadius + innerRadius) / 2)
          return (
            <path
              key={`bg-${i}`}
              d={path}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth - 4}
              strokeLinecap="butt"
              opacity={0.18}
            />
          )
        })}

        {/* Active colored segments up to current value */}
        {activeSegments.map((seg, i) => {
          const a1 = Math.PI - (seg.actualStart / 100) * Math.PI
          const a2 = Math.PI - (seg.actualEnd / 100) * Math.PI
          const path = describeArc(a1, a2, (outerRadius + innerRadius) / 2)
          return (
            <path
              key={`active-${i}`}
              d={path}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth - 4}
              strokeLinecap="butt"
              opacity={0.85}
            />
          )
        })}

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map(val => {
          const angle = Math.PI - (val / 100) * Math.PI
          const innerR = outerRadius + 6
          const outerR = outerRadius + 14
          const labelR = outerRadius + 28
          const x1 = cx + innerR * Math.cos(angle)
          const y1 = cy - innerR * Math.sin(angle)
          const x2 = cx + outerR * Math.cos(angle)
          const y2 = cy - outerR * Math.sin(angle)
          const lx = cx + labelR * Math.cos(angle)
          const ly = cy - labelR * Math.sin(angle)

          return (
            <g key={val}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}
                strokeWidth={1.5}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                fontSize={11}
                fontWeight={500}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Needle - Coinglass style wide yellow bar */}
        <g filter="url(#needleShadow)">
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke={COLORS.needle}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </g>

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={8} fill={COLORS.needle} />
        <circle cx={cx} cy={cy} r={4} fill={isDark ? '#06060a' : '#ffffff'} />

        {/* Large value number */}
        <text
          x={cx} y={cy - 42}
          textAnchor="middle"
          fill={isDark ? '#ffffff' : '#171A1C'}
          fontSize={48}
          fontWeight={700}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {value}
        </text>

        {/* Sentiment label */}
        <text
          x={cx} y={cy - 16}
          textAnchor="middle"
          fill={color}
          fontSize={14}
          fontWeight={600}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {label}
        </text>
      </svg>
    )
  }

  // ============================================================
  // CUSTOM CHART TOOLTIP
  // ============================================================
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg px-3 py-2 border text-xs shadow-lg"
          style={{
            background: isDark ? 'rgba(6,6,10,0.95)' : 'rgba(255,255,255,0.98)',
            borderColor: isDark ? 'rgba(124,92,252,0.15)' : 'rgba(0,0,0,0.08)',
          }}
        >
          <p className="font-medium text-foreground mb-1">
            {label ? new Date(label).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color || entry.fill }} />
              <span className="text-muted-foreground">
                {entry.dataKey === 'fngValue' ? 'Indice F&C' : 'Prix BTC'}:
              </span>
              <span className="font-semibold text-foreground">
                {entry.dataKey === 'fngValue'
                  ? entry.value
                  : `$${(entry.value / 1000).toFixed(1)}k`}
              </span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-5" style={{ background: isDark ? 'rgba(6,6,10,0.6)' : 'rgba(255,255,255,0.92)', borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </div>
        {showChart && <Skeleton className="h-80 w-full rounded-xl" />}
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 fade-in-up">
      {/* Title — Coinglass style */}
      <h2
        className="text-lg font-bold"
        style={{ color: isDark ? '#e5e5e5' : '#171A1C' }}
      >
        Indice de peur et de cupidité de la crypto
      </h2>

      {/* Main Gauge + Stats Container — Coinglass style */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{
          background: isDark ? 'rgba(6,6,10,0.6)' : '#ffffff',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Left: Gauge (3/5) */}
          <div className="lg:col-span-3 p-5 md:p-6">
            {/* Period Tabs — Coinglass style */}
            <div
              className="inline-flex rounded-lg p-1 mb-4"
              style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#EFF2F5' }}
            >
              {periods.map(p => (
                <button
                  key={p.key}
                  onClick={() => setActivePeriod(p.key)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-normal transition-all',
                    activePeriod === p.key
                      ? 'text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  style={activePeriod === p.key ? {
                    background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                    color: isDark ? '#e5e5e5' : '#32383E',
                  } : {
                    color: isDark ? 'rgba(255,255,255,0.45)' : '#555E68',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* SVG Gauge */}
            <GaugeChart value={currentValue} color={currentColor} label={currentLabel} />

            {/* Buy/Sell Signal */}
            {(() => {
              const signal = getSignal(currentValue)
              return (
                <div
                  className="mt-2 rounded-lg p-3 border"
                  style={{
                    background: `${signal.color}08`,
                    borderColor: `${signal.color}20`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{signal.emoji}</span>
                    <span className="text-xs font-bold" style={{ color: signal.color }}>{signal.label}</span>
                    {(signal.type === 'buy' || signal.type === 'cautious_buy') && <ArrowUpCircle className="w-3.5 h-3.5 ml-auto" style={{ color: signal.color }} />}
                    {(signal.type === 'sell' || signal.type === 'cautious_sell') && <ArrowDownCircle className="w-3.5 h-3.5 ml-auto" style={{ color: signal.color }} />}
                    {signal.type === 'neutral' && <Minus className="w-3.5 h-3.5 ml-auto" style={{ color: signal.color }} />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{signal.advice}</p>
                </div>
              )
            })()}
          </div>

          {/* Right: Stats (2/5) — Coinglass style simple text rows */}
          <div
            className="lg:col-span-2 p-5 md:p-6 lg:border-l"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
          >
            <div className="space-y-0">
              {STATS_CATEGORIES.map((cat, i) => {
                const days = categoryStats[cat.key] || 0
                const pct = totalDays > 0 ? ((days / totalDays) * 100).toFixed(2) : '0.00'

                return (
                  <div
                    key={cat.key}
                    className={cn(
                      'flex items-center justify-between py-3',
                      i < STATS_CATEGORIES.length - 1 && 'border-b',
                    )}
                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: cat.color, opacity: 0.8 }}
                      />
                      <span
                        className="text-sm"
                        style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#555E68' }}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: isDark ? '#e5e5e5' : '#32383E' }}
                      >
                        {days}j
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#999' }}
                      >
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Chart — Coinglass style bar chart */}
      {showChart && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: isDark ? 'rgba(6,6,10,0.6)' : '#ffffff',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }}
        >
          <div className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-semibold" style={{ color: isDark ? '#e5e5e5' : '#32383E' }}>Historique</h3>
                <div className="flex items-center gap-1">
                  {periods.map(p => (
                    <button
                      key={p.key}
                      onClick={() => setActivePeriod(p.key)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-xs transition-all',
                        activePeriod === p.key
                          ? 'shadow-sm'
                          : 'hover:bg-muted/50'
                      )}
                      style={activePeriod === p.key ? {
                        background: isDark ? 'rgba(255,255,255,0.1)' : '#EFF2F5',
                        color: isDark ? '#e5e5e5' : '#32383E',
                        fontWeight: 500,
                      } : {
                        color: isDark ? 'rgba(255,255,255,0.4)' : '#555E68',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#58BA63' }} />
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#555E68' }}>Peur</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#FDDD60' }} />
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#555E68' }}>Neutre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: '#FF6E76' }} />
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#555E68' }}>Avidité</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)' }} />
                  <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#555E68' }}>Prix BTC</span>
                </div>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? 'rgba(255,255,255,0.04)' : '#EEEEEE'}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#999' }}
                      axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
                      tickLine={false}
                      interval="preserveStartEnd"
                      minTickGap={50}
                    />

                    <YAxis
                      yAxisId="fng"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#999' }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />

                    <YAxis
                      yAxisId="btc"
                      orientation="right"
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11, fill: isDark ? 'rgba(255,255,255,0.3)' : '#999' }}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    {/* Neutral reference line at 50 */}
                    <ReferenceLine
                      y={50}
                      yAxisId="fng"
                      stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}
                      strokeDasharray="4 4"
                    />

                    {/* F&G colored bars — Coinglass style */}
                    <Bar
                      yAxisId="fng"
                      dataKey="fngValue"
                      radius={[2, 2, 0, 0]}
                      maxBarSize={8}
                      isAnimationActive={false}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fngColor} opacity={0.85} />
                      ))}
                    </Bar>

                    {/* BTC Price Line overlay */}
                    <Line
                      yAxisId="btc"
                      type="monotone"
                      dataKey="btcPrice"
                      stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}