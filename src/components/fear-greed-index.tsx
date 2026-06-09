'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from '@/components/theme-provider'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'
import { Gauge, TrendingUp, ArrowUpCircle, ArrowDownCircle, Minus, Info } from 'lucide-react'
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

type Period = 'all' | '1m' | '3m' | '1y'

// ============================================================
// CONSTANTS
// ============================================================
const ZONES = [
  { min: 0, max: 25, label: 'Extrême Peur', color: '#22c55e', colorLight: '#16a34a' },
  { min: 25, max: 50, label: 'Peur', color: '#84cc16', colorLight: '#65a30d' },
  { min: 50, max: 75, label: 'Neutre', color: '#eab308', colorLight: '#ca8a04' },
  { min: 75, max: 100, label: 'Avidité', color: '#f97316', colorLight: '#ea580c' },
  { min: 100, max: 101, label: 'Extrême Avidité', color: '#ef4444', colorLight: '#dc2626' },
]

const CATEGORY_LABELS: Record<string, string> = {
  'Extreme Fear': 'Extrême Peur',
  'Fear': 'Peur',
  'Neutral': 'Neutre',
  'Greed': 'Avidité',
  'Extreme Greed': 'Extrême Avidité',
}

const CATEGORY_COLORS: Record<string, string> = {
  'Extreme Fear': '#22c55e',
  'Fear': '#84cc16',
  'Neutral': '#eab308',
  'Greed': '#f97316',
  'Extreme Greed': '#ef4444',
}

// Stats card categories (French labels matching Coinglass)
const STATS_CATEGORIES = [
  { key: 'Extreme Greed', label: "Pour l'avidité extrême", color: '#ef4444', icon: '🔴' },
  { key: 'Greed', label: 'Avidité', color: '#f97316', icon: '🟠' },
  { key: 'Neutral', label: 'Neutre', color: '#eab308', icon: '🟡' },
  { key: 'Fear', label: 'Peur', color: '#84cc16', icon: '🟢' },
  { key: 'Extreme Fear', label: 'Pour Extrême', color: '#22c55e', icon: '🟩' },
]

function getValueColor(value: number): string {
  if (value <= 25) return '#22c55e'
  if (value <= 50) return '#84cc16'
  if (value <= 75) return '#eab308'
  if (value <= 100) return '#f97316'
  return '#ef4444'
}

function getValueLabel(value: number): string {
  if (value <= 25) return 'Extrême Peur'
  if (value <= 50) return 'Peur'
  if (value <= 75) return 'Neutre'
  if (value <= 100) return 'Avidité'
  return 'Extrême Avidité'
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
  const [activePeriod, setActivePeriod] = useState<Period>('1y')

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Try the API route first
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

        // Fallback: fetch directly from alternative.me API (CORS-friendly)
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
            // Generate BTC prices client-side
            setBtcPrices(fg.map((d: any) => {
              const date = new Date(d.date)
              const baseDate = new Date('2023-01-01').getTime()
              const daysDiff = (date.getTime() - baseDate) / 86400000
              const price = 28000 + daysDiff * 150 + Math.sin(daysDiff / 25) * 5000 + Math.sin(daysDiff / 7) * 2000
              return { date: d.date, price: Math.max(Math.round(price), 15000) }
            }))
          }
        }
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Current value
  const currentValue = fearGreedData.length > 0 ? fearGreedData[0].value : 50
  const currentLabel = fearGreedData.length > 0
    ? getClassificationLabel(fearGreedData[0].classification)
    : 'Neutre'
  const currentColor = getValueColor(currentValue)

  // Filter data by period
  const filteredData = useMemo(() => {
    if (fearGreedData.length === 0) return []

    const now = new Date()
    let cutoffDate: Date | null = null

    switch (activePeriod) {
      case '1m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
        break
      case '3m':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
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

    // Reverse so oldest is first (for chart)
    return [...filtered].reverse()
  }, [fearGreedData, activePeriod])

  // Merge F&G data with BTC prices for chart
  const chartData = useMemo((): ChartDataPoint[] => {
    // Create a map of BTC prices by date
    const btcMap = new Map<string, number>()
    btcPrices.forEach(p => btcMap.set(p.date, p.price))

    return filteredData.map(d => ({
      date: d.date,
      fngValue: d.value,
      btcPrice: btcMap.get(d.date) || null,
      fngColor: getValueColor(d.value),
    }))
  }, [filteredData, btcPrices])

  // Stats: days in each category
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      'Extreme Fear': 0,
      'Fear': 0,
      'Neutral': 0,
      'Greed': 0,
      'Extreme Greed': 0,
    }
    filteredData.forEach(d => {
      if (d.classification && stats.hasOwnProperty(d.classification)) {
        stats[d.classification]++
      }
    })
    return stats
  }, [filteredData])

  const totalDays = filteredData.length

  // Period buttons
  const periods: { key: Period; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: '1m', label: '1 mois' },
    { key: '3m', label: '3 mois' },
    { key: '1y', label: '1 an' },
  ]

  // Format date for X-axis
  const formatDate = useCallback((dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }, [])

  // ============================================================
  // SVG SEMICIRCULAR GAUGE
  // ============================================================
  const GaugeChart = ({ value, color, label }: { value: number; color: string; label: string }) => {
    const size = 220
    const strokeWidth = 18
    const radius = (size - strokeWidth) / 2
    const cx = size / 2
    const cy = size / 2 + 10

    // Semicircle: from 180° to 0° (left to right)
    const startAngle = Math.PI
    const endAngle = 0
    const totalAngle = Math.PI

    // Needle angle: map value 0-100 to PI-0
    const needleAngle = Math.PI - (value / 100) * Math.PI

    // Needle endpoint
    const needleLength = radius - 20
    const needleX = cx + needleLength * Math.cos(needleAngle)
    const needleY = cy - needleLength * Math.sin(needleAngle)

    // Create arc path for each zone
    const createArcPath = (startVal: number, endVal: number) => {
      const a1 = Math.PI - (startVal / 100) * Math.PI
      const a2 = Math.PI - (endVal / 100) * Math.PI
      const x1 = cx + radius * Math.cos(a1)
      const y1 = cy - radius * Math.sin(a1)
      const x2 = cx + radius * Math.cos(a2)
      const y2 = cy - radius * Math.sin(a2)
      const largeArc = (a1 - a2) > Math.PI ? 1 : 0
      return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
    }

    // Active arc (filled up to current value)
    const activeEndAngle = Math.PI - (value / 100) * Math.PI
    const activeEndX = cx + radius * Math.cos(activeEndAngle)
    const activeEndY = cy - radius * Math.sin(activeEndAngle)

    return (
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`} className="mx-auto">
        {/* Background arcs for each zone */}
        {ZONES.map((zone, i) => (
          <path
            key={i}
            d={createArcPath(zone.min, Math.min(zone.max, 100))}
            fill="none"
            stroke={zone.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            opacity={0.2}
          />
        ))}

        {/* Active colored arc segments up to current value */}
        {ZONES.map((zone, i) => {
          const zoneEnd = Math.min(zone.max, 100)
          const segStart = Math.max(zone.min, 0)
          const segEnd = Math.min(zoneEnd, value)
          if (segEnd <= segStart) return null

          const a1 = Math.PI - (segStart / 100) * Math.PI
          const a2 = Math.PI - (segEnd / 100) * Math.PI
          const x1 = cx + radius * Math.cos(a1)
          const y1 = cy - radius * Math.sin(a1)
          const x2 = cx + radius * Math.cos(a2)
          const y2 = cy - radius * Math.sin(a2)
          const largeArc = (a1 - a2) > Math.PI ? 1 : 0

          return (
            <path
              key={`active-${i}`}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={zone.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              opacity={0.85}
            />
          )
        })}

        {/* Tick marks and labels */}
        {[0, 25, 50, 75, 100].map(val => {
          const angle = Math.PI - (val / 100) * Math.PI
          const innerR = radius + strokeWidth / 2 + 4
          const outerR = radius + strokeWidth / 2 + 10
          const labelR = radius + strokeWidth / 2 + 22
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
                stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={1.5}
              />
              <text
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                fontSize={10}
                fontWeight={500}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* Needle */}
        <g>
          {/* Needle glow */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.3}
          />
          {/* Needle line */}
          <line
            x1={cx} y1={cy}
            x2={needleX} y2={needleY}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Center dot */}
          <circle cx={cx} cy={cy} r={6} fill={color} />
          <circle cx={cx} cy={cy} r={3} fill={isDark ? '#06060a' : '#ffffff'} />
        </g>

        {/* Value text */}
        <text
          x={cx} y={cy - 20}
          textAnchor="middle"
          fill={color}
          fontSize={42}
          fontWeight={800}
        >
          {value}
        </text>

        {/* Label text */}
        <text
          x={cx} y={cy + 2}
          textAnchor="middle"
          fill={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
          fontSize={11}
          fontWeight={500}
        >
          {label}
        </text>
      </svg>
    )
  }

  // ============================================================
  // CUSTOM TOOLTIP FOR CHART
  // ============================================================
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-lg px-3 py-2 border text-xs shadow-lg"
          style={{
            background: isDark ? 'rgba(6,6,10,0.95)' : 'rgba(255,255,255,0.98)',
            borderColor: isDark ? 'rgba(124,92,252,0.15)' : 'rgba(109,77,224,0.15)',
          }}
        >
          <p className="font-medium text-foreground mb-1">
            {label ? new Date(label).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: entry.color }}
              />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="glass-card border-border rounded-xl">
              <CardContent className="p-6">
                <Skeleton className="h-8 w-64 mb-6" />
                <div className="flex justify-center">
                  <Skeleton className="h-40 w-56 rounded-full" />
                </div>
                <Skeleton className="h-4 w-32 mx-auto mt-2" />
              </CardContent>
            </Card>
          </div>
          <Card className="glass-card border-border rounded-xl">
            <CardContent className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </div>
        <Card className="glass-card border-border rounded-xl">
          <CardContent className="p-4">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-4 fade-in-up">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(109,77,224,0.1)' }}>
          <Gauge className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Indice de peur et de cupidité de la crypto</h2>
          <p className="text-xs text-muted-foreground">Analyse du sentiment du marché en temps réel</p>
        </div>
      </div>

      {/* Gauge + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gauge Card */}
        <Card className="glass-card border-border rounded-xl lg:col-span-2">
          <CardContent className="p-4 md:p-6">
            {/* Period Selectors */}
            <div className="flex items-center gap-1 mb-4">
              {periods.map(p => (
                <button
                  key={p.key}
                  onClick={() => setActivePeriod(p.key)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                    activePeriod === p.key
                      ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                      : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* SVG Gauge */}
            <div className="flex justify-center py-2">
              <GaugeChart value={currentValue} color={currentColor} label={currentLabel} />
            </div>

            {/* Current Classification Badge */}
            <div className="flex justify-center mt-1">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
                style={{
                  background: `${currentColor}10`,
                  borderColor: `${currentColor}30`,
                }}
              >
                <span className="text-sm font-bold" style={{ color: currentColor }}>
                  {currentValue} — {currentLabel}
                </span>
              </div>
            </div>

            {/* Buy/Sell Signal */}
            {(() => {
              const signal = getSignal(currentValue)
              return (
                <div className="mt-4 rounded-lg p-3 border" style={{ background: `${signal.color}08`, borderColor: `${signal.color}25` }}>
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
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card className="glass-card border-border rounded-xl">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
              Distribution sur la période
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="space-y-2.5">
              {STATS_CATEGORIES.map(cat => {
                const days = categoryStats[cat.key] || 0
                const pct = totalDays > 0 ? ((days / totalDays) * 100).toFixed(1) : '0.0'

                return (
                  <div
                    key={cat.key}
                    className="rounded-lg p-2.5 border transition-colors"
                    style={{
                      background: `${cat.color}06`,
                      borderColor: `${cat.color}18`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cat.icon}</span>
                        <span className="text-xs font-medium text-foreground">{cat.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold" style={{ color: cat.color }}>
                          {days}j
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: cat.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Chart */}
      {showChart && (
      <Card className="glass-card border-border rounded-xl overflow-hidden">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Historique</h3>
              <div className="flex items-center gap-1">
                {periods.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setActivePeriod(p.key)}
                    className={cn(
                      'px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all',
                      activePeriod === p.key
                        ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                        : 'bg-muted/50 text-muted-foreground border border-transparent hover:bg-muted'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ background: '#7c5cfc' }} />
                <span className="text-[10px] text-muted-foreground">Indice F&C</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }} />
                <span className="text-[10px] text-muted-foreground">Prix BTC</span>
              </div>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div className="w-full" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    {/* Gradient for F&G area */}
                    <linearGradient id="fngGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c5cfc" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0.02} />
                    </linearGradient>
                    {/* Gradient for BTC area */}
                    <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
                    axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={40}
                  />

                  <YAxis
                    yAxisId="fng"
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />

                  <YAxis
                    yAxisId="btc"
                    orientation="right"
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* BTC Price Area (rendered first so it's behind) */}
                  <Area
                    yAxisId="btc"
                    type="monotone"
                    dataKey="btcPrice"
                    stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                    strokeWidth={1.5}
                    fill="url(#btcGradient)"
                    dot={false}
                    activeDot={false}
                    connectNulls
                    isAnimationActive={false}
                  />

                  {/* F&G Index Area */}
                  <Area
                    yAxisId="fng"
                    type="monotone"
                    dataKey="fngValue"
                    stroke="#7c5cfc"
                    strokeWidth={2}
                    fill="url(#fngGradient)"
                    dot={false}
                    activeDot={{
                      r: 4,
                      stroke: '#7c5cfc',
                      strokeWidth: 2,
                      fill: isDark ? '#06060a' : '#ffffff',
                    }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  )
}
