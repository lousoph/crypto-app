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
  Search, Activity, Zap, Eye, Gauge, ShoppingCart, Tag, ArrowUpCircle, ArrowDownCircle, Sparkles, Brain, MessageSquare
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

// ============================================================
// TYPES
// ============================================================
type View = 'dashboard' | 'transactions' | 'ai-analysis' | 'profile' | 'admin-users' | 'admin-tokens' | 'admin-exchanges'

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

const plColor = (v: number) => v >= 0 ? 'text-emerald-400' : 'text-red-400'
const plBg = (v: number) => v >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10'

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
const EXCHANGE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  BINANCE:  { bg: '#F0B90B', text: '#1E1E1E', icon: 'BN' },
  BYBIT:   { bg: '#F7A600', text: '#1E1E1E', icon: 'BY' },
  COINBASE:{ bg: '#0052FF', text: '#FFFFFF', icon: 'CB' },
  KRAKEN:  { bg: '#7B61FF', text: '#FFFFFF', icon: 'KR' },
  OKX:     { bg: '#1A1A2E', text: '#FFFFFF', icon: 'OK' },
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
  const style = EXCHANGE_STYLES[name.toUpperCase()] || { bg: '#7c5cfc', text: '#FFFFFF', icon: name.slice(0, 2) }
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
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })
      if (!result?.ok) throw new Error('Inscription réussie mais connexion échouée')
      return true
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
  onRegister: (email: string, password: string, name: string) => Promise<void>
}) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isRegister) {
        await onRegister(email, password, name)
        toast.success('Compte créé avec succès !')
      } else {
        const ok = await onLogin(email, password)
        if (!ok) setError('Email ou mot de passe incorrect')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
  }

  // Check which OAuth providers are available
  const hasGoogle = !!(process.env.NEXT_PUBLIC_HAS_GOOGLE)
  const hasApple = !!(process.env.NEXT_PUBLIC_HAS_APPLE)
  const hasAnyOAuth = hasGoogle || hasApple

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#000000' }}>
      {/* Animated ambient gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[15%] w-[60%] h-[60%] rounded-full parallax-orb" style={{ background: 'radial-gradient(ellipse, rgba(124,92,252,0.12) 0%, transparent 70%)', animation: 'ambientDrift1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] rounded-full parallax-orb" style={{ background: 'radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)', animation: 'ambientDrift2 25s ease-in-out infinite' }} />
        <div className="absolute top-[50%] left-[60%] w-[40%] h-[40%] rounded-full parallax-orb" style={{ background: 'radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)', animation: 'ambientDrift3 30s ease-in-out infinite' }} />
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
        backgroundImage: 'radial-gradient(rgba(124,92,252,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.5,
      }} />

      <div className="w-full max-w-md space-y-7 fade-in-up relative z-10">
        {/* Logo with immersive glow */}
        <div className="text-center space-y-3">
          <div className="float-animation inline-flex items-center justify-center w-20 h-20 rounded-2xl border relative" style={{ background: 'rgba(124, 92, 252, 0.08)', borderColor: 'rgba(124, 92, 252, 0.15)', boxShadow: '0 0 40px rgba(124, 92, 252, 0.1), 0 0 80px rgba(124, 92, 252, 0.04)' }}>
            <Wallet className="w-10 h-10 text-violet-400" />
            <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.1), rgba(6,182,212,0.05))', opacity: 0.5 }} />
          </div>
          <h1 className="text-4xl font-bold gradient-text">
            CryptoFolio
          </h1>
          <p className="text-sm typewriter" style={{ color: 'rgba(255,255,255,0.35)' }}>Suivez votre portefeuille crypto en temps réel</p>
        </div>

        {/* Main auth card */}
        <div className="rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden" style={{ background: 'rgba(6, 6, 10, 0.85)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 8px 60px rgba(0,0,0,0.5), 0 0 40px rgba(124,92,252,0.04)' }}>
          {/* Card inner gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' }} />

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {isRegister ? 'Créer un compte' : 'Bienvenue'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
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
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}
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
                <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 font-medium" style={{ background: 'rgba(6,6,10,0.85)', color: 'rgba(255,255,255,0.2)' }}>ou</span>
              </div>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2 fade-in-up stagger-1">
                <Label htmlFor="name" className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="border text-white placeholder:text-white/20 rounded-xl h-11 transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(124,92,252,0.25),0_0_12px_rgba(124,92,252,0.1)]"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                />
              </div>
            )}
            <div className={hasAnyOAuth ? 'space-y-2 fade-in-up stagger-3' : 'space-y-2 fade-in-up stagger-2'}>
              <Label htmlFor="email" className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="border text-white placeholder:text-white/20 rounded-xl h-11 transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(124,92,252,0.25),0_0_12px_rgba(124,92,252,0.1)]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
              />
            </div>
            <div className={hasAnyOAuth ? 'space-y-2 fade-in-up stagger-4' : 'space-y-2 fade-in-up stagger-3'}>
              <Label htmlFor="password" className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="border text-white placeholder:text-white/20 rounded-xl h-11 transition-all duration-300 focus:shadow-[0_0_0_2px_rgba(124,92,252,0.25),0_0_12px_rgba(124,92,252,0.1)]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-xl border fade-in" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="btn-primary-glow btn-ripple w-full text-white rounded-xl h-11 font-medium shadow-lg transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRegister ? 'Créer le compte' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
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

          {/* Demo accounts — login only */}
          {!isRegister && (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-medium text-center mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>Comptes de démonstration</p>
              <div className="space-y-2 wave-stagger">
                <button
                  type="button"
                  onClick={() => fillDemo('unibus93@gmail.com', '#@769891506Fs#@')}
                  className="demo-account-btn fade-in-up w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left group"
                  style={{ background: 'rgba(124,92,252,0.06)', borderColor: 'rgba(124,92,252,0.15)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,92,252,0.12)' }}>
                    <Shield className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Admin</p>
                    <p className="text-xs text-white/25 truncate">unibus93@gmail.com</p>
                  </div>
                  <LogIn className="w-4 h-4 text-white/15 group-hover:text-violet-400 transition-colors" />
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('premium@cryptotracker.com', 'premium123')}
                  className="demo-account-btn w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left group"
                  style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Premium</p>
                    <p className="text-xs text-white/25 truncate">premium@cryptotracker.com</p>
                  </div>
                  <LogIn className="w-4 h-4 text-white/15 group-hover:text-amber-400 transition-colors" />
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('demo@cryptotracker.com', 'demo123')}
                  className="demo-account-btn w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 text-left group"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <User className="w-4 h-4 text-white/35" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">Gratuit</p>
                    <p className="text-xs text-white/25 truncate">demo@cryptotracker.com</p>
                  </div>
                  <LogIn className="w-4 h-4 text-white/15 group-hover:text-white/50 transition-colors" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom security note */}
        <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
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
  const items: { id: View; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'ai-analysis', label: 'IA', icon: Sparkles },
    { id: 'profile', label: 'Profil', icon: User },
    ...(isAdmin ? [{ id: 'admin-users' as View, label: 'Admin', icon: Shield }] : []),
  ]

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const active = currentView === item.id ||
            (item.id === 'admin-users' && (currentView === 'admin-tokens' || currentView === 'admin-exchanges'))
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`bottom-nav-item flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[64px] ${
                active ? 'active' : 'text-white/40'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
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
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const userItems = [
    { id: 'dashboard' as View, label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'transactions' as View, label: 'Transactions', icon: ArrowLeftRight },
    { id: 'ai-analysis' as View, label: 'Analyse IA', icon: Sparkles },
    { id: 'profile' as View, label: 'Profil & Abonnement', icon: User },
  ]

  const adminItems = [
    { id: 'admin-users' as View, label: 'Gestion Utilisateurs', icon: Shield },
    { id: 'admin-tokens' as View, label: 'Gestion Tokens', icon: Coins },
    { id: 'admin-exchanges' as View, label: 'Gestion Exchanges', icon: Building2 },
  ]

  const NavItem = ({ item }: { item: { id: View; label: string; icon: any } }) => {
    const active = currentView === item.id
    return (
      <button
        onClick={() => { setView(item.id); setMobileOpen(false) }}
        className={`nav-item-hover magnetic-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
          active
            ? 'text-violet-300 nav-active-sweep'
            : 'text-white/40 hover:text-white/70'
        }`}
        style={active ? { background: 'rgba(124,92,252,0.12)', borderLeft: '3px solid #7c5cfc' } : { borderLeft: '3px solid transparent' }}
      >
        <item.icon className={`w-5 h-5 shrink-0 transition-colors ${active ? 'text-violet-400' : ''}`} />
        {!collapsed && <span>{item.label}</span>}
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
      <div className={`flex items-center gap-3 px-5 py-5 border-b ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg relative breathe" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(6,182,212,0.3))', border: '1px solid rgba(124,92,252,0.2)', boxShadow: '0 0 20px rgba(124,92,252,0.1), 0 0 40px rgba(124,92,252,0.05)' }}>
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
            <Separator className="my-4" style={{ background: 'rgba(255,255,255,0.05)' }} />
            <div className="space-y-1">
              {!collapsed && <p className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Administration</p>}
              {adminItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User info */}
      <div className={`border-t p-4 ${collapsed ? 'flex flex-col items-center' : ''}`} style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'w-full'}`}>
          <div className="avatar-ring shrink-0">
            <div className="w-9 h-9 flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}>
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{user?.name || user?.email}</p>
              <Badge variant="outline" className={`text-[10px] mt-0.5 px-1.5 py-0 floating-badge ${
                user?.role === 'admin' ? 'border-violet-500/30 text-violet-400 bg-violet-500/10' :
                user?.role === 'user_premium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                'border-white/10 text-white/30 bg-white/5'
              }`}>
                {user?.role === 'admin' ? 'Admin' :
                 user?.role === 'user_premium' ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`mt-3 w-full transition-all duration-200 rounded-xl btn-ripple ${
              showLogoutConfirm
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {showLogoutConfirm ? 'Confirmer ?' : 'Déconnexion'}
          </Button>
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
        <Menu className="w-5 h-5 text-white/60" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden fade-in" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
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
          <ChevronDown className={`w-3 h-3 text-white/40 transition-transform duration-200 ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
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
    <div className="rounded-xl px-4 py-3 shadow-xl chart-tooltip-glass" style={{ background: 'rgba(6,6,10,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,92,252,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(124,92,252,0.08)' }}>
      {label && <p className="text-xs mb-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>{entry.name}:</span>
          <span className="text-white font-semibold">{fmt(entry.value)} $</span>
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
      <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 glow-dot"></span>
          </span>
          <span className="text-xs font-semibold text-emerald-400">LIVE</span>
        </div>
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Cours en temps réel</span>
      </div>
      <div ref={tickerRef} className="flex items-center gap-1 px-4 py-3 overflow-x-auto ticker-scroll">
        {entries.map(([ticker, price]) => {
          const prev = prevPrices[ticker]
          const change = prev && prev !== price ? ((price - prev) / prev) * 100 : 0
          const isUp = change >= 0
          return (
            <div key={ticker} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg shrink-0 mr-1 hover-scale-glow ${change !== 0 ? (isUp ? 'price-flash-up' : 'price-flash-down') : ''}`} style={{ background: 'rgba(255,255,255,0.03)' }}>
              <TokenLogo ticker={ticker} size={24} />
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-white/60">{ticker}</span>
                <span className="text-xs font-semibold text-white/90">{fmtPrice(price)} $</span>
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
          <div className="h-48 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
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
              <h3 className="text-sm font-semibold text-white/80">Indice de Peur & Cupidité</h3>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Marché crypto global</p>
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
                stroke="rgba(255,255,255,0.06)"
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
              <text x="20" y="108" fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle">0</text>
              <text x="110" y="15" fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle">50</text>
              <text x="200" y="108" fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle">100</text>
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
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
            <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>Historique 30 jours</p>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fgAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fgColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={fgColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} tickLine={false} axisLine={false} width={25} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(26,29,46,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'white',
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
        <div className="flex items-center justify-between text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
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
          <div className="h-48 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
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
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,92,252,0.12)' }}>
            <Activity className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Signaux d&apos;Achat & Vente</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Basé sur votre PRU et le contexte marché</p>
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
                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{ts.reason}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Info note */}
        <p className="text-[10px] text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
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
                <div className="h-4 w-2/3 rounded-lg mb-4 skeleton-wave" style={{ background: 'rgba(255,255,255,0.04)' }} />
                <div className="h-8 w-1/2 rounded-lg skeleton-wave" style={{ background: 'rgba(255,255,255,0.04)' }} />
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
        <h2 className="text-xl font-semibold text-white/80">Aucune transaction</h2>
        <p className="text-center max-w-md" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
      iconBg: 'rgba(124,92,252,0.12)',
      iconColor: 'text-violet-400',
      colorClass: '',
      prefix: '',
      suffix: ' $',
      glowColor: 'rgba(124,92,252,0.08)',
    },
    {
      label: 'P/L Global',
      value: data.pl,
      icon: data.pl >= 0 ? TrendingUp : TrendingDown,
      barClass: data.pl >= 0 ? 'kpi-bar-emerald' : 'kpi-bar-red',
      iconBg: data.pl >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      iconColor: data.pl >= 0 ? 'text-emerald-400' : 'text-red-400',
      colorClass: plColor(data.pl),
      prefix: data.pl >= 0 ? '+' : '',
      suffix: ' $',
      glowColor: data.pl >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
    },
    {
      label: 'Investissement Total',
      value: data.investissementTotal,
      icon: DollarSign,
      barClass: 'kpi-bar-cyan',
      iconBg: 'rgba(6,182,212,0.12)',
      iconColor: 'text-cyan-400',
      colorClass: '',
      prefix: '',
      suffix: ' $',
      glowColor: 'rgba(6,182,212,0.06)',
    },
    {
      label: 'ROI',
      value: data.roi,
      icon: data.roi >= 0 ? TrendingUp : TrendingDown,
      barClass: data.roi >= 0 ? 'kpi-bar-amber' : 'kpi-bar-red',
      iconBg: data.roi >= 0 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
      iconColor: data.roi >= 0 ? 'text-amber-400' : 'text-red-400',
      colorClass: plColor(data.roi),
      prefix: data.roi >= 0 ? '+' : '',
      suffix: '',
      isPercent: true,
      glowColor: data.roi >= 0 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)',
    },
  ]

  return (
    <div className="space-y-6 view-enter-cinematic">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-2xl font-bold gradient-shimmer-text">Tableau de Bord</h1>
          <div className="flex items-center gap-2 text-sm mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
            <span>Vue d&apos;ensemble de votre portefeuille</span>
            {lastUpdated && (
              <span className="hidden sm:flex items-center gap-1.5">
                • <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow live-breathe" />
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>Mis à jour {lastUpdated.toLocaleTimeString('fr-FR')} • {nextRefreshIn}s</span>
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 shrink-0 glass rounded-xl text-white/60 hover:text-white/80 hover:bg-white/5 h-10 btn-ripple"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* Live Price Ticker */}
      <LivePriceTicker />

      {/* Fear & Greed Index + Market Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 fade-in-up">
        <FearGreedWidget />
        {/* Token Buy/Sell Signals */}
        <TokenSignals />
      </div>

      {/* Freemium Upgrade Banner */}
      {user?.role === 'user_free' && (
        <Card className="glass-card rounded-2xl fade-in-up rainbow-border" style={{ borderColor: 'rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.04)' }}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-semibold text-amber-400">Débloquez l&apos;accès illimité</p>
              <p style={{ color: 'rgba(255,255,255,0.35)' }}>Plan Gratuit limité à 3 tokens et 10 transactions. Passez en Premium pour profiter de toutes les fonctionnalités.</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card, i) => (
          <div key={card.label} className={`fade-in-up stagger-${i + 1}`}>
            <Card className={`glass-card rounded-2xl card-hover-3d tilt-card gradient-border shimmer-vivid ${card.barClass}`}>
              <CardContent className="p-5 sm:p-6 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>{card.label}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center kpi-icon-glow" style={{ background: card.iconBg }}>
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
                {card.isPercent ? (
                  <p className={`text-xl sm:text-2xl font-bold kpi-value-animate ${card.colorClass || 'text-white/90'}`}>
                    <AnimatedCounter value={card.value} prefix={card.prefix} suffix="%" className={card.colorClass || 'text-white/90'} />
                  </p>
                ) : (
                  <p className={`text-xl sm:text-2xl font-bold kpi-value-animate ${card.colorClass || 'text-white/90'}`}>
                    <AnimatedCounter value={card.value} prefix={card.prefix} suffix={card.suffix} className={card.colorClass || 'text-white/90'} />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Portfolio Distribution - Dynamic Pie Chart */}
        <Card className="glass-card rounded-2xl card-hover-3d gradient-border spotlight-card fade-in-up stagger-5 chart-enter chart-bg-grad">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Répartition du Portefeuille</CardTitle>
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
                      background: 'rgba(6, 6, 10, 0.92)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid rgba(124, 92, 252, 0.15)',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(124,92,252,0.08)',
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
                      <span className="text-white/50 font-medium">{t.ticker}</span>
                      <span className="text-white/30 ml-auto">{pct.toFixed(1)}%</span>
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
            <CardTitle className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Investissement vs Valeur Actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280} className="sm:h-[300px]">
              <BarChart data={barData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} width={50} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }} />
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
          <CardTitle className="text-base font-medium text-white/70">Détail par Token</CardTitle>
          <CardDescription style={{ color: 'rgba(255,255,255,0.25)' }}>Analyse détaillée de chaque crypto-actif de votre portefeuille</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <TableHead className="font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Token</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Montant Investi</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Quantité</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>PRU</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Cours Actuel</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Valeur Actuelle</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>P/L</TableHead>
                  <TableHead className="text-right font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Rentabilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTokens.map((t) => (
                  <TableRow key={t.ticker} className="data-row-hover hover-scale-glow transition-colors" style={{ borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TokenLogo ticker={t.ticker} size={36} />
                        <div>
                          <p className="font-semibold text-white/80">{t.ticker}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white/60">{fmt(t.montantInvesti)} $</TableCell>
                    <TableCell className="text-right font-mono text-white/40">{fmtSmall(t.quantite)}</TableCell>
                    <TableCell className="text-right font-mono text-white/60">{fmt(t.pru)} $</TableCell>
                    <TableCell className="text-right font-mono text-white/60">{fmt(t.currentPrice)} $</TableCell>
                    <TableCell className="text-right font-mono text-white/60">{fmt(t.valeurActuelle)} $</TableCell>
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
                      <p className="font-semibold text-white/80">{t.ticker}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.name}</p>
                    </div>
                  </div>
                  <Badge className={`${t.rentabilite >= 0 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'} border font-mono text-xs`}>
                    {t.rentabilite >= 0 ? '+' : ''}{fmtPct(t.rentabilite)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Investi</p>
                    <p className="text-white/60 font-mono">{fmt(t.montantInvesti)} $</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Valeur</p>
                    <p className="text-white/60 font-mono">{fmt(t.valeurActuelle)} $</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Quantité</p>
                    <p className="text-white/40 font-mono">{fmtSmall(t.quantite)}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>P/L</p>
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
    <div className="space-y-6 view-enter-cinematic">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-2xl font-bold gradient-shimmer-text">Transactions</h1>
          <p className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Gérez vos achats de crypto-actifs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2 rounded-xl h-10 shadow-lg transition-all active:scale-[0.98] hidden sm:flex text-white btn-primary-glow btn-ripple" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Nouvelle Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog-enter rounded-2xl max-w-lg dialog-mobile-fullscreen text-white" style={{ background: 'rgba(26,29,46,0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DialogHeader>
              <DialogTitle className="text-white/90">{editingTx ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
              <DialogDescription className="sr-only">{editingTx ? 'Formulaire de modification de transaction' : 'Formulaire d\'ajout de transaction'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Date</Label>
                  <Input type="date" {...register('date')} className="border text-white rounded-xl h-11" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
                  {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Token</Label>
                  <Select onValueChange={v => setValue('tokenTicker', v)} defaultValue={editingTx?.tokenTicker}>
                    <SelectTrigger className="border text-white rounded-xl h-11" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent style={{ background: 'rgba(26,29,46,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                  <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Montant investi ($)</Label>
                  <Input type="number" step="0.01" {...register('montantInvesti')} placeholder="15.70" className="border text-white placeholder:text-white/20 rounded-xl h-11" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
                  {errors.montantInvesti && <p className="text-xs text-red-400">{errors.montantInvesti.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Cours d&apos;achat ($)</Label>
                  <Input type="number" step="0.0001" {...register('coursAchat')} placeholder="82603.9" className="border text-white placeholder:text-white/20 rounded-xl h-11" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
                  {errors.coursAchat && <p className="text-xs text-red-400">{errors.coursAchat.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Exchange (optionnel)</Label>
                <Select onValueChange={v => setValue('exchangeId', v)} defaultValue={editingTx?.exchangeId || ''}>
                  <SelectTrigger className="border text-white rounded-xl h-11" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent style={{ background: 'rgba(26,29,46,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {exchanges.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Notes (optionnel)</Label>
                <Input {...register('notes')} placeholder="Note facultative" className="border text-white placeholder:text-white/20 rounded-xl h-11" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }} />
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl text-white/50 hover:text-white/70 hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>Annuler</Button>
                </DialogClose>
                <Button type="submit" className="rounded-xl shadow-lg text-white transition-all active:scale-[0.98] btn-primary-glow btn-ripple" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
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
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-400">Plan Gratuit — Limité à 3 tokens et 10 transactions</p>
              <p style={{ color: 'rgba(255,255,255,0.25)' }}>Passez en Premium pour débloquer l&apos;accès illimité.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par token, exchange, notes..."
            className="border text-white placeholder:text-white/20 rounded-xl h-11 pl-10"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.06)' }}
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
            <h3 className="text-lg font-semibold text-white/70 mb-2">Aucune transaction</h3>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>Ajoutez votre première transaction pour commencer le suivi.</p>
            <Button onClick={openNew} className="gap-2 rounded-xl shadow-lg text-white btn-primary-glow btn-ripple" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
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
                    <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                      <TableHead className="cursor-pointer select-none" style={{ color: 'rgba(255,255,255,0.35)' }} onClick={() => toggleSort('date')}>
                        <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" style={{ color: 'rgba(255,255,255,0.35)' }} onClick={() => toggleSort('tokenTicker')}>
                        <span className="flex items-center gap-1">Token <SortIcon field="tokenTicker" /></span>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none" style={{ color: 'rgba(255,255,255,0.35)' }} onClick={() => toggleSort('montantInvesti')}>
                        <span className="flex items-center justify-end gap-1">Montant <SortIcon field="montantInvesti" /></span>
                      </TableHead>
                      <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Cours</TableHead>
                      <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Quantité</TableHead>
                      <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Exchange</TableHead>
                      <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((tx, idx) => (
                      <TableRow key={tx.id} className={`transition-colors data-row-hover tx-row-hover ${recentTxId === tx.id ? 'tx-success-flash tx-row-enter' : ''}`} style={{ borderBottomColor: 'rgba(255,255,255,0.04)', animationDelay: `${idx * 0.05}s` }}>
                        <TableCell className="font-mono text-sm text-white/50">
                          {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TokenLogo ticker={tx.tokenTicker} size={28} />
                            <Badge variant="outline" className="font-semibold border-white/10 text-white/70">
                              {tx.tokenTicker}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-white/60">{fmt(tx.montantInvesti)} $</TableCell>
                        <TableCell className="text-right font-mono text-white/50">{fmt(tx.coursAchat)} $</TableCell>
                        <TableCell className="text-right font-mono text-white/40">{fmtSmall(tx.quantite)}</TableCell>
                        <TableCell>
                          {tx.exchange ? (
                            <div className="flex items-center gap-1.5">
                              <ExchangeLogo name={tx.exchange.name} size={20} />
                              <span className="text-xs text-white/50">{tx.exchange.name}</span>
                            </div>
                          ) : <span style={{ color: 'rgba(255,255,255,0.12)' }}>—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60" onClick={() => openEdit(tx)}>
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            {deleteConfirm === tx.id ? (
                              <div className="flex gap-1 fade-in">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20" onClick={() => handleDelete(tx.id)}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/5 text-white/30" onClick={() => setDeleteConfirm(null)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400" onClick={() => setDeleteConfirm(tx.id)}>
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
                      <p className="font-semibold text-white/80">{tx.tokenTicker}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5 text-white/30 hover:text-white/60" onClick={() => openEdit(tx)}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    {deleteConfirm === tx.id ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-red-500/10 text-red-400" onClick={() => handleDelete(tx.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white/5 text-white/30" onClick={() => setDeleteConfirm(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-400" onClick={() => setDeleteConfirm(tx.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Montant</p>
                    <p className="text-white/60 font-mono">{fmt(tx.montantInvesti)} $</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Cours</p>
                    <p className="text-white/50 font-mono">{fmt(tx.coursAchat)} $</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Quantité</p>
                    <p className="text-white/40 font-mono">{fmtSmall(tx.quantite)}</p>
                  </div>
                </div>
                {(tx.exchange || tx.notes) && (
                  <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    {tx.exchange && (
                      <div className="flex items-center gap-1.5">
                        <ExchangeLogo name={tx.exchange.name} size={20} />
                        <span className="text-xs text-white/35">{tx.exchange.name}</span>
                      </div>
                    )}
                    {tx.notes && (
                      <span className="text-xs truncate flex-1" style={{ color: 'rgba(255,255,255,0.15)' }}>{tx.notes}</span>
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
        className="fab-button fab-pulse-ring fixed bottom-20 right-4 sm:hidden w-14 h-14 rounded-2xl flex items-center justify-center text-white z-40 active:scale-95"
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
              <h2 className="text-2xl font-bold text-white">Bienvenue en Premium !</h2>
              <p className="text-sm text-white/50">Accès illimité débloqué</p>
            </div>
          </div>
        )}
        {step === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                Passer en Premium
              </DialogTitle>
              <DialogDescription className="sr-only">Choisissez votre durée d&apos;abonnement Premium et payez via PayPal</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Features */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.5)' }}>Tokens illimités</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.5)' }}>Transactions illimitées</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.5)' }}>Graphiques d&apos;évolution</span></div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.5)' }}>Métriques avancées</span></div>
              </div>

              {/* Duration selector */}
              <div className="space-y-2">
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Choisissez votre durée d&apos;engagement</p>
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
                            : 'rgba(255,255,255,0.02)',
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
                        <p className={`text-sm font-semibold ${isSelected ? 'text-amber-400' : 'text-white/60'}`}>
                          {plan.label}
                        </p>
                        <div className="mt-1">
                          <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                            {plan.total.toFixed(2).replace('.', ',')} €
                          </span>
                        </div>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Total</span>
                  <div className="text-right">
                    <span className="text-xl font-bold text-amber-400">{currentPlan.total.toFixed(2).replace('.', ',')} €</span>
                    {currentPlan.discount > 0 && (
                      <span className="ml-2 text-xs font-semibold text-emerald-400">
                        Économie de {((currentPlan.months * 9.99) - currentPlan.total).toFixed(2).replace('.', ',')} €
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Soit {currentPlan.monthly.toFixed(2).replace('.', ',')} €/mois
                  {currentPlan.discount > 0 && ` au lieu de 9,99 €/mois`}
                </p>
              </div>

              <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)' }}>
                <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                <Button variant="ghost" className="text-white/40 hover:text-white/60 rounded-xl">Annuler</Button>
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
              <DialogTitle className="flex items-center gap-2 text-white">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.12)' }}>
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
                    <p className="text-sm font-semibold text-white/80">CryptoFolio Premium</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
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
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>Paiement sécurisé via PayPal</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
                </div>

                {paypalLoading && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400/60" />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Chargement de PayPal...</span>
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
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>Chargement du bouton de paiement...</p>
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
              <Button variant="ghost" className="text-white/40 hover:text-white/60 rounded-xl" onClick={() => { setStep('select'); setError('') }}>
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
              <p className="text-white/80 font-medium">Vérification du paiement...</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Activation de votre abonnement Premium</p>
            </div>
          </div>
        )}
        {step === 'success' && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="text-center">
              <p className="text-white/80 font-semibold text-lg">Bienvenue en Premium !</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Votre accès illimité est maintenant activé</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// PROFILE VIEW
// ============================================================
function ProfileView({ user, onUpgrade }: { user: any; onUpgrade: () => void }) {
  const isPremium = user?.role === 'user_premium'
  const isAdmin = user?.role === 'admin'
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <div className="space-y-6 max-w-2xl view-enter-cinematic">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold gradient-shimmer-text">Profil & Abonnement</h1>
        <p className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Gérez votre compte et votre abonnement</p>
      </div>

      {/* User Info */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="avatar-ring">
              <div className="w-16 h-16 flex items-center justify-center text-white text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}>
                {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-white/80">{user?.name || 'Utilisateur'}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
              <Badge className={`mt-1.5 text-xs border ${
                isAdmin ? 'bg-violet-500/15 text-violet-400 border-violet-500/20' :
                isPremium ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                'bg-white/5 text-white/30 border-white/10'
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
          <CardTitle className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Comparatif des plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className={`p-5 rounded-2xl border transition-all ${
              !isPremium && !isAdmin
                ? 'border-violet-500/30 glass-card'
                : ''
            }`} style={!isPremium && !isAdmin ? { background: 'rgba(124,92,252,0.05)' } : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <User className="w-4 h-4 text-white/40" />
                </div>
                <h3 className="font-semibold text-white/70">Gratuit</h3>
              </div>
              <p className="text-2xl font-bold text-white/80 mb-4">0 €<span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>/mois</span></p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>Accès au tableau de bord</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>3 tokens maximum</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>10 transactions maximum</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.2)' }}>Pas de graphiques avancés</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.2)' }}>Pas de métriques avancées</span></li>
              </ul>
              {!isPremium && !isAdmin && (
                <Badge className="mt-4 text-white border-0" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)' }}>Plan actuel</Badge>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isPremium
                ? 'border-amber-500/30 glass-card'
                : ''
            }`} style={isPremium ? { background: 'rgba(245,158,11,0.05)' } : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white/70">Premium</h3>
              </div>
              <p className="text-2xl font-bold text-white/80 mb-4">9,99 €<span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.25)' }}>/mois</span></p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>Accès au tableau de bord</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>Tokens illimités</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>Transactions illimitées</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>Graphiques d&apos;évolution</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span style={{ color: 'rgba(255,255,255,0.45)' }}>Métriques avancées</span></li>
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
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
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
        <h1 className="text-2xl font-bold text-white/90">Gestion Utilisateurs</h1>
        <p className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{users.length} comptes enregistrés</p>
      </div>

      {/* Desktop Table */}
      <Card className="glass-card rounded-2xl hidden md:block fade-in-up stagger-1">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Utilisateur</TableHead>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Rôle</TableHead>
                  <TableHead className="text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Transactions</TableHead>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Statut</TableHead>
                  <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="transition-colors" style={{ borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.25), rgba(6,182,212,0.25))' }}>
                          {u.name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white/70">{u.name || 'Sans nom'}</p>
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="w-32 border text-white/60 rounded-xl h-9" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'rgba(26,29,46,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <SelectItem value="user_free">Gratuit</SelectItem>
                          <SelectItem value="user_premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center text-white/40">{u._count.transactions}</TableCell>
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.25), rgba(6,182,212,0.25))' }}>
                  {u.name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-white/70">{u.name || 'Sans nom'}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{u.email}</p>
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
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Rôle</p>
                <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                  <SelectTrigger className="w-full border text-white/60 rounded-xl h-9 text-xs mt-1" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: 'rgba(26,29,46,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <SelectItem value="user_free">Gratuit</SelectItem>
                    <SelectItem value="user_premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Transactions</p>
                <p className="text-white/40 mt-1 font-mono">{u._count.transactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
          <h1 className="text-2xl font-bold text-white/90">Gestion des Tokens</h1>
          <p className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{tokens.length} tokens configurés</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-10 shadow-lg text-white transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Ajouter un Token
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl dialog-mobile-fullscreen text-white" style={{ background: 'rgba(26,29,46,0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DialogHeader>
              <DialogTitle className="text-white/90">Nouveau Token</DialogTitle>
              <DialogDescription className="sr-only">Formulaire d\'ajout d\'un nouveau token</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Ticker</Label>
                  <Input
                    value={newToken.ticker}
                    onChange={e => setNewToken({ ...newToken, ticker: e.target.value.toUpperCase() })}
                    placeholder="BTC"
                    className="border text-white placeholder:text-white/20 rounded-xl h-11"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Nom</Label>
                  <Input
                    value={newToken.name}
                    onChange={e => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="Bitcoin"
                    className="border text-white placeholder:text-white/20 rounded-xl h-11"
                    style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>CoinGecko ID</Label>
                <Input
                  value={newToken.coingeckoId}
                  onChange={e => setNewToken({ ...newToken, coingeckoId: e.target.value })}
                  placeholder="bitcoin"
                  className="border text-white placeholder:text-white/20 rounded-xl h-11"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>CryptoCompare ID</Label>
                <Input
                  value={newToken.cryptoCompareId}
                  onChange={e => setNewToken({ ...newToken, cryptoCompareId: e.target.value })}
                  placeholder="BTC"
                  className="border text-white placeholder:text-white/20 rounded-xl h-11"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                />
              </div>
              <Button onClick={addToken} className="w-full rounded-xl shadow-lg text-white transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>Ajouter</Button>
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
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Ticker</TableHead>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Nom</TableHead>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>CoinGecko ID</TableHead>
                  <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Prix Actuel</TableHead>
                  <TableHead className="text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Transactions</TableHead>
                  <TableHead className="text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Statut</TableHead>
                  <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id} className="transition-colors" style={{ borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TokenLogo ticker={t.ticker} size={28} />
                        <Badge variant="outline" className="font-bold border-white/10 text-white/70">{t.ticker}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60">{t.name}</TableCell>
                    <TableCell className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.coingeckoId || '—'}</TableCell>
                    <TableCell className="text-right font-mono text-white/60">
                      {t.currentPrice ? fmt(t.currentPrice) + ' $' : '—'}
                    </TableCell>
                    <TableCell className="text-center text-white/40">{t._count.transactions}</TableCell>
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
                  <p className="font-semibold text-white/80">{t.ticker}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{t.name}</p>
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
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Prix</p>
                <p className="text-white/60 font-mono">{t.currentPrice ? fmt(t.currentPrice) + ' $' : '—'}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Transactions</p>
                <p className="text-white/40 font-mono">{t._count.transactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {t.active ? (
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 border text-xs">Actif</Badge>
              ) : (
                <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border text-xs">Inactif</Badge>
              )}
              {t.coingeckoId && (
                <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.12)' }}>{t.coingeckoId}</span>
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
          <h1 className="text-2xl font-bold text-white/90">Gestion des Exchanges</h1>
          <p className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{exchanges.length} plateformes configurées</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl h-10 shadow-lg text-white transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>
              <Plus className="w-4 h-4" /> Ajouter un Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl dialog-mobile-fullscreen text-white" style={{ background: 'rgba(26,29,46,0.95)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <DialogHeader>
              <DialogTitle className="text-white/90">Nouvel Exchange</DialogTitle>
              <DialogDescription className="sr-only">Formulaire d\'ajout d\'un nouvel exchange</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Nom</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="BINANCE"
                  className="border text-white placeholder:text-white/20 rounded-xl h-11"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
                />
              </div>
              <Button onClick={addExchange} className="w-full rounded-xl shadow-lg text-white transition-all active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}>Ajouter</Button>
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
                <TableRow className="hover:bg-transparent" style={{ borderBottomColor: 'rgba(255,255,255,0.05)' }}>
                  <TableHead style={{ color: 'rgba(255,255,255,0.35)' }}>Nom</TableHead>
                  <TableHead className="text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Transactions</TableHead>
                  <TableHead className="text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Statut</TableHead>
                  <TableHead className="text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchanges.map((e) => (
                  <TableRow key={e.id} className="transition-colors" style={{ borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ExchangeLogo name={e.name} size={32} />
                        <span className="font-semibold text-white/70">{e.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-white/40">{e._count.transactions}</TableCell>
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
                  <p className="font-semibold text-white/80">{e.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{e._count.transactions} transactions</p>
                </div>
              </div>
              <Switch
                checked={e.active}
                onCheckedChange={() => toggleActive(e.id, e.active)}
                className={`${e.active ? 'bg-emerald-500' : 'bg-white/10'}`}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
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
  keyFactors: string[]
  risks: string[]
  disclaimer: string
}

function AIAnalysisView({ user }: { user: any }) {
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [selectedTicker, setSelectedTicker] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState('')
  const [prices, setPrices] = useState<Record<string, number>>({})

  // Load tokens and prices
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
  }, [])

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
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'analyse IA')
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

  const signalIcon = (signal: string) => {
    switch (signal) {
      case 'ACHAT': return <ArrowUpCircle className="w-8 h-8 text-emerald-400" />
      case 'VENTE': return <ArrowDownCircle className="w-8 h-8 text-red-400" />
      default: return <Gauge className="w-8 h-8 text-amber-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ScrollReveal>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative breathe" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.2), rgba(6,182,212,0.2))', border: '1px solid rgba(124,92,252,0.2)', boxShadow: '0 0 20px rgba(124,92,252,0.1)' }}>
            <Sparkles className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Analyse IA</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>L&apos;IA analyse le marché pour vous aider à décider</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Disclaimer banner */}
      <ScrollReveal>
        <div className="rounded-xl p-4 border flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.15)' }}>
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Assistance, pas conseil financier</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>L&apos;IA vous aide à analyser les données techniques et l&apos;actualité du marché. Vous prenez la décision finale. Ceci ne constitue pas un conseil en investissement.</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Token selector */}
      <ScrollReveal>
        <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' }} />

          <Label className="text-xs font-medium mb-3 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Sélectionnez un token à analyser</Label>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                <SelectTrigger className="w-full border rounded-xl h-11 text-white" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  <SelectValue placeholder="Choisir un token" />
                </SelectTrigger>
                <SelectContent style={{ background: 'rgba(10,10,16,0.98)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {tokens.map(t => (
                    <SelectItem key={t.ticker} value={t.ticker} className="text-white/80 focus:text-white focus:bg-violet-500/10">
                      <div className="flex items-center gap-2">
                        <TokenLogo ticker={t.ticker} size={20} />
                        <span>{t.ticker}</span>
                        <span className="text-white/30 text-xs">{t.name}</span>
                        {prices[t.ticker] && (
                          <span className="text-white/20 text-xs ml-auto">${fmtPrice(prices[t.ticker])}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={runAnalysis}
              disabled={loading || !selectedTicker}
              className="btn-primary-glow btn-ripple text-white rounded-xl h-11 px-6 font-medium transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c5cfc, #06b6d4)', boxShadow: '0 4px 20px rgba(124,92,252,0.25)' }}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {loading ? 'Analyse en cours...' : 'Analyser'}
            </Button>
          </div>

          {/* Selected token quick info */}
          {selectedTicker && prices[selectedTicker] && (
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              <TokenLogo ticker={selectedTicker} size={16} />
              <span>{selectedTicker}</span>
              <span className="text-white/50 font-medium">${fmtPrice(prices[selectedTicker])}</span>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Loading animation */}
      {loading && (
        <div className="fade-in-up">
          <div className="rounded-2xl p-8 relative overflow-hidden flex flex-col items-center justify-center gap-4" style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,92,252,0.1)' }}>
                <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
              </div>
              <div className="absolute inset-0 rounded-2xl orbit" style={{ animationDuration: '3s', border: '2px solid transparent', borderTopColor: 'rgba(124,92,252,0.5)', borderRightColor: 'rgba(6,182,212,0.3)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white/60">L&apos;IA analyse le marché...</p>
              <p className="text-xs text-white/25 mt-1">Données techniques, sentiment, actualités</p>
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
          {/* Signal Card */}
          <ScrollReveal direction="scale">
            <div className={`rounded-2xl p-6 border relative overflow-hidden ${signalConfig(analysis.signal).glow}`} style={{ background: 'rgba(6,6,10,0.7)', borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.3), rgba(6,182,212,0.2), transparent)' }} />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {signalIcon(analysis.signal)}
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Signal</p>
                    <p className={`text-2xl font-bold ${signalConfig(analysis.signal).text}`}>
                      {analysis.signal}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Confiance</p>
                  <p className={`text-2xl font-bold ${signalConfig(analysis.signal).text}`}>
                    {analysis.confidence}%
                  </p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="w-full h-2 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-2 rounded-full transition-all duration-1000"
                  style={{
                    width: `${analysis.confidence}%`,
                    background: analysis.signal === 'ACHAT' ? 'linear-gradient(90deg, #10b981, #34d399)' : analysis.signal === 'VENTE' ? 'linear-gradient(90deg, #ef4444, #f87171)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    boxShadow: `0 0 10px ${analysis.signal === 'ACHAT' ? 'rgba(16,185,129,0.3)' : analysis.signal === 'VENTE' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`
                  }}
                />
              </div>

              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{analysis.summary}</p>
            </div>
          </ScrollReveal>

          {/* Technical Analysis + Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical */}
            <ScrollReveal direction="left">
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,92,252,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-white/80">Analyse Technique</h3>
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
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{item.label}</span>
                      <span className="text-xs font-medium text-white/70">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Sentiment */}
            <ScrollReveal direction="left">
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white/80">Sentiment du Marché</h3>
                </div>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke={analysis.sentiment.fearGreedIndex <= 25 ? '#ef4444' : analysis.sentiment.fearGreedIndex <= 45 ? '#f97316' : analysis.sentiment.fearGreedIndex <= 55 ? '#f59e0b' : analysis.sentiment.fearGreedIndex <= 75 ? '#10b981' : '#06b6d4'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(analysis.sentiment.fearGreedIndex / 100) * 251.3} 251.3`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white">{analysis.sentiment.fearGreedIndex}</span>
                      <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>F&amp;G</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <Badge className={`${analysis.sentiment.fearGreedIndex <= 25 ? 'bg-red-500/15 text-red-400 border-red-500/30' : analysis.sentiment.fearGreedIndex <= 45 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : analysis.sentiment.fearGreedIndex <= 55 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : analysis.sentiment.fearGreedIndex <= 75 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'} text-xs`}>
                      {analysis.sentiment.fearGreedLabel}
                    </Badge>
                    <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{analysis.sentiment.interpretation}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Key Factors & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Factors */}
            <ScrollReveal>
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white/80">Facteurs Clés à Suivre</h3>
                </div>
                <div className="space-y-2">
                  {analysis.keyFactors.map((factor, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.1)', color: 'rgba(16,185,129,0.8)' }}>{i + 1}</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{factor}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Risks */}
            <ScrollReveal>
              <div className="rounded-2xl p-5 relative overflow-hidden h-full" style={{ background: 'rgba(6,6,10,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.2), transparent)' }} />
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-semibold text-white/80">Risques Identifiés</h3>
                </div>
                <div className="space-y-2">
                  {analysis.risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold" style={{ background: 'rgba(239,68,68,0.1)', color: 'rgba(239,68,68,0.8)' }}>{i + 1}</div>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Disclaimer */}
          <ScrollReveal>
            <div className="rounded-xl p-4 border text-center" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.04)' }}>
              <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>{analysis.disclaimer}</p>
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && !error && (
        <ScrollReveal direction="scale">
          <div className="rounded-2xl p-10 relative overflow-hidden flex flex-col items-center justify-center text-center" style={{ background: 'rgba(6,6,10,0.5)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 breathe" style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}>
              <Brain className="w-10 h-10 text-violet-400/50" />
            </div>
            <h3 className="text-lg font-semibold text-white/60 mb-2">L&apos;IA est prête à analyser</h3>
            <p className="text-sm max-w-md" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Sélectionnez un token et lancez l&apos;analyse. L&apos;IA étudiera les indicateurs techniques, le sentiment du marché et les facteurs clés pour vous fournir une analyse claire.
            </p>
            <div className="flex items-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Technique</span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <Gauge className="w-3.5 h-3.5" />
                <span>Sentiment</span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <Eye className="w-3.5 h-3.5" />
                <span>Facteurs clés</span>
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
      <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#000000' }}>
        <ParticleField />
        <div className="flex flex-col items-center gap-5">
          {/* Orbit animation around wallet icon */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center float-animation" style={{ background: 'rgba(124,92,252,0.15)', borderColor: 'rgba(124,92,252,0.3)' }}>
                <Wallet className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            {/* Orbiting dot */}
            <div className="absolute inset-0 orbit" style={{ animationDuration: '3s' }}>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 glow-dot" />
            </div>
            {/* Second orbiting dot */}
            <div className="absolute inset-0 orbit-reverse" style={{ animationDuration: '4s' }}>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: '0 0 8px rgba(6,182,212,0.5)' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-violet-400/50" />
            <span className="text-sm text-white/30 font-medium">Chargement...</span>
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
    if (currentView === 'admin-users' || currentView === 'admin-tokens' || currentView === 'admin-exchanges') {
      if (!isAdmin) return <DashboardView user={user} onUpgrade={() => setShowUpgrade(true)} />
      return (
        <div className="space-y-6 page-transition view-enter-cinematic">
          <div className="fade-in-up">
            <h1 className="text-2xl font-bold gradient-shimmer-text">Administration</h1>
            <p className="mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Gérez les utilisateurs, tokens et exchanges</p>
          </div>
          <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as View)} className="fade-in-up stagger-1">
            <TabsList className="w-full justify-start rounded-xl p-1 h-auto" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <TabsTrigger value="admin-users" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-white data-[state=active]:shadow-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Utilisateurs</TabsTrigger>
              <TabsTrigger value="admin-tokens" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-white data-[state=active]:shadow-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Tokens</TabsTrigger>
              <TabsTrigger value="admin-exchanges" className="rounded-lg px-4 py-2 text-sm data-[state=active]:text-white data-[state=active]:shadow-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Exchanges</TabsTrigger>
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
          </Tabs>
        </div>
      )
    }

    switch (currentView) {
      case 'dashboard': return <DashboardView user={user} onUpgrade={() => setShowUpgrade(true)} />
      case 'transactions': return <TransactionsView user={user} onUpgrade={() => setShowUpgrade(true)} />
      case 'ai-analysis': return <AIAnalysisView user={user} />
      case 'profile': return <ProfileView user={user} onUpgrade={refreshSession} />
      default: return <DashboardView user={user} onUpgrade={() => setShowUpgrade(true)} />
    }
  }

  return (
    <div className="flex min-h-screen relative noise-overlay mesh-gradient" style={{ background: '#000000' }}>
      <AmbientBackground />
      <ParticleField />
      <MouseGlow />
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
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
