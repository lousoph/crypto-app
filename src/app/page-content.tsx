'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LayoutDashboard, ArrowLeftRight, User, Shield, Coins, Building2,
  LogOut, LogIn, TrendingUp, TrendingDown, DollarSign, Wallet,
  Plus, Trash2, Edit3, ChevronDown, ChevronUp, RefreshCw,
  BarChart3, Crown, AlertTriangle, Check, X, Menu,
  Search, Activity, Zap, Eye, Gauge, ShoppingCart, Tag, ArrowUpCircle, ArrowDownCircle, Sparkles, Brain, MessageSquare,
  Sun, Moon, Monitor, Mail
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, ReferenceLine, PieChart, Pie, Cell
} from 'recharts'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useTheme } from '@/components/theme-provider'

// ============================================================
// TYPES
// ============================================================
type View = 'dashboard' | 'transactions' | 'ai-analysis' | 'explorer' | 'profile' | 'admin-users' | 'admin-tokens' | 'admin-exchanges' | 'admin-pricing'

interface TokenData {
  id: string
  ticker: string
  name: string
  coingeckoId: string | null
  cryptoCompareId: string | null
  currentPrice: number | null
  active: boolean
}

interface ExchangeData {
  id: string
  name: string
  active: boolean
}

interface TransactionData {
  id: string
  date: string
  tokenTicker: string
  montantInvesti: number
  coursAchat: number
  quantite: number
  exchangeId: string | null
  notes: string | null
  token: TokenData
  exchange: ExchangeData | null
}

interface TokenDashboard {
  ticker: string
  name: string
  montantInvesti: number
  quantite: number
  currentPrice: number
  pru: number
  valeurActuelle: number
  pl: number
  rentabilite: number
}

interface DashboardData {
  investissementTotal: number
  valeurActuelle: number
  pl: number
  roi: number
  tokens: TokenDashboard[]
}

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: string
  suspended: boolean
  createdAt: string
  _count: { transactions: number }
}

interface AdminToken extends TokenData {
  _count: { transactions: number }
}

interface AdminExchange extends ExchangeData {
  _count: { transactions: number }
}

// ============================================================
// THEME-AWARE STYLES HOOK
// Returns style objects that adapt to light/dark theme
// ============================================================
function useThemeStyles() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return {
    // Card styles
    cardBg: isDark ? 'rgba(6, 6, 10, 0.6)' : 'rgba(255, 255, 255, 0.92)',
    cardBorder: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(109, 77, 224, 0.12)',
    cardShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(109, 77, 224, 0.12)',
    subtleBg: isDark ? 'rgba(124, 92, 252, 0.08)' : 'rgba(109, 77, 224, 0.06)',
    accentBg: isDark ? 'rgba(124, 92, 252, 0.12)' : 'rgba(109, 77, 224, 0.08)',
    primaryGradient: isDark
      ? 'linear-gradient(135deg, #7c5cfc, #06b6d4)'
      : 'linear-gradient(135deg, #6d4de0, #0891b2)',
    glowShadow: isDark
      ? '0 0 20px rgba(124, 92, 252, 0.1)'
      : '0 0 20px rgba(109, 77, 224, 0.15)',
    overlayBg: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
    textMuted: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.5)',
    // Social button styles
    socialBtnBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    socialBtnBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    socialBtnText: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    // Login/Loading screen specific
    orbBg1: isDark ? 'rgba(124,92,252,0.07)' : 'rgba(124,92,252,0.12)',
    orbBg2: isDark ? 'rgba(6,182,212,0.05)' : 'rgba(6,182,212,0.08)',
    orbBg3: isDark ? 'rgba(168,85,247,0.04)' : 'rgba(168,85,247,0.06)',
    logoBg: isDark ? 'rgba(124,92,252,0.15)' : 'rgba(109,77,224,0.1)',
    logoBorder: isDark ? 'rgba(124,92,252,0.3)' : 'rgba(109,77,224,0.2)',
    logoShadow: isDark ? '0 0 40px rgba(124,92,252,0.06)' : '0 0 40px rgba(109,77,224,0.1)',
    // Sidebar
    sidebarActiveBg: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(109,77,224,0.08)',
    sidebarActiveBorder: isDark ? '#7c5cfc' : '#6d4de0',
    // Badge
    badgeBg: isDark ? 'rgba(124,92,252,0.15)' : 'rgba(109,77,224,0.1)',
    // Error states
    errorBg: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
    errorBorder: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
    // Premium
    premiumBg: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
    premiumBorder: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.15)',
    premiumShadow: isDark ? '0 4px 20px rgba(245,158,11,0.15)' : '0 4px 20px rgba(245,158,11,0.2)',
    premiumBtnShadow: isDark ? '0 4px 20px rgba(245,158,11,0.3)' : '0 4px 20px rgba(245,158,11,0.25)',
    // Auth card shadow
    authCardShadow: isDark ? '0 8px 60px rgba(0,0,0,0.4), 0 0 40px rgba(124,92,252,0.06)' : '0 8px 60px rgba(0,0,0,0.12), 0 0 40px rgba(109,77,224,0.08)',
    // Input focus shadow
    inputFocusShadow: isDark ? '0 0 0 2px rgba(124,92,252,0.25), 0 0 12px rgba(124,92,252,0.1)' : '0 0 0 2px rgba(109,77,224,0.25), 0 0 12px rgba(109,77,224,0.1)',
    // Gradient line for auth card top
    authGradientLine: isDark ? 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' : 'linear-gradient(90deg, transparent, rgba(109,77,224,0.3), rgba(8,145,178,0.2), transparent)',
    // Dot grid for login
    dotGrid: isDark ? 'rgba(124,92,252,0.06)' : 'rgba(109,77,224,0.06)',
    // Logo gradient overlay
    logoGradientOverlay: isDark ? 'linear-gradient(135deg, rgba(124,92,252,0.1), rgba(6,182,212,0.05))' : 'linear-gradient(135deg, rgba(109,77,224,0.1), rgba(8,145,178,0.05))',
    // Chart tooltip
    chartTooltipBg: isDark ? 'rgba(6, 6, 10, 0.92)' : 'rgba(255, 255, 255, 0.96)',
    chartTooltipBorder: isDark ? 'rgba(124, 92, 252, 0.15)' : 'rgba(109, 77, 224, 0.15)',
    chartTooltipShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(124,92,252,0.08)' : '0 8px 32px rgba(0,0,0,0.12), 0 0 20px rgba(109,77,224,0.08)',
    // Primary button shadow
    primaryBtnShadow: isDark ? '0 4px 20px rgba(124,92,252,0.25)' : '0 4px 20px rgba(109,77,224,0.25)',
    // Explorer icon background
    explorerIconBg: isDark ? 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(16,185,129,0.1))' : 'linear-gradient(135deg, rgba(8,145,178,0.15), rgba(5,150,105,0.1))',
    explorerIconBorder: isDark ? 'rgba(6,182,212,0.2)' : 'rgba(8,145,178,0.2)',
    // Icon backgrounds for KPI
    iconBgViolet: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(109,77,224,0.1)',
    iconBgCyan: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(8,145,178,0.1)',
    iconBgEmerald: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(5,150,105,0.1)',
    iconBgAmber: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.1)',
    iconBgRed: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.1)',
    // Glow colors for KPI
    glowViolet: isDark ? 'rgba(124,92,252,0.08)' : 'rgba(109,77,224,0.08)',
    glowCyan: isDark ? 'rgba(6,182,212,0.06)' : 'rgba(8,145,178,0.06)',
    glowEmerald: isDark ? 'rgba(16,185,129,0.06)' : 'rgba(5,150,105,0.06)',
    glowAmber: isDark ? 'rgba(245,158,11,0.06)' : 'rgba(217,119,6,0.06)',
    glowRed: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(220,38,38,0.06)',
    // isDark flag
    isDark,
  }
}

// ============================================================
// SCROLL REVEAL HOOK — IntersectionObserver
// ============================================================
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ============================================================
// SCROLL REVEAL WRAPPER COMPONENT
// ============================================================
function ScrollReveal({ children, className = '', direction = 'up' }: {
  children: React.ReactNode
  className?: string
  direction?: 'up' | 'left' | 'scale'
}) {
  const { ref, visible } = useScrollReveal()
  const dirClass = direction === 'left' ? 'scroll-reveal-left' : direction === 'scale' ? 'scroll-reveal-scale' : 'scroll-reveal'
  return (
    <div ref={ref} className={`${dirClass} ${visible ? 'visible' : ''} ${className}`}>
      {children}
    </div>
  )
}

// ============================================================
// AMBIENT BACKGROUND — IMMERSIVE GRADIENT GLOW + AURORA BLOBS
// ============================================================
function AmbientBackground() {
  return (
    <div className="ambient-bg">
      {/* Aurora morphing blobs */}
      <div className="aurora-blob" style={{
        top: '10%', left: '5%', width: '35%', height: '35%',
        background: 'rgba(124, 92, 252, 0.06)',
        animationDuration: '15s',
      }} />
      <div className="aurora-blob" style={{
        bottom: '5%', right: '10%', width: '30%', height: '30%',
        background: 'rgba(6, 182, 212, 0.04)',
        animationDuration: '20s',
        animationDirection: 'reverse',
      }} />
      <div className="aurora-blob" style={{
        top: '40%', right: '30%', width: '25%', height: '25%',
        background: 'rgba(167, 139, 250, 0.03)',
        animationDuration: '25s',
      }} />
    </div>
  )
}

// ============================================================
// PARTICLE FIELD — FLOATING LUMINOUS PARTICLES
// ============================================================
function ParticleField() {
  const [particles, setParticles] = useState<Array<{
    id: number
    size: number
    x: number
    duration: number
    delay: number
    color: string
  }>>([])

  useEffect(() => {
    const colors = [
      'rgba(124, 92, 252, 0.4)',
      'rgba(6, 182, 212, 0.3)',
      'rgba(167, 139, 250, 0.3)',
      'rgba(16, 185, 129, 0.25)',
    ]
    // Use a seeded pseudo-random for deterministic initial values (no hydration mismatch)
    const seeded = (seed: number) => {
      const x = Math.sin(seed * 9301 + 49297) * 233280
      return x - Math.floor(x)
    }
    setParticles(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      size: seeded(i * 5 + 1) * 4 + 1,
      x: seeded(i * 5 + 2) * 100,
      duration: seeded(i * 5 + 3) * 20 + 15,
      delay: seeded(i * 5 + 4) * 15,
      color: colors[Math.floor(seeded(i * 5 + 5) * colors.length)],
    })))
  }, [])

  return (
    <div className="particle-field">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  )
}

// ============================================================
// MOUSE GLOW — CURSOR-FOLLOWING RADIAL GLOW
// ============================================================
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleMove = (e: MouseEvent) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`
        glowRef.current.style.top = `${e.clientY}px`
        if (!glowRef.current.classList.contains('active')) {
          glowRef.current.classList.add('active')
        }
      }
    }
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  if (!mounted) return null
  return <div ref={glowRef} className="mouse-glow" />
}

// ============================================================
// ANIMATED COUNTER — SMOOTH NUMBER COUNT-UP
// ============================================================
function AnimatedCounter({ value, className = '', prefix = '', suffix = '' }: {
  value: number
  className?: string
  prefix?: string
  suffix?: string
}) {
  const [displayed, setDisplayed] = useState(0)
  const [prevValue, setPrevValue] = useState(value)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (value !== prevValue) {
      setIsUpdating(true)
      const duration = 800
      const start = prevValue
      const diff = value - start
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        // Easing: cubic-bezier approximation
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayed(start + diff * eased)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setDisplayed(value)
          setPrevValue(value)
          setIsUpdating(false)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [value, prevValue])

  useEffect(() => {
    setDisplayed(value)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={`${className} ${isUpdating ? 'counter-animate updating' : 'counter-animate'}`}>
      {prefix}{fmt(displayed)}{suffix}
    </span>
  )
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPct = (n: number) =>
  (n * 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

const fmtSmall = (n: number) =>
  n < 0.01 ? n.toLocaleString('fr-FR', { minimumFractionDigits: 6, maximumFractionDigits: 8 })
    : n < 1 ? n.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
    : n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtPrice = (n: number) =>
  n >= 1 ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : n >= 0.01 ? n.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    : n.toLocaleString('fr-FR', { minimumFractionDigits: 6, maximumFractionDigits: 8 })

const plColor = (v: number) => v >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
const plBg = (v: number) => v >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-400/10' : 'bg-red-500/10 dark:bg-red-400/10'

const CHART_COLORS = [
  '#7c5cfc', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#6366f1',
  '#84cc16', '#e11d48', '#0ea5e9', '#a855f7', '#f43f5e',
]

const tokenGradientClass = (ticker: string) => {
  const t = ticker.toUpperCase()
  if (t === 'BTC') return 'token-gradient-btc'
  if (t === 'ETH') return 'token-gradient-eth'
  if (t === 'SOL') return 'token-gradient-sol'
  return 'token-gradient-default'
}

// Token logo CDN (cryptocurrency-icons)
const TOKEN_LOGO_URL = (symbol: string) =>
  `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a63530be6e374711a8554f31b17e4cb92c25fa5/128/color/${symbol.toLowerCase()}.png`

// Exchange brand styles
const EXCHANGE_STYLES: Record<string, { bg: string; text: string; icon: string; gradient: string }> = {
  BINANCE:  { bg: '#F0B90B', text: '#1E1E1E', icon: 'BN', gradient: 'linear-gradient(135deg, rgba(240,185,11,0.08), rgba(240,185,11,0.02))' },
  BYBIT:   { bg: '#F7A600', text: '#1E1E1E', icon: 'BY', gradient: 'linear-gradient(135deg, rgba(247,166,0,0.08), rgba(247,166,0,0.02))' },
  COINBASE:{ bg: '#0052FF', text: '#FFFFFF', icon: 'CB', gradient: 'linear-gradient(135deg, rgba(0,82,255,0.08), rgba(0,82,255,0.02))' },
  KRAKEN:  { bg: '#7B61FF', text: '#FFFFFF', icon: 'KR', gradient: 'linear-gradient(135deg, rgba(123,97,255,0.08), rgba(123,97,255,0.02))' },
  OKX:     { bg: '#1A1A2E', text: '#FFFFFF', icon: 'OK', gradient: 'linear-gradient(135deg, rgba(26,26,46,0.12), rgba(26,26,46,0.03))' },
}

// Exchange logo URLs from CoinGecko CDN
const EXCHANGE_LOGO_URLS: Record<string, string> = {
  BINANCE:  'https://assets.coingecko.com/markets/images/52/small/binance.jpg?1704720022',
  BYBIT:    'https://assets.coingecko.com/markets/images/502/small/bybit.jpg?1704720023',
  COINBASE: 'https://assets.coingecko.com/markets/images/19/small/coinbase.jpg?1704720022',
  KRAKEN:   'https://assets.coingecko.com/markets/images/23/small/kraken.jpg?1704720022',
  OKX:      'https://assets.coingecko.com/markets/images/363/small/okex.jpg?1704720023',
}

// ============================================================
// TOKEN LOGO COMPONENT
// ============================================================
function TokenLogo({ ticker, size = 24, className = '' }: { ticker: string; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false)
  const symbol = ticker.toLowerCase()

  if (imgError) {
    return (
      <div
        className={`${tokenGradientClass(ticker)} flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(size * 0.35, 9), borderRadius: size * 0.22 }}
      >
        {ticker.slice(0, 2)}
      </div>
    )
  }

  return (
    <img
      src={TOKEN_LOGO_URL(symbol)}
      alt={ticker}
      width={size}
      height={size}
      className={`rounded-lg shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  )
}

// ============================================================
// EXCHANGE LOGO COMPONENT
// ============================================================
function ExchangeLogo({ name, size = 24, className = '' }: { name: string; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false)
  const logoUrl = EXCHANGE_LOGO_URLS[name.toUpperCase()]
  const style = EXCHANGE_STYLES[name.toUpperCase()] || { bg: '#7c5cfc', text: '#FFFFFF', icon: name.slice(0, 2), gradient: 'linear-gradient(135deg, rgba(124,92,252,0.08), rgba(124,92,252,0.02))' }

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        width={size}
        height={size}
        className={`rounded-lg shrink-0 object-cover ${className}`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        loading="lazy"
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center font-bold shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(size * 0.32, 9), background: style.bg, color: style.text, borderRadius: size * 0.22 }}
    >
      {style.icon}
    </div>
  )
}

// ============================================================
// AUTH HOOK
// ============================================================
function useAuth() {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const user = session?.user ?? null

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })
    if (result?.error === 'EMAIL_NOT_VERIFIED') {
      throw new Error('EMAIL_NOT_VERIFIED')
    }
    return result?.ok ?? false
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (res.ok) {
      if (data.requiresVerification) {
        return { requiresVerification: true, email, verificationCode: data.verificationCode }
      }
      // Fallback: auto-sign in if no verification needed
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      if (!result?.ok) throw new Error('Inscription réussie mais connexion échouée')
      return { requiresVerification: false }
    }
    throw new Error(data.error || 'Erreur inscription')
  }

  const logout = async () => {
    await signOut({ redirect: false })
  }

  return { user, loading, login, register, logout, refetch: async () => {} }
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin, onRegister }: {
  onLogin: (email: string, password: string) => Promise<boolean>
  onRegister: (email: string, password: string, name: string) => Promise<any>
}) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const ts = useThemeStyles()

  // Email verification state
  const [showVerification, setShowVerification] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        const result = await onRegister(email, password, name)
        if (result?.requiresVerification) {
          setVerifyEmail(email)
          setShowVerification(true)
          // DEVELOPMENT: Auto-fill verification code from server response
          // In production, this would be sent via email and not returned in the API response
          if (result.verificationCode) {
            setVerifyCode(result.verificationCode)
          }
          toast.success('Compte créé ! Vérifiez votre email.')
        } else {
          toast.success('Compte créé avec succès !')
        }
      } else {
        const ok = await onLogin(email, password)
        if (!ok) setError('Email ou mot de passe incorrect')
      }
    } catch (err: any) {
      if (err.message === 'EMAIL_NOT_VERIFIED') {
        setVerifyEmail(email)
        setShowVerification(true)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setVerifyError('Veuillez entrer le code à 6 chiffres')
      return
    }
    setVerifyLoading(true)
    setVerifyError('')
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Email vérifié avec succès !')
        setShowVerification(false)
        setVerifyCode('')
        // Auto sign in
        const ok = await onLogin(verifyEmail, password)
        if (!ok) {
          setError('Email vérifié. Veuillez vous connecter.')
          setIsRegister(false)
        }
      } else {
        setVerifyError(data.error || 'Code invalide')
      }
    } catch {
      setVerifyError('Erreur réseau')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail }),
      })
      const data = await res.json()
      if (res.ok) {
        // DEVELOPMENT: Auto-fill verification code from server response
        // In production, this would be sent via email and not returned in the API response
        if (data.verificationCode) {
          setVerifyCode(data.verificationCode)
        }
        toast.success('Nouveau code envoyé !')
        setResendCooldown(60)
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  const handleOAuthSignIn = async (provider: string) => {
    setOauthLoading(provider)
    setError('')
    try {
      const result = await signIn(provider, { redirect: false })
      if (result?.error) {
        setError('Erreur de connexion avec ' + provider.charAt(0).toUpperCase() + provider.slice(1))
      }
    } catch {
      setError('Erreur de connexion avec ' + provider.charAt(0).toUpperCase() + provider.slice(1))
    } finally {
      setOauthLoading(null)
    }
  }

  // Check which OAuth providers are available
  const hasGoogle = !!(process.env.NEXT_PUBLIC_HAS_GOOGLE)
  const hasApple = !!(process.env.NEXT_PUBLIC_HAS_APPLE)
  const hasAnyOAuth = hasGoogle || hasApple

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Animated ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[15%] w-[60%] h-[60%] rounded-full parallax-orb" style={{ background: `radial-gradient(ellipse, ${ts.orbBg1} 0%, transparent 70%)`, animation: 'ambientDrift1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] rounded-full parallax-orb" style={{ background: `radial-gradient(ellipse, ${ts.orbBg2} 0%, transparent 70%)`, animation: 'ambientDrift2 25s ease-in-out infinite' }} />
        <div className="absolute top-[50%] left-[60%] w-[40%] h-[40%] rounded-full parallax-orb" style={{ background: `radial-gradient(ellipse, ${ts.orbBg3} 0%, transparent 70%)`, animation: 'ambientDrift3 30s ease-in-out infinite' }} />
      </div>

      {/* Aurora morphing blobs on login */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-blob" style={{ top: '20%', left: '10%', width: '40%', height: '40%', background: 'rgba(124, 92, 252, 0.05)', animationDuration: '18s' }} />
        <div className="aurora-blob" style={{ bottom: '10%', right: '5%', width: '35%', height: '35%', background: 'rgba(6, 182, 212, 0.04)', animationDuration: '22s', animationDirection: 'reverse' }} />
      </div>

      {/* Floating particles */}
      <ParticleField />

      {/* Particle grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(${ts.dotGrid} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />

      <div className="w-full max-w-md space-y-7 fade-in-up relative z-10">
        {/* Logo with immersive glow */}
        <div className="text-center space-y-3">
          <div className="float-animation inline-flex items-center justify-center w-20 h-20 rounded-2xl border relative" style={{ background: ts.logoBg, borderColor: ts.logoBorder, boxShadow: `${ts.logoShadow}, 0 0 80px ${ts.isDark ? 'rgba(124,92,252,0.04)' : 'rgba(109,77,224,0.04)'}` }}>
            <Wallet className="w-10 h-10 text-violet-400" />
            <div className="absolute inset-0 rounded-2xl" style={{ background: ts.logoGradientOverlay, opacity: 0.5 }} />
          </div>
          <h1 className="text-4xl font-bold gradient-text">
            CryptoFolio
          </h1>
          <p className="text-sm typewriter text-muted-foreground">Suivez votre portefeuille crypto en temps réel</p>
        </div>

        {/* Email Verification Screen */}
        {showVerification ? (
          <div className="rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden glass-strong" style={{ boxShadow: ts.authCardShadow }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: ts.authGradientLine }} />
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ts.accentBg }}>
                  <Mail className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Vérifiez votre email</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Un code de vérification a été envoyé à <span className="text-foreground/80 font-medium">{verifyEmail}</span>
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Code de vérification</Label>
                <Input
                  value={verifyCode}
                  onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 6); setVerifyCode(val); setVerifyError('') }}
                  placeholder="000000"
                  className="border text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-muted-foreground/30 rounded-xl h-14 transition-all duration-300"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)', boxShadow: 'none' }}
                  onFocus={(e) => { e.target.style.boxShadow = ts.inputFocusShadow }}
                  onBlur={(e) => { e.target.style.boxShadow = 'none' }}
                  maxLength={6}
                />
              </div>

              {verifyError && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-xl border" style={{ background: ts.errorBg, borderColor: ts.errorBorder }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {verifyError}
                </div>
              )}

              <Button
                onClick={handleVerify}
                className="btn-primary-glow btn-ripple w-full text-foreground rounded-xl h-11 font-medium shadow-lg transition-all active:scale-[0.98]"
                style={{ background: ts.primaryGradient, boxShadow: ts.primaryBtnShadow }}
                disabled={verifyLoading || verifyCode.length !== 6}
              >
                {verifyLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Vérifier
              </Button>

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium disabled:text-muted-foreground/30 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Renvoyer le code (${resendCooldown}s)` : 'Renvoyer le code'}
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => { setShowVerification(false); setVerifyCode(''); setVerifyError('') }}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* Main auth card */}
        <div className="rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden glass-strong" style={{ boxShadow: ts.authCardShadow }}>
          {/* Card inner gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: ts.authGradientLine }} />

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {isRegister ? 'Créer un compte' : 'Bienvenue'}
            </h2>
            <p className="text-sm mt-1 text-muted-foreground">
              {isRegister
                ? 'Créez votre compte pour commencer à suivre vos investissements'
                : 'Connectez-vous pour accéder à votre portefeuille'}
            </p>
          </div>

          {/* Social Login Buttons */}
          {hasAnyOAuth && (
            <div className="space-y-3 mb-5 fade-in-up stagger-1">
              {hasGoogle && (
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={oauthLoading !== null}
                  className="social-btn w-full flex items-center justify-center gap-3 h-11 rounded-xl font-medium text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: ts.socialBtnBg, border: `1px solid ${ts.socialBtnBorder}`, color: ts.socialBtnText }}
                >
                  {oauthLoading === 'google' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Continuer avec Google
                </button>
              )}
              {hasApple && (
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn('apple')}
                  disabled={oauthLoading !== null}
                  className="social-btn w-full flex items-center justify-center gap-3 h-11 rounded-xl font-medium text-sm transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
                  style={{ background: ts.socialBtnBg, border: `1px solid ${ts.socialBtnBorder}`, color: ts.socialBtnText }}
                >
                  {oauthLoading === 'apple' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                  )}
                  Continuer avec Apple
                </button>
              )}
            </div>
          )}

          {/* Separator */}
          {hasAnyOAuth && (
            <div className="relative my-5 fade-in-up stagger-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 font-medium bg-background text-muted-foreground">ou</span>
              </div>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2 fade-in-up stagger-1">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11 transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(124,92,252,0.25),0_0_12px_rgba(124,92,252,0.1)] bg-input"
                />
              </div>
            )}
            <div className={hasAnyOAuth ? 'space-y-2 fade-in-up stagger-3' : 'space-y-2 fade-in-up stagger-2'}>
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11 transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(124,92,252,0.25),0_0_12px_rgba(124,92,252,0.1)]"
                style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
              />
            </div>
            <div className={hasAnyOAuth ? 'space-y-2 fade-in-up stagger-4' : 'space-y-2 fade-in-up stagger-3'}>
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11 transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(124,92,252,0.25),0_0_12px_rgba(124,92,252,0.1)]"
                style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-xl border fade-in" style={{ background: ts.errorBg, borderColor: ts.errorBorder }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="btn-primary-glow btn-ripple w-full text-foreground rounded-xl h-11 font-medium shadow-lg transition-all active:scale-[0.98]"
              style={{ background: ts.primaryGradient, boxShadow: ts.primaryBtnShadow }}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRegister ? 'Créer le compte' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {isRegister ? (
              <>Déjà un compte ?{' '}
                <button onClick={() => { setIsRegister(false); setError('') }} className="text-violet-400 hover:text-violet-300 transition-colors font-medium glow-underline">
                  Se connecter
                </button>
              </>
            ) : (
              <>Pas encore de compte ?{' '}
                <button onClick={() => { setIsRegister(true); setError('') }} className="text-violet-400 hover:text-violet-300 transition-colors font-medium glow-underline">
                  Créer un compte
                </button>
              </>
            )}
          </div>


        </div>
        </>
        )}

        {/* Bottom security note */}
        <p className="text-center text-[11px] text-muted-foreground/40">
          Données sécurisées · Chiffrement de bout en bout · Conformité RGPD
        </p>
      </div>
    </div>
  )
}

// ============================================================
// BOTTOM NAVIGATION (MOBILE)
// ============================================================
function BottomNav({ currentView, setView, user }: {
  currentView: View
  setView: (v: View) => void
  user: any
}) {
  const isAdmin = user?.role === 'admin'
  const isPremium = user?.role === 'user_premium'
  const { theme, setTheme, resolvedTheme } = useTheme()
  const items: { id: View; label: string; icon: any; premium?: boolean }[] = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'ai-analysis', label: 'Prédict AI', icon: Sparkles, premium: true },
    { id: 'explorer', label: 'Explorer', icon: Search },
    { id: 'profile', label: 'Profil', icon: User },
    ...(isAdmin ? [{ id: 'admin-users' as View, label: 'Admin', icon: Shield }] : []),
  ]

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1 sm:px-2 max-w-lg mx-auto">
        {items.map(item => {
          const active = currentView === item.id ||
            (item.id === 'admin-users' && (currentView === 'admin-tokens' || currentView === 'admin-exchanges'))
          const locked = item.premium && !isPremium && !isAdmin
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`bottom-nav-item flex flex-col items-center justify-center gap-0.5 px-1 sm:px-3 py-2 rounded-xl min-w-[48px] sm:min-w-[56px] relative ${
                active ? 'active' : locked ? 'text-foreground/20' : 'text-foreground/40'
              }`}
            >
              {locked && <Crown className="w-2.5 h-2.5 text-amber-400 absolute -top-0.5 right-0.5 sm:right-1" />}
              <item.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              <span className="text-[9px] sm:text-[10px] font-medium leading-tight truncate max-w-[56px] sm:max-w-none">{item.label}</span>
            </button>
          )
        })}
        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="bottom-nav-item flex flex-col items-center justify-center gap-0.5 px-1 sm:px-2 py-2 rounded-xl min-w-[40px] sm:min-w-[44px] text-foreground/40"
          title={resolvedTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {resolvedTheme === 'dark' ? <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />}
        </button>
      </div>
    </nav>
  )
}

// ============================================================
// SIDEBAR
// ============================================================
function Sidebar({ currentView, setView, user, onLogout }: {
  currentView: View
  setView: (v: View) => void
  user: any
  onLogout: () => void
}) {
  const isAdmin = user?.role === 'admin'
  const isPremium = user?.role === 'user_premium'
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const ts = useThemeStyles()

  const userItems = [
    { id: 'dashboard' as View, label: 'Tableau de bord', icon: LayoutDashboard, premium: false },
    { id: 'transactions' as View, label: 'Transactions', icon: ArrowLeftRight, premium: false },
    { id: 'ai-analysis' as View, label: 'Prédict AI', icon: Sparkles, premium: true },
    { id: 'explorer' as View, label: 'Explorateur', icon: Search, premium: false },
    { id: 'profile' as View, label: 'Profil & Abonnement', icon: User, premium: false },
  ]

  const adminItems = [
    { id: 'admin-users' as View, label: 'Gestion Utilisateurs', icon: Shield },
    { id: 'admin-tokens' as View, label: 'Gestion Tokens', icon: Coins },
    { id: 'admin-exchanges' as View, label: 'Gestion Exchanges', icon: Building2 },
    { id: 'admin-pricing' as View, label: 'Tarifs Premium', icon: Tag },
  ]

  const NavItem = ({ item }: { item: { id: View; label: string; icon: any; premium?: boolean } }) => {
    const active = currentView === item.id
    const locked = item.premium && !isPremium && !isAdmin
    return (
      <button
        onClick={() => { setView(item.id); setMobileOpen(false) }}
        className={`nav-item-hover magnetic-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
          active
            ? 'text-violet-300 nav-active-sweep'
            : locked ? 'text-foreground/25'
            : 'text-foreground/40 hover:text-foreground/70'
        }`}
        style={active ? { background: ts.sidebarActiveBg, borderLeft: `3px solid ${ts.sidebarActiveBorder}` } : { borderLeft: '3px solid transparent' }}
      >
        <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-violet-400' : ''}`} />
        {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        {!collapsed && locked && <Crown className="w-3 h-3 text-amber-400/70 shrink-0" />}
      </button>
    )
  }

  const handleLogout = () => {
    if (showLogoutConfirm) {
      onLogout()
      setShowLogoutConfirm(false)
    } else {
      setShowLogoutConfirm(true)
      setTimeout(() => setShowLogoutConfirm(false), 3000)
    }
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-5 py-5 border-b ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: 'var(--border)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative breathe" style={{ background: `linear-gradient(135deg, ${ts.isDark ? 'rgba(124,92,252,0.3)' : 'rgba(109,77,224,0.3)'}, ${ts.isDark ? 'rgba(6,182,212,0.3)' : 'rgba(8,145,178,0.3)'})`, border: `1px solid ${ts.isDark ? 'rgba(124,92,252,0.2)' : 'rgba(109,77,224,0.2)'}`, boxShadow: `${ts.logoShadow}, 0 0 40px ${ts.isDark ? 'rgba(124,92,252,0.05)' : 'rgba(109,77,224,0.05)'}` }}>
          <Wallet className="w-5 h-5 text-violet-400" />
          {/* Animated ring around logo */}
          <div className="absolute inset-[-4px] rounded-xl orbit" style={{ animationDuration: '6s', border: '1px solid transparent', borderTopColor: 'rgba(124,92,252,0.4)', borderRightColor: 'rgba(6,182,212,0.3)', borderBottomColor: 'rgba(167,139,250,0.2)' }} />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text neon-glow">CryptoFolio</span>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4 custom-scrollbar">
        <div className="space-y-1">
          {userItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>

        {isAdmin && (
          <>
            <Separator className="my-4" style={{ background: 'var(--muted)' }} />
            <div className="space-y-1">
              {!collapsed && <p className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-2 text-muted-foreground/50">Administration</p>}
              {adminItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User info */}
      <div className={`border-t p-4 ${collapsed ? 'flex flex-col items-center' : ''}`} style={{ borderColor: 'var(--border)' }}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'w-full'}`}>
          <div className="avatar-ring shrink-0">
            {user?.image ? (
              <img src={user.image} alt="Avatar" className="w-9 h-9 rounded-full object-cover" style={{ background: ts.primaryGradient }} />
            ) : (
              <div className="w-9 h-9 flex items-center justify-center text-foreground text-sm font-bold" style={{ background: ts.primaryGradient }}>
                {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground/80 truncate">{user?.name || user?.email}</p>
              <Badge variant="outline" className={`text-[10px] mt-0.5 px-1.5 py-0 floating-badge ${
                user?.role === 'admin' ? 'border-violet-500/30 text-violet-400 bg-violet-500/10' :
                user?.role === 'user_premium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                'border-foreground/10 text-foreground/30 bg-foreground/5'
              }`}>
                {user?.role === 'admin' ? 'Admin' :
                 user?.role === 'user_premium' ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          )}
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (resolvedTheme === 'dark') setTheme('light')
                else setTheme('dark')
              }}
              className="h-9 w-9 rounded-xl text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5 transition-all"
              title={resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={`flex-1 transition-all duration-200 rounded-xl btn-ripple ${
                showLogoutConfirm
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  : 'text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5'
              }`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              {showLogoutConfirm ? 'Confirmer ?' : 'Déconnexion'}
            </Button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden glass rounded-xl h-10 w-10"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5 text-foreground/60" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden fade-in bg-foreground/50 backdrop-blur-[4px]" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 glass-sidebar flex flex-col transform transition-transform duration-300 md:hidden ${
        mobileOpen ? 'translate-x-0 slide-in-left' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col h-screen glass-sidebar sticky top-0 transition-all duration-300 ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}>
        {sidebarContent}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-8 w-6 h-6 rounded-full glass shadow-lg hidden md:flex items-center justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronDown className={`w-3 h-3 text-foreground/40 transition-transform duration-200 ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
        </Button>
      </aside>
    </>
  )
}

// ============================================================
// CUSTOM CHART TOOLTIP
// ============================================================
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-4 py-3 shadow-xl chart-tooltip-glass glass-strong">
      {label && <p className="text-xs mb-1.5 font-medium text-muted-foreground">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="text-foreground font-semibold">{fmt(entry.value)} $</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// LIVE PRICE TICKER
// ============================================================
function LivePriceTicker() {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({})
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices')
        if (res.ok) {
          const data = await res.json()
          setPrevPrices(prices)
          setPrices(data)
        }
      } catch (err) {
        console.error(err)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  const entries = Object.entries(prices)
  if (entries.length === 0) return null

  return (
    <div className="glass-card rounded-2xl overflow-hidden fade-in-up gradient-border">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 glow-dot"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400">LIVE</span>
        </div>
        <span className="text-xs text-muted-foreground" >Cours en temps réel</span>
      </div>
      <div ref={tickerRef} className="flex items-center gap-1 px-4 py-3 overflow-x-auto ticker-scroll">
        {entries.map(([ticker, price]) => {
          const prev = prevPrices[ticker]
          const change = prev && prev !== price ? ((price - prev) / prev) * 100 : 0
          const isUp = change >= 0
          return (
            <div key={ticker} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 mr-1 hover-scale-glow ${change !== 0 ? (isUp ? 'price-flash-up' : 'price-flash-down') : ''}`} style={{ background: 'var(--input)' }}>
              <TokenLogo ticker={ticker} size={24} />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-foreground/60">{ticker}</span>
                <span className="text-xs font-semibold text-foreground/90">{fmtPrice(price)} $</span>
              </div>
              {change !== 0 && (
                <span className={`text-[10px] font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isUp ? '+' : ''}{change.toFixed(2)}%
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// FEAR & GREED INDEX WIDGET
// ============================================================
interface FearGreedData {
  value: number
  classification: string
  timestamp: string
  timeUntilUpdate: string
  history: { value: number; classification: string; date: string }[]
}

function FearGreedWidget() {
  const [data, setData] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFG = async () => {
      try {
        const res = await fetch('/api/fear-greed')
        if (res.ok) {
          const d = await res.json()
          setData(d)
        }
      } catch (err) {
        console.error('Fear & Greed fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFG()
    const interval = setInterval(fetchFG, 900000) // refresh every 15 min
    return () => clearInterval(interval)
  }, [])

  const getFGColor = (value: number) => {
    if (value <= 20) return '#ef4444'       // Extreme Fear
    if (value <= 40) return '#f97316'      // Fear
    if (value <= 60) return '#eab308'      // Neutral
    if (value <= 80) return '#22c55e'      // Greed
    return '#16a34a'                       // Extreme Greed
  }

  const getFGLabel = (classification: string) => {
    const labels: Record<string, string> = {
      'Extreme Fear': 'Peur Extrême',
      'Fear': 'Peur',
      'Neutral': 'Neutre',
      'Greed': 'Cupidité',
      'Extreme Greed': 'Cupidité Extrême',
    }
    return labels[classification] || classification
  }

  const getSignal = (value: number) => {
    if (value <= 25) return { label: 'Moment d\'achat idéal', icon: ShoppingCart, color: '#22c55e', bg: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)' }
    if (value <= 45) return { label: 'Fenêtre d\'achat favorable', icon: ArrowUpCircle, color: '#84cc16', bg: 'rgba(132,204,22,0.08)', borderColor: 'rgba(132,204,22,0.2)' }
    if (value <= 55) return { label: 'Zone neutre – Prudence', icon: Eye, color: '#eab308', bg: 'rgba(234,179,8,0.08)', borderColor: 'rgba(234,179,8,0.2)' }
    if (value <= 75) return { label: 'Zone de prudence – Envisagez de vendre', icon: Tag, color: '#f97316', bg: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.2)' }
    return { label: 'Moment de vente opportun', icon: ArrowDownCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }
  }

  if (loading) {
    return (
      <Card className="glass-card rounded-2xl skeleton-wave fade-in-up">
        <CardContent className="p-6">
          <div className="h-48 rounded-xl" style={{ background: 'var(--input)' }} />
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const signal = getSignal(data.value)
  const fgColor = getFGColor(data.value)
  const gaugeAngle = (data.value / 100) * 180 - 90 // -90 to 90 degrees

  // Area chart data for history
  const chartData = [...data.history].reverse().map(h => ({
    date: h.date.slice(5), // MM-DD
    value: h.value,
  }))

  return (
    <Card className="glass-card rounded-2xl card-hover-3d gradient-border fade-in-up">
      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${fgColor}18` }}>
              <Gauge className="w-4 h-4" style={{ color: fgColor }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">Indice de Peur & Cupidité</h3>
              <p className="text-xs text-muted-foreground">Marché crypto global</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: fgColor }}>{data.value}</p>
            <p className="text-xs font-semibold" style={{ color: fgColor }}>{getFGLabel(data.classification)}</p>
          </div>
        </div>

        {/* Gauge */}
        <div className="flex justify-center">
          <div className="relative" style={{ width: 220, height: 120 }}>
            <svg viewBox="0 0 220 120" className="w-full h-full">
              {/* Background arc */}
              <defs>
                <linearGradient id="fgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="25%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#eab308" />
                  <stop offset="75%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              {/* Arc background */}
              <path
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke="var(--border)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Colored arc */}
              <path
                d="M 20 110 A 90 90 0 0 1 200 110"
                fill="none"
                stroke="url(#fgGrad)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Needle */}
              <line
                x1="110"
                y1="110"
                x2={110 + 80 * Math.cos((gaugeAngle - 90) * Math.PI / 180)}
                y2={110 + 80 * Math.sin((gaugeAngle - 90) * Math.PI / 180)}
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transition: 'all 1s ease-out' }}
              />
              {/* Center dot */}
              <circle cx="110" cy="110" r="6" fill="white" />
              {/* Labels */}
              <text x="20" y="108" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">0</text>
              <text x="110" y="15" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">50</text>
              <text x="200" y="108" fill="var(--muted-foreground)" fontSize="9" textAnchor="middle">100</text>
            </svg>
          </div>
        </div>

        {/* Buy/Sell Signal */}
        <div
          className="flex items-center gap-3 rounded-xl p-3.5 border"
          style={{ background: signal.bg, borderColor: signal.borderColor }}
        >
          <signal.icon className="w-5 h-5 shrink-0" style={{ color: signal.color }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: signal.color }}>{signal.label}</p>
            <p className="text-xs text-muted-foreground" >
              {data.value <= 25 ? 'Le marché est dans un état de peur extrême – c\'est souvent le meilleur moment pour acheter à bas prix.' :
               data.value <= 45 ? 'Le marché est craintif – les prix peuvent être sous-évalués, c\'est une fenêtre d\'achat potentielle.' :
               data.value <= 55 ? 'Le marché est neutre – ni peur ni cupidité excessive. Restez prudent et surveillez les tendances.' :
               data.value <= 75 ? 'Le marché devient cupide – les prix pourraient être surévalués. Envisagez de prendre des bénéfices partiels.' :
               'Le marché est en cupidié extrême – c\'est souvent le moment de vendre avant une correction.'}
            </p>
          </div>
        </div>

        {/* 30-Day History Chart */}
        {chartData.length > 1 && (
          <div>
            <p className="text-xs font-medium mb-2 text-muted-foreground" >Historique 30 jours</p>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fgAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fgColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={fgColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} width={25} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--foreground)',
                  }}
                />
                <ReferenceLine y={25} stroke="rgba(34,197,94,0.3)" strokeDasharray="4 4" />
                <ReferenceLine y={75} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="value" stroke={fgColor} strokeWidth={2} fill="url(#fgAreaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground" >
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Peur Extrême</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Peur</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> Neutre</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Cupidité</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Cupidité Extr.</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// TOKEN BUY/SELL SIGNALS
// ============================================================
function TokenSignals() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [fgValue, setFgValue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, fgRes] = await Promise.all([
          fetch('/api/dashboard'),
          fetch('/api/fear-greed'),
        ])
        if (dashRes.ok) setData(await dashRes.json())
        if (fgRes.ok) {
          const fg = await fgRes.json()
          setFgValue(fg.value)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="glass-card rounded-2xl skeleton-wave fade-in-up">
        <CardContent className="p-6">
          <div className="h-48 rounded-xl" style={{ background: 'var(--input)' }} />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.tokens.length === 0) return null

  const getTokenSignal = (token: TokenDashboard) => {
    const priceVsPRU = token.pru > 0 ? (token.currentPrice - token.pru) / token.pru : 0
    const signals: { ticker: string; signal: 'ACHAT' | 'VENTE' | 'HOLD'; color: string; bg: string; borderColor: string; reason: string; icon: any }[] = []

    // Token is significantly below PRU (bought price) → buy opportunity
    if (priceVsPRU <= -0.20) {
      signals.push({
        ticker: token.ticker,
        signal: 'ACHAT',
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.08)',
        borderColor: 'rgba(34,197,94,0.2)',
        reason: `Le cours actuel est ${Math.abs(priceVsPRU * 100).toFixed(1)}% sous votre PRU – Opportunité de moyenne à la baisse`,
        icon: ShoppingCart,
      })
    } else if (priceVsPRU <= -0.05) {
      signals.push({
        ticker: token.ticker,
        signal: 'ACHAT',
        color: '#84cc16',
        bg: 'rgba(132,204,22,0.08)',
        borderColor: 'rgba(132,204,22,0.2)',
        reason: `Le cours est ${(Math.abs(priceVsPRU) * 100).toFixed(1)}% sous votre PRU – Possibilité d'achat à prix réduit`,
        icon: ArrowUpCircle,
      })
    } else if (priceVsPRU >= 0.50) {
      signals.push({
        ticker: token.ticker,
        signal: 'VENTE',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        borderColor: 'rgba(239,68,68,0.2)',
        reason: `Plus-value de +${(priceVsPRU * 100).toFixed(1)}% – Envisagez de prendre des bénéfices importants`,
        icon: ArrowDownCircle,
      })
    } else if (priceVsPRU >= 0.25) {
      signals.push({
        ticker: token.ticker,
        signal: 'VENTE',
        color: '#f97316',
        bg: 'rgba(249,115,22,0.08)',
        borderColor: 'rgba(249,115,22,0.2)',
        reason: `Plus-value de +${(priceVsPRU * 100).toFixed(1)}% – Pensez à sécuriser une partie de vos gains`,
        icon: Tag,
      })
    } else {
      signals.push({
        ticker: token.ticker,
        signal: 'HOLD',
        color: '#eab308',
        bg: 'rgba(234,179,8,0.06)',
        borderColor: 'rgba(234,179,8,0.15)',
        reason: `Proche de votre PRU (${(priceVsPRU >= 0 ? '+' : '')}${(priceVsPRU * 100).toFixed(1)}%) – Conservez et surveillez`,
        icon: Eye,
      })
    }
    return signals[0]
  }

  const tokenSignals = data.tokens
    .map(t => getTokenSignal(t))
    .sort((a, b) => {
      const order = { 'ACHAT': 0, 'VENTE': 1, 'HOLD': 2 }
      return order[a.signal] - order[b.signal]
    })

  // Market context summary
  const marketContext = fgValue !== null
    ? fgValue <= 25 ? { text: 'Marché en peur extrême – Opportunités d\'achat', color: '#22c55e' }
      : fgValue <= 45 ? { text: 'Marché craintif – Favorable aux achats', color: '#84cc16' }
      : fgValue <= 55 ? { text: 'Marché neutre – Restez prudent', color: '#eab308' }
      : fgValue <= 75 ? { text: 'Marché confiant – Prudence recommandée', color: '#f97316' }
      : { text: 'Marché euphorique – Risque de correction', color: '#ef4444' }
    : null

  return (
    <Card className="glass-card rounded-2xl card-hover-3d gradient-border fade-in-up">
      <CardContent className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,92,252,0.1)' }}>
            <Activity className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground/80">Signaux d&apos;Achat & Vente</h3>
            <p className="text-xs text-muted-foreground" >Basé sur votre PRU et le contexte marché</p>
          </div>
        </div>

        {/* Market Context Banner */}
        {marketContext && (
          <div className="flex items-center gap-2 rounded-lg p-2.5 border" style={{ background: `${marketContext.color}10`, borderColor: `${marketContext.color}30` }}>
            <Zap className="w-4 h-4 shrink-0" style={{ color: marketContext.color }} />
            <p className="text-xs font-medium" style={{ color: marketContext.color }}>{marketContext.text}</p>
          </div>
        )}

        {/* Signal List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
          {tokenSignals.map(ts => (
            <div
              key={ts.ticker}
              className="flex items-start gap-3 rounded-xl p-3 border transition-colors"
              style={{ background: ts.bg, borderColor: ts.borderColor }}
            >
              <div className="flex items-center gap-2 shrink-0">
                <TokenLogo ticker={ts.ticker} size={28} />
                <Badge
                  className="font-bold text-[10px] px-2 py-0.5 border-0"
                  style={{ background: `${ts.color}20`, color: ts.color }}
                >
                  {ts.signal}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <ts.icon className="w-3.5 h-3.5 shrink-0" style={{ color: ts.color }} />
                  <span className="text-xs font-semibold" style={{ color: ts.color }}>{ts.ticker}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{ts.reason}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <p className="text-[10px] text-center text-muted-foreground/50" >
          Ces signaux sont indicatifs et ne constituent pas un conseil financier. Faites vos propres recherches.
        </p>
      </CardContent>
    </Card>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ user, onUpgrade }: { user: any; onUpgrade: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [nextRefreshIn, setNextRefreshIn] = useState(60)
  const ts = useThemeStyles()

  const fetchData = useCallback(async (showToast = false, force = false) => {
    try {
      await fetch(`/api/prices${force ? '?force=true' : ''}`)
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const d = await res.json()
        setData(d)
        setLastUpdated(new Date())
        setNextRefreshIn(60)
        if (showToast) toast.success('Prix actualisés !')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData(false)
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefreshIn(prev => (prev > 0 ? prev - 1 : 60))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData(true, true)
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 page-transition">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="glass-card rounded-2xl skeleton-wave" style={{ height: '120px' }}>
              <CardContent className="p-6">
                <div className="h-4 w-2/3 rounded-lg mb-4 skeleton-wave" style={{ background: 'var(--input)' }} />
                <div className="h-8 w-1/2 rounded-lg skeleton-wave" style={{ background: 'var(--input)' }} />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card className="glass-card rounded-2xl skeleton-wave" style={{ height: '350px' }} />
          <Card className="glass-card rounded-2xl skeleton-wave" style={{ height: '350px' }} />
        </div>
      </div>
    )
  }

  if (!data || data.tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 page-transition">
        <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-violet-400/50" />
        </div>
        <h2 className="text-xl font-semibold text-foreground/80">Aucune transaction</h2>
        <p className="text-center max-w-md text-muted-foreground" >
          Commencez par ajouter des transactions dans l&apos;onglet &quot;Transactions&quot; pour voir votre tableau de bord.
        </p>
      </div>
    )
  }

  const sortedTokens = [...data.tokens].sort((a, b) => b.valeurActuelle - a.valeurActuelle)
  const totalValue = data.valeurActuelle || 1

  const barData = sortedTokens.map(t => ({
    name: t.ticker,
    investissement: t.montantInvesti,
    valeur: t.valeurActuelle,
  }))

  const kpiCards = [
    {
      label: 'Valeur du Portefeuille',
      value: data.valeurActuelle,
      icon: Wallet,
      barClass: 'kpi-bar-violet',
      iconBg: ts.iconBgViolet,
      iconColor: 'text-violet-400',
      colorClass: '',
      prefix: '',
      suffix: ' $',
      glowColor: ts.glowViolet,
    },
    {
      label: 'P/L Global',
      value: data.pl,
      icon: data.pl >= 0 ? TrendingUp : TrendingDown,
      barClass: data.pl >= 0 ? 'kpi-bar-emerald' : 'kpi-bar-red',
      iconBg: data.pl >= 0 ? ts.iconBgEmerald : ts.iconBgRed,
      iconColor: data.pl >= 0 ? 'text-emerald-400' : 'text-red-400',
      colorClass: plColor(data.pl),
      prefix: data.pl >= 0 ? '+' : '',
      suffix: ' $',
      glowColor: data.pl >= 0 ? ts.glowEmerald : ts.glowRed,
    },
    {
      label: 'Investissement Total',
      value: data.investissementTotal,
      icon: DollarSign,
      barClass: 'kpi-bar-cyan',
      iconBg: ts.iconBgCyan,
      iconColor: 'text-cyan-400',
      colorClass: '',
      prefix: '',
      suffix: ' $',
      glowColor: ts.glowCyan,
    },
    {
      label: 'ROI',
      value: data.roi,
      icon: data.roi >= 0 ? TrendingUp : TrendingDown,
      barClass: data.roi >= 0 ? 'kpi-bar-amber' : 'kpi-bar-red',
      iconBg: data.roi >= 0 ? ts.iconBgAmber : ts.iconBgRed,
      iconColor: data.roi >= 0 ? 'text-amber-400' : 'text-red-400',
      colorClass: plColor(data.roi),
      prefix: data.roi >= 0 ? '+' : '',
      suffix: '',
      isPercent: true,
      glowColor: data.roi >= 0 ? ts.glowAmber : ts.glowRed,
    },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 view-enter-cinematic">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 fade-in-up">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold gradient-shimmer-text">Tableau de Bord</h1>
          <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground" >
            <span>Vue d&apos;ensemble de votre portefeuille</span>
            {lastUpdated && (
              <span className="hidden sm:flex items-center gap-1.5">
                • <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow live-breathe" />
                <span className="text-muted-foreground/50">Mis à jour {lastUpdated.toLocaleTimeString('fr-FR')} • {nextRefreshIn}s</span>
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 shrink-0 glass rounded-xl text-foreground/60 hover:text-foreground/80 hover:bg-foreground/5 h-10 btn-ripple"
          style={{ borderColor: 'var(--border)' }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Live Price Ticker */}
      <LivePriceTicker />

      {/* Fear & Greed Index + Market Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 fade-in-up">
        <FearGreedWidget />
        {/* Token Buy/Sell Signals */}
        <TokenSignals />
      </div>

      {/* Freemium Upgrade Banner */}
      {user?.role === 'user_free' && (
        <Card className="glass-card rounded-2xl fade-in-up rainbow-border" style={{ borderColor: ts.premiumBorder, background: ts.premiumBg }}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-amber-400">Débloquez l&apos;accès illimité</p>
              <p className="text-muted-foreground">Plan Gratuit limité à 3 tokens et 10 transactions. Passez en Premium pour profiter de toutes les fonctionnalités.</p>
            </div>
            <Button
              className="rounded-xl text-black font-semibold shadow-lg transition-all active:scale-[0.98] shrink-0 upgrade-btn-glow btn-ripple"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
              onClick={onUpgrade}
            >
              <Crown className="w-4 h-4 mr-2" /> Passer en Premium
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {kpiCards.map((card, i) => (
          <div key={card.label} className={`fade-in-up stagger-${i + 1}`}>
            <Card className={`glass-card rounded-2xl card-hover-3d tilt-card gradient-border shimmer-vivid ${card.barClass}`}>
              <CardContent className="p-5 sm:p-6 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground" >{card.label}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center kpi-icon-glow" style={{ background: card.iconBg }}>
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
                {card.isPercent ? (
                  <p className={`text-xl sm:text-2xl font-bold kpi-value-animate ${card.colorClass || 'text-foreground/90'}`}>
                    <AnimatedCounter value={card.value} prefix={card.prefix} suffix="%" className={card.colorClass || 'text-foreground/90'} />
                  </p>
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold kpi-value-animate ${card.colorClass || 'text-foreground/90'}`}>
                    <AnimatedCounter value={card.value} prefix={card.prefix} suffix={card.suffix} className={card.colorClass || 'text-foreground/90'} />
                  </p>
                )}
                {/* Subtle gradient glow behind value */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full" style={{ background: card.glowColor, filter: 'blur(20px)' }} />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      </ScrollReveal>

      {/* Charts */}
      <ScrollReveal direction="scale">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Portfolio Distribution - Dynamic Pie Chart */}
        <Card className="glass-card rounded-2xl card-hover-3d gradient-border spotlight-card fade-in-up stagger-5 chart-enter chart-bg-grad">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground" >Répartition du Portefeuille</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={sortedTokens.map((t, i) => ({
                      name: t.ticker,
                      value: t.valeurActuelle,
                      color: CHART_COLORS[i % CHART_COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                    stroke="none"
                  >
                    {sortedTokens.map((t, i) => (
                      <Cell key={t.ticker} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: ts.chartTooltipBg,
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: `1px solid ${ts.chartTooltipBorder}`,
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'var(--foreground)',
                      boxShadow: ts.chartTooltipShadow,
                    }}
                    formatter={(value: number, name: string) => [`${fmt(value)} $`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend below pie */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-2 w-full">
                {sortedTokens.map((t, i) => {
                  const pct = (t.valeurActuelle / totalValue) * 100
                  return (
                    <div key={t.ticker} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-foreground/50 font-medium">{t.ticker}</span>
                      <span className="text-foreground/30 ml-auto">{pct.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment vs Value Bar Chart */}
        <Card className="glass-card rounded-2xl card-hover-3d gradient-border spotlight-card fade-in-up stagger-6 chart-enter chart-bg-grad">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground" >Investissement vs Valeur Actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280} className="sm:h-[300px]">
              <BarChart data={barData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--muted-foreground)' }} />
                <Bar dataKey="investissement" name="Investissement" fill="#06b6d4" radius={[6, 6, 0, 0]} animationDuration={800} />
                <Bar dataKey="valeur" name="Valeur Actuelle" fill="#7c5cfc" radius={[6, 6, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      </ScrollReveal>

      {/* Detailed Table - Desktop / Cards - Mobile */}
      <ScrollReveal direction="left">
      <Card className="glass-card rounded-2xl fade-in-up gradient-border shimmer-vivid">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-foreground/70">Détail par Token</CardTitle>
          <CardDescription className="text-muted-foreground">Analyse détaillée de chaque crypto-actif de votre portefeuille</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'var(--border)' }}>
                  <TableHead className="font-semibold text-muted-foreground" >Token</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >Montant Investi</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >Quantité</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >PRU</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >Cours Actuel</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >Valeur Actuelle</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >P/L</TableHead>
                  <TableHead className="text-right font-semibold text-muted-foreground" >Rentabilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTokens.map((t) => (
                  <TableRow key={t.ticker} className="data-row-hover hover-scale-glow transition-colors" style={{ borderBottomColor: 'var(--border)' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TokenLogo ticker={t.ticker} size={36} />
                        <div>
                          <p className="font-semibold text-foreground/80">{t.ticker}</p>
                          <p className="text-xs text-muted-foreground" >{t.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-foreground/60">{fmt(t.montantInvesti)} $</TableCell>
                    <TableCell className="text-right font-mono text-foreground/40">{fmtSmall(t.quantite)}</TableCell>
                    <TableCell className="text-right font-mono text-foreground/60">{fmt(t.pru)} $</TableCell>
                    <TableCell className="text-right font-mono text-foreground/60">{fmt(t.currentPrice)} $</TableCell>
                    <TableCell className="text-right font-mono text-foreground/60">{fmt(t.valeurActuelle)} $</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${plColor(t.pl)}`}>
                      {t.pl >= 0 ? '+' : ''}{fmt(t.pl)} $
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={`${t.rentabilite >= 0 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'} border font-mono`}>
                        {t.rentabilite >= 0 ? '+' : ''}{fmtPct(t.rentabilite)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3 list-stagger">
            {sortedTokens.map((t) => (
              <div key={t.ticker} className="glass-card rounded-2xl p-4 space-y-3 card-hover-3d gradient-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TokenLogo ticker={t.ticker} size={40} />
                    <div>
                      <p className="font-semibold text-foreground/80">{t.ticker}</p>
                      <p className="text-xs text-muted-foreground" >{t.name}</p>
                    </div>
                  </div>
                  <Badge className={`${t.rentabilite >= 0 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'} border font-mono text-xs`}>
                    {t.rentabilite >= 0 ? '+' : ''}{fmtPct(t.rentabilite)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground" >Investi</p>
                    <p className="text-foreground/60 font-mono">{fmt(t.montantInvesti)} $</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground" >Valeur</p>
                    <p className="text-foreground/60 font-mono">{fmt(t.valeurActuelle)} $</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground" >Quantité</p>
                    <p className="text-foreground/40 font-mono">{fmtSmall(t.quantite)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground" >P/L</p>
                    <p className={`font-mono font-semibold ${plColor(t.pl)}`}>
                      {t.pl >= 0 ? '+' : ''}{fmt(t.pl)} $
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </ScrollReveal>
    </div>
  )
}

// ============================================================
// TRANSACTIONS VIEW
// ============================================================
const transactionSchema = z.object({
  date: z.string().min(1, 'Date requise'),
  tokenTicker: z.string().min(1, 'Token requis'),
  montantInvesti: z.string().min(1, 'Montant requis'),
  coursAchat: z.string().min(1, 'Cours requis'),
  exchangeId: z.string().optional(),
  notes: z.string().optional(),
})

function TransactionsView({ user, onUpgrade }: { user: any; onUpgrade: () => void }) {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [exchanges, setExchanges] = useState<ExchangeData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'date' | 'tokenTicker' | 'montantInvesti'>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [recentTxId, setRecentTxId] = useState<string | null>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      tokenTicker: '',
      montantInvesti: '',
      coursAchat: '',
      exchangeId: '',
      notes: '',
    },
  })

  const fetchData = useCallback(async () => {
    try {
      const [txRes, tokenRes, exRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/tokens'),
        fetch('/api/exchanges'),
      ])
      if (txRes.ok) setTransactions(await txRes.json())
      if (tokenRes.ok) setTokens(await tokenRes.json())
      if (exRes.ok) setExchanges(await exRes.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const openNew = () => {
    setEditingTx(null)
    reset({
      date: new Date().toISOString().split('T')[0],
      tokenTicker: '',
      montantInvesti: '',
      coursAchat: '',
      exchangeId: '',
      notes: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (tx: TransactionData) => {
    setEditingTx(tx)
    reset({
      date: new Date(tx.date).toISOString().split('T')[0],
      tokenTicker: tx.tokenTicker,
      montantInvesti: tx.montantInvesti.toString(),
      coursAchat: tx.coursAchat.toString(),
      exchangeId: tx.exchangeId || '',
      notes: tx.notes || '',
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: any) => {
    try {
      const body = {
        ...values,
        montantInvesti: parseFloat(values.montantInvesti),
        coursAchat: parseFloat(values.coursAchat),
      }

      if (editingTx) {
        const res = await fetch('/api/transactions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTx.id, ...body }),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || err.error || 'Erreur')
        }
        toast.success('Transaction modifiée')
        setRecentTxId(editingTx.id)
      } else {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.detail || err.error || 'Erreur')
        }
        toast.success('Transaction ajoutée !', { className: 'toast-success-bar' })
      }

      setDialogOpen(false)
      fetchData()
      // Clear animation highlight after 1.5s
      setTimeout(() => setRecentTxId(null), 1500)
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Transaction supprimée', { className: 'toast-success-bar' })
        fetchData()
      }
    } catch (err: any) {
      toast.error(err.message)
    }
    setDeleteConfirm(null)
  }

  const sorted = [...transactions]
    .filter(tx => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return tx.tokenTicker.toLowerCase().includes(q) ||
        tx.token?.name?.toLowerCase().includes(q) ||
        tx.exchange?.name?.toLowerCase().includes(q) ||
        tx.notes?.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'date') return dir * (new Date(a.date).getTime() - new Date(b.date).getTime())
      if (sortField === 'tokenTicker') return dir * a.tokenTicker.localeCompare(b.tokenTicker)
      return dir * (a.montantInvesti - b.montantInvesti)
    })

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    sortField === field ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 page-transition">
        <RefreshCw className="w-8 h-8 animate-spin text-violet-400/50" />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 view-enter-cinematic">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold gradient-shimmer-text">Transactions</h1>
          <p className="mt-1 text-muted-foreground" >Gérez vos achats de crypto-actifs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2 rounded-xl h-10 shadow-lg transition-all active:scale-[0.98] hidden sm:flex text-foreground btn-primary-glow btn-ripple" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Nouvelle Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-enter rounded-2xl max-w-lg dialog-mobile-fullscreen text-foreground" style={{ background: 'var(--popover)', backdropFilter: 'blur(30px)', border: '1px solid var(--border)' }}>
            <DialogHeader>
              <DialogTitle className="text-foreground/90">{editingTx ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
              <DialogDescription className="sr-only">{editingTx ? 'Formulaire de modification de transaction' : 'Formulaire d\'ajout de transaction'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" >Date</Label>
                  <Input type="date" {...register('date')} className="border text-foreground rounded-xl h-11" style={{ background: 'var(--input)', borderColor: 'var(--border)' }} />
                  {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" >Token</Label>
                  <Select onValueChange={v => setValue('tokenTicker', v)} defaultValue={editingTx?.tokenTicker}>
                    <SelectTrigger className="border text-foreground rounded-xl h-11" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent style={{ background: 'var(--popover)', border: '1px solid var(--border)' }}>
                      {tokens.map(t => (
                        <SelectItem key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tokenTicker && <p className="text-xs text-red-400">{errors.tokenTicker.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" >Montant investi ($)</Label>
                  <Input type="number" step="0.01" {...register('montantInvesti')} placeholder="15.70" className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11" style={{ background: 'var(--input)', borderColor: 'var(--border)' }} />
                  {errors.montantInvesti && <p className="text-xs text-red-400">{errors.montantInvesti.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" >Cours d&apos;achat ($)</Label>
                  <Input type="number" step="0.0001" {...register('coursAchat')} placeholder="82603.9" className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11" style={{ background: 'var(--input)', borderColor: 'var(--border)' }} />
                  {errors.coursAchat && <p className="text-xs text-red-400">{errors.coursAchat.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground" >Exchange (optionnel)</Label>
                <Select onValueChange={v => setValue('exchangeId', v)} defaultValue={editingTx?.exchangeId || ''}>
                  <SelectTrigger className="border text-foreground rounded-xl h-11" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent style={{ background: 'var(--popover)', border: '1px solid var(--border)' }}>
                    {exchanges.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground" >Notes (optionnel)</Label>
                <Input {...register('notes')} placeholder="Note facultative" className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11" style={{ background: 'var(--input)', borderColor: 'var(--border)' }} />
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl text-foreground/50 hover:text-foreground/70 hover:bg-foreground/5" style={{ borderColor: 'var(--border)' }}>Annuler</Button>
                </DialogClose>
                <Button type="submit" className="rounded-xl shadow-lg text-foreground transition-all active:scale-[0.98] btn-primary-glow btn-ripple" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
                  {editingTx ? 'Modifier' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Freemium notice */}
      {user?.role === 'user_free' && (
        <Card className="glass-card rounded-2xl fade-in-up stagger-1" style={{ borderColor: 'rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.1)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-400">Plan Gratuit — Limité à 3 tokens et 10 transactions</p>
              <p className="text-muted-foreground text-xs sm:text-sm">Passez en Premium pour débloquer l&apos;accès illimité.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
              <Badge className="border" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}>
                {transactions.length}/10
              </Badge>
              <Button
                size="sm"
                className="rounded-xl text-black font-semibold shadow-lg transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 15px rgba(245,158,11,0.25)' }}
                onClick={onUpgrade}
              >
                <Crown className="w-3.5 h-3.5 mr-1.5" /> Premium
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search/Filter Bar */}
      {transactions.length > 0 && (
        <div className="relative fade-in-up stagger-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50"  />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par token, exchange, notes..."
            className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11 pl-10"
            style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
          />
        </div>
      )}

      {/* Transactions Content */}
      {transactions.length === 0 ? (
        <Card className="glass-card rounded-2xl fade-in-up">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl glass mx-auto mb-4 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-violet-400/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/70 mb-2">Aucune transaction</h3>
            <p className="mb-6 text-muted-foreground" >Ajoutez votre première transaction pour commencer le suivi.</p>
            <Button onClick={openNew} className="gap-2 rounded-xl shadow-lg text-foreground btn-primary-glow btn-ripple" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Ajouter une transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="glass-card rounded-2xl hidden md:block fade-in-up stagger-3">
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'var(--border)' }}>
                      <TableHead className="cursor-pointer select-none text-muted-foreground"  onClick={() => toggleSort('date')}>
                        <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none text-muted-foreground"  onClick={() => toggleSort('tokenTicker')}>
                        <span className="flex items-center gap-1">Token <SortIcon field="tokenTicker" /></span>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none text-muted-foreground"  onClick={() => toggleSort('montantInvesti')}>
                        <span className="flex items-center justify-end gap-1">Montant <SortIcon field="montantInvesti" /></span>
                      </TableHead>
                      <TableHead className="text-right text-muted-foreground" >Cours</TableHead>
                      <TableHead className="text-right text-muted-foreground" >Quantité</TableHead>
                      <TableHead className="text-muted-foreground">Exchange</TableHead>
                      <TableHead className="text-right text-muted-foreground" >Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((tx, idx) => (
                      <TableRow key={tx.id} className={`transition-colors data-row-hover tx-row-hover ${recentTxId === tx.id ? 'tx-success-flash tx-row-enter' : ''}`} style={{ borderBottomColor: 'var(--border)', animationDelay: `${idx * 0.05}s` }}>
                        <TableCell className="font-mono text-sm text-foreground/50">
                          {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TokenLogo ticker={tx.tokenTicker} size={28} />
                            <Badge variant="outline" className="font-semibold border-foreground/10 text-foreground/70">
                              {tx.tokenTicker}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-foreground/60">{fmt(tx.montantInvesti)} $</TableCell>
                        <TableCell className="text-right font-mono text-foreground/50">{fmt(tx.coursAchat)} $</TableCell>
                        <TableCell className="text-right font-mono text-foreground/40">{fmtSmall(tx.quantite)}</TableCell>
                        <TableCell>
                          {tx.exchange ? (
                            <div className="flex items-center gap-1.5">
                              <ExchangeLogo name={tx.exchange.name} size={20} />
                              <span className="text-xs text-foreground/50">{tx.exchange.name}</span>
                            </div>
                          ) : <span style={{ color: 'var(--muted-foreground)' }}>—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-foreground/5 text-foreground/30 hover:text-foreground/60" onClick={() => openEdit(tx)}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            {deleteConfirm === tx.id ? (
                              <div className="flex gap-1 fade-in">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" onClick={() => handleDelete(tx.id)}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-foreground/5 text-foreground/30" onClick={() => setDeleteConfirm(null)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-foreground/20 hover:text-red-400" onClick={() => setDeleteConfirm(tx.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3 fade-in-up stagger-3 list-stagger">
            {sorted.map((tx) => (
              <div key={tx.id} className={`glass-card rounded-2xl p-4 space-y-3 card-hover tx-row-hover ${recentTxId === tx.id ? 'tx-success-flash tx-row-enter' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TokenLogo ticker={tx.tokenTicker} size={40} />
                    <div>
                      <p className="font-semibold text-foreground/80">{tx.tokenTicker}</p>
                      <p className="text-xs text-muted-foreground" >{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-foreground/5 text-foreground/30 hover:text-foreground/60" onClick={() => openEdit(tx)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {deleteConfirm === tx.id ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400" onClick={() => handleDelete(tx.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-foreground/5 text-foreground/30" onClick={() => setDeleteConfirm(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-500/10 text-foreground/20 hover:text-red-400" onClick={() => setDeleteConfirm(tx.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground/50" >Montant</p>
                    <p className="text-foreground/60 font-mono">{fmt(tx.montantInvesti)} $</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground/50" >Cours</p>
                    <p className="text-foreground/50 font-mono">{fmt(tx.coursAchat)} $</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground/50" >Quantité</p>
                    <p className="text-foreground/40 font-mono">{fmtSmall(tx.quantite)}</p>
                  </div>
                </div>
                {(tx.exchange || tx.notes) && (
                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    {tx.exchange && (
                      <div className="flex items-center gap-1.5">
                        <ExchangeLogo name={tx.exchange.name} size={20} />
                        <span className="text-xs text-foreground/35">{tx.exchange.name}</span>
                      </div>
                    )}
                    {tx.notes && (
                      <span className="text-xs truncate flex-1 text-muted-foreground/40" >{tx.notes}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAB Button on Mobile */}
      <button
        onClick={openNew}
        className="fab-button fab-pulse-ring fixed bottom-20 right-4 sm:hidden w-14 h-14 rounded-2xl flex items-center justify-center text-foreground z-40 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

// ============================================================
// SUBSCRIPTION PLANS
// ============================================================
const SUBSCRIPTION_PLANS = [
  { months: 1,  discount: 0,  total: 9.99,  monthly: 9.99, label: '1 mois',  badge: '' },
  { months: 3,  discount: 10, total: 26.97, monthly: 8.99, label: '3 mois',  badge: '-10%' },
  { months: 6,  discount: 15, total: 50.95, monthly: 8.49, label: '6 mois',  badge: '-15%' },
  { months: 12, discount: 20, total: 95.90, monthly: 7.99, label: '12 mois', badge: '-20%' },
] as const

// PayPal SDK types
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onError: (err: any) => void
        onCancel?: () => void
        style?: { layout?: string; color?: string; shape?: string; label?: string; height?: number }
      }) => { render: (container: string) => Promise<void>; close: () => void }
    }
  }
}

// ============================================================
// ADMIN PRICING VIEW — Manage Premium Subscription Prices
// ============================================================
interface PricingPlan {
  months: number
  discount: number
  total: number
  monthly: number
  label: string
  badge: string
}

function AdminPricingView() {
  const [plans, setPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editPlan, setEditPlan] = useState<PricingPlan | null>(null)

  const fetchPricing = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pricing')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPricing() }, [fetchPricing])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Recalculate derived fields
      const updatedPlans = plans.map(p => ({
        ...p,
        monthly: Number((p.total / p.months).toFixed(2)),
        badge: p.discount > 0 ? `-${p.discount}%` : '',
      }))
      const res = await fetch('/api/admin/pricing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plans: updatedPlans }),
      })
      if (res.ok) {
        toast.success('Tarifs mis à jour avec succès')
        setPlans(updatedPlans)
        setEditIdx(null)
        setEditPlan(null)
      } else {
        const data = await res.json()
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (idx: number) => {
    setEditIdx(idx)
    setEditPlan({ ...plans[idx] })
  }

  const cancelEdit = () => {
    setEditIdx(null)
    setEditPlan(null)
  }

  const applyEdit = () => {
    if (editPlan && editIdx !== null) {
      const newPlans = [...plans]
      newPlans[editIdx] = { ...editPlan }
      setPlans(newPlans)
      setEditIdx(null)
      setEditPlan(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-violet-400/50" /></div>

  return (
    <div className="space-y-6 page-transition">
      <div className="fade-in-up">
        <h2 className="text-xl font-bold text-foreground/80 flex items-center gap-2">
          <Tag className="w-5 h-5 text-violet-400" /> Tarification Premium
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Modifiez les prix des offres d&apos;abonnement Premium</p>
      </div>

      <Card className="glass-card rounded-2xl fade-in-up stagger-1">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all relative ${
                  idx === editIdx ? 'border-violet-500/30' : 'border-border'
                }`}
                style={idx === editIdx ? { background: 'rgba(124,92,252,0.05)' } : { background: 'var(--muted)' }}
              >
                {plan.badge && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
                    {plan.badge}
                  </div>
                )}

                {editIdx === idx && editPlan ? (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Label</Label>
                      <Input
                        value={editPlan.label}
                        onChange={e => setEditPlan({ ...editPlan, label: e.target.value })}
                        className="rounded-xl h-9 text-sm"
                        style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Durée (mois)</Label>
                      <Input
                        type="number"
                        value={editPlan.months}
                        onChange={e => setEditPlan({ ...editPlan, months: Number(e.target.value) })}
                        className="rounded-xl h-9 text-sm"
                        style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Prix total (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editPlan.total}
                        onChange={e => setEditPlan({ ...editPlan, total: Number(e.target.value) })}
                        className="rounded-xl h-9 text-sm"
                        style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Réduction (%)</Label>
                      <Input
                        type="number"
                        value={editPlan.discount}
                        onChange={e => setEditPlan({ ...editPlan, discount: Number(e.target.value) })}
                        className="rounded-xl h-9 text-sm"
                        style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={applyEdit} className="flex-1 rounded-xl text-xs" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}>
                        <Check className="w-3 h-3 mr-1" /> OK
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit} className="flex-1 rounded-xl text-xs">
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground/70">{plan.label}</h3>
                    <div>
                      <p className="text-2xl font-bold text-foreground/80">{plan.total.toFixed(2).replace('.', ',')} €</p>
                      <p className="text-xs text-muted-foreground">{(plan.total / plan.months).toFixed(2).replace('.', ',')} €/mois</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{plan.months} mois</span>
                      {plan.discount > 0 && <Badge className="text-[10px] px-1.5 bg-amber-500/15 text-amber-500 border-amber-500/20 border">-{plan.discount}%</Badge>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(idx)}
                      className="w-full rounded-xl text-xs"
                    >
                      <Edit3 className="w-3 h-3 mr-1" /> Modifier
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl font-medium transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Tag className="w-4 h-4 mr-2" />}
              Enregistrer les tarifs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// UPGRADE PREMIUM MODAL
// ============================================================
function UpgradePremiumModal({ open, onOpenChange, onSuccess }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'select' | 'paypal' | 'processing' | 'success'>('select')
  const [selectedPlan, setSelectedPlan] = useState(1)
  const [error, setError] = useState('')
  const [celebrating, setCelebrating] = useState(false)
  const [paypalLoaded, setPaypalLoaded] = useState(false)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const paypalContainerRef = useRef<HTMLDivElement>(null)
  const paypalButtonsRef = useRef<any>(null)

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.months === selectedPlan) || SUBSCRIPTION_PLANS[0]

  // Load PayPal SDK dynamically with robust error handling
  const loadPayPalSDK = useCallback(() => {
    if (paypalLoaded || paypalLoading) return
    setPaypalLoading(true)

    // Check if SDK already loaded
    const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]')
    if (existingScript || window.paypal) {
      setPaypalLoaded(true)
      setPaypalLoading(false)
      return
    }

    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    if (!clientId) {
      console.error('NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set')
      setError('Configuration PayPal manquante. Veuillez contacter le support.')
      setPaypalLoading(false)
      return
    }

    const script = document.createElement('script')
    // Load only the Buttons component to reduce SDK size and avoid unused module errors
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&intent=capture&locale=fr_FR&components=buttons`
    script.async = true
    script.onload = () => {
      // Verify that the paypal object and Buttons method are available
      if (window.paypal && window.paypal.Buttons) {
        setPaypalLoaded(true)
        setPaypalLoading(false)
      } else {
        console.error('PayPal SDK loaded but Buttons not available')
        setError('PayPal n\'a pas pu se charger correctement. Veuillez réessayer.')
        setPaypalLoading(false)
      }
    }
    script.onerror = () => {
      setError('Impossible de charger PayPal. Vérifiez votre connexion et réessayez.')
      setPaypalLoading(false)
    }
    document.body.appendChild(script)
  }, [paypalLoaded, paypalLoading])

  // Render PayPal buttons when SDK is loaded and modal is on paypal step
  useEffect(() => {
    if (!open || step !== 'paypal') return

    // Add global PayPal SDK error handler to catch unhandled exceptions
    const handlePayPalError = (event: ErrorEvent) => {
      if (event.message?.includes('paypal') || event.filename?.includes('paypal')) {
        console.warn('PayPal SDK global error caught:', event.message)
        // Don't show to user unless it's critical — the SDK recovers internally
        event.preventDefault()
      }
    }
    window.addEventListener('error', handlePayPalError)

    const tryRenderButtons = () => {
      if (!window.paypal?.Buttons || !paypalContainerRef.current) return false

      // Clear previous buttons
      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = ''
      }

      try {
        paypalButtonsRef.current = window.paypal.Buttons({
          createOrder: async () => {
            setError('')
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration: selectedPlan }),
              })
              const data = await res.json()
              if (!res.ok) {
                setError(data.error || 'Erreur lors de la création de la commande')
                return ''
              }
              return data.orderID
            } catch (err: any) {
              setError(err.message)
              return ''
            }
          },
          onApprove: async (data: { orderID: string }) => {
            setStep('processing')
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderID: data.orderID, duration: selectedPlan }),
              })
              const result = await res.json()
              if (res.ok && result.success) {
                setStep('success')
                toast.success('Bienvenue en Premium !')
                setCelebrating(true)
                setTimeout(() => {
                  setCelebrating(false)
                  onOpenChange(false)
                  setStep('select')
                  onSuccess()
                }, 2500)
              } else {
                setError(result.error || 'Le paiement a échoué')
                setStep('paypal')
              }
            } catch (err: any) {
              setError(err.message)
              setStep('paypal')
            }
          },
          onError: (err: any) => {
            console.error('PayPal button error:', err)
            // Don't show generic error for SDK internal errors that are harmless
            const errMsg = typeof err === 'string' ? err : err?.message || ''
            if (errMsg.includes('unhandled_exception') || errMsg.includes('Window closed')) {
              // These are usually user cancelling or harmless SDK errors
              return
            }
            setError('Une erreur est survenue avec PayPal. Veuillez réessayer.')
          },
          onCancel: () => {
            // User closed the PayPal popup — just stay on the paypal step, no error
            setStep('paypal')
          },
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            height: 45,
          },
        })

        paypalButtonsRef.current.render('#paypal-button-container')
        return true
      } catch (err) {
        console.error('PayPal render error:', err)
        return false
      }
    }

    loadPayPalSDK()

    const timer1 = setTimeout(() => tryRenderButtons(), 500)
    const timer2 = setTimeout(() => tryRenderButtons(), 1500)
    const timer3 = setTimeout(() => tryRenderButtons(), 3000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      window.removeEventListener('error', handlePayPalError)
      if (paypalButtonsRef.current) {
        try { paypalButtonsRef.current.close() } catch (e) {}
      }
    }
  }, [open, step, paypalLoaded, loadPayPalSDK, onSuccess, onOpenChange, selectedPlan])

  // Reset on close
  const handleOpenChange = (v: boolean) => {
    onOpenChange(v)
    if (!v) {
      setStep('select')
      setError('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="glass-card border-0 max-w-md" style={{ background: 'rgba(20,22,35,0.98)', backdropFilter: 'blur(30px)' }}>
        {celebrating && (
          <div className="upgrade-celebration fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-4">
              <div className="upgrade-crown-bounce">
                <Crown className="w-20 h-20 text-amber-400" style={{ filter: 'drop-shadow(0 0 20px rgba(245,158,11,0.5))' }} />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Bienvenue en Premium !</h2>
              <p className="text-sm text-foreground/50">Accès illimité débloqué</p>
            </div>
          </div>
        )}
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                Passer en Premium
              </DialogTitle>
              <DialogDescription className="sr-only">Choisissez votre durée d&apos;abonnement Premium et payez via PayPal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Features */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Tokens illimités</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Transactions illimitées</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Graphiques d&apos;évolution</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Métriques avancées</span></div>
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-violet-400 shrink-0" /> <span className="text-violet-400 font-medium">Prédict AI</span></div>
              </div>

              {/* Duration selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground" >Choisissez votre durée d&apos;engagement</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.months
                    const isBest = plan.months === 12
                    return (
                      <button
                        key={plan.months}
                        onClick={() => setSelectedPlan(plan.months)}
                        className={`relative p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-amber-500/50'
                            : 'border-white/5 hover:border-white/15'
                        }`}
                        style={{
                          background: isSelected
                            ? 'rgba(245,158,11,0.08)'
                            : 'var(--input)',
                        }}
                      >
                        {plan.badge && (
                          <span
                            className="absolute -top-2 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                            style={{
                              background: isBest
                                ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                : 'rgba(245,158,11,0.2)',
                              color: isBest ? '#000' : '#f59e0b',
                            }}
                          >
                            {plan.badge}
                          </span>
                        )}
                        <p className={`text-sm font-semibold ${isSelected ? 'text-amber-400' : 'text-foreground/60'}`}>
                          {plan.label}
                        </p>
                        <div className="mt-1">
                          <span className={`text-lg font-bold ${isSelected ? 'text-foreground' : 'text-foreground/70'}`}>
                            {plan.total.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5 text-muted-foreground" >
                          {plan.monthly.toFixed(2).replace('.', ',')} €/mois
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" >Total</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-amber-400">{currentPlan.total.toFixed(2).replace('.', ',')} €</span>
                    {currentPlan.discount > 0 && (
                      <span className="ml-2 text-xs font-semibold text-emerald-400">
                        Économie de {((currentPlan.months * 9.99) - currentPlan.total).toFixed(2).replace('.', ',')} €
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] mt-1 text-muted-foreground" >
                  Soit {currentPlan.monthly.toFixed(2).replace('.', ',')} €/mois
                  {currentPlan.discount > 0 && ` au lieu de 9,99 €/mois`}
                </p>
              </div>

              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground" >
                  Paiement sécurisé via PayPal. Annulation possible à tout moment depuis votre profil.
                </p>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="ghost" className="text-foreground/40 hover:text-foreground/60 rounded-xl">Annuler</Button>
              </DialogClose>
              <Button
                onClick={() => setStep('paypal')}
                className="rounded-xl text-black font-semibold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
              >
                <Crown className="w-4 h-4 mr-2" /> Payer avec PayPal
              </Button>
            </DialogFooter>
          </>
        )}
        {step === 'paypal' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                Paiement Premium — {currentPlan.label}
              </DialogTitle>
              <DialogDescription className="sr-only">Paiement sécurisé via PayPal pour l&apos;abonnement {currentPlan.label}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Order summary */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground/80">CryptoFolio Premium</p>
                    <p className="text-xs text-muted-foreground" >
                      Abonnement {currentPlan.label}
                      {currentPlan.discount > 0 && ` (-${currentPlan.discount}%)`}
                    </p>
                  </div>
                  <span className="text-2xl font-bold text-amber-400">{currentPlan.total.toFixed(2).replace('.', ',')} €</span>
                </div>
              </div>

              {/* PayPal Payment Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px flex-1" style={{ background: 'var(--muted)' }} />
                  <span className="text-xs font-medium text-muted-foreground">Paiement sécurisé via PayPal</span>
                  <div className="h-px flex-1" style={{ background: 'var(--muted)' }} />
                </div>

                {paypalLoading && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400/60" />
                    <span className="text-xs text-muted-foreground" >Chargement de PayPal...</span>
                  </div>
                )}

                <div
                  id="paypal-button-container"
                  ref={paypalContainerRef}
                  className="min-h-[45px]"
                  style={{ opacity: paypalLoaded ? 1 : 0.3 }}
                />

                {!paypalLoaded && !paypalLoading && (
                  <div className="flex items-center justify-center py-4">
                    <p className="text-xs text-muted-foreground" >Chargement du bouton de paiement...</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" className="text-foreground/40 hover:text-foreground/60 rounded-xl" onClick={() => { setStep('select'); setError('') }}>
                Retour
              </Button>
            </DialogFooter>
          </>
        )}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-foreground/80 font-medium">Vérification du paiement...</p>
              <p className="text-xs mt-1 text-muted-foreground" >Activation de votre abonnement Premium</p>
            </div>
          </div>
        )}
        {step === 'success' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-foreground/80 font-semibold text-lg">Bienvenue en Premium !</p>
              <p className="text-xs mt-1 text-muted-foreground" >Votre accès illimité est maintenant activé</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// EXPLORER VIEW — CoinMarketCap Powered (Top 500)
// ============================================================

// CMC Token interface
interface CMCToken {
  id: number
  name: string
  symbol: string
  slug: string
  cmc_rank: number
  circulating_supply: number
  total_supply: number
  max_supply: number | null
  quote: {
    USD: {
      price: number
      volume_24h: number
      volume_change_24h: number
      percent_change_1h: number
      percent_change_24h: number
      percent_change_7d: number
      percent_change_30d: number
      market_cap: number
      market_cap_dominance: number
      fully_diluted_market_cap: number
    }
  }
}

// CMC Exchange interface
interface CMCExchange {
  id: number
  name: string
  slug: string
  rank: number
  logo: string
  description: string | null
  urls: { website: string[]; fee: string[]; twitter: string[] }
  market_pairs: number
  volume_24h: number
  volume_7d: number
  volume_30d: number
  quote: {
    USD: {
      volume_24h: number
      volume_7d: number
      volume_30d: number
    }
  }
}

// Global metrics interface
interface GlobalMetrics {
  total_cryptocurrencies: number
  total_exchanges: number
  total_market_cap: number
  total_volume_24h: number
  btc_dominance: number
  eth_dominance: number
  market_cap_change_24h: number
  volume_change_24h: number
}

// Fear & Greed interface
interface FearGreedData {
  value: number
  classification: string
  history: Array<{ value: number; classification: string; date: string }>
}

// Number formatting for large values
const fmtMarketCap = (n: number) => {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`
  return `$${n.toFixed(2)}`
}

const fmtVolume = (n: number) => fmtMarketCap(n)

const fmtChangePercent = (n: number) => {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

const changeColor = (n: number) => n >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
const changeBg = (n: number) => n >= 0 ? 'bg-emerald-500/10 dark:bg-emerald-500/15' : 'bg-red-500/10 dark:bg-red-500/15'

// CMC Logo URL helper
const CMC_LOGO_URL = (id: number) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${id}.png`

function ExplorerView() {
  const ts = useThemeStyles()
  const [cmcTokens, setCmcTokens] = useState<CMCToken[]>([])
  const [cmcExchanges, setCmcExchanges] = useState<CMCExchange[]>([])
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null)
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('market')
  const [tokenSearch, setTokenSearch] = useState('')
  const [exchangeSearch, setExchangeSearch] = useState('')
  const [sortField, setSortField] = useState<string>('cmc_rank')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 50

  // Load all data from CMC
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tokensRes, exchangesRes, globalRes, fearRes] = await Promise.all([
          fetch('/api/cmc/listings?limit=500'),
          fetch('/api/cmc/exchanges?limit=100'),
          fetch('/api/cmc/global'),
          fetch('/api/fear-greed'),
        ])

        if (tokensRes.ok) {
          const tokensData = await tokensRes.json()
          setCmcTokens(tokensData.data || [])
        }
        if (exchangesRes.ok) {
          const exchangesData = await exchangesRes.json()
          setCmcExchanges(exchangesData.data || [])
        }
        if (globalRes.ok) {
          const globalData = await globalRes.json()
          setGlobalMetrics({
            total_cryptocurrencies: globalData.total_cryptocurrencies || 0,
            total_exchanges: globalData.total_exchanges || 0,
            total_market_cap: globalData.quote?.USD?.total_market_cap || 0,
            total_volume_24h: globalData.quote?.USD?.total_volume_24h || 0,
            btc_dominance: globalData.btc_dominance || 0,
            eth_dominance: globalData.eth_dominance || 0,
            market_cap_change_24h: globalData.quote?.USD?.total_market_cap_yesterday_percentage_change || 0,
            volume_change_24h: globalData.quote?.USD?.total_volume_24h_yesterday_percentage_change || 0,
          })
        }
        if (fearRes.ok) {
          const fearData = await fearRes.json()
          setFearGreed(fearData)
        }
      } catch (err) {
        console.error('Failed to load explorer data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter tokens
  const filteredTokens = cmcTokens.filter(t => {
    if (!tokenSearch) return true
    const q = tokenSearch.toLowerCase()
    return t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
  })

  // Sort tokens
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    let aVal: number, bVal: number
    switch (sortField) {
      case 'cmc_rank': aVal = a.cmc_rank; bVal = b.cmc_rank; break
      case 'price': aVal = a.quote.USD.price; bVal = b.quote.USD.price; break
      case 'change_1h': aVal = a.quote.USD.percent_change_1h; bVal = b.quote.USD.percent_change_1h; break
      case 'change_24h': aVal = a.quote.USD.percent_change_24h; bVal = b.quote.USD.percent_change_24h; break
      case 'change_7d': aVal = a.quote.USD.percent_change_7d; bVal = b.quote.USD.percent_change_7d; break
      case 'market_cap': aVal = a.quote.USD.market_cap; bVal = b.quote.USD.market_cap; break
      case 'volume_24h': aVal = a.quote.USD.volume_24h; bVal = b.quote.USD.volume_24h; break
      default: aVal = a.cmc_rank; bVal = b.cmc_rank
    }
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal
  })

  // Paginate tokens
  const totalPages = Math.ceil(sortedTokens.length / PER_PAGE)
  const paginatedTokens = sortedTokens.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Filter exchanges
  const filteredExchanges = cmcExchanges.filter(e => {
    if (!exchangeSearch) return true
    const q = exchangeSearch.toLowerCase()
    return e.name.toLowerCase().includes(q)
  })

  // Sort toggle helper
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'cmc_rank' ? 'asc' : 'desc')
    }
    setPage(1)
  }

  // Fear & Greed gauge
  const fgValue = fearGreed?.value || 50
  const fgClass = fgValue <= 25 ? 'text-red-500' : fgValue <= 45 ? 'text-orange-500' : fgValue <= 55 ? 'text-yellow-500' : fgValue <= 75 ? 'text-lime-500' : 'text-emerald-500'
  const fgLabel = fearGreed?.classification || 'Neutre'
  const fgColor = fgValue <= 25 ? '#ef4444' : fgValue <= 45 ? '#f97316' : fgValue <= 55 ? '#eab308' : fgValue <= 75 ? '#84cc16' : '#10b981'

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-4">
        <RefreshCw className="w-10 h-10 animate-spin text-violet-400/50 mx-auto" />
        <p className="text-sm text-muted-foreground animate-pulse">Chargement des données CoinMarketCap...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6 view-enter-cinematic">
      {/* Header */}
      <div className="fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative" style={{ background: ts.explorerIconBg, border: `1px solid ${ts.explorerIconBorder}` }}>
            <Search className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold gradient-text">Explorateur</h1>
            <p className="text-sm text-muted-foreground">Données en direct CoinMarketCap — Top 500</p>
          </div>
        </div>
      </div>

      {/* Global Market Stats */}
      {globalMetrics && (
        <div className="fade-in-up stagger-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <div className="rounded-xl p-3 border kpi-bar-violet" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-violet-400" />
              <span className="text-[11px] text-muted-foreground">Crypto-monnaies</span>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">{globalMetrics.total_cryptocurrencies.toLocaleString('fr-FR')}</p>
          </div>
          <div className="rounded-xl p-3 border kpi-bar-cyan" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] text-muted-foreground">Exchanges</span>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">{globalMetrics.total_exchanges.toLocaleString('fr-FR')}</p>
          </div>
          <div className="rounded-xl p-3 border kpi-bar-emerald" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-[11px] text-muted-foreground">Cap. Marché</span>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">{fmtMarketCap(globalMetrics.total_market_cap)}</p>
          </div>
          <div className="rounded-xl p-3 border kpi-bar-amber" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] text-muted-foreground">Vol. 24h</span>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">{fmtVolume(globalMetrics.total_volume_24h)}</p>
          </div>
          <div className="rounded-xl p-3 border" style={{ background: 'var(--popover)', borderColor: 'var(--border)', borderTop: '3px solid #f59e0b' }}>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] text-muted-foreground">Dominance BTC</span>
            </div>
            <p className="text-lg font-bold text-foreground mt-1">{globalMetrics.btc_dominance.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl p-3 border" style={{ background: 'var(--popover)', borderColor: 'var(--border)', borderTop: '3px solid #627eea' }}>
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] text-muted-foreground">Fear & Greed</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-lg font-bold ${fgClass}`}>{fgValue}</span>
              <span className={`text-[10px] font-medium ${fgClass}`}>{fgLabel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fear & Greed + Market Cap Chart */}
      {fearGreed && (
        <div className="fade-in-up stagger-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fear & Greed Gauge */}
          <div className="rounded-2xl p-5 border" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-semibold text-foreground">Indice de Peur et Cupidité</h3>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="var(--border)" strokeWidth="12" strokeDasharray="401" strokeDashoffset="100" strokeLinecap="round" transform="rotate(135 100 100)" />
                  <circle cx="100" cy="100" r="85" fill="none" stroke={fgColor} strokeWidth="12" strokeDasharray="401" strokeDashoffset={401 - (fgValue / 100) * 301} strokeLinecap="round" transform="rotate(135 100 100)" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-bold ${fgClass}`}>{fgValue}</span>
                  <span className={`text-xs font-semibold ${fgClass} mt-1`}>{fgLabel}</span>
                </div>
              </div>
            </div>
            {/* History bar */}
            <div className="flex items-end gap-1 h-12">
              {fearGreed.history?.slice(0, 14).reverse().map((item, i) => {
                const h = Math.max(item.value * 0.4, 4)
                const c = item.value <= 25 ? '#ef4444' : item.value <= 45 ? '#f97316' : item.value <= 55 ? '#eab308' : item.value <= 75 ? '#84cc16' : '#10b981'
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-sm transition-all hover:scale-y-110" style={{ height: h, background: c, minHeight: 4, opacity: 0.6 + (i / 14) * 0.4 }} title={`${item.date}: ${item.value} (${item.classification})`} />
                    <span className="text-[8px] text-muted-foreground/50">{item.date.slice(8)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Market Cap Overview */}
          <div className="rounded-2xl p-5 border" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground">Top 10 par Capitalisation</h3>
            </div>
            <div className="space-y-2">
              {cmcTokens.slice(0, 10).map((t, i) => {
                const maxCap = cmcTokens[0]?.quote.USD.market_cap || 1
                const pct = (t.quote.USD.market_cap / maxCap) * 100
                const change24 = t.quote.USD.percent_change_24h
                return (
                  <div key={t.id} className="flex items-center gap-3 group">
                    <span className="text-[10px] text-muted-foreground w-4 text-right font-mono">{i + 1}</span>
                    <img src={CMC_LOGO_URL(t.id)} alt={t.symbol} className="w-5 h-5 rounded-full shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <span className="text-xs font-semibold text-foreground w-10">{t.symbol}</span>
                    <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'var(--input)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, #7c5cfc, #06b6d4)` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground w-16 text-right">{fmtMarketCap(t.quote.USD.market_cap)}</span>
                    <span className={`text-[10px] font-medium w-14 text-right ${changeColor(change24)}`}>{fmtChangePercent(change24)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="fade-in-up stagger-3">
        <TabsList className="w-full justify-start rounded-xl p-1 h-auto flex-wrap gap-1" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
          <TabsTrigger value="market" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
            <Activity className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Marché</span><span className="sm:hidden">Marché</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
            <Coins className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Top 500</span><span className="sm:hidden">500</span>
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
            <Building2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Exchanges</span><span className="sm:hidden">Exch.</span>
          </TabsTrigger>
          <TabsTrigger value="gainers" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Hausse</span><span className="sm:hidden">+24h</span>
          </TabsTrigger>
          <TabsTrigger value="losers" className="rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
            <TrendingDown className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Baisse</span><span className="sm:hidden">-24h</span>
          </TabsTrigger>
        </TabsList>

        {/* Market Overview Tab — Quick cards */}
        <TabsContent value="market" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cmcTokens.slice(0, 20).map((t) => {
              const change24 = t.quote.USD.percent_change_24h
              const change7d = t.quote.USD.percent_change_7d
              return (
                <div key={t.id} className="rounded-2xl p-4 border transition-all hover:border-violet-500/20 hover:shadow-lg hover:scale-[1.02] group card-hover-3d" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={CMC_LOGO_URL(t.id)} alt={t.symbol} className="w-10 h-10 rounded-full shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm">{t.symbol}</p>
                        <span className="text-[10px] text-muted-foreground/60">#{t.cmc_rank}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{t.name}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-base font-bold text-foreground">${fmtPrice(t.quote.USD.price)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Cap: {fmtMarketCap(t.quote.USD.market_cap)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${changeBg(change24)} ${changeColor(change24)}`}>
                        {change24 >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {fmtChangePercent(change24)}
                      </span>
                      <p className={`text-[10px] mt-1 ${changeColor(change7d)}`}>7j: {fmtChangePercent(change7d)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Top 500 Tokens Tab — Full Table */}
        <TabsContent value="tokens" className="mt-4 space-y-4">
          {/* Search + Count */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
              <Input
                value={tokenSearch}
                onChange={(e) => { setTokenSearch(e.target.value); setPage(1) }}
                placeholder="Rechercher par ticker ou nom..."
                className="border rounded-xl h-11 pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50"
                style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
              />
              {tokenSearch && (
                <button onClick={() => { setTokenSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{filteredTokens.length} cryptos trouvées</span>
          </div>

          {/* Token Table — scrollable on mobile */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr style={{ background: 'var(--input)' }}>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('cmc_rank')}>
                      # {sortField === 'cmc_rank' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3">Nom</th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('price')}>
                      Prix {sortField === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('change_1h')}>
                      1h {sortField === 'change_1h' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors" onClick={() => toggleSort('change_24h')}>
                      24h {sortField === 'change_24h' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors hidden md:table-cell" onClick={() => toggleSort('change_7d')}>
                      7j {sortField === 'change_7d' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell" onClick={() => toggleSort('market_cap')}>
                      Cap. Marché {sortField === 'market_cap' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 cursor-pointer hover:text-foreground transition-colors hidden lg:table-cell" onClick={() => toggleSort('volume_24h')}>
                      Vol. 24h {sortField === 'volume_24h' && (sortDir === 'asc' ? '↑' : '↓')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTokens.map((t, idx) => {
                    const q = t.quote.USD
                    return (
                      <tr key={t.id} className="data-row-hover border-t" style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--input)' }}>
                        <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{t.cmc_rank}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <img src={CMC_LOGO_URL(t.id)} alt={t.symbol} className="w-7 h-7 rounded-full shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                            <div>
                              <p className="text-sm font-semibold text-foreground">{t.symbol}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">{t.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-foreground">${fmtPrice(q.price)}</td>
                        <td className={`px-3 py-3 text-right text-xs font-medium ${changeColor(q.percent_change_1h)}`}>{fmtChangePercent(q.percent_change_1h)}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-md ${changeBg(q.percent_change_24h)} ${changeColor(q.percent_change_24h)}`}>
                            {fmtChangePercent(q.percent_change_24h)}
                          </span>
                        </td>
                        <td className={`px-3 py-3 text-right text-xs font-medium hidden md:table-cell ${changeColor(q.percent_change_7d)}`}>{fmtChangePercent(q.percent_change_7d)}</td>
                        <td className="px-3 py-3 text-right text-xs text-foreground/80 hidden lg:table-cell">{fmtMarketCap(q.market_cap)}</td>
                        <td className="px-3 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">{fmtVolume(q.volume_24h)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 text-xs">Précédent</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" onClick={() => setPage(pageNum)} className="h-8 w-8 text-xs p-0">
                      {pageNum}
                    </Button>
                  )
                })}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs">Suivant</Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Exchanges Tab */}
        <TabsContent value="exchanges" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
              <Input
                value={exchangeSearch}
                onChange={(e) => setExchangeSearch(e.target.value)}
                placeholder="Rechercher un exchange..."
                className="border rounded-xl h-11 pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50"
                style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
              />
              {exchangeSearch && (
                <button onClick={() => setExchangeSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{filteredExchanges.length} exchanges</span>
          </div>

          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr style={{ background: 'var(--input)' }}>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3">#</th>
                    <th className="text-left text-[11px] font-semibold text-muted-foreground px-3 py-3">Exchange</th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 hidden sm:table-cell">Paires</th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3">Vol. 24h</th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 hidden md:table-cell">Vol. 7j</th>
                    <th className="text-right text-[11px] font-semibold text-muted-foreground px-3 py-3 hidden lg:table-cell">Vol. 30j</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExchanges.map((e, idx) => {
                    const q = e.quote?.USD
                    return (
                      <tr key={e.id} className="data-row-hover border-t" style={{ borderColor: 'var(--border)', background: idx % 2 === 0 ? 'transparent' : 'var(--input)' }}>
                        <td className="px-3 py-3 text-xs text-muted-foreground font-mono">{e.rank || idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {e.logo ? (
                              <img src={e.logo} alt={e.name} className="w-7 h-7 rounded-full shrink-0" onError={(ev) => { (ev.target as HTMLImageElement).style.display = 'none' }} />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 text-[10px] font-bold shrink-0">
                                {e.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-foreground">{e.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-xs text-muted-foreground hidden sm:table-cell">{e.market_pairs || '—'}</td>
                        <td className="px-3 py-3 text-right text-xs font-medium text-foreground/80">{q ? fmtVolume(q.volume_24h) : '—'}</td>
                        <td className="px-3 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">{q ? fmtVolume(q.volume_7d) : '—'}</td>
                        <td className="px-3 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">{q ? fmtVolume(q.volume_30d) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Top Gainers Tab */}
        <TabsContent value="gainers" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">Top 50 des plus fortes hausses sur 24h</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...cmcTokens]
              .filter(t => t.quote?.USD?.percent_change_24h != null)
              .sort((a, b) => b.quote.USD.percent_change_24h - a.quote.USD.percent_change_24h)
              .slice(0, 50)
              .map((t) => {
                const change24 = t.quote.USD.percent_change_24h
                return (
                  <div key={t.id} className="rounded-2xl p-4 border transition-all hover:shadow-lg hover:scale-[1.02] group" style={{ background: 'var(--popover)', borderColor: 'rgba(16,185,129,0.2)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <img src={CMC_LOGO_URL(t.id)} alt={t.symbol} className="w-8 h-8 rounded-full shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{t.symbol}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{t.name}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">#{t.cmc_rank}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-bold text-foreground">${fmtPrice(t.quote.USD.price)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-400`}>
                        <TrendingUp className="w-3 h-3" />
                        {fmtChangePercent(change24)}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </TabsContent>

        {/* Top Losers Tab */}
        <TabsContent value="losers" className="mt-4 space-y-4">
          <p className="text-xs text-muted-foreground">Top 50 des plus fortes baisses sur 24h</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...cmcTokens]
              .filter(t => t.quote?.USD?.percent_change_24h != null)
              .sort((a, b) => a.quote.USD.percent_change_24h - b.quote.USD.percent_change_24h)
              .slice(0, 50)
              .map((t) => {
                const change24 = t.quote.USD.percent_change_24h
                return (
                  <div key={t.id} className="rounded-2xl p-4 border transition-all hover:shadow-lg hover:scale-[1.02] group" style={{ background: 'var(--popover)', borderColor: 'rgba(239,68,68,0.2)' }}>
                    <div className="flex items-center gap-3 mb-2">
                      <img src={CMC_LOGO_URL(t.id)} alt={t.symbol} className="w-8 h-8 rounded-full shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{t.symbol}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{t.name}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">#{t.cmc_rank}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-bold text-foreground">${fmtPrice(t.quote.USD.price)}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400`}>
                        <TrendingDown className="w-3 h-3" />
                        {fmtChangePercent(change24)}
                      </span>
                    </div>
                  </div>
                )
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================================
// PROFILE VIEW
// ============================================================
function ProfileView({ user, onUpgrade }: { user: any; onUpgrade: () => void }) {
  const isPremium = user?.role === 'user_premium'
  const isAdmin = user?.role === 'admin'
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Email change state
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)

  // Password change state
  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier est trop volumineux (max 2 Mo)')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Type de fichier non autorisé. Utilisez JPEG, PNG, GIF ou WebP.')
      return
    }
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const res = await fetch('/api/user/upload-avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setAvatarUrl(data.url + '?t=' + Date.now())
        toast.success('Photo de profil mise à jour')
        onUpgrade() // refresh session
      } else {
        toast.error(data.error || 'Erreur lors du téléchargement')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setAvatarUploading(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const displayAvatarUrl = avatarUrl || user?.image

  const handleUpdateEmail = async () => {
    if (!newEmail || !emailPassword) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    setEmailLoading(true)
    try {
      const res = await fetch('/api/user/update-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newEmail, currentPassword: emailPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Email mis à jour avec succès')
        setNewEmail('')
        setEmailPassword('')
        onUpgrade() // refresh session
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      toast.error('Veuillez remplir tous les champs')
      return
    }
    if (newPwd.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (newPwd !== confirmPwd) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setPwdLoading(true)
    try {
      const res = await fetch('/api/user/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: currentPwd, newPassword: newPwd }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Mot de passe mis à jour avec succès')
        setCurrentPwd('')
        setNewPwd('')
        setConfirmPwd('')
      } else {
        toast.error(data.error || 'Erreur lors de la mise à jour')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setPwdLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Veuillez entrer votre mot de passe')
      return
    }
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, currentPassword: deletePassword }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Compte supprimé. Déconnexion...')
        setTimeout(() => signOut({ redirect: false }), 1000)
      } else {
        toast.error(data.error || 'Erreur lors de la suppression')
      }
    } catch {
      toast.error('Erreur réseau')
    } finally {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl view-enter-cinematic">
      <div className="fade-in-up">
        <h1 className="text-xl sm:text-2xl font-bold gradient-shimmer-text">Profil & Abonnement</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gérez votre compte et votre abonnement</p>
      </div>

      {/* User Info */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="avatar-ring relative group cursor-pointer shrink-0" onClick={() => !avatarUploading && avatarInputRef.current?.click()}>
              {displayAvatarUrl ? (
                <img src={displayAvatarUrl} alt="Avatar" className="w-16 h-16 rounded-full object-cover" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }} />
              ) : (
                <div className="w-16 h-16 flex items-center justify-center text-foreground text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}>
                  {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                {avatarUploading ? <RefreshCw className="w-5 h-5 text-white animate-spin" /> : <Edit3 className="w-5 h-5 text-white" />}
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground/80">{user?.name || 'Utilisateur'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className={`mt-1.5 text-xs border ${
                isAdmin ? 'bg-violet-500/15 text-violet-400 border-violet-500/20' :
                isPremium ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                'bg-foreground/5 text-foreground/30 border-foreground/10'
              }`}>
                {isAdmin ? 'Administrateur' : isPremium ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Comparatif des plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className={`p-5 rounded-2xl border transition-all ${
              !isPremium && !isAdmin
                ? 'border-violet-500/30 glass-card'
                : ''
            }`} style={!isPremium && !isAdmin ? { background: 'rgba(124,92,252,0.05)' } : { background: 'var(--muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                  <User className="w-4 h-4 text-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground/70">Gratuit</h3>
              </div>
              <p className="text-2xl font-bold text-foreground/80 mb-4">0 €<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Accès au tableau de bord</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">3 tokens maximum</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">10 transactions maximum</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span className="text-muted-foreground/50">Pas de graphiques avancés</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span className="text-muted-foreground/50">Pas de métriques avancées</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span className="text-muted-foreground/50">Pas de Prédict AI</span></li>
              </ul>
              {!isPremium && !isAdmin && (
                <Badge className="mt-4 text-foreground border-0" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}>Plan actuel</Badge>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isPremium
                ? 'border-amber-500/30 glass-card'
                : ''
            }`} style={isPremium ? { background: 'rgba(245,158,11,0.05)' } : { background: 'var(--muted)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground/70">Premium</h3>
              </div>
              <p className="text-2xl font-bold text-foreground/80 mb-4">9,99 €<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Accès au tableau de bord</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Tokens illimités</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Transactions illimitées</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Graphiques d&apos;évolution</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-muted-foreground">Métriques avancées</span></li>
                <li className="flex items-center gap-2.5"><Sparkles className="w-4 h-4 text-violet-400 shrink-0" /> <span className="text-violet-400 font-medium">Prédict AI</span></li>
              </ul>
              {isPremium ? (
                <Badge className="mt-4 bg-amber-500 text-black border-0">Plan actuel</Badge>
              ) : !isAdmin ? (
                <Button
                  className="mt-4 rounded-xl text-black font-semibold shadow-lg transition-all active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
                  onClick={() => setShowUpgrade(true)}
                >
                  <Crown className="w-4 h-4 mr-2" /> Passer en Premium
                </Button>
              ) : null}
            </div>
          </div>
          {!isPremium && !isAdmin && (
            <div className="flex flex-col items-center mt-5 gap-3">
              <p className="text-xs text-muted-foreground">
                Débloquez l&apos;accès illimité pour {SUBSCRIPTION_PLANS[0].monthly.toFixed(2).replace('.', ',')} €/mois
              </p>
              <Button
                className="rounded-xl text-black font-semibold shadow-lg transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}
                onClick={() => setShowUpgrade(true)}
              >
                <Crown className="w-4 h-4 mr-2" /> Passer en Premium
              </Button>
            </div>
          )}

          {/* Upgrade Modal */}
          <UpgradePremiumModal
            open={showUpgrade}
            onOpenChange={setShowUpgrade}
            onSuccess={onUpgrade}
          />
        </CardContent>
      </Card>

      {/* Apparence — Theme Selection */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Monitor className="w-4 h-4" /> Apparence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Choisissez le thème de l&apos;application</p>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: 'light' as const, label: 'Clair', icon: Sun },
              { value: 'dark' as const, label: 'Sombre', icon: Moon },
              { value: 'system' as const, label: 'Système', icon: Monitor },
            ]).map(opt => {
              const isActive = theme === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300 ${
                    isActive
                      ? 'border-violet-500/50 shadow-[0_0_16px_rgba(124,92,252,0.15)]'
                      : 'border-transparent hover:border-foreground/10'
                  }`}
                  style={isActive ? { background: 'rgba(124,92,252,0.08)' } : { background: 'var(--muted)' }}
                >
                  <opt.icon className={`w-5 h-5 ${isActive ? 'text-violet-400' : 'text-foreground/40'}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-violet-400' : 'text-foreground/50'}`}>{opt.label}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }} />
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modifier l'email */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Mail className="w-4 h-4" /> Modifier l&apos;email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-xl border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
            <p className="text-xs text-muted-foreground mb-1">Email actuel</p>
            <p className="text-sm font-medium text-foreground/80">{user?.email}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Nouvel email</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nouveau@email.com"
              className="border rounded-xl h-10"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Mot de passe actuel</Label>
            <Input
              type="password"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="••••••••"
              className="border rounded-xl h-10"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
          </div>
          <Button
            onClick={handleUpdateEmail}
            disabled={emailLoading}
            className="w-full rounded-xl font-medium transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}
          >
            {emailLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
            Mettre à jour l&apos;email
          </Button>
        </CardContent>
      </Card>

      {/* Modifier le mot de passe */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" /> Modifier le mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Mot de passe actuel</Label>
            <Input
              type="password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              placeholder="••••••••"
              className="border rounded-xl h-10"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Nouveau mot de passe</Label>
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              className="border rounded-xl h-10"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Confirmer le nouveau mot de passe</Label>
            <Input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="••••••••"
              className="border rounded-xl h-10"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
            />
          </div>
          <Button
            onClick={handleUpdatePassword}
            disabled={pwdLoading}
            className="w-full rounded-xl font-medium transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}
          >
            {pwdLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
            Mettre à jour le mot de passe
          </Button>
        </CardContent>
      </Card>

      {/* Zone dangereuse */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-6 border-red-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Zone dangereuse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La suppression de votre compte est irréversible. Toutes vos données, y compris vos transactions, seront définitivement supprimées.
          </p>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-xl text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 font-medium transition-all"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer mon compte
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-xl border border-red-500/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
              <p className="text-sm font-medium text-red-400">Êtes-vous sûr ? Cette action est irréversible.</p>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Confirmez avec votre mot de passe</Label>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  className="border rounded-xl h-10 border-red-500/30 focus:border-red-500/50"
                  style={{ background: 'var(--input)' }}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword('') }}
                  className="flex-1 rounded-xl font-medium"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deletePassword}
                  className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-all active:scale-[0.98]"
                >
                  {deleteLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// ADMIN USERS VIEW
// ============================================================
function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) setUsers(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const updateRole = async (id: string, role: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role }),
      })
      if (res.ok) {
        toast.success('Rôle modifié')
        fetchUsers()
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleSuspend = async (id: string, suspended: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, suspended: !suspended }),
      })
      if (res.ok) {
        toast.success(suspended ? 'Compte réactivé' : 'Compte suspendu')
        fetchUsers()
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Supprimer définitivement ce compte ?')) return
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Compte supprimé')
        fetchUsers()
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-violet-400/50" /></div>

  return (
    <div className="space-y-6 page-transition">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold text-foreground/90">Gestion Utilisateurs</h1>
        <p className="mt-1 text-muted-foreground" >{users.length} comptes enregistrés</p>
      </div>

      {/* Desktop Table */}
      <Card className="glass-card rounded-2xl hidden md:block fade-in-up stagger-1">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'var(--border)' }}>
                  <TableHead className="text-muted-foreground">Utilisateur</TableHead>
                  <TableHead className="text-muted-foreground">Rôle</TableHead>
                  <TableHead className="text-center text-muted-foreground" >Transactions</TableHead>
                  <TableHead className="text-muted-foreground">Statut</TableHead>
                  <TableHead className="text-right text-muted-foreground" >Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="transition-colors" style={{ borderBottomColor: 'var(--border)' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-foreground text-xs font-bold" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.25), rgba(6,182,212,0.25))' }}>
                          {u.name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-foreground/70">{u.name || 'Sans nom'}</p>
                          <p className="text-xs text-muted-foreground" >{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="w-32 border text-foreground/60 rounded-xl h-9" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'var(--popover)', border: '1px solid var(--border)' }}>
                          <SelectItem value="user_free">Gratuit</SelectItem>
                          <SelectItem value="user_premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center text-foreground/40">{u._count.transactions}</TableCell>
                    <TableCell>
                      {u.suspended ? (
                        <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border">Suspendu</Badge>
                      ) : (
                        <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 border">Actif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSuspend(u.id, u.suspended)}
                          className={`rounded-xl h-8 text-xs ${
                            u.suspended
                              ? 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                              : 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                          }`}
                          style={u.suspended ? { background: 'rgba(16,185,129,0.05)' } : { background: 'rgba(245,158,11,0.05)' }}
                        >
                          {u.suspended ? 'Réactiver' : 'Suspendre'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-8 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10"
                          style={{ background: 'rgba(239,68,68,0.05)' }}
                          onClick={() => deleteUser(u.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 fade-in-up stagger-1">
        {users.map((u) => (
          <div key={u.id} className="glass-card rounded-2xl p-4 space-y-3 card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-foreground text-sm font-bold" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.25), rgba(6,182,212,0.25))' }}>
                  {u.name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-foreground/70">{u.name || 'Sans nom'}</p>
                  <p className="text-xs text-muted-foreground" >{u.email}</p>
                </div>
              </div>
              {u.suspended ? (
                <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border text-xs">Suspendu</Badge>
              ) : (
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 border text-xs">Actif</Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground/50" >Rôle</p>
                <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                  <SelectTrigger className="w-full border text-foreground/60 rounded-xl h-9 text-xs mt-1" style={{ background: 'var(--input)', borderColor: 'var(--border)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'var(--popover)', border: '1px solid var(--border)' }}>
                    <SelectItem value="user_free">Gratuit</SelectItem>
                    <SelectItem value="user_premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/50" >Transactions</p>
                <p className="text-foreground/40 mt-1 font-mono">{u._count.transactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSuspend(u.id, u.suspended)}
                className={`rounded-xl h-8 text-xs flex-1 ${
                  u.suspended
                    ? 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                    : 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                }`}
                style={u.suspended ? { background: 'rgba(16,185,129,0.05)' } : { background: 'rgba(245,158,11,0.05)' }}
              >
                {u.suspended ? 'Réactiver' : 'Suspendre'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-8 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 flex-1"
                style={{ background: 'rgba(239,68,68,0.05)' }}
                onClick={() => deleteUser(u.id)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// ADMIN TOKENS VIEW
// ============================================================
function AdminTokensView() {
  const [tokens, setTokens] = useState<AdminToken[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newToken, setNewToken] = useState({ ticker: '', name: '', coingeckoId: '', cryptoCompareId: '' })

  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/tokens')
      if (res.ok) setTokens(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  const addToken = async () => {
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newToken),
      })
      if (res.ok) {
        toast.success('Token ajouté')
        setAddOpen(false)
        setNewToken({ ticker: '', name: '', coingeckoId: '', cryptoCompareId: '' })
        fetchTokens()
      } else {
        const err = await res.json()
        toast.error(err.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch('/api/admin/tokens', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      toast.success(active ? 'Token désactivé' : 'Token activé')
      fetchTokens()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-violet-400/50" /></div>

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground/90">Gestion des Tokens</h1>
          <p className="mt-1 text-muted-foreground" >{tokens.length} tokens configurés</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-10 shadow-lg text-foreground transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Ajouter un Token
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl dialog-mobile-fullscreen text-foreground" style={{ background: 'var(--popover)', backdropFilter: 'blur(30px)', border: '1px solid var(--border)' }}>
            <DialogHeader>
              <DialogTitle className="text-foreground/90">Nouveau Token</DialogTitle>
              <DialogDescription className="sr-only">Formulaire d\'ajout d\'un nouveau token</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" >Ticker</Label>
                  <Input
                    value={newToken.ticker}
                    onChange={e => setNewToken({ ...newToken, ticker: e.target.value.toUpperCase() })}
                    placeholder="BTC"
                    className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11"
                    style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" >Nom</Label>
                  <Input
                    value={newToken.name}
                    onChange={e => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="Bitcoin"
                    className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11"
                    style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground" >CoinGecko ID</Label>
                <Input
                  value={newToken.coingeckoId}
                  onChange={e => setNewToken({ ...newToken, coingeckoId: e.target.value })}
                  placeholder="bitcoin"
                  className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground" >CryptoCompare ID</Label>
                <Input
                  value={newToken.cryptoCompareId}
                  onChange={e => setNewToken({ ...newToken, cryptoCompareId: e.target.value })}
                  placeholder="BTC"
                  className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                />
              </div>
              <Button onClick={addToken} className="w-full rounded-xl shadow-lg text-foreground transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table */}
      <Card className="glass-card rounded-2xl hidden md:block fade-in-up stagger-1">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'var(--border)' }}>
                  <TableHead className="text-muted-foreground">Ticker</TableHead>
                  <TableHead className="text-muted-foreground">Nom</TableHead>
                  <TableHead className="text-muted-foreground">CoinGecko ID</TableHead>
                  <TableHead className="text-right text-muted-foreground" >Prix Actuel</TableHead>
                  <TableHead className="text-center text-muted-foreground" >Transactions</TableHead>
                  <TableHead className="text-center text-muted-foreground" >Statut</TableHead>
                  <TableHead className="text-right text-muted-foreground" >Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id} className="transition-colors" style={{ borderBottomColor: 'var(--border)' }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TokenLogo ticker={t.ticker} size={28} />
                        <Badge variant="outline" className="font-bold border-foreground/10 text-foreground/70">{t.ticker}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground/60">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground" >{t.coingeckoId || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-foreground/60">
                      {t.currentPrice ? fmt(t.currentPrice) + ' $' : '—'}
                    </TableCell>
                    <TableCell className="text-center text-foreground/40">{t._count.transactions}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={t.active}
                          onCheckedChange={() => toggleActive(t.id, t.active)}
                          className={`${t.active ? 'bg-emerald-500' : 'bg-white/10'}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(t.id, t.active)}
                        className={`rounded-xl h-8 text-xs ${
                          t.active
                            ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                            : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                        style={t.active ? { background: 'rgba(239,68,68,0.05)' } : { background: 'rgba(16,185,129,0.05)' }}
                      >
                        {t.active ? 'Désactiver' : 'Activer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 fade-in-up stagger-1">
        {tokens.map((t) => (
          <div key={t.id} className="glass-card rounded-2xl p-4 space-y-3 card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TokenLogo ticker={t.ticker} size={40} />
                <div>
                  <p className="font-semibold text-foreground/80">{t.ticker}</p>
                  <p className="text-xs text-muted-foreground" >{t.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={t.active}
                  onCheckedChange={() => toggleActive(t.id, t.active)}
                  className={`${t.active ? 'bg-emerald-500' : 'bg-white/10'}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground/50" >Prix</p>
                <p className="text-foreground/60 font-mono">{t.currentPrice ? fmt(t.currentPrice) + ' $' : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground/50" >Transactions</p>
                <p className="text-foreground/40 font-mono">{t._count.transactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              {t.active ? (
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 border text-xs">Actif</Badge>
              ) : (
                <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border text-xs">Inactif</Badge>
              )}
              {t.coingeckoId && (
                <span className="text-xs font-mono" style={{ color: 'var(--muted-foreground)' }}>{t.coingeckoId}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// ADMIN EXCHANGES VIEW
// ============================================================
function AdminExchangesView() {
  const [exchanges, setExchanges] = useState<AdminExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')

  const fetchExchanges = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/exchanges')
      if (res.ok) setExchanges(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchExchanges() }, [fetchExchanges])

  const addExchange = async () => {
    try {
      const res = await fetch('/api/admin/exchanges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })
      if (res.ok) {
        toast.success('Exchange ajouté')
        setAddOpen(false)
        setNewName('')
        fetchExchanges()
      } else {
        const err = await res.json()
        toast.error(err.error)
      }
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await fetch('/api/admin/exchanges', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      })
      toast.success(active ? 'Exchange désactivé' : 'Exchange activé')
      fetchExchanges()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-violet-400/50" /></div>

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground/90">Gestion des Exchanges</h1>
          <p className="mt-1 text-muted-foreground" >{exchanges.length} plateformes configurées</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-10 shadow-lg text-foreground transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Ajouter un Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl dialog-mobile-fullscreen text-foreground" style={{ background: 'var(--popover)', backdropFilter: 'blur(30px)', border: '1px solid var(--border)' }}>
            <DialogHeader>
              <DialogTitle className="text-foreground/90">Nouvel Exchange</DialogTitle>
              <DialogDescription className="sr-only">Formulaire d\'ajout d\'un nouvel exchange</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground" >Nom</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="BINANCE"
                  className="border text-foreground placeholder:text-muted-foreground/50 rounded-xl h-11"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                />
              </div>
              <Button onClick={addExchange} className="w-full rounded-xl shadow-lg text-foreground transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Table */}
      <Card className="glass-card rounded-2xl hidden md:block fade-in-up stagger-1">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'var(--border)' }}>
                  <TableHead className="text-muted-foreground">Nom</TableHead>
                  <TableHead className="text-center text-muted-foreground" >Transactions</TableHead>
                  <TableHead className="text-center text-muted-foreground" >Statut</TableHead>
                  <TableHead className="text-right text-muted-foreground" >Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchanges.map((e) => (
                  <TableRow key={e.id} className="transition-colors" style={{ borderBottomColor: 'var(--border)' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ExchangeLogo name={e.name} size={32} />
                        <span className="font-semibold text-foreground/70">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-foreground/40">{e._count.transactions}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Switch
                          checked={e.active}
                          onCheckedChange={() => toggleActive(e.id, e.active)}
                          className={`${e.active ? 'bg-emerald-500' : 'bg-white/10'}`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(e.id, e.active)}
                        className={`rounded-xl h-8 text-xs ${
                          e.active
                            ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                            : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                        }`}
                        style={e.active ? { background: 'rgba(239,68,68,0.05)' } : { background: 'rgba(16,185,129,0.05)' }}
                      >
                        {e.active ? 'Désactiver' : 'Activer'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 fade-in-up stagger-1">
        {exchanges.map((e) => (
          <div key={e.id} className="glass-card rounded-2xl p-4 card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ExchangeLogo name={e.name} size={40} />
                <div>
                  <p className="font-semibold text-foreground/80">{e.name}</p>
                  <p className="text-xs text-muted-foreground" >{e._count.transactions} transactions</p>
                </div>
              </div>
              <Switch
                checked={e.active}
                onCheckedChange={() => toggleActive(e.id, e.active)}
                className={`${e.active ? 'bg-emerald-500' : 'bg-white/10'}`}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {e.active ? (
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 border text-xs">Actif</Badge>
              ) : (
                <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border text-xs">Inactif</Badge>
              )}
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive(e.id, e.active)}
                className={`rounded-xl h-8 text-xs ${
                  e.active
                    ? 'text-red-400 border-red-500/20 hover:bg-red-500/10'
                    : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                }`}
                style={e.active ? { background: 'rgba(239,68,68,0.05)' } : { background: 'rgba(16,185,129,0.05)' }}
              >
                {e.active ? 'Désactiver' : 'Activer'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// AI ANALYSIS VIEW — AI-POWERED MARKET ANALYSIS
// ============================================================
interface AIAnalysisResult {
  signal: 'ACHAT' | 'VENTE' | 'NEUTRE'
  confidence: number
  summary: string
  technicalAnalysis: {
    trend: string
    supportLevel: string
    resistanceLevel: string
    rsiApprox: string
    volume24h: string
  }
  sentiment: {
    fearGreedIndex: number
    fearGreedLabel: string
    interpretation: string
  }
  newsImpact?: string
  newsItems?: { title: string; snippet: string; source: string; date: string }[]
  keyFactors: string[]
  risks: string[]
  disclaimer: string
  chartData?: { time: string; price: number; open: number; high: number; low: number; volume: number }[]
  currentPrice?: number
  priceChangePct24h?: number
}

interface AnalysisHistoryEntry {
  ticker: string
  name: string
  timestamp: number
  signal: string
  confidence: number
  summary: string
}

function AIAnalysisView({ user }: { user: any }) {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [selectedTicker, setSelectedTicker] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showTokenDropdown, setShowTokenDropdown] = useState(false)
  const tokenSearchRef = useRef<HTMLDivElement>(null)

  // Load tokens, prices and history
  useEffect(() => {
    const loadData = async () => {
      try {
        const [tokensRes, pricesRes] = await Promise.all([
          fetch('/api/tokens'),
          fetch('/api/prices'),
        ])
        if (tokensRes.ok) {
          const tokensData = await tokensRes.json()
          setTokens(tokensData.filter((t: TokenData) => t.active))
          if (tokensData.length > 0 && !selectedTicker) {
            setSelectedTicker(tokensData[0].ticker)
          }
        }
        if (pricesRes.ok) {
          setPrices(await pricesRes.json())
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      }
    }
    loadData()
    // Load history from localStorage
    try {
      const saved = localStorage.getItem('cf_ai_history')
      if (saved) setHistory(JSON.parse(saved))
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tokenSearchRef.current && !tokenSearchRef.current.contains(e.target as Node)) {
        setShowTokenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredTokens = tokens.filter(t => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return t.ticker.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
  })

  const selectedToken = tokens.find(t => t.ticker === selectedTicker)

  const saveToHistory = (ticker: string, name: string, result: AIAnalysisResult) => {
    const entry: AnalysisHistoryEntry = {
      ticker,
      name,
      timestamp: Date.now(),
      signal: result.signal,
      confidence: result.confidence,
      summary: result.summary,
    }
    const newHistory = [entry, ...history].slice(0, 20)
    setHistory(newHistory)
    try { localStorage.setItem('cf_ai_history', JSON.stringify(newHistory)) } catch {}
  }

  const runAnalysis = async () => {
    if (!selectedTicker) return
    setLoading(true)
    setError('')
    setAnalysis(null)

    try {
      const token = tokens.find(t => t.ticker === selectedTicker)
      const res = await fetch('/api/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedTicker,
          name: token?.name || selectedTicker,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erreur lors de l\'analyse')
      }

      const data = await res.json()
      setAnalysis(data)
      saveToHistory(selectedTicker, token?.name || selectedTicker, data)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse Prédict AI')
    } finally {
      setLoading(false)
    }
  }

  const signalConfig = (signal: string) => {
    switch (signal) {
      case 'ACHAT': return { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]' }
      case 'VENTE': return { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.15)]' }
      default: return { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.15)]' }
    }
  }

  const signalIcon = (signal: string, size = 8) => {
    switch (signal) {
      case 'ACHAT': return <ArrowUpCircle className={`w-${size} h-${size} text-emerald-400`} />
      case 'VENTE': return <ArrowDownCircle className={`w-${size} h-${size} text-red-400`} />
      default: return <Gauge className={`w-${size} h-${size} text-amber-400`} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative breathe" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(124,92,252,0.2)', boxShadow: '0 0 20px rgba(124,92,252,0.1)' }}>
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">Prédict AI</h1>
              <p className="text-sm text-muted-foreground">L&apos;IA analyse le marché pour vous aider à décider</p>
            </div>
          </div>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className="text-foreground/30 hover:text-foreground/60 hover:bg-foreground/5 rounded-xl">
              <Activity className="w-4 h-4 mr-1" />
              <span className="text-xs">Historique ({history.length})</span>
            </Button>
          )}
        </div>
      </ScrollReveal>

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <ScrollReveal>
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.2), transparent)' }} />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-foreground/60 uppercase tracking-wider">Historique des analyses</h3>
              <Button variant="ghost" size="sm" onClick={() => { setHistory([]); try { localStorage.removeItem('cf_ai_history') } catch {} }} className="text-red-400/50 hover:text-red-400 h-6 text-[10px] hover:bg-red-500/10">
                Effacer
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {history.map((h, i) => (
                <button key={i} onClick={() => { setSelectedTicker(h.ticker); setShowHistory(false) }} className="w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left group hover:border-violet-500/20" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                  <TokenLogo ticker={h.ticker} size={24} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground/70">{h.ticker}</span>
                      <Badge className={`${signalConfig(h.signal).bg} ${signalConfig(h.signal).text} text-[9px] px-1.5 py-0`}>{h.signal}</Badge>
                    </div>
                    <p className="text-[10px] text-foreground/25 truncate mt-0.5">{h.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold ${signalConfig(h.signal).text}`}>{h.confidence}%</p>
                    <p className="text-[9px] text-foreground/20">{new Date(h.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* Disclaimer banner */}
      <ScrollReveal>
        <div className="rounded-xl p-4 border flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Assistance, pas conseil financier</p>
            <p className="text-xs mt-1 text-muted-foreground">L&apos;IA vous aide à analyser les données techniques et l&apos;actualité du marché. Vous prenez la décision finale. Ceci ne constitue pas un conseil en investissement.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Token selector - Searchable Combobox */}
      <ScrollReveal>
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' }} />

          <Label className="text-xs font-medium text-muted-foreground mb-3 block">Sélectionnez un token à analyser</Label>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 relative" ref={tokenSearchRef}>
              {selectedToken && !showTokenDropdown ? (
                <div
                  className="flex items-center gap-3 border rounded-xl h-12 px-4 cursor-pointer transition-colors hover:border-violet-500/30"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                  onClick={() => { setShowTokenDropdown(true); setSearchQuery('') }}
                >
                  <TokenLogo ticker={selectedToken.ticker} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground/90">{selectedToken.ticker}</span>
                      <span className="text-foreground/35 text-xs truncate">{selectedToken.name}</span>
                    </div>
                    {prices[selectedToken.ticker] != null && (
                      <span className="text-foreground/50 text-xs">${fmtPrice(prices[selectedToken.ticker])}</span>
                    )}
                  </div>
                  <button
                    className="ml-2 p-1 rounded-lg text-foreground/25 hover:text-foreground/60 hover:bg-foreground/5 transition-all"
                    onClick={(e) => { e.stopPropagation(); setSelectedTicker(''); setSearchQuery(''); setShowTokenDropdown(true) }}
                    title="Désélectionner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowTokenDropdown(true) }}
                    onFocus={() => setShowTokenDropdown(true)}
                    placeholder="Rechercher un token (ticker ou nom)..."
                    className="w-full border rounded-xl h-12 pl-10 pr-3 text-foreground placeholder:text-muted-foreground/50"
                    style={{ background: 'var(--input)', borderColor: 'var(--border)' }}
                    autoFocus
                  />
                </div>
              )}
              {showTokenDropdown && (
                <div className="absolute z-50 top-14 left-0 right-0 max-h-72 overflow-y-auto rounded-xl border shadow-xl custom-scrollbar" style={{ background: 'var(--popover)', borderColor: 'var(--border)' }}>
                  {filteredTokens.length === 0 ? (
                    <div className="px-4 py-6 text-sm text-muted-foreground/50 text-center">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-30" />
                      Aucun token trouvé
                    </div>
                  ) : (
                    filteredTokens.map(t => (
                      <button
                        key={t.ticker}
                        onClick={() => { setSelectedTicker(t.ticker); setShowTokenDropdown(false); setSearchQuery('') }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-violet-500/10 ${selectedTicker === t.ticker ? 'bg-violet-500/5' : ''}`}
                      >
                        <TokenLogo ticker={t.ticker} size={28} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground/90 text-sm">{t.ticker}</span>
                            <span className="text-foreground/35 text-xs truncate">{t.name}</span>
                          </div>
                        </div>
                        <span className="text-foreground/30 text-xs font-medium shrink-0">
                          {prices[t.ticker] != null ? `$${fmtPrice(prices[t.ticker])}` : '—'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={runAnalysis}
              disabled={loading || !selectedTicker}
              className="btn-primary-glow btn-ripple text-foreground rounded-xl h-12 px-6 w-full sm:w-auto font-medium transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? 'Analyse...' : 'Analyser'}
            </Button>
          </div>

          {/* Selected token quick info */}
          {selectedTicker && (
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <TokenLogo ticker={selectedTicker} size={16} />
              <span className="font-medium">{selectedTicker}</span>
              {prices[selectedTicker] != null ? (
                <span className="text-foreground/50 font-medium">${fmtPrice(prices[selectedTicker])}</span>
              ) : (
                <span className="text-foreground/25">Prix non disponible</span>
              )}
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Loading animation */}
      {loading && (
        <div className="fade-in-up">
          <div className="rounded-2xl p-8 relative overflow-hidden flex flex-col items-center justify-center gap-4" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,92,252,0.1)' }}>
                <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl orbit" style={{ animationDuration: '3s', border: '2px solid transparent', borderTopColor: 'rgba(124,92,252,0.5)', borderRightColor: 'rgba(6,182,212,0.3)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground/60">L&apos;IA analyse le marché...</p>
              <p className="text-xs text-foreground/25 mt-1">Données techniques, sentiment, actualités</p>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="fade-in-up flex items-center gap-2 text-red-400 text-sm p-4 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <div className="space-y-4 fade-in-up">
          {/* 24h Price Chart */}
          {analysis.chartData && analysis.chartData.length > 0 && (
            <ScrollReveal>
              <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' }} />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-400" />
                    <h3 className="text-sm font-semibold text-foreground/80">Prix 24h</h3>
                  </div>
                  {(analysis.currentPrice || analysis.priceChangePct24h !== undefined) && (
                    <div className="flex items-center gap-2">
                      {analysis.currentPrice && <span className="text-sm font-bold text-foreground">${fmtPrice(analysis.currentPrice)}</span>}
                      {analysis.priceChangePct24h !== undefined && (
                        <Badge className={`${analysis.priceChangePct24h >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'} text-[10px] px-1.5 py-0`}>
                          {analysis.priceChangePct24h >= 0 ? '+' : ''}{analysis.priceChangePct24h.toFixed(2)}%
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <defs>
                        <linearGradient id="aiChartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={analysis.priceChangePct24h !== undefined && analysis.priceChangePct24h < 0 ? "#ef4444" : "#7c5cfc"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={analysis.priceChangePct24h !== undefined && analysis.priceChangePct24h < 0 ? "#ef4444" : "#7c5cfc"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={60} tickFormatter={(v: number) => '$' + fmtPrice(v)} />
                      <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '11px', color: 'var(--foreground)' }} formatter={(value: number) => ['$' + fmtPrice(value), 'Prix']} labelStyle={{ color: 'var(--muted-foreground)' }} />
                      <Area type="monotone" dataKey="price" stroke={analysis.priceChangePct24h !== undefined && analysis.priceChangePct24h < 0 ? "#ef4444" : "#7c5cfc"} strokeWidth={2} fill="url(#aiChartGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Signal Card */}
          <ScrollReveal direction="scale">
            <div className={`rounded-2xl p-6 border relative overflow-hidden glass-card ${signalConfig(analysis.signal).glow}`}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' }} />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {signalIcon(analysis.signal)}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground" >Signal</p>
                    <p className={`text-2xl font-bold ${signalConfig(analysis.signal).text}`}>
                      {analysis.signal}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-muted-foreground" >Confiance</p>
                  <p className={`text-2xl font-bold ${signalConfig(analysis.signal).text}`}>
                    {analysis.confidence}%
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="w-full h-2 rounded-full mb-4" style={{ background: 'var(--muted)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${analysis.confidence}%`,
                    background: analysis.signal === 'ACHAT' ? 'linear-gradient(90deg, #10b981, #34d399)' : analysis.signal === 'VENTE' ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    boxShadow: `0 0 10px ${analysis.signal === 'ACHAT' ? 'rgba(16,185,129,0.3)' : analysis.signal === 'VENTE' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                  }}
                />
              </div>

              <p className="text-sm leading-relaxed text-foreground/60">{analysis.summary}</p>
            </div>
          </ScrollReveal>

          {/* Technical Analysis + Sentiment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Technical */}
            <ScrollReveal direction="left">
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-foreground/80">Analyse Technique</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Tendance', value: analysis.technicalAnalysis.trend },
                    { label: 'Support', value: analysis.technicalAnalysis.supportLevel },
                    { label: 'Resistance', value: analysis.technicalAnalysis.resistanceLevel },
                    { label: 'RSI (approx.)', value: analysis.technicalAnalysis.rsiApprox },
                    { label: 'Volume 24h', value: analysis.technicalAnalysis.volume24h },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground" >{item.label}</span>
                      <span className="text-xs font-medium text-foreground/70">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Sentiment */}
            <ScrollReveal direction="left">
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-foreground/80">Sentiment du Marche</h3>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={analysis.sentiment.fearGreedIndex <= 25 ? '#ef4444' : analysis.sentiment.fearGreedIndex <= 45 ? '#f97316' : analysis.sentiment.fearGreedIndex <= 55 ? '#f59e0b' : analysis.sentiment.fearGreedIndex <= 75 ? '#10b981' : '#06b6d4'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(analysis.sentiment.fearGreedIndex / 100) * 251.3} 251.3`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-foreground">{analysis.sentiment.fearGreedIndex}</span>
                      <span className="text-[9px] text-muted-foreground" >F&amp;G</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Badge className={`${analysis.sentiment.fearGreedIndex <= 25 ? 'bg-red-500/15 text-red-400 border-red-500/30' : analysis.sentiment.fearGreedIndex <= 45 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : analysis.sentiment.fearGreedIndex <= 55 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : analysis.sentiment.fearGreedIndex <= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'} text-xs`}>
                      {analysis.sentiment.fearGreedLabel}
                    </Badge>
                    <p className="text-xs mt-2 text-muted-foreground" >{analysis.sentiment.interpretation}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* News Impact + News Items */}
          {(analysis.newsImpact || (analysis.newsItems && analysis.newsItems.length > 0)) && (
            <ScrollReveal>
              <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.3), rgba(124,92,252,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-foreground/80">Impact des Actualites</h3>
                </div>
                {analysis.newsImpact && (
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>{analysis.newsImpact}</p>
                )}
                {analysis.newsItems && analysis.newsItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground" >Dernieres actualites</p>
                    {analysis.newsItems.map((news, i) => (
                      <div key={i} className="rounded-xl p-3 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(6,182,212,0.1)', color: 'rgba(6,182,212,0.8)' }}>{i + 1}</div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground/60 truncate">{news.title}</p>
                            <p className="text-[10px] mt-0.5 leading-relaxed text-muted-foreground" >{news.snippet}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {news.source && <span className="text-[9px] text-muted-foreground/50" >{news.source}</span>}
                              {news.date && <span className="text-[9px] text-muted-foreground/40" >{news.date}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          )}

          {/* Key Factors & Risks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Key Factors */}
            <ScrollReveal>
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-foreground/80">Facteurs Cles a Suivre</h3>
                </div>
                <div className="space-y-2">
                  {analysis.keyFactors.map((factor, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,0.8)' }}>{i + 1}</div>
                      <p className="text-xs leading-relaxed text-muted-foreground" >{factor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Risks */}
            <ScrollReveal>
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'var(--popover)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-foreground/80">Risques Identifies</h3>
                </div>
                <div className="space-y-2">
                  {analysis.risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.8)' }}>{i + 1}</div>
                      <p className="text-xs leading-relaxed text-muted-foreground" >{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Disclaimer */}
          <ScrollReveal>
            <div className="rounded-xl p-4 border text-center" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
              <p className="text-[11px] leading-relaxed text-muted-foreground">{analysis.disclaimer}</p>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && !error && (
        <ScrollReveal direction="scale">
          <div className="rounded-2xl p-10 relative overflow-hidden flex flex-col items-center justify-center text-center glass-card">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 breathe" style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}>
              <Brain className="w-10 h-10 text-violet-400/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground/60 mb-2">L&apos;IA est prete a analyser</h3>
            <p className="text-sm max-w-md text-muted-foreground" >
              Selectionnez un token et lancez l&apos;analyse. L&apos;IA etudiera les indicateurs techniques, le sentiment du marche, les actualites et les facteurs cles pour vous fournir une analyse claire.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50" >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Technique</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50" >
                <Gauge className="w-3.5 h-3.5" />
                <span>Sentiment</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50" >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Actualites</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/50" >
                <Eye className="w-3.5 h-3.5" />
                <span>Facteurs cles</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}
    </div>
  )
}

// ============================================================
// MAIN APP
// ============================================================
export function CryptoApp() {
  const { user, loading, login, register, logout } = useAuth()
  const { update: updateSession } = useSession()
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [seeded, setSeeded] = useState(false)
  const ts = useThemeStyles()

  const refreshSession = useCallback(async () => {
    await updateSession({})
  }, [updateSession])

  // Persist & restore current view from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cf_view') as View | null
    if (saved && saved !== currentView) {
      setCurrentView(saved)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem('cf_view', currentView)
  }, [currentView])

  // Seed DB on first load
  useEffect(() => {
    if (!seeded) {
      fetch('/api/seed', { method: 'POST' }).then(() => setSeeded(true)).catch(() => setSeeded(true))
    }
  }, [seeded])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-background">
        <ParticleField />
        <div className="flex flex-col items-center gap-5">
          {/* Orbit animation around wallet icon */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center float-animation" style={{ background: ts.logoBg, borderColor: ts.logoBorder }}>
                <Wallet className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            {/* Orbiting dot */}
            <div className="absolute inset-0 orbit" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 glow-dot" />
            </div>
            {/* Second orbiting dot */}
            <div className="absolute inset-0 orbit-reverse" style={{ animationDuration: '4s' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: `0 0 8px ${ts.isDark ? 'rgba(6,182,212,0.5)' : 'rgba(8,145,178,0.5)'}` }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-400/50" />
            <span className="text-sm text-foreground/30 font-medium">Chargement...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />
  }

  const isAdmin = user?.role === 'admin'

  const renderView = () => {
    // Admin section uses tabs
    if (currentView === 'admin-users' || currentView === 'admin-tokens' || currentView === 'admin-exchanges' || currentView === 'admin-pricing') {
      if (!isAdmin) return <DashboardView user={user} onUpgrade={() => setShowUpgrade(true)} />
      return (
    <div className="space-y-4 sm:space-y-6 page-transition view-enter-cinematic">
          <div className="fade-in-up">
            <h1 className="text-lg sm:text-2xl font-bold gradient-shimmer-text">Administration</h1>
            <p className="mt-1 text-muted-foreground">Gérez les utilisateurs, tokens, exchanges et tarifs</p>
          </div>
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as View)} className="fade-in-up stagger-1">
            <TabsList className="w-full justify-start rounded-xl p-1 h-auto flex-wrap overflow-x-auto" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
              <TabsTrigger value="admin-users" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">Utilisateurs</TabsTrigger>
              <TabsTrigger value="admin-tokens" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">Tokens</TabsTrigger>
              <TabsTrigger value="admin-exchanges" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">Exchanges</TabsTrigger>
              <TabsTrigger value="admin-pricing" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">Tarifs</TabsTrigger>
            </TabsList>
            <TabsContent value="admin-users" className="mt-6">
              <AdminUsersView />
            </TabsContent>
            <TabsContent value="admin-tokens" className="mt-6">
              <AdminTokensView />
            </TabsContent>
            <TabsContent value="admin-exchanges" className="mt-6">
              <AdminExchangesView />
            </TabsContent>
            <TabsContent value="admin-pricing" className="mt-6">
              <AdminPricingView />
            </TabsContent>
          </Tabs>
        </div>
      )
    }

    switch (currentView) {
      case 'dashboard': return <DashboardView user={user} onUpgrade={() => setShowUpgrade(true)} />
      case 'transactions': return <TransactionsView user={user} onUpgrade={() => setShowUpgrade(true)} />
      case 'ai-analysis': {
        const isPremiumOrAdmin = user?.role === 'user_premium' || user?.role === 'admin'
        if (!isPremiumOrAdmin) {
          return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6 fade-in-up">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ts.premiumBg}, rgba(249,115,22,0.1))`, border: `1px solid ${ts.premiumBorder}` }}>
                <Crown className="w-10 h-10 text-amber-400" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground/80">Prédict AI — Premium</h2>
                <p className="text-sm text-muted-foreground max-w-md">Prédict AI est réservé aux membres Premium. Passez en Premium pour débloquer cette fonctionnalité.</p>
              </div>
              <Button
                className="rounded-xl text-black font-semibold shadow-lg transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: ts.premiumBtnShadow }}
                onClick={() => setShowUpgrade(true)}
              >
                <Crown className="w-4 h-4 mr-2" /> Passer en Premium
              </Button>
            </div>
          )
        }
        return <AIAnalysisView user={user} />
      }
      case 'explorer': return <ExplorerView />
      case 'profile': return <ProfileView user={user} onUpgrade={refreshSession} />
      default: return <DashboardView user={user} onUpgrade={() => setShowUpgrade(true)} />
    }
  }

  return (
    <div className="flex min-h-screen relative noise-overlay mesh-gradient bg-background">
      <AmbientBackground />
      <ParticleField />
      <MouseGlow />
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 p-3 sm:p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto view-enter-cinematic" key={currentView}>
          {renderView()}
        </div>
      </main>
      <BottomNav
        currentView={currentView}
        setView={setCurrentView}
        user={user}
      />

      {/* Global Upgrade Modal (accessible from TransactionsView freemium banner) */}
      <UpgradePremiumModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        onSuccess={refreshSession}
      />
    </div>
  )
}
