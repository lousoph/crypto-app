'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  LayoutDashboard, ArrowLeftRight, User, Shield, Coins, Building2,
  LogOut, TrendingUp, TrendingDown, DollarSign, Wallet,
  Plus, Trash2, RefreshCw, BarChart3, Crown, AlertTriangle,
  Check, X, Menu, Search, Activity, Zap, Brain, Mail,
  Sun, Moon, Sparkles, ChevronDown, ChevronUp, Eye, EyeOff,
  Gauge, ArrowUpCircle, ArrowDownCircle, Minus, ExternalLink, Star, Pencil,
  Home, Newspaper, Lightbulb, Clock, Globe, ArrowRight, Bell, Download, Flame, FlameKindling, ChevronsUpDown, Tag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
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
  PieChart, Pie, Cell
} from 'recharts'
import { signIn, signOut, useSession } from 'next-auth/react'
import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'
import FearGreedIndex from '@/components/fear-greed-index'

// ============================================================
// TYPES
// ============================================================
type View = 'home' | 'dashboard' | 'transactions' | 'ai-analysis' | 'profile' | 'admin-users' | 'admin-tokens' | 'admin-exchanges' | 'admin-pricing' | 'admin-coupons'

interface TokenData {
  id: string; ticker: string; name: string; coingeckoId: string | null; cryptoCompareId: string | null; currentPrice: number | null; active: boolean
}

interface ExchangeData {
  id: string; name: string; active: boolean
}

interface TransactionData {
  id: string; date: string; tokenTicker: string; montantInvesti: number; coursAchat: number; quantite: number; exchangeId: string | null; notes: string | null; token: TokenData; exchange: ExchangeData | null
}

interface TokenDashboard {
  ticker: string; name: string; montantInvesti: number; quantite: number; currentPrice: number; pru: number; valeurActuelle: number; pl: number; rentabilite: number
}

interface DashboardData {
  investissementTotal: number; valeurActuelle: number; pl: number; roi: number; tokens: TokenDashboard[]
}

interface AdminUser {
  id: string; email: string; name: string | null; role: string; suspended: boolean; createdAt: string; _count: { transactions: number }
}

interface AdminToken extends TokenData { _count: { transactions: number } }
interface AdminExchange extends ExchangeData { _count: { transactions: number } }

interface AIAnalysisResult {
  signal: string; confidence: number; summary: string;
  technicalAnalysis: { trend: string; supportLevel: string; resistanceLevel: string; rsiApprox: string; volume24h: string }
  sentiment: { fearGreedIndex: number; fearGreedLabel: string; interpretation: string }
  newsImpact: string; keyFactors: string[]; risks: string[]; disclaimer: string;
  chartData?: { time: string; price: number }[]; currentPrice?: number; priceChangePct24h?: number
}

// ============================================================
// THEME-AWARE STYLES HOOK
// ============================================================
function useThemeStyles() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  return {
    isDark,
    cardBg: isDark ? 'rgba(6,6,10,0.6)' : 'rgba(255,255,255,0.92)',
    cardBorder: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(109,77,224,0.12)',
    cardShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(109,77,224,0.12)',
    accentBg: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(109,77,224,0.08)',
    primaryGradient: isDark ? 'linear-gradient(135deg,#7c5cfc,#06b6d4)' : 'linear-gradient(135deg,#6d4de0,#0891b2)',
    primaryBtnShadow: isDark ? '0 4px 20px rgba(124,92,252,0.25)' : '0 4px 20px rgba(109,77,224,0.25)',
    authCardShadow: isDark ? '0 8px 60px rgba(0,0,0,0.4),0 0 40px rgba(124,92,252,0.06)' : '0 8px 60px rgba(0,0,0,0.12),0 0 40px rgba(109,77,224,0.08)',
    authGradientLine: isDark ? 'linear-gradient(90deg,transparent,rgba(124,92,252,0.3),rgba(6,182,212,0.2),transparent)' : 'linear-gradient(90deg,transparent,rgba(109,77,224,0.3),rgba(8,145,178,0.2),transparent)',
    orbBg1: isDark ? 'rgba(124,92,252,0.07)' : 'rgba(124,92,252,0.12)',
    orbBg2: isDark ? 'rgba(6,182,212,0.05)' : 'rgba(6,182,212,0.08)',
    orbBg3: isDark ? 'rgba(168,85,247,0.04)' : 'rgba(168,85,247,0.06)',
    logoBg: isDark ? 'rgba(124,92,252,0.15)' : 'rgba(109,77,224,0.1)',
    logoBorder: isDark ? 'rgba(124,92,252,0.3)' : 'rgba(109,77,224,0.2)',
    logoShadow: isDark ? '0 0 40px rgba(124,92,252,0.06)' : '0 0 40px rgba(109,77,224,0.1)',
    dotGrid: isDark ? 'rgba(124,92,252,0.06)' : 'rgba(109,77,224,0.06)',
    socialBtnBg: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    socialBtnBorder: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    socialBtnText: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    inputFocusShadow: isDark ? '0 0 0 2px rgba(124,92,252,0.25),0 0 12px rgba(124,92,252,0.1)' : '0 0 0 2px rgba(109,77,224,0.25),0 0 12px rgba(109,77,224,0.1)',
    errorBg: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
    errorBorder: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.15)',
    chartTooltipBg: isDark ? 'rgba(6,6,10,0.92)' : 'rgba(255,255,255,0.96)',
    chartTooltipBorder: isDark ? 'rgba(124,92,252,0.15)' : 'rgba(109,77,224,0.15)',
    iconBgViolet: isDark ? 'rgba(124,92,252,0.12)' : 'rgba(109,77,224,0.1)',
    iconBgCyan: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(8,145,178,0.1)',
    iconBgEmerald: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(5,150,105,0.1)',
    iconBgAmber: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.1)',
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const fmt = (n: number) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
const fmtPct = (n: number) => (n >= 0 ? '+' : '') + (n * 100).toFixed(2) + '%'
const fmtQty = (n: number) => {
  if (n === 0) return '0'
  if (n >= 1000) return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
  if (n >= 1) return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(n)
  // For very small quantities, show up to 10 decimals without scientific notation
  return n.toFixed(10).replace(/0+$/, '').replace(/\.$/, '')
}
const fmtSmall = (n: number) => n < 0.01 ? n.toFixed(8).replace(/0+$/, '').replace(/\.$/, '') : n < 1 ? n.toFixed(4) : n.toFixed(2)
const fmtPrice = (n: number) => n >= 1 ? fmt(n) : fmtSmall(n)
const plColor = (v: number) => v >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
const plBg = (v: number) => v >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'

const CHART_COLORS = ['#7c5cfc','#06b6d4','#f59e0b','#10b981','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#6366f1']

const TOKEN_LOGO_PRIMARY = (symbol: string) =>
  `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${symbol.toLowerCase()}.png`
const TOKEN_LOGO_FALLBACK = (symbol: string) =>
  `https://www.cryptocompare.com/media/37776598/${symbol.toUpperCase()}.png`

// ============================================================
// TOKEN LOGO COMPONENT
// ============================================================
function TokenLogo({ ticker, size = 24, className = '' }: { ticker: string; size?: number; className?: string }) {
  const [imgError, setImgError] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const gradients: Record<string, string> = { BTC: '#f59e0b', ETH: '#627eea', SOL: '#9945ff', BNB: '#f0b90b', XRP: '#00aae4', ADA: '#0033ad', DOGE: '#c3a634', AVAX: '#e84142', DOT: '#e6007a', MATIC: '#8247e5', ATOM: '#2e3148', LINK: '#2a5ada', UNI: '#ff007a', NEAR: '#00c08b', LTC: '#bfbbbb', TRX: '#ef0027', SHIB: '#f00500' }

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(size * 0.35, 9), borderRadius: size * 0.22, background: gradients[ticker.toUpperCase()] || 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }}
      >
        {ticker.slice(0, 2)}
      </div>
    )
  }
  return (
    <img src={useFallback ? TOKEN_LOGO_FALLBACK(ticker) : TOKEN_LOGO_PRIMARY(ticker)} alt={ticker} width={size} height={size}
      className={`rounded-lg shrink-0 ${className}`} style={{ width: size, height: size }}
      onError={() => { if (!useFallback) { setUseFallback(true) } else { setImgError(true) } }} loading="lazy" />
  )
}

// ============================================================
// AUTH HOOK
// ============================================================
function useAuth() {
  const { data: session, status } = useSession()
  const loading = status === 'loading'
  const user = session?.user ?? null
  const emailVerified = (session?.user as any)?.emailVerified ?? true
  const userRole = (session?.user as any)?.role ?? 'user_free'

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', { redirect: false, email, password })
    if (result?.ok) return true
    if (result?.error) throw new Error(result.error === 'CredentialsSignin' ? 'Email ou mot de passe incorrect' : result.error)
    return false
  }

  const register = async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json()
    if (res.ok) {
      if (data.requiresVerification) return { requiresVerification: true, email, verificationCode: data.verificationCode }
      const result = await signIn('credentials', { redirect: false, email, password })
      if (!result?.ok) throw new Error('Inscription réussie mais connexion échouée')
      return { requiresVerification: false }
    }
    throw new Error(data.error || 'Erreur inscription')
  }

  const logout = async () => { await signOut({ redirect: false }) }

  return { user, loading, login, register, logout, emailVerified, userRole }
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
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showVerification, setShowVerification] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const ts = useThemeStyles()

  useEffect(() => {
    if (resendCooldown > 0) { const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000); return () => clearTimeout(t) }
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (!email || !email.trim()) { setError('Veuillez entrer votre email'); return }
      if (!password || password.length < 1) { setError('Veuillez entrer votre mot de passe'); return }
      if (isRegister) {
        const result = await onRegister(email, password, name)
        if (result?.requiresVerification) {
          setVerifyEmail(email); setShowVerification(true)
          if (result.verificationCode) setVerifyCode(result.verificationCode)
          toast.success('Compte créé ! Vérifiez votre email.')
        } else { toast.success('Compte créé avec succès !') }
      } else {
        const ok = await onLogin(email, password)
        if (!ok) {
          const msg = 'Email ou mot de passe incorrect'
          setError(msg)
          toast.error(msg)
        }
      }
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally { setLoading(false) }
  }

  const handleVerify = async () => {
    if (!verifyCode || verifyCode.length !== 6) { setVerifyError('Veuillez entrer le code à 6 chiffres'); return }
    setVerifyLoading(true); setVerifyError('')
    try {
      const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verifyEmail, code: verifyCode }) })
      const data = await res.json()
      if (res.ok) { toast.success('Email vérifié !'); setShowVerification(false); setVerifyCode(''); await onLogin(verifyEmail, password) }
      else setVerifyError(data.error || 'Code invalide')
    } catch { setVerifyError('Erreur réseau') } finally { setVerifyLoading(false) }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: verifyEmail }) })
      const data = await res.json()
      if (res.ok) { if (data.verificationCode) setVerifyCode(data.verificationCode); toast.success('Nouveau code envoyé !'); setResendCooldown(60) }
      else toast.error(data.error || 'Erreur lors de l\'envoi')
    } catch { toast.error('Erreur réseau') }
  }

  const hasGoogle = !!process.env.NEXT_PUBLIC_HAS_GOOGLE
  const hasApple = !!process.env.NEXT_PUBLIC_HAS_APPLE

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[15%] w-[60%] h-[60%] rounded-full" style={{ background: `radial-gradient(ellipse,${ts.orbBg1} 0%,transparent 70%)`, animation: 'ambientDrift1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] rounded-full" style={{ background: `radial-gradient(ellipse,${ts.orbBg2} 0%,transparent 70%)`, animation: 'ambientDrift2 25s ease-in-out infinite' }} />
        <div className="absolute top-[50%] left-[60%] w-[40%] h-[40%] rounded-full" style={{ background: `radial-gradient(ellipse,${ts.orbBg3} 0%,transparent 70%)`, animation: 'ambientDrift3 30s ease-in-out infinite' }} />
      </div>
      {/* Dot grid */}
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: `radial-gradient(${ts.dotGrid} 1px,transparent 1px)`, backgroundSize: '40px 40px', opacity: 0.5 }} />

      <div className="w-full max-w-md space-y-7 fade-in-up relative z-10">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="float-animation inline-flex items-center justify-center w-20 h-20 rounded-2xl border relative" style={{ background: ts.logoBg, borderColor: ts.logoBorder, boxShadow: ts.logoShadow }}>
            <Wallet className="w-10 h-10 text-violet-500 dark:text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">Prédict AI</h1>
          <p className="text-sm text-muted-foreground">Suivez votre portefeuille crypto en temps réel</p>
        </div>

        {/* Verification or Auth Card */}
        {showVerification ? (
          <div className="rounded-2xl p-6 sm:p-8 shadow-2xl glass-strong" style={{ boxShadow: ts.authCardShadow }}>
            <div className="h-px -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6" style={{ background: ts.authGradientLine, position: 'relative' }} />
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ts.accentBg }}>
                  <Mail className="w-5 h-5 text-violet-500 dark:text-violet-400" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Vérifiez votre email</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Un code a été envoyé à <span className="text-foreground/80 font-medium">{verifyEmail}</span></p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Code de vérification</Label>
                <Input value={verifyCode} onChange={(e) => { setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setVerifyError('') }}
                  placeholder="000000" className="border text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-muted-foreground/30 rounded-xl h-14"
                  style={{ background: 'var(--input)', borderColor: 'var(--border)' }} maxLength={6} />
              </div>
              {verifyError && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 rounded-xl border" style={{ background: ts.errorBg, borderColor: ts.errorBorder }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />{verifyError}
                </div>
              )}
              <Button onClick={handleVerify} className="btn-primary-glow w-full text-foreground rounded-xl h-11 font-medium shadow-lg" style={{ background: ts.primaryGradient, boxShadow: ts.primaryBtnShadow }} disabled={verifyLoading || verifyCode.length !== 6}>
                {verifyLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Vérifier
              </Button>
              <div className="text-center">
                <button onClick={handleResend} disabled={resendCooldown > 0} className="text-sm text-violet-500 hover:text-violet-400 transition-colors font-medium disabled:text-muted-foreground/30 disabled:cursor-not-allowed">
                  {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
                </button>
              </div>
              <div className="text-center">
                <button onClick={() => { setShowVerification(false); setVerifyCode(''); setVerifyError('') }} className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors">Retour</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-6 sm:p-8 shadow-2xl glass-strong" style={{ boxShadow: ts.authCardShadow }}>
            <div className="h-px -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-6" style={{ background: ts.authGradientLine, position: 'relative' }} />
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">{isRegister ? 'Créer un compte' : 'Bienvenue'}</h2>
              <p className="text-sm mt-1 text-muted-foreground">{isRegister ? 'Créez votre compte pour commencer' : 'Connectez-vous pour accéder à votre portefeuille'}</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Nom</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom"
                    className="border rounded-xl h-11 bg-input" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required
                  className="border rounded-xl h-11 bg-input" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">Mot de passe</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                    className="border rounded-xl h-11 bg-input pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              <Button type="submit" className="btn-primary-glow w-full rounded-xl h-11 font-medium shadow-lg text-white" style={{ background: ts.primaryGradient, boxShadow: ts.primaryBtnShadow }} disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {isRegister ? 'Créer mon compte' : 'Se connecter'}
              </Button>
            </form>
            <div className="mt-5 text-center">
              <button onClick={() => { setIsRegister(!isRegister); setError('') }} className="text-sm text-violet-500 hover:text-violet-400 transition-colors font-medium">
                {isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// EMAIL VERIFICATION SCREEN (for authenticated but unverified users)
// ============================================================
function EmailVerificationScreen({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const ts = useThemeStyles()

  useEffect(() => {
    if (resendCooldown > 0) { const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000); return () => clearTimeout(t) }
  }, [resendCooldown])

  const handleVerify = async () => {
    if (code.length !== 6) { setError('6 chiffres requis'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) })
      const data = await res.json()
      if (res.ok) { toast.success('Email vérifié !'); onVerified() }
      else setError(data.error || 'Code invalide')
    } catch { setError('Erreur réseau') } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (res.ok) { toast.success('Code renvoyé !'); setResendCooldown(60) }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[15%] w-[60%] h-[60%] rounded-full" style={{ background: `radial-gradient(ellipse,${ts.orbBg1} 0%,transparent 70%)`, animation: 'ambientDrift1 20s ease-in-out infinite' }} />
        <div className="absolute bottom-[-20%] right-[10%] w-[50%] h-[50%] rounded-full" style={{ background: `radial-gradient(ellipse,${ts.orbBg2} 0%,transparent 70%)`, animation: 'ambientDrift2 25s ease-in-out infinite' }} />
      </div>
      <div className="w-full max-w-md space-y-7 fade-in-up relative z-10">
        <div className="text-center space-y-3">
          <div className="float-animation inline-flex items-center justify-center w-20 h-20 rounded-2xl border relative" style={{ background: ts.logoBg, borderColor: ts.logoBorder, boxShadow: ts.logoShadow }}>
            <Mail className="w-10 h-10 text-violet-500 dark:text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Vérification requise</h1>
          <p className="text-sm text-muted-foreground">Vérifiez votre email pour accéder à l'application</p>
        </div>
        <div className="rounded-2xl p-6 sm:p-8 shadow-2xl glass-strong" style={{ boxShadow: ts.authCardShadow }}>
          <div className="h-px -mx-6 -mt-6 sm:-mx-8 sm:-mt-8 mb-4" style={{ background: ts.authGradientLine, position: 'relative' }} />
          <p className="text-sm text-muted-foreground mb-4">Un code a été envoyé à <span className="text-foreground font-medium">{email}</span></p>
          <div className="space-y-4">
            <Input value={code} onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              placeholder="000000" className="border text-foreground text-center text-2xl tracking-[0.5em] font-mono placeholder:text-muted-foreground/30 rounded-xl h-14"
              style={{ background: 'var(--input)', borderColor: 'var(--border)' }} maxLength={6} />
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <Button onClick={handleVerify} className="btn-primary-glow w-full text-foreground rounded-xl h-11 font-medium" style={{ background: ts.primaryGradient, boxShadow: ts.primaryBtnShadow }} disabled={loading || code.length !== 6}>
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Vérifier
            </Button>
            <div className="text-center">
              <button onClick={handleResend} disabled={resendCooldown > 0} className="text-sm text-violet-500 hover:text-violet-400 transition-colors font-medium disabled:text-muted-foreground/30 disabled:cursor-not-allowed">
                {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// LIQUIDITY HEATMAP COMPONENT
// ============================================================
function LiquidityHeatmap() {
  const [activeFilter, setActiveFilter] = useState<string>('24h')
  const ts = useThemeStyles()

  const currentPrice = 104250
  const volatility = 4.2
  const liquidations24h = 187

  const priceRange = { min: 95000, max: 115000, step: 250 }
  const gridCols = 10
  const gridRows = 8
  const cellWidth = 100 / gridCols
  const cellHeight = 100 / gridRows

  const totalSteps = Math.floor((priceRange.max - priceRange.min) / priceRange.step)
  const stepsPerRow = Math.floor(totalSteps / gridRows)

  const generateHeatmapData = () => {
    const cells: { price: number; intensity: number; side: 'buy' | 'sell'; liquidity: string }[] = []
    for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < stepsPerRow; col++) {
      const price = priceRange.max - (row * stepsPerRow + col) * priceRange.step
      if (price < priceRange.min || price > priceRange.max) continue
      const distance = Math.abs(price - currentPrice) / (currentPrice * 0.01)
      const isAbove = price > currentPrice
      const side = isAbove ? ('sell' as const) : ('buy' as const)
      // Simulate clusters of liquidity near round numbers
      const roundDist = Math.abs(price % 1000) / 1000
      const clusterBonus = roundDist < 0.02 ? 0.3 : roundDist < 0.05 ? 0.15 : 0
      const proximityBonus = Math.max(0, 1 - distance * 0.04) * 0.3
      const noise = Math.sin(price * 7.3 + row * 13.7) * 0.5 + 0.5
      const intensity = Math.min(1, Math.max(0.05, proximityBonus + clusterBonus + noise * 0.35))
      const liquidity = intensity > 0.7 ? '$XXM+' : intensity > 0.4 ? '$XXM' : intensity > 0.2 ? '$X.XM' : '$X.XK'
      cells.push({ price, intensity, side, liquidity })
    }
    }
    return cells
  }

  const cells = useMemo(() => generateHeatmapData(), [])

  const getCellColor = (intensity: number, side: 'buy' | 'sell') => {
    const maxI = 1
    const n = intensity / maxI
    if (side === 'buy') {
      if (n > 0.7) return `rgba(16, 185, 129, ${0.3 + n * 0.7})`
      if (n > 0.4) return `rgba(52, 211, 153, ${0.2 + n * 0.6})`
      if (n > 0.2) return `rgba(132, 204, 22, ${0.15 + n * 0.45})`
      return `rgba(134, 239, 172, ${0.08 + n * 0.25})`
    } else {
      if (n > 0.7) return `rgba(239, 68, 68, ${0.3 + n * 0.7})`
      if (n > 0.4) return `rgba(248, 113, 113, ${0.2 + n * 0.6})`
      if (n > 0.2) return `rgba(250, 204, 21, ${0.15 + n * 0.45})`
      return `rgba(251, 191, 36, ${0.08 + n * 0.25})`
    }
  }

  const getBorderWidth = (price: number) => {
    const mod = price % 5000
    if (mod === 0) return 2
    if (mod === 2500) return 1.5
    return 1
  }

  const currentRow = Math.floor((priceRange.max - currentPrice) / priceRange.step)
  const currentCol = currentRow % stepsPerRow

  return (
    <Card className="glass-card card-hover border-border rounded-xl overflow-hidden">
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#ef4444,#f59e0b,#10b981,#06b6d4)' }} />
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ts.iconBgViolet }}>
              <Flame className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Carte de Liquidité Bitcoin</p>
              <p className="text-[10px] text-muted-foreground">Zones de liquidité estimées en temps réel</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {['24h', '7d', '30d'].map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                  activeFilter === f
                    ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30'
                    : 'bg-muted/50 text-muted-foreground border border-border hover:bg-muted'
                }`}
              >{f}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 mb-3 text-[10px]">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Activity className="w-3 h-3" />
            <span>Volatilité: <span className="font-semibold text-foreground">{volatility}%</span></span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <FlameKindling className="w-3 h-3" />
            <span>Liquidations 24h: <span className="font-semibold text-foreground">${liquidations24h}M</span></span>
          </div>
        </div>

        {/* Current price indicator */}
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(124,92,252,0.06)' }}>
          <span className="text-[10px] text-muted-foreground">BTC/USD</span>
          <span className="text-xs font-bold text-violet-600 dark:text-violet-400">${currentPrice.toLocaleString('fr-FR')}</span>
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-violet-500" />
        </div>

        {/* Heatmap Grid */}
        <div className="rounded-lg overflow-hidden border border-border/50 p-1" style={{ background: 'rgba(0,0,0,0.02)' }}>
          <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {cells.map((cell, idx) => {
              const isCurrentRow = Math.floor(idx / stepsPerRow) === Math.floor(currentRow / stepsPerRow)
              const isCurrentCol = (idx % stepsPerRow) === currentCol
              const isCurrent = isCurrentRow && isCurrentCol
              return (
                <TooltipProvider key={idx}>
                  <TooltipTrigger asChild>
                    <div
                      className={`heatmap-cell rounded-sm flex items-center justify-center text-[7px] font-mono leading-none ${
                        isCurrent ? 'heatmap-current-line' : ''
                      }`}
                      style={{
                        height: '28px',
                        background: getCellColor(cell.intensity, cell.side),
                        borderBottomWidth: getBorderWidth(cell.price) + 'px',
                        borderBottomColor: isCurrent
                          ? 'rgba(124, 92, 252, 0.8)'
                          : ts.isDark ? 'rgba(124,92,252,0.06)' : 'rgba(109,77,224,0.04)',
                        color: cell.intensity > 0.5
                          ? (ts.isDark ? '#fff' : '#1e293b')
                          : (ts.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'),
                      }}
                      title={`$${cell.price.toLocaleString('fr-FR')} — Liquidité: ${cell.side === 'buy' ? 'Achat' : 'Vente'} (${(cell.intensity * 100).toFixed(0)}%)`}
                    >
                      {cell.price % 1000 === 0 ? (
                        <span className="font-bold" style={{ textShadow: ts.isDark ? '0 0 6px rgba(255,255,255,0.2)' : 'none' }}>
                          {(cell.price / 1000).toFixed(0)}k
                        </span>
                      ) : (
                        <span className="opacity-70">{(cell.price / 1000).toFixed(1)}k</span>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px] px-2 py-1 max-w-[180px]">
                    <p className="font-mono">${cell.price.toLocaleString('fr-FR')}</p>
                    <p className="text-muted-foreground">{cell.side === 'buy' ? '🟢 Achat' : '🔴 Vente'} — {(cell.intensity * 100).toFixed(0)}%</p>
                  </TooltipContent>
                </TooltipProvider>
              )
            })}
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-emerald-500 font-medium">Achat</span>
            <div className="flex gap-0.5">
              {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
                <div key={v} className="w-4 h-2 rounded-sm" style={{ background: getCellColor(v, 'buy') }} />
              ))}
            </div>
            <span className="text-[9px] text-red-500 font-medium">Vente</span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(124,92,252,0.3)', boxShadow: '0 0 6px rgba(124,92,252,0.4)' }} />
            <span>Prix actuel</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// LIVE PRICE TICKER
// ============================================================
function LivePriceTicker({ tokens }: { tokens: TokenData[] }) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [changes, setChanges] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/prices')
        if (res.ok) {
          const data = await res.json()
          if (data.prices) {
            const p: Record<string, number> = {}
            const c: Record<string, number> = {}
            Object.entries(data.prices).forEach(([k, v]: [string, any]) => {
              p[k] = v.USD; c[k] = v.CHANGEPCT24HOUR || 0
            })
            setPrices(p); setChanges(c)
          }
        }
      } catch {}
    }
    fetchPrices(); const i = setInterval(fetchPrices, 60000); return () => clearInterval(i)
  }, [])

  // Sort: BTC first, then by market cap order, limit to 20 for scrolling
  const tickers = tokens
    .filter(t => t.active && prices[t.ticker])
    .sort((a, b) => {
      // BTC always first
      if (a.ticker === 'BTC') return -1
      if (b.ticker === 'BTC') return 1
      // ETH second
      if (a.ticker === 'ETH') return -1
      if (b.ticker === 'ETH') return 1
      // SOL third
      if (a.ticker === 'SOL') return -1
      if (b.ticker === 'SOL') return 1
      return 0
    })
    .slice(0, 20)

  if (tickers.length === 0) return null

  // Duplicate the list for seamless infinite scroll
  const tickerItems = [...tickers, ...tickers]

  return (
    <div className="w-full ticker-marquee-container">
      <div className="ticker-marquee-track">
        {tickerItems.map((t, idx) => {
          const change = changes[t.ticker] || 0
          return (
            <div key={`${t.ticker}-${idx}`} className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/50">
              <TokenLogo ticker={t.ticker} size={18} />
              <span className="text-xs font-semibold text-foreground">{t.ticker}</span>
              <span className="text-xs text-muted-foreground">${fmtPrice(prices[t.ticker])}</span>
              <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// FEAR & GREED WIDGET
// ============================================================
function FearGreedWidget() {
  const [data, setData] = useState<{ value: number; classification: string; history?: { value: number; date: string }[] } | null>(null)

  useEffect(() => {
    const fetchFG = () => {
      fetch('/api/fear-greed').then(r => r.json()).then(d => { if (d.value) setData(d) }).catch(() => {})
    }
    fetchFG()
    const interval = setInterval(fetchFG, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return null

  const getColor = (v: number) => v <= 25 ? '#ef4444' : v <= 45 ? '#f97316' : v <= 55 ? '#eab308' : v <= 75 ? '#84cc16' : '#10b981'

  // Determine buy/sell signal based on Fear & Greed value
  const getSignal = (v: number) => {
    if (v <= 20) return { label: 'Achat Fort', emoji: '🟢', advice: 'Marché en panique extrême — Opportunité d\'achat historique', color: '#10b981', type: 'buy' }
    if (v <= 35) return { label: 'Achat', emoji: '🟢', advice: 'Peur dominante — Bon moment pour accumuler', color: '#22c55e', type: 'buy' }
    if (v <= 45) return { label: 'Achat Modéré', emoji: '🟡', advice: 'Légère peur — Positions progressives recommandées', color: '#eab308', type: 'cautious_buy' }
    if (v <= 55) return { label: 'Neutre', emoji: '🟡', advice: 'Sentiment neutre — Maintenir les positions actuelles', color: '#eab308', type: 'neutral' }
    if (v <= 65) return { label: 'Prudence', emoji: '🟠', advice: 'Cupidité croissante — Réduire les achats', color: '#f97316', type: 'cautious_sell' }
    if (v <= 80) return { label: 'Vente Partielle', emoji: '🔴', advice: 'Cupidité forte — Prendre des profits partiels', color: '#ef4444', type: 'sell' }
    return { label: 'Vente Forte', emoji: '🔴', advice: 'Cupidité extrême — Risque de correction élevé', color: '#dc2626', type: 'sell' }
  }

  const signal = getSignal(data.value)

  return (
    <Card className="glass-card card-hover border-border rounded-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${getColor(data.value)}15` }}>
            <Gauge className="w-6 h-6" style={{ color: getColor(data.value) }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Fear & Greed Index</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold" style={{ color: getColor(data.value) }}>{data.value}</span>
              <Badge variant="secondary" className="text-[10px]" style={{ background: `${getColor(data.value)}15`, color: getColor(data.value) }}>
                {data.classification}
              </Badge>
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${data.value}%`, background: `linear-gradient(90deg, ${getColor(0)}, ${getColor(data.value)})` }} />
        </div>
        {/* Buy/Sell Signal */}
        <div className="rounded-lg p-2.5 border" style={{ background: `${signal.color}08`, borderColor: `${signal.color}25` }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm">{signal.emoji}</span>
            <span className="text-xs font-bold" style={{ color: signal.color }}>{signal.label}</span>
            {(signal.type === 'buy' || signal.type === 'cautious_buy') && <ArrowUpCircle className="w-3.5 h-3.5 ml-auto" style={{ color: signal.color }} />}
            {(signal.type === 'sell' || signal.type === 'cautious_sell') && <ArrowDownCircle className="w-3.5 h-3.5 ml-auto" style={{ color: signal.color }} />}
            {signal.type === 'neutral' && <Minus className="w-3.5 h-3.5 ml-auto" style={{ color: signal.color }} />}
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{signal.advice}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// TOKEN SIGNALS WIDGET
// ============================================================
function TokenSignals({ tokens }: { tokens: TokenDashboard[] }) {
  if (tokens.length === 0) return null

  return (
    <Card className="glass-card card-hover border-border rounded-xl">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />Signaux du portefeuille
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {tokens.slice(0, 8).map(t => {
            const isUp = t.rentabilite >= 0
            return (
              <div key={t.ticker} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <TokenLogo ticker={t.ticker} size={20} />
                <span className="text-xs font-semibold text-foreground w-10">{t.ticker}</span>
                <div className="flex-1 min-w-0">
                  <Progress value={Math.min(Math.abs(t.rentabilite * 100), 100)} className="h-1.5" />
                </div>
                <span className={`text-xs font-bold ${plColor(t.rentabilite)}`}>{fmtPct(t.rentabilite)}</span>
                {isUp ? <ArrowUpCircle className="w-4 h-4 text-emerald-500" /> : <ArrowDownCircle className="w-4 h-4 text-red-500" />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ tokens: allTokens, userRole }: { tokens: TokenData[]; userRole: string }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const ts = useThemeStyles()

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) { const data = await res.json(); setDashboard(data) }
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchDashboard()
    // Auto-refresh dashboard every 60 seconds
    const interval = setInterval(fetchDashboard, 60000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:px-0 md:py-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-muted/30 shimmer" />)}
        </div>
        <div className="h-64 rounded-xl bg-muted/30 shimmer" />
      </div>
    )
  }

  const d = dashboard || { investissementTotal: 0, valeurActuelle: 0, pl: 0, roi: 0, tokens: [] }
  const isPremium = userRole === 'user_premium' || userRole === 'admin'

  const kpis = [
    { label: 'Investissement', value: d.investissementTotal, icon: DollarSign, barClass: 'kpi-bar-violet', iconBg: ts.iconBgViolet, prefix: '$' },
    { label: 'Valeur actuelle', value: d.valeurActuelle, icon: Wallet, barClass: 'kpi-bar-cyan', iconBg: ts.iconBgCyan, prefix: '$' },
    { label: 'P&L', value: d.pl, icon: d.pl >= 0 ? TrendingUp : TrendingDown, barClass: d.pl >= 0 ? 'kpi-bar-emerald' : 'kpi-bar-red', iconBg: d.pl >= 0 ? ts.iconBgEmerald : ts.iconBgAmber, prefix: '$', color: d.pl >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'ROI', value: d.roi * 100, icon: Activity, barClass: d.roi >= 0 ? 'kpi-bar-emerald' : 'kpi-bar-red', iconBg: d.roi >= 0 ? ts.iconBgEmerald : ts.iconBgAmber, suffix: '%', color: d.roi >= 0 ? 'text-emerald-500' : 'text-red-500' },
  ]

  const barChartData = d.tokens.map(t => ({ name: t.ticker, pl: Math.round(t.pl * 100) / 100 }))
  const pieChartData = d.tokens.map(t => ({ name: t.ticker, value: Math.round(t.valeurActuelle * 100) / 100 }))

  return (
    <div className="space-y-3 md:space-y-4 page-transition">
      {/* Live Price Ticker */}
      <LivePriceTicker tokens={allTokens} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-2 md:gap-3 card-stagger">
        {kpis.map((kpi, i) => (
          <Card key={i} className={`glass-card card-hover border-border rounded-xl ${kpi.barClass} kpi-value-animate stagger-${i + 1}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: kpi.iconBg }}>
                  <kpi.icon className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                </div>
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium truncate">{kpi.label}</span>
              </div>
              <p className={`text-base lg:text-lg font-bold truncate ${kpi.color || 'text-foreground'}`}>
                {kpi.prefix}{kpi.suffix === '%' ? kpi.value.toFixed(2) + '%' : fmt(Math.abs(kpi.value))}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {d.tokens.length === 0 ? (
        <Card className="glass-card border-border rounded-xl">
          <CardContent className="p-8 text-center">
            <Wallet className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Aucune transaction</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Ajoutez des transactions pour voir votre portefeuille</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Portfolio Table */}
          <Card className="glass-card border-border rounded-xl">
            <CardHeader className="p-3 md:p-4 pb-2">
              <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-500" />Portefeuille
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
                {/* Compact table — all screens, all columns on one line */}
                <div className="overflow-x-auto scrollbar-none -mx-2 px-2">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[9px] md:text-[10px] px-1 md:px-2 py-1.5">Token</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">Investi</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">Qté</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">PRU</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">Prix</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">Valeur</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">P&L</TableHead>
                      <TableHead className="text-[9px] md:text-[10px] text-right px-1 md:px-2 py-1.5">ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.tokens.map(t => (
                      <TableRow key={t.ticker} className="data-row-hover">
                        <TableCell className="px-1 md:px-2 py-1.5 md:py-2">
                          <div className="flex items-center gap-1 md:gap-2">
                            <TokenLogo ticker={t.ticker} size={22} />
                            <div className="min-w-0">
                              <p className="text-[10px] md:text-xs font-semibold text-foreground truncate leading-tight">{t.ticker}</p>
                              <p className="text-[8px] md:text-[10px] text-muted-foreground truncate leading-tight max-md:hidden">{t.name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] md:text-xs text-right text-muted-foreground whitespace-nowrap px-1 md:px-2 py-1.5 md:py-2">${fmt(t.montantInvesti)}</TableCell>
                        <TableCell className="text-[10px] md:text-xs text-right text-muted-foreground whitespace-nowrap px-1 md:px-2 py-1.5 md:py-2">{fmtQty(t.quantite)}</TableCell>
                        <TableCell className="text-[10px] md:text-xs text-right text-muted-foreground whitespace-nowrap px-1 md:px-2 py-1.5 md:py-2">${fmtPrice(t.pru)}</TableCell>
                        <TableCell className="text-[10px] md:text-xs text-right font-medium text-foreground whitespace-nowrap px-1 md:px-2 py-1.5 md:py-2">${fmtPrice(t.currentPrice)}</TableCell>
                        <TableCell className="text-[10px] md:text-xs text-right text-muted-foreground whitespace-nowrap px-1 md:px-2 py-1.5 md:py-2">${fmt(t.valeurActuelle)}</TableCell>
                        <TableCell className={`text-[10px] md:text-xs text-right font-semibold whitespace-nowrap px-1 md:px-2 py-1.5 md:py-2 ${plColor(t.pl)}`}>{t.pl >= 0 ? '+' : ''}${fmt(Math.abs(t.pl))}</TableCell>
                        <TableCell className="text-right px-1 md:px-2 py-1.5 md:py-2">
                          <Badge variant="secondary" className={`text-[9px] md:text-[10px] font-bold ${plBg(t.rentabilite)}`}>
                            {fmtPct(t.rentabilite)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            {/* P&L Bar Chart */}
            <Card className="glass-card border-border rounded-xl">
              <CardHeader className="p-3 md:p-4 pb-2">
                <CardTitle className="text-xs md:text-sm font-semibold">P&L par token</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="h-48 md:h-52 lg:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                      <Tooltip
                        contentStyle={{
                          background: ts.chartTooltipBg,
                          border: `1px solid ${ts.chartTooltipBorder}`,
                          borderRadius: 12,
                          fontSize: 12,
                          color: ts.isDark ? '#e5e5e5' : '#1e293b',
                        }}
                        itemStyle={{ color: ts.isDark ? '#e5e5e5' : '#1e293b' }}
                        labelStyle={{ color: ts.isDark ? '#e5e5e5' : '#1e293b' }}
                        formatter={(value: number, name: string) => [`${fmtPct(value)}`, name]}
                      />
                      <Bar dataKey="pl" radius={[4, 4, 0, 0]}>
                        {barChartData.map((entry, i) => <Cell key={i} fill={entry.pl >= 0 ? '#10b981' : '#ef4444'} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            <Card className="glass-card border-border rounded-xl">
              <CardHeader className="p-3 md:p-4 pb-2">
                <CardTitle className="text-xs md:text-sm font-semibold">Répartition</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-4 pt-0">
                <div className="h-48 md:h-52 lg:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                        {pieChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: ts.chartTooltipBg,
                          border: `1px solid ${ts.chartTooltipBorder}`,
                          borderRadius: 12,
                          fontSize: 12,
                          color: ts.isDark ? '#e5e5e5' : '#1e293b',
                        }}
                        itemStyle={{ color: ts.isDark ? '#e5e5e5' : '#1e293b' }}
                        labelStyle={{ color: ts.isDark ? '#e5e5e5' : '#1e293b' }}
                        formatter={(value: number, name: string) => [`${fmt(value)} €`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {pieChartData.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-1">
                      <TokenLogo ticker={t.name} size={14} />
                      <span className="text-[10px] text-muted-foreground">{t.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Widgets Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <FearGreedWidget />
            <TokenSignals tokens={d.tokens} />
          </div>

          </>
      )}
    </div>
  )
}

// ============================================================
// TRANSACTIONS VIEW
// ============================================================
function TransactionsView({ userRole }: { userRole: string }) {
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [exchanges, setExchanges] = useState<ExchangeData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [tokenFilter, setTokenFilter] = useState<string>('all')
  const isPremium = userRole === 'user_premium' || userRole === 'admin'

  // Form state
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formToken, setFormToken] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formBuyPrice, setFormBuyPrice] = useState('')
  const [formExchange, setFormExchange] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [tokenSearch, setTokenSearch] = useState('')
  const [tokenSearchOpen, setTokenSearchOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [txRes, tokRes, exRes] = await Promise.all([
        fetch('/api/transactions'), fetch('/api/tokens'), fetch('/api/exchanges')
      ])
      if (txRes.ok) setTransactions(await txRes.json())
      if (tokRes.ok) setTokens((await tokRes.json()).filter((t: TokenData) => t.active))
      if (exRes.ok) setExchanges((await exRes.json()).filter((e: ExchangeData) => e.active))
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredTokens = tokens.filter(t => t.ticker.toLowerCase().includes(tokenSearch.toLowerCase()) || t.name.toLowerCase().includes(tokenSearch.toLowerCase()))
  const filteredTx = transactions.filter(tx => {
    const matchSearch = tx.tokenTicker.toLowerCase().includes(searchTerm.toLowerCase()) || tx.token.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchFilter = tokenFilter === 'all' || tx.tokenTicker === tokenFilter
    return matchSearch && matchFilter
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formToken || !formAmount || !formBuyPrice) { toast.error('Veuillez remplir tous les champs requis'); return }
    const amount = parseFloat(formAmount)
    const price = parseFloat(formBuyPrice)
    if (isNaN(amount) || amount <= 0) { toast.error('Le montant doit être supérieur à 0'); return }
    if (isNaN(price) || price <= 0) { toast.error('Le prix d\'achat doit être supérieur à 0'); return }
    setFormLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formDate, tokenTicker: formToken, montantInvesti: amount, coursAchat: price, exchangeId: formExchange || null, notes: formNotes || null }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Transaction ajoutée !'); setShowForm(false); resetForm(); fetchData()
      } else {
        if (data.detail) toast.error(data.detail); else toast.error(data.error || 'Erreur')
      }
    } catch { toast.error('Erreur réseau') } finally { setFormLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette transaction ?')) return
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Transaction supprimée'); fetchData() }
      else toast.error('Erreur lors de la suppression')
    } catch { toast.error('Erreur réseau') }
  }

  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0]); setFormToken(''); setFormAmount(''); setFormBuyPrice(''); setFormExchange(''); setFormNotes(''); setTokenSearch(''); setTokenSearchOpen(false)
  }

  const uniqueTickers = [...new Set(transactions.map(t => t.tokenTicker))]

  if (loading) {
    return <div className="space-y-4 p-4 md:px-0 md:py-3"><div className="h-20 rounded-xl bg-muted/30 shimmer" /><div className="h-64 rounded-xl bg-muted/30 shimmer" /></div>
  }

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Transactions</h2>
          <p className="text-xs text-muted-foreground">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="btn-primary-glow text-foreground rounded-xl h-10 gap-2" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }}>
          <Plus className="w-4 h-4" />Ajouter
        </Button>
      </div>

      {/* Free tier notice */}
      {!isPremium && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-600 dark:text-amber-400">Plan gratuit : 3 tokens max, 10 transactions max</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-input border-border" />
        </div>
        <Select value={tokenFilter} onValueChange={setTokenFilter}>
          <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl"><SelectValue placeholder="Token" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {uniqueTickers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      {filteredTx.length === 0 ? (
        <Card className="glass-card border-border rounded-xl">
          <CardContent className="p-8 text-center">
            <ArrowLeftRight className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">Aucune transaction</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredTx.map(tx => (
            <Card key={tx.id} className="glass-card border-border rounded-xl">
              <CardContent className="p-2.5 md:p-3">
                <div className="flex items-center gap-2 md:gap-3 whitespace-nowrap">
                  <TokenLogo ticker={tx.tokenTicker} size={28} className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span className="text-xs md:text-sm font-semibold text-foreground truncate">{tx.tokenTicker}</span>
                      {tx.exchange && <Badge variant="secondary" className="text-[9px] md:text-[10px] shrink-0">{tx.exchange.name}</Badge>}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground whitespace-nowrap">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs md:text-sm font-semibold text-foreground whitespace-nowrap">${fmt(tx.montantInvesti)}</p>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground whitespace-nowrap">{fmtQty(tx.quantite)} @ ${fmtPrice(tx.coursAchat)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 shrink-0 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(tx.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Transaction Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="dialog-mobile-fullscreen sm:max-w-md rounded-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-violet-500" />Nouvelle transaction</DialogTitle>
            <DialogDescription>Ajoutez un achat crypto à votre portefeuille</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Date</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="h-10 rounded-xl bg-input border-border" required />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Token</Label>
                <Popover open={tokenSearchOpen} onOpenChange={setTokenSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={tokenSearchOpen}
                      className="h-10 rounded-xl w-full justify-between font-normal text-muted-foreground">
                      {formToken ? (() => {
                        const t = tokens.find(tk => tk.ticker === formToken)
                        return t ? <div className="flex items-center gap-2"><TokenLogo ticker={t.ticker} size={16} /><span>{t.ticker}</span><span className="text-muted-foreground text-xs">{t.name}</span></div> : formToken
                      })() : 'Sélectionner un token'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un token..." value={tokenSearch} onValueChange={setTokenSearch} />
                      <CommandList>
                        <CommandEmpty>Aucun token trouvé.</CommandEmpty>
                        <CommandGroup className="max-h-60 overflow-y-auto">
                          {filteredTokens.map(t => (
                            <CommandItem key={t.ticker} value={`${t.ticker} ${t.name}`}
                              onSelect={() => { setFormToken(t.ticker); setTokenSearch(''); setTokenSearchOpen(false) }}>
                              <Check className={cn("mr-2 h-4 w-4 shrink-0", formToken === t.ticker ? "opacity-100" : "opacity-0")} />
                              <TokenLogo ticker={t.ticker} size={16} />
                              <span className="ml-1">{t.ticker}</span>
                              <span className="ml-1 text-muted-foreground text-xs">{t.name}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Montant ($)</Label>
                  <Input type="number" step="0.01" placeholder="100" value={formAmount} onChange={(e) => setFormAmount(e.target.value)}
                    className="h-10 rounded-xl bg-input border-border" required />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Prix d'achat ($)</Label>
                  <Input type="number" step="0.00001" placeholder="0.00" value={formBuyPrice} onChange={(e) => setFormBuyPrice(e.target.value)}
                    className="h-10 rounded-xl bg-input border-border" required />
                </div>
              </div>
              {formAmount && formBuyPrice && parseFloat(formBuyPrice) > 0 && (
                <p className="text-xs text-muted-foreground">Quantité : {(parseFloat(formAmount) / parseFloat(formBuyPrice)).toFixed(6)}</p>
              )}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Exchange (optionnel)</Label>
                <Select value={formExchange} onValueChange={setFormExchange}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {exchanges.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Notes (optionnel)</Label>
                <Input placeholder="Notes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                  className="h-10 rounded-xl bg-input border-border" />
              </div>
            </div>
            {/* Boutons toujours visibles en bas */}
            <div className="shrink-0 flex gap-2 justify-end pt-3 border-t border-border">
              <DialogClose asChild><Button type="button" variant="ghost" className="rounded-xl h-10">Annuler</Button></DialogClose>
              <Button type="submit" className="btn-primary-glow text-foreground rounded-xl h-10" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }} disabled={formLoading}>
                {formLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}Ajouter
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// AI ANALYSIS VIEW (Premium)
// ============================================================
function AIAnalysisView({ tokens, userRole, setView }: { tokens: TokenData[]; userRole: string; setView: (v: View) => void }) {
  const [selectedTicker, setSelectedTicker] = useState('')
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ ticker: string; signal: string; confidence: number; date: string }[]>([])
  const [tokenSearch, setTokenSearch] = useState('')
  const isPremium = userRole === 'user_premium' || userRole === 'admin'
  const ts = useThemeStyles()

  useEffect(() => {
    try { const h = localStorage.getItem('ai-analysis-history'); if (h) setHistory(JSON.parse(h)) } catch {}
  }, [])

  const saveHistory = (h: typeof history) => {
    setHistory(h); try { localStorage.setItem('ai-analysis-history', JSON.stringify(h)) } catch {}
  }

  const runAnalysis = async () => {
    if (!selectedTicker) { toast.error('Sélectionnez un token'); return }
    setLoading(true); setAnalysis(null)
    try {
      const token = tokens.find(t => t.ticker === selectedTicker)
      const res = await fetch('/api/ai-analysis', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: selectedTicker, name: token?.name || selectedTicker }),
      })
      const data = await res.json()
      if (res.ok) {
        setAnalysis(data)
        const newEntry = { ticker: selectedTicker, signal: data.signal, confidence: data.confidence, date: new Date().toISOString() }
        saveHistory([newEntry, ...history.slice(0, 19)])
      } else { toast.error(data.error || 'Erreur lors de l\'analyse') }
    } catch { toast.error('Erreur réseau') } finally { setLoading(false) }
  }

  const filteredTokens = tokens.filter(t => t.ticker.toLowerCase().includes(tokenSearch.toLowerCase()) || t.name.toLowerCase().includes(tokenSearch.toLowerCase()))

  const signalConfig: Record<string, { color: string; bg: string; icon: typeof TrendingUp }> = {
    ACHAT: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: TrendingUp },
    VENTE: { color: 'text-red-500', bg: 'bg-red-500/10', icon: TrendingDown },
    NEUTRE: { color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Minus },
  }

  if (!isPremium) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="glass-card border-border rounded-xl max-w-sm w-full text-center p-8">
          <Crown className="w-16 h-16 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Fonctionnalité Premium</h2>
          <p className="text-sm text-muted-foreground mb-4">L'analyse IA est réservée aux membres Premium</p>
          <button
            type="button"
            className="btn-primary-glow text-foreground rounded-xl h-11 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium w-full"
            style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
            onClick={(e) => {
              e.stopPropagation()
              console.log('[Premium] clicked, navigating to profile')
              setView('profile')
            }}
          >
            <Crown className="w-4 h-4" />Devenir Premium
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Brain className="w-5 h-5 text-violet-500" />Prédict AI
      </h2>

      {/* Token selector */}
      <Card className="glass-card border-border rounded-xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-medium">Token à analyser</Label>
              <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="Sélectionner un token" /></SelectTrigger>
                <SelectContent>
                  <div className="p-2"><Input placeholder="Rechercher..." value={tokenSearch} onChange={(e) => setTokenSearch(e.target.value)} className="h-8 rounded-lg text-sm mb-2" /></div>
                  {filteredTokens.map(t => (
                    <SelectItem key={t.ticker} value={t.ticker}>
                      <div className="flex items-center gap-2"><TokenLogo ticker={t.ticker} size={16} /><span>{t.ticker}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={runAnalysis} className="btn-primary-glow text-foreground rounded-xl h-10 gap-2 w-full sm:w-auto" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }} disabled={loading || !selectedTicker}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Analyser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <Card className="glass-card border-border rounded-xl">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto text-violet-500 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Analyse en cours... Cela peut prendre quelques secondes</p>
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysis && !loading && (
        <div className="space-y-4">
          {/* Signal Card */}
          <Card className="glass-card border-border rounded-xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {(() => {
                  const cfg = signalConfig[analysis.signal] || signalConfig.NEUTRE
                  const Icon = cfg.icon
                  return (
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${cfg.bg}`}>
                      <Icon className={`w-10 h-10 ${cfg.color}`} />
                    </div>
                  )
                })()}
                <div className="text-center sm:text-left flex-1">
                  <p className="text-xs text-muted-foreground font-medium">Signal</p>
                  <p className={`text-3xl font-bold ${signalConfig[analysis.signal]?.color || 'text-amber-500'}`}>{analysis.signal}</p>
                  <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
                    <Progress value={analysis.confidence} className="h-2 flex-1 max-w-32" />
                    <span className="text-sm font-semibold text-foreground">{analysis.confidence}%</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          {/* Technical + Sentiment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-border rounded-xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-violet-500" />Analyse technique</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {[
                  { label: 'Tendance', value: analysis.technicalAnalysis.trend },
                  { label: 'Support', value: analysis.technicalAnalysis.supportLevel },
                  { label: 'Résistance', value: analysis.technicalAnalysis.resistanceLevel },
                  { label: 'RSI', value: analysis.technicalAnalysis.rsiApprox },
                  { label: 'Volume 24h', value: analysis.technicalAnalysis.volume24h },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-xs font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card border-border rounded-xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Gauge className="w-4 h-4 text-cyan-500" />Sentiment</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Fear & Greed</span>
                  <span className="text-xs font-medium text-foreground">{analysis.sentiment.fearGreedIndex} — {analysis.sentiment.fearGreedLabel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Interprétation</span>
                  <span className="text-xs font-medium text-foreground text-right max-w-[60%]">{analysis.sentiment.interpretation}</span>
                </div>
                <Separator />
                <p className="text-xs text-muted-foreground">{analysis.newsImpact}</p>
              </CardContent>
            </Card>
          </div>

          {/* Key Factors & Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-border rounded-xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Facteurs clés</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {analysis.keyFactors.map((f, i) => (
                  <div key={i} className="flex items-start gap-2"><Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /><span className="text-xs text-foreground">{f}</span></div>
                ))}
              </CardContent>
            </Card>
            <Card className="glass-card border-border rounded-xl">
              <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" />Risques</CardTitle></CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {analysis.risks.map((r, i) => (
                  <div key={i} className="flex items-start gap-2"><X className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" /><span className="text-xs text-foreground">{r}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-muted-foreground/60 text-center px-4">{analysis.disclaimer}</p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="glass-card border-border rounded-xl">
          <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold">Historique</CardTitle></CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <TokenLogo ticker={h.ticker} size={20} />
                    <span className="text-xs font-semibold text-foreground">{h.ticker}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] font-bold ${signalConfig[h.signal]?.bg || ''} ${signalConfig[h.signal]?.color || ''}`}>{h.signal}</Badge>
                    <span className="text-xs text-muted-foreground">{h.confidence}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// HOME / ACCUEIL VIEW — AI Tips, News, Market Overview
// ============================================================
function HomeView({ tokens: allTokens }: { tokens: TokenData[] }) {
  const [tips, setTips] = useState<string[]>([])
  const [tipsLoading, setTipsLoading] = useState(true)
  const [news, setNews] = useState<any[]>([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [globalData, setGlobalData] = useState<any>(null)
  const [activeTip, setActiveTip] = useState(0)
  const ts = useThemeStyles()

  const fetchGlobalData = useCallback(async () => {
    try {
      const res = await fetch('/api/cmc/global')
      const d = await res.json()
      if (d.data) setGlobalData(d.data)
    } catch {}
  }, [])

  // Fetch news
  const fetchNews = useCallback(async () => {
    try {
      const r = await fetch('/api/news')
      const d = await r.json()
      if (d.news) setNews(d.news)
      setNewsLoading(false)
    } catch { setNewsLoading(false) }
  }, [])

  useEffect(() => {
    // Fetch AI tips
    fetch('/api/ai-tips')
      .then(r => r.json())
      .then(d => { setTips(d.tips || []); setTipsLoading(false) })
      .catch(() => setTipsLoading(false))

    // Fetch news from @crypto_detente
    fetchNews()

    // Fetch global market data
    fetchGlobalData()

    // Refresh news every 5 minutes & market data every 60 seconds
    const newsInterval = setInterval(fetchNews, 300000)
    const marketInterval = setInterval(fetchGlobalData, 60000)
    return () => { clearInterval(newsInterval); clearInterval(marketInterval) }
  }, [fetchGlobalData, fetchNews])

  // Auto-rotate tips
  useEffect(() => {
    if (tips.length <= 1) return
    const interval = setInterval(() => {
      setActiveTip(prev => (prev + 1) % tips.length)
    }, 8000)
    return () => clearInterval(interval)
  }, [tips.length])

  const getDateStr = (dateStr: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
      if (diff < 60) return `Il y a ${diff}min`
      if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    } catch { return dateStr }
  }

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ts.iconBgViolet }}>
          <Home className="w-5 h-5 text-violet-500" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">Accueil</h2>
          <p className="text-xs text-muted-foreground">Conseils IA, actualités et marché crypto</p>
        </div>
      </div>

      {/* Global Market Metrics */}
      {globalData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 card-stagger">
          {[
            { label: 'Market Cap', value: `$${((globalData.quote?.USD?.total_market_cap || 0) / 1e12).toFixed(2)}T`, icon: DollarSign, bg: ts.iconBgViolet },
            { label: 'Volume 24h', value: `$${((globalData.quote?.USD?.total_volume_24h || 0) / 1e9).toFixed(2)}B`, icon: BarChart3, bg: ts.iconBgCyan },
            { label: 'BTC Dominance', value: `${(globalData.btc_dominance || 0).toFixed(1)}%`, icon: TrendingUp, bg: ts.iconBgEmerald },
            { label: 'Cryptos actives', value: globalData.active_cryptocurrencies?.toLocaleString() || '—', icon: Coins, bg: ts.iconBgAmber },
          ].map((m, i) => (
            <Card key={i} className="glass-card card-hover border-border rounded-xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: m.bg }}>
                    <m.icon className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">{m.label}</span>
                </div>
                <p className="text-sm font-bold text-foreground">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Live Ticker */}
      <Card className="glass-card card-hover border-border rounded-xl">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-500" />Prix en direct
          </CardTitle>
        </CardHeader>
          <CardContent className="p-3 pt-0">
            <LivePriceTicker tokens={allTokens} />
          </CardContent>
        </Card>

      {/* Fear & Greed Index */}
      <FearGreedIndex showChart={false} />

      {/* Section Separator */}
      <hr className="section-separator" />

      {/* AI Tips Section */}
      <Card className="glass-card card-hover border-border rounded-xl overflow-hidden">
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#7c5cfc,#06b6d4,#a78bfa)' }} />
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-500" />Conseils IA du jour
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-violet-500/10 text-violet-500">Auto-généré</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          {tipsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/30 shimmer" />)}
            </div>
          ) : tips.length > 0 ? (
            <div className="space-y-2">
              {tips.map((tip, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-all duration-500 ${i === activeTip ? 'ring-1 ring-violet-500/30 bg-violet-500/5' : 'hover:bg-muted/30'}`}
                  onClick={() => setActiveTip(i)}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${i === activeTip ? 'bg-violet-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                    <Lightbulb className="w-3 h-3" />
                  </div>
                  <p className="text-xs text-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Impossible de charger les conseils IA pour le moment.</p>
          )}
        </CardContent>
      </Card>

      {/* Section Separator */}
      <hr className="section-separator" />

      {/* Crypto News Section */}
      <Card className="glass-card card-hover border-border rounded-xl overflow-hidden">
        <div className="h-0.5" style={{ background: 'linear-gradient(90deg,#06b6d4,#f59e0b,#06b6d4)' }} />
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold flex items-center gap-2">
              <Newspaper className="w-3.5 h-3.5 text-cyan-500" />Actualités Crypto
            </CardTitle>
            <a
              href="https://x.com/crypto_detente"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-400 transition-colors font-medium"
            >
              <Globe className="w-3 h-3" />@crypto_detente
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          {newsLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted/30 shimmer" />)}
            </div>
          ) : news.length > 0 ? (
            <div className="space-y-2">
              {news.slice(0, 6).map((item: any, i: number) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-violet-500 transition-colors line-clamp-2">{item.title}</p>
                    {item.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                      <span className="text-[9px] text-muted-foreground/60">{getDateStr(item.pubDate)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-violet-500 transition-colors shrink-0 mt-3" />
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ background: ts.iconBgCyan }}>
                <Newspaper className="w-7 h-7 text-cyan-500" />
              </div>
              <p className="text-xs font-medium text-foreground mb-1">Suivez Crypto Détente</p>
              <p className="text-[10px] text-muted-foreground mb-3">Actualités, analyses et conseils crypto quotidiens</p>
              <a
                href="https://x.com/crypto_detente"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                style={{ background: ts.primaryGradient }}
              >
                <ExternalLink className="w-3 h-3" />Voir sur X
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premium CTA Section */}
      <Card className="rounded-xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.08), rgba(6,182,212,0.06), rgba(168,85,247,0.05))', border: '1px solid rgba(124,92,252,0.15)' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706,#f59e0b)' }} />
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-foreground">Prédict AI Premium</h3>
                <Badge variant="secondary" className="text-[9px] px-1.5 bg-amber-500/10 text-amber-500 font-bold">9.99$/mois</Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
                Débloquez les analyses IA avancées, les signaux de trading en temps réel, les alertes personnalisées et l&apos;export de vos données.
              </p>
              <div className="grid grid-cols-2 gap-1.5 mb-3">
                {[
                  { icon: Brain, label: 'Analyses IA avancées', color: '#7c5cfc' },
                  { icon: Zap, label: 'Signaux de trading', color: '#f59e0b' },
                  { icon: AlertTriangle, label: 'Alertes personnalisées', color: '#ef4444' },
                  { icon: BarChart3, label: 'Export de données', color: '#06b6d4' },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <f.icon className="w-3 h-3 shrink-0" style={{ color: f.color }} />
                    <span className="text-[10px] text-muted-foreground">{f.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60">
                <span>1 mois, 3 mois (-10%), 6 mois (-15%), 12 mois (-20%)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card card-hover border-border rounded-xl">
          <CardContent className="p-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: ts.iconBgViolet }}>
              <TrendingUp className="w-4 h-4 text-violet-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Analyse de marché</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Dashboard en temps réel avec P&L et ROI par token</p>
          </CardContent>
        </Card>
        <Card className="glass-card card-hover border-border rounded-xl">
          <CardContent className="p-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: ts.iconBgCyan }}>
              <Shield className="w-4 h-4 text-cyan-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Sécurité</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Données chiffrées, authentification sécurisée</p>
          </CardContent>
        </Card>
        <Card className="glass-card card-hover border-border rounded-xl">
          <CardContent className="p-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: ts.iconBgEmerald }}>
              <Clock className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">Données 24/7</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Prix actualisés, Fear & Greed en continu</p>
          </CardContent>
        </Card>
        <Card className="glass-card card-hover border-border rounded-xl">
          <CardContent className="p-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: ts.iconBgAmber }}>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs font-semibold text-foreground">IA Prédictive</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">Conseils auto-générés basés sur le marché</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ============================================================
// PROMO CODE INPUT (user-facing)
// ============================================================
function PromoCodeInput() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleRedeem = async () => {
    if (!code.trim()) return
    setLoading(true); setResult(null)
    try {
      const res = await fetch('/api/coupons/redeem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ success: true, message: data.message })
        toast.success(data.message)
        setCode('')
        const { update } = await import('next-auth/react')
        await update({})
      } else {
        setResult({ success: false, message: data.error })
        toast.error(data.error)
      }
    } catch {
      setResult({ success: false, message: 'Erreur réseau' })
      toast.error('Erreur réseau')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          placeholder="Entrez votre code promo"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setResult(null) }}
          className="h-10 rounded-xl bg-input border-border font-mono text-sm"
          maxLength={30}
          onKeyDown={(e) => { if (e.key === 'Enter') handleRedeem() }}
        />
        <Button
          onClick={handleRedeem}
          disabled={loading || !code.trim()}
          className="rounded-xl h-10 px-4 text-xs font-medium shrink-0"
          style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }}
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </Button>
      </div>
      {result && (
        <p className={`text-xs mt-2 ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
          {result.success ? <Check className="w-3 h-3 inline mr-1" /> : <X className="w-3 h-3 inline mr-1" />}
          {result.message}
        </p>
      )}
    </div>
  )
}

// ============================================================
// PROFILE VIEW
// ============================================================
function ProfileView({ userRole }: { userRole: string }) {
  const { user, logout } = useAuth()
  const { update: updateSession } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [selectedPlan, setSelectedPlan] = useState(1)
  const [paypalLoading, setPaypalLoading] = useState(false)
  const [paypalError, setPaypalError] = useState('')
  const isPremium = userRole === 'user_premium' || userRole === 'admin'

  useEffect(() => {
    fetch('/api/subscription').then(r => r.json()).then(d => setSubscription(d)).catch(() => {})
  }, [])

  const handlePayPalSubscribe = async () => {
    setPaypalLoading(true)
    setPaypalError('')
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: selectedPlan }),
      })
      const data = await res.json()
      if (res.ok && data.orderID) {
        // Use the approval URL from PayPal (contains proper return/cancel URLs)
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl
        } else {
          // Fallback: construct URL manually
          const isSandbox = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'sandbox'
          const baseUrl = isSandbox
            ? 'https://www.sandbox.paypal.com/checkoutnow'
            : 'https://www.paypal.com/checkoutnow'
          window.location.href = `${baseUrl}?token=${data.orderID}`
        }
      } else {
        setPaypalError(data.error || 'Erreur lors de la création de la commande PayPal')
        toast.error(data.error || 'Erreur PayPal')
      }
    } catch (err: any) {
      setPaypalError('Erreur de connexion au serveur de paiement')
      toast.error('Erreur réseau')
    } finally {
      setPaypalLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error('Remplissez tous les champs'); return }
    if (newPassword.length < 6) { toast.error('6 caractères minimum'); return }
    setPwLoading(true)
    try {
      const res = await fetch('/api/user/update-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Mot de passe modifié !'); setCurrentPassword(''); setNewPassword('') }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') } finally { setPwLoading(false) }
  }

  const handleChangeEmail = async () => {
    if (!newEmail) { toast.error('Entrez un email'); return }
    setEmailLoading(true)
    try {
      const res = await fetch('/api/user/update-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, currentPassword }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Email mis à jour !'); setNewEmail('') }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') } finally { setEmailLoading(false) }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Supprimer votre compte ? Cette action est irréversible.')) return
    try {
      const res = await fetch('/api/user/delete-account', { method: 'POST' })
      if (res.ok) { toast.success('Compte supprimé'); logout() }
      else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 2 Mo)'); return }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) { toast.error('Format non supporté (JPEG, PNG, GIF, WebP)'); return }
    setAvatarUploading(true)
    const formData = new FormData(); formData.append('avatar', file)
    try {
      const res = await fetch('/api/user/upload-avatar', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        toast.success('Avatar mis à jour !')
        // Update avatar display with cache-busting timestamp
        setAvatarUrl(`${data.url}?t=${Date.now()}`)
        // Refresh session to pick up new avatar
        await updateSession({})
      } else toast.error(data.error || 'Erreur lors de l\'upload')
    } catch { toast.error('Erreur réseau') } finally { setAvatarUploading(false) }
  }

  // Resolve avatar URL: local state (fresh upload) > session image > none
  const displayAvatar = avatarUrl || user?.image

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
        <User className="w-5 h-5 text-violet-500" />Profil
      </h2>

      {/* User info */}
      <Card className="glass-card border-border rounded-xl">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-4">
            <div className="avatar-ring">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                {displayAvatar ? <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" /> : <User className="w-8 h-8 text-muted-foreground" />}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 animate-spin text-violet-500" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-foreground truncate">{user?.name || 'Utilisateur'}</p>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={`text-[10px] font-bold ${isPremium ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                  {isPremium ? <><Crown className="w-3 h-3 mr-1" />Premium</> : 'Gratuit'}
                </Badge>
                {userRole === 'admin' && <Badge variant="secondary" className="text-[10px] font-bold bg-violet-500/10 text-violet-500">Admin</Badge>}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className={`cursor-pointer ${avatarUploading ? 'pointer-events-none opacity-50' : ''}`}>
              <span className="inline-flex items-center justify-center gap-2 rounded-xl h-9 px-4 text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors">
                {avatarUploading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {avatarUploading ? 'Envoi en cours...' : "Changer l'avatar"}
              </span>
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
            </label>
          </div>

          {/* Code promo */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-violet-500" />
              <p className="text-sm font-semibold text-foreground">Code promotionnel</p>
            </div>
            <PromoCodeInput />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans — always visible */}
      <Card className="glass-card border-border rounded-xl overflow-hidden">
        <div className="h-1" style={{ background: isPremium ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#7c5cfc,#06b6d4)' }} />
        <CardContent className="p-4 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isPremium ? 'rgba(245,158,11,0.12)' : 'rgba(124,92,252,0.12)' }}>
              <Crown className="w-5 h-5" style={{ color: isPremium ? '#f59e0b' : '#7c5cfc' }} />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Abonnement</p>
              <p className="text-[10px] text-muted-foreground">{isPremium ? 'Votre plan actuel' : 'Choisissez votre plan'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Free Plan */}
            <div className={`p-3 rounded-xl border transition-all ${!isPremium ? 'border-violet-500/30 bg-violet-500/5' : 'border-border opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Gratuit</span>
                <Badge variant="secondary" className={`text-[9px] px-1.5 ${!isPremium ? 'bg-violet-500/10 text-violet-500' : 'bg-muted text-muted-foreground'}`}>
                  {!isPremium ? 'Actuel' : 'Basique'}
                </Badge>
              </div>
              <p className="text-lg font-bold text-foreground mb-2">0$<span className="text-[10px] text-muted-foreground font-normal">/mois</span></p>
              <ul className="space-y-1.5">
                {[
                  'Dashboard de base',
                  '3 tokens maximum',
                  '10 transactions max',
                  'Prix en temps réel',
                  'Fear & Greed Index',
                  'Conseils IA quotidiens',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Check className="w-3 h-3 text-violet-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {!isPremium && (
                <p className="text-[9px] text-violet-500 text-center mt-3 font-medium">Votre plan actuel</p>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`p-3 rounded-xl border transition-all pricing-card-premium relative ${isPremium ? 'border-amber-500/30 bg-amber-500/5' : 'border-border hover:border-amber-500/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500" />Premium
                </span>
                <Badge variant="secondary" className={`text-[9px] px-1.5 font-bold ${isPremium ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-500/15 text-amber-500 animate-pulse'}`}>
                  {isPremium ? 'Actif' : 'Recommandé'}
                </Badge>
              </div>
              <p className="text-lg font-bold text-foreground mb-2">9.99$<span className="text-[10px] text-muted-foreground font-normal">/mois</span></p>
              <ul className="space-y-1.5">
                {[
                  'Tokens et transactions illimités',
                  'Analyses IA avancées',
                  'Signaux de trading',
                  'Alertes personnalisées',
                  'Export de données',
                  'Support prioritaire',
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Star className="w-3 h-3 text-amber-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {isPremium ? (
                <p className="text-[9px] text-amber-500 text-center mt-3 font-medium flex items-center justify-center gap-1">
                  <Crown className="w-3 h-3" />Premium actif
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { months: 1, price: 9.99, badge: '' },
                      { months: 3, price: 26.97, badge: '-10%' },
                      { months: 6, price: 50.95, badge: '-15%' },
                      { months: 12, price: 95.90, badge: '-20%' },
                    ].map(plan => (
                      <button
                        key={plan.months}
                        onClick={() => setSelectedPlan(plan.months)}
                        className={`p-1.5 rounded-lg border text-center transition-all ${
                          selectedPlan === plan.months
                            ? 'border-amber-500/40 bg-amber-500/10'
                            : 'border-border hover:border-amber-500/20'
                        }`}
                      >
                        <p className="text-[9px] text-muted-foreground">{plan.months === 1 ? '1m' : plan.months === 3 ? '3m' : plan.months === 6 ? '6m' : '12m'}</p>
                        <p className="text-[10px] font-bold text-foreground">${plan.price.toFixed(0)}</p>
                      </button>
                    ))}
                  </div>
                  {paypalError && (
                    <p className="text-[10px] text-red-400 text-center">{paypalError}</p>
                  )}
                  <Button
                    onClick={handlePayPalSubscribe}
                    disabled={paypalLoading}
                    className="upgrade-btn-glow text-foreground rounded-lg h-9 w-full text-[11px] font-medium"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}
                  >
                    {paypalLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-1.5" /> : <Crown className="w-3 h-3 mr-1.5" />}
                    S'abonner — {[1,3,6,12].includes(selectedPlan) ? [9.99,26.97,50.95,95.90][[1,3,6,12].indexOf(selectedPlan)].toFixed(2) : '9.99'}$
                  </Button>
                  <p className="text-[8px] text-muted-foreground text-center">Paiement sécurisé via PayPal. Annulable à tout moment.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Offer Banner */}
      <div className="premium-banner rounded-xl p-4 md:p-5 relative" style={{ background: 'linear-gradient(135deg, rgba(124,92,252,0.08), rgba(6,182,212,0.06), rgba(168,85,247,0.04), rgba(245,158,11,0.03))' }}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,92,252,0.12)' }}>
            <Brain className="w-5 h-5 text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground mb-2">🔓 Débloquez tout le potentiel de Prédict AI</p>
            <div className="flex flex-wrap gap-3 mb-3">
              <div className="flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-violet-500" />
                <span className="text-[11px] text-muted-foreground">Analyses IA avancées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span className="text-[11px] text-muted-foreground">Signaux de trading en temps réel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] text-muted-foreground">Alertes personnalisées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] text-muted-foreground">Export de vos données</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/70">Rejoignez le plan Premium pour accéder à ces fonctionnalités exclusives.</p>
          </div>
        </div>
      </div>

      {/* Change Email */}
      <Card className="glass-card border-border rounded-xl">
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold">Changer l'email</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <Input type="password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
          <Input type="email" placeholder="Nouvel email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
          <Button onClick={handleChangeEmail} className="rounded-xl h-9 text-xs" disabled={emailLoading} variant="outline">
            {emailLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : null}Modifier
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card className="glass-card border-border rounded-xl">
        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-semibold">Changer le mot de passe</CardTitle></CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <Input type="password" placeholder="Mot de passe actuel" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
          <Input type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
          <Button onClick={handleChangePassword} className="rounded-xl h-9 text-xs" disabled={pwLoading} variant="outline">
            {pwLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : null}Modifier
          </Button>
        </CardContent>
      </Card>

      {/* Logout & Delete */}
      <div className="space-y-2">
        <Button onClick={logout} variant="outline" className="w-full rounded-xl h-10 gap-2">
          <LogOut className="w-4 h-4" />Se déconnecter
        </Button>
        <Button onClick={handleDeleteAccount} variant="ghost" className="w-full rounded-xl h-10 text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2">
          <Trash2 className="w-4 h-4" />Supprimer le compte
        </Button>
      </div>
    </div>
  )
}

// ============================================================
// ADMIN VIEWS
// ============================================================
function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editRole, setEditRole] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/admin/users'); if (res.ok) setUsers(await res.json()) } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleUpdate = async (id: string, updates: { role?: string; suspended?: boolean; name?: string; email?: string; newPassword?: string }) => {
    try {
      const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
      const data = await res.json()
      if (res.ok) { toast.success('Utilisateur modifié'); fetchUsers() }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  const handleToggleSuspend = async (u: AdminUser) => {
    await handleUpdate(u.id, { suspended: !u.suspended })
  }

  const openEdit = (u: AdminUser) => {
    setEditUser(u); setEditName(u.name || ''); setEditEmail(u.email); setEditRole(u.role); setEditPassword('')
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser) return
    if (!editEmail.trim()) { toast.error("L'email est requis"); return }
    setEditLoading(true)
    try {
      const updates: any = { name: editName.trim() || null, email: editEmail.trim(), role: editRole }
      if (editPassword.trim()) updates.newPassword = editPassword.trim()
      const res = await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editUser.id, ...updates }) })
      const data = await res.json()
      if (res.ok) { toast.success('Utilisateur modifié'); setEditUser(null); fetchUsers() }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') } finally { setEditLoading(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) { toast.success('Utilisateur supprimé'); setDeleteConfirm(null); fetchUsers() }
      else toast.error(data.error || 'Erreur')
    } catch { toast.error('Erreur réseau') } finally { setDeleteLoading(false) }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-4"><div className="h-64 rounded-xl bg-muted/30 shimmer" /></div>

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Shield className="w-5 h-5 text-violet-500" />Gestion des utilisateurs</h2>
        <Badge variant="secondary" className="text-xs">{users.length} utilisateur{users.length !== 1 ? 's' : ''}</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Rechercher un utilisateur..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-input border-border" />
      </div>

      {/* User list */}
      <div className="space-y-2 max-h-[65vh] overflow-y-auto custom-scrollbar">
        {filteredUsers.length === 0 ? (
          <Card className="glass-card border-border rounded-xl">
            <CardContent className="p-8 text-center">
              <User className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé</p>
            </CardContent>
          </Card>
        ) : filteredUsers.map(u => (
          <Card key={u.id} className={`glass-card border-border rounded-xl transition-all ${u.suspended ? 'opacity-60 border-red-500/30' : ''}`}>
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${u.suspended ? 'bg-red-500/10 text-red-500' : 'bg-violet-500/10 text-violet-500'}`}>
                  {u.suspended ? <AlertTriangle className="w-5 h-5" /> : (u.name || u.email).slice(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{u.name || 'Sans nom'}</p>
                    {u.role === 'admin' && <Badge className="text-[9px] px-1.5 py-0 bg-violet-500/10 text-violet-500">Admin</Badge>}
                    {u.role === 'user_premium' && <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-500">Premium</Badge>}
                    {u.suspended && <Badge className="text-[9px] px-1.5 py-0 bg-red-500/10 text-red-500">Suspendu</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">{u._count.transactions} transaction{u._count.transactions !== 1 ? 's' : ''} · Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                {/* Actions — desktop */}
                <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                  <Select value={u.role} onValueChange={(role) => handleUpdate(u.id, { role })}>
                    <SelectTrigger className="h-8 w-24 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user_free">Gratuit</SelectItem>
                      <SelectItem value="user_premium">Premium</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg text-violet-500 border-violet-500/30 hover:bg-violet-500/10"
                    onClick={() => openEdit(u)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant={u.suspended ? 'default' : 'outline'} size="sm"
                    className={`h-8 text-xs rounded-lg ${u.suspended ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-amber-600 border-amber-500/30 hover:bg-amber-500/10'}`}
                    onClick={() => handleToggleSuspend(u)}>
                    {u.suspended ? 'Réactiver' : 'Suspendre'}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    onClick={() => setDeleteConfirm(u.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {/* Actions — mobile */}
                <div className="flex sm:hidden items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-500" onClick={() => openEdit(u)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleSuspend(u)}>
                    {u.suspended ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(u.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null) }}>
        <DialogContent className="dialog-mobile-fullscreen sm:max-w-md rounded-xl">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-violet-500" />Modifier l'utilisateur</DialogTitle>
            <DialogDescription>Modifiez les informations de {editUser?.name || editUser?.email}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Nom</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nom de l'utilisateur"
                  className="h-10 rounded-xl bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Email</Label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@exemple.com" required
                  className="h-10 rounded-xl bg-input border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Rôle</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user_free">Gratuit</SelectItem>
                    <SelectItem value="user_premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Nouveau mot de passe <span className="text-muted-foreground">(optionnel)</span></Label>
                <Input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer"
                  className="h-10 rounded-xl bg-input border-border" />
              </div>
            </div>
            <div className="shrink-0 flex gap-2 justify-end pt-3 border-t border-border">
              <DialogClose asChild><Button type="button" variant="ghost" className="rounded-xl h-10">Annuler</Button></DialogClose>
              <Button type="submit" className="btn-primary-glow text-foreground rounded-xl h-10" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }} disabled={editLoading}>
                {editLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}>
        <DialogContent className="dialog-mobile-fullscreen sm:max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500"><AlertTriangle className="w-5 h-5" />Supprimer cet utilisateur ?</DialogTitle>
            <DialogDescription>Cette action est irréversible. Toutes les données de l'utilisateur (transactions, sessions) seront définitivement supprimées.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl h-10">Annuler</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="rounded-xl h-10 bg-red-600 hover:bg-red-700 text-white" disabled={deleteLoading}>
              {deleteLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminTokensView() {
  const [tokens, setTokens] = useState<AdminToken[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTicker, setFormTicker] = useState('')
  const [formName, setFormName] = useState('')
  const [formCoingecko, setFormCoingecko] = useState('')
  const [formCC, setFormCC] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchTokens = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/admin/tokens'); if (res.ok) setTokens(await res.json()) } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTokens() }, [fetchTokens])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTicker || !formName) { toast.error('Ticker et nom requis'); return }
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: formTicker.toUpperCase(), name: formName, coingeckoId: formCoingecko || null, cryptoCompareId: formCC || null }),
      })
      if (res.ok) { toast.success('Token créé'); setShowForm(false); setFormTicker(''); setFormName(''); setFormCoingecko(''); setFormCC(''); fetchTokens() }
      else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') } finally { setFormLoading(false) }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/tokens', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) })
      if (res.ok) { toast.success('Token modifié'); fetchTokens() } else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce token ?')) return
    try {
      const res = await fetch(`/api/admin/tokens?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Token supprimé'); fetchTokens() } else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Coins className="w-5 h-5 text-violet-500" />Gestion des tokens</h2>
        <Button onClick={() => setShowForm(true)} className="rounded-xl h-9 text-xs gap-2" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }}>
          <Plus className="w-3 h-3" />Ajouter
        </Button>
      </div>
      <div className="space-y-2">
        {tokens.map(t => (
          <Card key={t.id} className="glass-card border-border rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <TokenLogo ticker={t.ticker} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{t.ticker} <span className="text-muted-foreground font-normal">— {t.name}</span></p>
                <p className="text-[10px] text-muted-foreground">{t.currentPrice ? `$${fmtPrice(t.currentPrice)}` : 'Pas de prix'} • {t._count.transactions} tx</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={t.active} onCheckedChange={() => handleToggle(t.id, t.active)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="dialog-mobile-fullscreen sm:max-w-md rounded-xl">
          <DialogHeader><DialogTitle>Ajouter un token</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder="Ticker (ex: BTC)" value={formTicker} onChange={(e) => setFormTicker(e.target.value.toUpperCase())} className="h-10 rounded-xl bg-input border-border" required />
            <Input placeholder="Nom (ex: Bitcoin)" value={formName} onChange={(e) => setFormName(e.target.value)} className="h-10 rounded-xl bg-input border-border" required />
            <Input placeholder="CoinGecko ID (optionnel)" value={formCoingecko} onChange={(e) => setFormCoingecko(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
            <Input placeholder="CryptoCompare ID (optionnel)" value={formCC} onChange={(e) => setFormCC(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
            <DialogFooter><Button type="submit" className="rounded-xl h-10" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }} disabled={formLoading}>Créer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminExchangesView() {
  const [exchanges, setExchanges] = useState<AdminExchange[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchExchanges = useCallback(async () => {
    setLoading(true)
    try { const res = await fetch('/api/admin/exchanges'); if (res.ok) setExchanges(await res.json()) } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchExchanges() }, [fetchExchanges])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName) { toast.error('Nom requis'); return }
    setFormLoading(true)
    try {
      const res = await fetch('/api/admin/exchanges', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.toUpperCase() }),
      })
      if (res.ok) { toast.success('Exchange créé'); setShowForm(false); setFormName(''); fetchExchanges() } else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') } finally { setFormLoading(false) }
  }

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/exchanges', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !active }) })
      if (res.ok) { toast.success('Exchange modifié'); fetchExchanges() } else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet exchange ?')) return
    try {
      const res = await fetch(`/api/admin/exchanges?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Exchange supprimé'); fetchExchanges() } else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') }
  }

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Building2 className="w-5 h-5 text-violet-500" />Gestion des exchanges</h2>
        <Button onClick={() => setShowForm(true)} className="rounded-xl h-9 text-xs gap-2" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }}>
          <Plus className="w-3 h-3" />Ajouter
        </Button>
      </div>
      <div className="space-y-2">
        {exchanges.map(ex => (
          <Card key={ex.id} className="glass-card border-border rounded-xl">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">{ex.name.slice(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                <p className="text-[10px] text-muted-foreground">{ex._count.transactions} transactions</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={ex.active} onCheckedChange={() => handleToggle(ex.id, ex.active)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(ex.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="dialog-mobile-fullscreen sm:max-w-md rounded-xl">
          <DialogHeader><DialogTitle>Ajouter un exchange</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <Input placeholder="Nom (ex: BINANCE)" value={formName} onChange={(e) => setFormName(e.target.value.toUpperCase())} className="h-10 rounded-xl bg-input border-border" required />
            <DialogFooter><Button type="submit" className="rounded-xl h-10" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }} disabled={formLoading}>Créer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AdminPricingView() {
  const [pricing, setPricing] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/pricing').then(r => r.json()).then(d => { setPricing(d); setFormData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      if (res.ok) { toast.success('Tarifs mis à jour'); setPricing(formData) } else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  if (loading) return <div className="p-4"><div className="h-64 rounded-xl bg-muted/30 shimmer" /></div>

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Star className="w-5 h-5 text-violet-500" />Gestion des tarifs</h2>
      <Card className="glass-card border-border rounded-xl">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nom du plan gratuit</Label>
              <Input value={formData?.freeName || ''} onChange={(e) => setFormData({ ...formData, freeName: e.target.value })} className="h-10 rounded-xl bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Nom du plan premium</Label>
              <Input value={formData?.premiumName || ''} onChange={(e) => setFormData({ ...formData, premiumName: e.target.value })} className="h-10 rounded-xl bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Prix mensuel ($)</Label>
              <Input type="number" value={formData?.monthlyPrice || ''} onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) })} className="h-10 rounded-xl bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Prix annuel ($)</Label>
              <Input type="number" value={formData?.yearlyPrice || ''} onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) })} className="h-10 rounded-xl bg-input border-border" />
            </div>
          </div>
          <Button onClick={handleSave} className="rounded-xl h-10" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }} disabled={saving}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}Sauvegarder
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// ADMIN COUPONS VIEW
// ============================================================
interface CouponData {
  id: string; code: string; type: string; value: number | null; maxUses: number | null;
  usedCount: number; active: boolean; expiresAt: string | null; createdAt: string;
  _count: { redemptions: number };
}

function AdminCouponsView() {
  const [coupons, setCoupons] = useState<CouponData[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formType, setFormType] = useState('premium_upgrade')
  const [formValue, setFormValue] = useState('')
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')
  const [formActive, setFormActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) { const data = await res.json(); setCoupons(data) }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchCoupons() }, [])

  const resetForm = () => {
    setEditId(null); setFormCode(''); setFormType('premium_upgrade'); setFormValue('')
    setFormMaxUses(''); setFormExpiresAt(''); setFormActive(true)
  }

  const openCreate = () => { resetForm(); setDialogOpen(true) }

  const openEdit = (c: CouponData) => {
    setEditId(c.id); setFormCode(c.code); setFormType(c.type)
    setFormValue(c.value !== null ? String(c.value) : '')
    setFormMaxUses(c.maxUses !== null ? String(c.maxUses) : '')
    setFormExpiresAt(c.expiresAt ? c.expiresAt.slice(0, 16) : '')
    setFormActive(c.active); setDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const body: any = {
        code: formCode, type: formType,
        value: formValue ? parseFloat(formValue) : null,
        maxUses: formMaxUses ? parseInt(formMaxUses) : null,
        expiresAt: formExpiresAt || null, active: formActive,
      }
      const url = editId
        ? '/api/admin/coupons'
        : '/api/admin/coupons'
      const method = editId ? 'PUT' : 'POST'
      if (editId) body.id = editId

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editId ? 'Coupon modifié' : 'Coupon créé')
        setDialogOpen(false); resetForm(); fetchCoupons()
      } else {
        const d = await res.json(); toast.error(d.error || 'Erreur')
      }
    } catch { toast.error('Erreur réseau') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Coupon supprimé'); fetchCoupons() }
      else toast.error('Erreur')
    } catch { toast.error('Erreur réseau') } finally { setDeleting(null) }
  }

  const toggleActive = async (c: CouponData) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      })
      if (res.ok) { toast.success(c.active ? 'Coupon désactivé' : 'Coupon activé'); fetchCoupons() }
    } catch { toast.error('Erreur') }
  }

  if (loading) return <div className="p-4"><div className="h-64 rounded-xl bg-muted/30 shimmer" /></div>

  return (
    <div className="space-y-4 p-4 md:px-0 md:py-3 page-transition">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Tag className="w-5 h-5 text-violet-500" />Codes promotionnels
        </h2>
        <Button onClick={openCreate} className="rounded-xl h-9 text-xs font-medium" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }}>
          <Plus className="w-4 h-4 mr-1" />Créer un code
        </Button>
      </div>

      {coupons.length === 0 ? (
        <Card className="glass-card border-border rounded-xl">
          <CardContent className="p-8 text-center">
            <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Aucun code promo créé</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Créez votre premier code promotionnel</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map(c => {
            const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date()
            const isFull = c.maxUses !== null && c.usedCount >= c.maxUses
            const statusColor = !c.active ? 'bg-gray-500/10 text-gray-500'
              : isExpired ? 'bg-red-500/10 text-red-500'
              : isFull ? 'bg-amber-500/10 text-amber-500'
              : 'bg-emerald-500/10 text-emerald-500'
            const statusLabel = !c.active ? 'Désactivé'
              : isExpired ? 'Expiré'
              : isFull ? 'Épuisé'
              : 'Actif'

            return (
              <Card key={c.id} className="glass-card border-border rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-foreground bg-muted/50 px-2.5 py-1 rounded-lg">{c.code}</span>
                        <Badge variant="secondary" className={`text-[10px] font-bold ${statusColor}`}>{statusLabel}</Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {c.type === 'premium_upgrade' ? 'Upgrade Premium' : `Réduction ${c.value ?? 0}%`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
                        <span>Utilisations : {c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ' (illimité)'}</span>
                        {c.type === 'premium_upgrade' && c.value && <span>Durée : {Math.round(c.value)} jours</span>}
                        {c.expiresAt && <span>Expire : {new Date(c.expiresAt).toLocaleDateString('fr-FR')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => toggleActive(c)} title={c.active ? 'Désactiver' : 'Activer'}>
                        {c.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => openEdit(c)} title="Modifier">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-400" onClick={() => handleDelete(c.id)} disabled={deleting === c.id} title="Supprimer">
                        {deleting === c.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-strong border-border rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editId ? 'Modifier le code' : 'Nouveau code promo'}</DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">{editId ? 'Modifiez les détails du coupon' : 'Créez un nouveau code promotionnel'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Code</Label>
              <Input placeholder="WELCOME50" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} className="h-10 rounded-xl bg-input border-border font-mono" required disabled={!!editId} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="h-10 rounded-xl bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium_upgrade">Upgrade Premium</SelectItem>
                  <SelectItem value="discount">Réduction (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">{formType === 'premium_upgrade' ? 'Durée premium (jours)' : 'Réduction (%)'}</Label>
              <Input type="number" placeholder={formType === 'premium_upgrade' ? '30' : '50'} value={formValue} onChange={(e) => setFormValue(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Utilisations max</Label>
              <Input type="number" placeholder="Illimité si vide" value={formMaxUses} onChange={(e) => setFormMaxUses(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Date d'expiration</Label>
              <Input type="datetime-local" value={formExpiresAt} onChange={(e) => setFormExpiresAt(e.target.value)} className="h-10 rounded-xl bg-input border-border" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Actif</Label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl">Annuler</Button>
              <Button type="submit" className="rounded-xl h-10" style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)', color: 'white' }} disabled={saving}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}{editId ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// NAVIGATION COMPONENTS
// ============================================================
const NAV_ITEMS: { id: View; label: string; icon: typeof LayoutDashboard; mobileOnly?: boolean }[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'ai-analysis', label: 'Prédict AI', icon: Brain },
  { id: 'profile', label: 'Profil', icon: User },
]

const ADMIN_ITEMS: { id: View; label: string; icon: typeof Shield }[] = [
  { id: 'admin-users', label: 'Utilisateurs', icon: Shield },
  { id: 'admin-tokens', label: 'Tokens', icon: Coins },
  { id: 'admin-exchanges', label: 'Exchanges', icon: Building2 },
  { id: 'admin-pricing', label: 'Tarifs', icon: Star },
  { id: 'admin-coupons', label: 'Codes promo', icon: Tag },
]

function BottomNav({ view, setView, isAdmin }: { view: View; setView: (v: View) => void; isAdmin: boolean }) {
  const items = NAV_ITEMS.slice(0, 5)
  return (
    <nav className="bottom-nav safe-area-bottom fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map(item => {
          const isActive = view === item.id
          return (
            <button key={item.id} onClick={() => setView(item.id)}
              className={`bottom-nav-item flex flex-col items-center gap-0.5 py-2 px-3 rounded-lg transition-all ${isActive ? 'active' : ''}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function Sidebar({ view, setView, isAdmin, onLogout }: { view: View; setView: (v: View) => void; isAdmin: boolean; onLogout: () => void }) {
  const { theme, setTheme } = useTheme()
  const ts = useThemeStyles()

  return (
    <aside className="glass-sidebar hidden md:flex flex-col w-52 h-screen fixed top-0 left-0 z-30 shrink-0">
      {/* Logo */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: ts.logoBg, border: `1px solid ${ts.logoBorder}` }}>
            <Wallet className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text">Prédict AI</h1>
          </div>
        </div>
      </div>

      <Separator />

      {/* Nav Items */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = view === item.id
            return (
              <button key={item.id} onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active-indicator text-violet-600 dark:text-violet-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                style={isActive ? { background: ts.accentBg } : undefined}>
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <Separator className="my-3" />
            <p className="text-[10px] font-semibold text-muted-foreground px-3 mb-1 uppercase tracking-wider">Administration</p>
            <div className="space-y-1">
              {ADMIN_ITEMS.map(item => {
                const isActive = view === item.id
                return (
                  <button key={item.id} onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'nav-active-indicator text-violet-600 dark:text-violet-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                    style={isActive ? { background: ts.accentBg } : undefined}>
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-3 space-y-2">
        {/* Theme Toggle */}
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>
        </button>
        {/* Logout */}
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all">
          <LogOut className="w-4 h-4" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}

// ============================================================
// MOBILE HEADER
// ============================================================
function MobileHeader({ view, setView, isAdmin, onLogout }: { view: View; setView: (v: View) => void; isAdmin: boolean; onLogout: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const currentLabel = [...NAV_ITEMS, ...ADMIN_ITEMS].find(n => n.id === view)?.label || 'Dashboard'

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/10">
            <Wallet className="w-4 h-4 text-violet-500" />
          </div>
          <span className="font-bold gradient-text text-sm">Prédict AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => setMenuOpen(!menuOpen)} className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div className="fixed top-14 right-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl glass-strong border border-border shadow-xl p-2 z-50">
          {isAdmin && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground px-3 py-1 uppercase tracking-wider">Admin</p>
              {ADMIN_ITEMS.map(item => (
                <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50">
                  <item.icon className="w-4 h-4" /><span>{item.label}</span>
                </button>
              ))}
              <Separator className="my-1" />
            </>
          )}
          <button onClick={() => { onLogout(); setMenuOpen(false) }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/5">
            <LogOut className="w-4 h-4" /><span>Déconnexion</span>
          </button>
        </div>
      )}
    </header>
  )
}

// ============================================================
// MAIN CRYPTO APP COMPONENT
// ============================================================
export function CryptoApp() {
  const { user, loading, login, register, logout, emailVerified, userRole } = useAuth()
  const [view, setView] = useState<View>(() => {
    // Restore view from URL hash on page load/refresh
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      const validViews: View[] = ['home', 'dashboard', 'transactions', 'ai-analysis', 'profile', 'admin-users', 'admin-tokens', 'admin-exchanges', 'admin-pricing', 'admin-coupons']
      if (hash && validViews.includes(hash as View)) return hash as View
    }
    return 'home'
  })
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [initialized, setInitialized] = useState(false)
  const isAdmin = userRole === 'admin'

  // Update URL hash when view changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'home' ? '' : view
    }
  }, [view])

  // Fetch tokens once authenticated
  useEffect(() => {
    if (user && !initialized) {
      fetch('/api/tokens').then(r => r.json()).then(d => { setTokens(d); setInitialized(true) }).catch(() => setInitialized(true))
    }
  }, [user, initialized])

  // Show loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-violet-500" />
          </div>
          <RefreshCw className="w-5 h-5 animate-spin text-violet-500/50" />
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />
  }

  // Show email verification prompt if authenticated but not verified
  if (!emailVerified) {
    return <EmailVerificationScreen email={user?.email || ''} onVerified={() => window.location.reload()} />
  }

  // Render current view
  const renderView = () => {
    switch (view) {
      case 'home': return <HomeView tokens={tokens} />
      case 'dashboard': return <DashboardView tokens={tokens} userRole={userRole} />
      case 'transactions': return <TransactionsView userRole={userRole} />
      case 'ai-analysis': return <AIAnalysisView tokens={tokens} userRole={userRole} setView={setView} />
      case 'profile': return <ProfileView userRole={userRole} />
      case 'admin-users': return isAdmin ? <AdminUsersView /> : <DashboardView tokens={tokens} userRole={userRole} />
      case 'admin-tokens': return isAdmin ? <AdminTokensView /> : <DashboardView tokens={tokens} userRole={userRole} />
      case 'admin-exchanges': return isAdmin ? <AdminExchangesView /> : <DashboardView tokens={tokens} userRole={userRole} />
      case 'admin-pricing': return isAdmin ? <AdminPricingView /> : <DashboardView tokens={tokens} userRole={userRole} />
      case 'admin-coupons': return isAdmin ? <AdminCouponsView /> : <DashboardView tokens={tokens} userRole={userRole} />
      default: return <HomeView tokens={tokens} />
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background overflow-x-hidden w-full">
      {/* Ambient Background */}
      <div className="ambient-bg">
        <div className="aurora-blob" style={{ top: '10%', left: '5%', width: '35%', height: '35%', background: 'rgba(124,92,252,0.06)', animationDuration: '15s' }} />
        <div className="aurora-blob" style={{ bottom: '5%', right: '10%', width: '30%', height: '30%', background: 'rgba(6,182,212,0.04)', animationDuration: '20s', animationDirection: 'reverse' }} />
      </div>

      {/* Desktop Sidebar */}
      <Sidebar view={view} setView={setView} isAdmin={isAdmin} onLogout={logout} />

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden min-w-0 md:ml-52">
        {/* Mobile Header */}
        <MobileHeader view={view} setView={setView} isAdmin={isAdmin} onLogout={logout} />

        {/* Content */}
        <main className="flex-1 overflow-x-hidden pt-14 pb-20 md:pt-0 md:overflow-y-auto md:pb-6 custom-scrollbar w-full">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 mx-auto max-w-full md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav view={view} setView={setView} isAdmin={isAdmin} />
    </div>
  )
}
