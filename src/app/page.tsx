'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LayoutDashboard, ArrowLeftRight, User, Shield, Coins, Building2,
  LogOut, LogIn, TrendingUp, TrendingDown, DollarSign, Wallet,
  Plus, Trash2, Edit3, ChevronDown, ChevronUp, RefreshCw,
  BarChart3, PieChart, Crown, AlertTriangle, Check, X, Menu,
  Search
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts'
import { signIn, signOut, useSession } from 'next-auth/react'

// ============================================================
// TYPES
// ============================================================
type View = 'dashboard' | 'transactions' | 'profile' | 'admin-users' | 'admin-tokens' | 'admin-exchanges'

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

const plColor = (v: number) => v >= 0 ? 'text-emerald-400' : 'text-red-400'
const plBg = (v: number) => v >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10'

const CHART_COLORS = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
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

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
  }

  return (
    <div className="login-gradient-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 fade-in-up">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="float-animation inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-600/20 border border-violet-500/30 shadow-lg shadow-violet-500/10">
            <Wallet className="w-10 h-10 text-violet-400" />
          </div>
          <h1 className="text-4xl font-bold gradient-text">
            CryptoTracker
          </h1>
          <p className="text-white/50 text-sm">Suivez votre portefeuille crypto en temps réel</p>
        </div>

        <div className="glass-strong rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/20">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              {isRegister ? 'Créer un compte' : 'Connexion'}
            </h2>
            <p className="text-white/40 text-sm mt-1">
              {isRegister
                ? 'Créez votre compte pour commencer à suivre vos investissements'
                : 'Connectez-vous pour accéder à votre portefeuille'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2 fade-in-up stagger-1">
                <Label htmlFor="name" className="text-white/70 text-xs font-medium">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                />
              </div>
            )}
            <div className="space-y-2 fade-in-up stagger-2">
              <Label htmlFor="email" className="text-white/70 text-xs font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
            </div>
            <div className="space-y-2 fade-in-up stagger-3">
              <Label htmlFor="password" className="text-white/70 text-xs font-medium">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-xl border border-red-400/20 fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl h-11 font-medium shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
              {isRegister ? 'Créer le compte' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-white/40">
            {isRegister ? (
              <>Déjà un compte ?{' '}
                <button onClick={() => { setIsRegister(false); setError('') }} className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Se connecter
                </button>
              </>
            ) : (
              <>Pas encore de compte ?{' '}
                <button onClick={() => { setIsRegister(true); setError('') }} className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
                  Créer un compte
                </button>
              </>
            )}
          </div>

          {!isRegister && (
            <div className="mt-5 space-y-2">
              <p className="text-white/40 text-xs font-medium text-center mb-3">Comptes de démonstration</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillDemo('admin@cryptotracker.com', 'admin123')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Admin</p>
                    <p className="text-xs text-white/30 truncate">admin@cryptotracker.com</p>
                  </div>
                  <LogIn className="w-4 h-4 text-white/20 group-hover:text-violet-400 transition-colors" />
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('premium@cryptotracker.com', 'premium123')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Premium</p>
                    <p className="text-xs text-white/30 truncate">premium@cryptotracker.com</p>
                  </div>
                  <LogIn className="w-4 h-4 text-white/20 group-hover:text-amber-400 transition-colors" />
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo('demo@cryptotracker.com', 'demo123')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Gratuit</p>
                    <p className="text-xs text-white/30 truncate">demo@cryptotracker.com</p>
                  </div>
                  <LogIn className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </button>
              </div>
            </div>
          )}
        </div>
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
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          active
            ? 'nav-active-indicator bg-gradient-to-r from-violet-600/20 to-cyan-600/10 text-violet-300 border border-violet-500/20'
            : 'text-white/40 hover:bg-white/5 hover:text-white/70 border border-transparent'
        }`}
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
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-600/30 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
          <Wallet className="w-5 h-5 text-violet-400" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text">CryptoTracker</span>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4 custom-scrollbar">
        <div className="space-y-1">
          {userItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>

        {isAdmin && (
          <>
            <Separator className="my-4 bg-white/5" />
            <div className="space-y-1">
              {!collapsed && <p className="px-3 text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2">Administration</p>}
              {adminItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User info */}
      <div className={`border-t border-white/5 p-4 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'w-full'}`}>
          <div className="avatar-ring shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white/80 truncate">{user?.name || user?.email}</p>
              <Badge variant="outline" className={`text-[10px] mt-0.5 px-1.5 py-0 ${
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
            className={`mt-3 w-full transition-all duration-200 ${
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
        <div className="fixed inset-0 bg-black/70 z-40 md:hidden fade-in" onClick={() => setMobileOpen(false)} />
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
    <div className="glass-strong rounded-xl px-4 py-3 shadow-xl">
      {label && <p className="text-white/60 text-xs mb-1.5 font-medium">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-white/50">{entry.name}:</span>
          <span className="text-white font-semibold">{fmt(entry.value)} $</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ user }: { user: any }) {
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
            <Card key={i} className="glass-card rounded-2xl shimmer">
              <CardContent className="p-6"><div className="h-20 bg-white/5 rounded-xl" /></CardContent>
            </Card>
          ))}
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
        <h2 className="text-xl font-semibold">Aucune transaction</h2>
        <p className="text-white/40 text-center max-w-md">
          Commencez par ajouter des transactions dans l&apos;onglet &quot;Transactions&quot; pour voir votre tableau de bord.
        </p>
      </div>
    )
  }

  const sortedTokens = [...data.tokens].sort((a, b) => b.valeurActuelle - a.valeurActuelle)

  const pieData = sortedTokens.map(t => ({
    name: t.ticker,
    value: t.valeurActuelle,
  }))

  const barData = sortedTokens.map(t => ({
    name: t.ticker,
    investissement: t.montantInvesti,
    valeur: t.valeurActuelle,
  }))

  const kpiCards = [
    {
      label: 'Investissement Total',
      value: `${fmt(data.investissementTotal)} $`,
      icon: DollarSign,
      barClass: 'kpi-bar-blue',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      colorClass: '',
    },
    {
      label: 'Valeur Actuelle',
      value: `${fmt(data.valeurActuelle)} $`,
      icon: Wallet,
      barClass: 'kpi-bar-violet',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      colorClass: '',
    },
    {
      label: 'P/L Global',
      value: `${data.pl >= 0 ? '+' : ''}${fmt(data.pl)} $`,
      icon: data.pl >= 0 ? TrendingUp : TrendingDown,
      barClass: data.pl >= 0 ? 'kpi-bar-emerald' : 'kpi-bar-red',
      iconBg: plBg(data.pl),
      iconColor: data.pl >= 0 ? 'text-emerald-400' : 'text-red-400',
      colorClass: plColor(data.pl),
    },
    {
      label: 'ROI',
      value: `${data.roi >= 0 ? '+' : ''}${fmtPct(data.roi)}`,
      icon: data.roi >= 0 ? TrendingUp : TrendingDown,
      barClass: data.roi >= 0 ? 'kpi-bar-amber' : 'kpi-bar-red',
      iconBg: plBg(data.roi),
      iconColor: data.roi >= 0 ? 'text-emerald-400' : 'text-red-400',
      colorClass: plColor(data.roi),
    },
  ]

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Tableau de Bord</h1>
          <div className="flex items-center gap-2 text-sm text-white/35 mt-1">
            <span>Vue d&apos;ensemble de votre portefeuille</span>
            {lastUpdated && (
              <span className="hidden sm:flex items-center gap-1.5">
                • <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-glow" />
                <span className="text-white/25">Mis à jour {lastUpdated.toLocaleTimeString('fr-FR')} • {nextRefreshIn}s</span>
              </span>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 shrink-0 glass rounded-xl border-white/10 text-white/60 hover:text-white/80 hover:bg-white/5 h-10"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {kpiCards.map((card, i) => (
          <div key={card.label} className={`fade-in-up stagger-${i + 1}`}>
            <Card className={`glass-card rounded-2xl card-hover gradient-border ${card.barClass}`}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{card.label}</span>
                  <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
                  </div>
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${card.colorClass || 'text-white/90'}`}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="glass-card rounded-2xl card-hover fade-in-up stagger-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50">Répartition du Portefeuille</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280} className="sm:h-[300px]">
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl card-hover fade-in-up stagger-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/50">Investissement vs Valeur Actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280} className="sm:h-[300px]">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="investissement" name="Investissement" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="valeur" name="Valeur Actuelle" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table - Desktop / Cards - Mobile */}
      <Card className="glass-card rounded-2xl fade-in-up">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-white/70">Détail par Token</CardTitle>
          <CardDescription className="text-white/30">Analyse détaillée de chaque crypto-actif de votre portefeuille</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="font-semibold text-white/40">Token</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">Montant Investi</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">Quantité</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">PRU</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">Cours Actuel</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">Valeur Actuelle</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">P/L</TableHead>
                  <TableHead className="text-right font-semibold text-white/40">Rentabilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTokens.map((t) => (
                  <TableRow key={t.ticker} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${tokenGradientClass(t.ticker)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                          {t.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white/80">{t.ticker}</p>
                          <p className="text-xs text-white/30">{t.name}</p>
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
          <div className="md:hidden space-y-3">
            {sortedTokens.map((t) => (
              <div key={t.ticker} className="glass-card rounded-2xl p-4 space-y-3 card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tokenGradientClass(t.ticker)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                      {t.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-white/80">{t.ticker}</p>
                      <p className="text-xs text-white/30">{t.name}</p>
                    </div>
                  </div>
                  <Badge className={`${t.rentabilite >= 0 ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20'} border font-mono text-xs`}>
                    {t.rentabilite >= 0 ? '+' : ''}{fmtPct(t.rentabilite)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="text-white/30 text-xs">Investi</p>
                    <p className="text-white/60 font-mono">{fmt(t.montantInvesti)} $</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">Valeur</p>
                    <p className="text-white/60 font-mono">{fmt(t.valeurActuelle)} $</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">Quantité</p>
                    <p className="text-white/40 font-mono">{fmtSmall(t.quantite)}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs">P/L</p>
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

function TransactionsView({ user }: { user: any }) {
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
        toast.success('Transaction ajoutée')
      }

      setDialogOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Transaction supprimée')
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
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 fade-in-up">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Transactions</h1>
          <p className="text-white/35 mt-1">Gérez vos achats de crypto-actifs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 gap-2 rounded-xl h-10 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98] hidden sm:flex">
              <Plus className="w-4 h-4" /> Nouvelle Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl border-white/10 max-w-lg dialog-mobile-fullscreen text-white">
            <DialogHeader>
              <DialogTitle className="text-white/90">{editingTx ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Date</Label>
                  <Input type="date" {...register('date')} className="bg-white/5 border-white/10 text-white rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20" />
                  {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Token</Label>
                  <Select onValueChange={v => setValue('tokenTicker', v)} defaultValue={editingTx?.tokenTicker}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-11"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent className="glass-strong border-white/10">
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
                  <Label className="text-white/50 text-xs">Montant investi ($)</Label>
                  <Input type="number" step="0.01" {...register('montantInvesti')} placeholder="15.70" className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20" />
                  {errors.montantInvesti && <p className="text-xs text-red-400">{errors.montantInvesti.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Cours d&apos;achat ($)</Label>
                  <Input type="number" step="0.0001" {...register('coursAchat')} placeholder="82603.9" className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20" />
                  {errors.coursAchat && <p className="text-xs text-red-400">{errors.coursAchat.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">Exchange (optionnel)</Label>
                <Select onValueChange={v => setValue('exchangeId', v)} defaultValue={editingTx?.exchangeId || ''}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-11"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent className="glass-strong border-white/10">
                    {exchanges.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">Notes (optionnel)</Label>
                <Input {...register('notes')} placeholder="Note facultative" className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20" />
              </div>
              <DialogFooter className="gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl border-white/10 text-white/50 hover:text-white/70 hover:bg-white/5">Annuler</Button>
                </DialogClose>
                <Button type="submit" className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]">
                  {editingTx ? 'Modifier' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Freemium notice */}
      {user?.role === 'user_free' && (
        <Card className="glass-card rounded-2xl border-amber-500/20 bg-amber-500/5 fade-in-up stagger-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-400" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-400">Plan Gratuit — Limité à 3 tokens et 10 transactions</p>
              <p className="text-white/30">Passez en Premium pour débloquer l&apos;accès illimité.</p>
            </div>
            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 border shrink-0">
              {transactions.length}/10
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Search/Filter Bar */}
      {transactions.length > 0 && (
        <div className="relative fade-in-up stagger-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par token, exchange, notes..."
            className="bg-white/5 border-white/8 text-white placeholder:text-white/20 rounded-xl h-11 pl-10 focus:border-violet-500/40 focus:ring-violet-500/15"
          />
        </div>
      )}

      {/* Transactions Content */}
      {transactions.length === 0 ? (
        <Card className="glass-card rounded-2xl fade-in-up">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl glass mx-auto mb-4 flex items-center justify-center">
              <ArrowLeftRight className="w-8 h-8 text-violet-400/40" />
            </div>
            <h3 className="text-lg font-semibold text-white/70 mb-2">Aucune transaction</h3>
            <p className="text-white/30 mb-6">Ajoutez votre première transaction pour commencer le suivi.</p>
            <Button onClick={openNew} className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 gap-2 rounded-xl shadow-lg shadow-violet-500/20">
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
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="cursor-pointer select-none text-white/40" onClick={() => toggleSort('date')}>
                        <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none text-white/40" onClick={() => toggleSort('tokenTicker')}>
                        <span className="flex items-center gap-1">Token <SortIcon field="tokenTicker" /></span>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none text-white/40" onClick={() => toggleSort('montantInvesti')}>
                        <span className="flex items-center justify-end gap-1">Montant <SortIcon field="montantInvesti" /></span>
                      </TableHead>
                      <TableHead className="text-right text-white/40">Cours</TableHead>
                      <TableHead className="text-right text-white/40">Quantité</TableHead>
                      <TableHead className="text-white/40">Exchange</TableHead>
                      <TableHead className="text-right text-white/40">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((tx) => (
                      <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                        <TableCell className="font-mono text-sm text-white/50">
                          {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${tokenGradientClass(tx.tokenTicker)} flex items-center justify-center text-[10px] font-bold text-white`}>
                              {tx.tokenTicker.slice(0, 2)}
                            </div>
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
                            <Badge variant="secondary" className="text-xs bg-white/5 text-white/40 border border-white/5">{tx.exchange.name}</Badge>
                          ) : <span className="text-white/15">—</span>}
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
          <div className="md:hidden space-y-3 fade-in-up stagger-3">
            {sorted.map((tx) => (
              <div key={tx.id} className="glass-card rounded-2xl p-4 space-y-3 card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${tokenGradientClass(tx.tokenTicker)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                      {tx.tokenTicker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-white/80">{tx.tokenTicker}</p>
                      <p className="text-xs text-white/30">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
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
                    <p className="text-white/25 text-xs">Montant</p>
                    <p className="text-white/60 font-mono">{fmt(tx.montantInvesti)} $</p>
                  </div>
                  <div>
                    <p className="text-white/25 text-xs">Cours</p>
                    <p className="text-white/50 font-mono">{fmt(tx.coursAchat)} $</p>
                  </div>
                  <div>
                    <p className="text-white/25 text-xs">Quantité</p>
                    <p className="text-white/40 font-mono">{fmtSmall(tx.quantite)}</p>
                  </div>
                </div>
                {(tx.exchange || tx.notes) && (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    {tx.exchange && (
                      <Badge variant="secondary" className="text-xs bg-white/5 text-white/30 border-0">{tx.exchange.name}</Badge>
                    )}
                    {tx.notes && (
                      <span className="text-xs text-white/20 truncate flex-1">{tx.notes}</span>
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
        className="fab-button fixed bottom-20 right-4 sm:hidden w-14 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center text-white z-40 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

// ============================================================
// PROFILE VIEW
// ============================================================
function ProfileView({ user }: { user: any }) {
  const isPremium = user?.role === 'user_premium'
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6 max-w-2xl page-transition">
      <div className="fade-in-up">
        <h1 className="text-2xl font-bold text-white/90">Profil & Abonnement</h1>
        <p className="text-white/35 mt-1">Gérez votre compte et votre abonnement</p>
      </div>

      {/* User Info */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/50">Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="avatar-ring">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-white/80">{user?.name || 'Utilisateur'}</p>
              <p className="text-white/35 text-sm">{user?.email}</p>
              <Badge className={`mt-1.5 text-xs ${
                isAdmin ? 'bg-violet-500/15 text-violet-400 border-violet-500/20' :
                isPremium ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                'bg-white/5 text-white/30 border-white/10'
              } border`}>
                {isAdmin ? 'Administrateur' : isPremium ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card className="glass-card rounded-2xl fade-in-up stagger-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-white/50">Comparatif des plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className={`p-5 rounded-2xl border transition-all ${
              !isPremium && !isAdmin
                ? 'border-violet-500/30 bg-violet-500/5 glass-card'
                : 'border-white/5 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/40" />
                </div>
                <h3 className="font-semibold text-white/70">Gratuit</h3>
              </div>
              <p className="text-2xl font-bold text-white/80 mb-4">0 €<span className="text-sm font-normal text-white/30">/mois</span></p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">Accès au tableau de bord</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">3 tokens maximum</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">10 transactions maximum</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span className="text-white/25">Pas de graphiques avancés</span></li>
                <li className="flex items-center gap-2.5"><X className="w-4 h-4 text-red-400/60 shrink-0" /> <span className="text-white/25">Pas de métriques avancées</span></li>
              </ul>
              {!isPremium && !isAdmin && (
                <Badge className="mt-4 bg-gradient-to-r from-violet-600 to-cyan-600 text-white border-0">Plan actuel</Badge>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`p-5 rounded-2xl border transition-all ${
              isPremium
                ? 'border-amber-500/30 bg-amber-500/5 glass-card'
                : 'border-white/5 bg-white/[0.02]'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="font-semibold text-white/70">Premium</h3>
              </div>
              <p className="text-2xl font-bold text-white/80 mb-4">9,99 €<span className="text-sm font-normal text-white/30">/mois</span></p>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">Accès au tableau de bord</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">Tokens illimités</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">Transactions illimitées</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">Graphiques d&apos;évolution</span></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> <span className="text-white/50">Métriques avancées</span></li>
              </ul>
              {isPremium ? (
                <Badge className="mt-4 bg-amber-500 text-black border-0">Plan actuel</Badge>
              ) : !isAdmin ? (
                <Button className="mt-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/20 rounded-xl" disabled>
                  <Crown className="w-4 h-4 mr-2" /> Passer en Premium
                </Button>
              ) : null}
            </div>
          </div>
          {!isPremium && !isAdmin && (
            <p className="text-xs text-white/20 mt-5 text-center">
              L&apos;intégration Stripe sera bientôt disponible. Contactez l&apos;administrateur pour activer votre compte Premium.
            </p>
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
        <h1 className="text-2xl font-bold text-white/90">Gestion Utilisateurs</h1>
        <p className="text-white/35 mt-1">{users.length} comptes enregistrés</p>
      </div>

      {/* Desktop Table */}
      <Card className="glass-card rounded-2xl hidden md:block fade-in-up stagger-1">
        <CardContent className="p-0">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-white/40">Utilisateur</TableHead>
                  <TableHead className="text-white/40">Rôle</TableHead>
                  <TableHead className="text-center text-white/40">Transactions</TableHead>
                  <TableHead className="text-white/40">Statut</TableHead>
                  <TableHead className="text-right text-white/40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-white text-xs font-bold">
                          {u.name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-white/70">{u.name || 'Sans nom'}</p>
                          <p className="text-xs text-white/30">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white/60 rounded-xl h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass-strong border-white/10">
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
                              ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                              : 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                          }`}
                        >
                          {u.suspended ? 'Réactiver' : 'Suspendre'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl h-8 text-xs text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/30 to-cyan-500/30 flex items-center justify-center text-white text-sm font-bold">
                  {u.name?.[0] || u.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-white/70">{u.name || 'Sans nom'}</p>
                  <p className="text-xs text-white/30">{u.email}</p>
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
                <p className="text-white/25 text-xs">Rôle</p>
                <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white/60 rounded-xl h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-white/10">
                    <SelectItem value="user_free">Gratuit</SelectItem>
                    <SelectItem value="user_premium">Premium</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-white/25 text-xs">Transactions</p>
                <p className="text-white/40 mt-1 font-mono">{u._count.transactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSuspend(u.id, u.suspended)}
                className={`rounded-xl h-8 text-xs flex-1 ${
                  u.suspended
                    ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                    : 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10'
                }`}
              >
                {u.suspended ? 'Réactiver' : 'Suspendre'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl h-8 text-xs text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 flex-1"
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
          <p className="text-white/35 mt-1">{tokens.length} tokens configurés</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 gap-2 rounded-xl h-10 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Ajouter un Token
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl border-white/10 dialog-mobile-fullscreen text-white">
            <DialogHeader>
              <DialogTitle className="text-white/90">Nouveau Token</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Ticker</Label>
                  <Input
                    value={newToken.ticker}
                    onChange={e => setNewToken({ ...newToken, ticker: e.target.value.toUpperCase() })}
                    placeholder="BTC"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/50 text-xs">Nom</Label>
                  <Input
                    value={newToken.name}
                    onChange={e => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="Bitcoin"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">CoinGecko ID</Label>
                <Input
                  value={newToken.coingeckoId}
                  onChange={e => setNewToken({ ...newToken, coingeckoId: e.target.value })}
                  placeholder="bitcoin"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">CryptoCompare ID</Label>
                <Input
                  value={newToken.cryptoCompareId}
                  onChange={e => setNewToken({ ...newToken, cryptoCompareId: e.target.value })}
                  placeholder="BTC"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                />
              </div>
              <Button onClick={addToken} className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]">Ajouter</Button>
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
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-white/40">Ticker</TableHead>
                  <TableHead className="text-white/40">Nom</TableHead>
                  <TableHead className="text-white/40">CoinGecko ID</TableHead>
                  <TableHead className="text-right text-white/40">Prix Actuel</TableHead>
                  <TableHead className="text-center text-white/40">Transactions</TableHead>
                  <TableHead className="text-center text-white/40">Statut</TableHead>
                  <TableHead className="text-right text-white/40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg ${tokenGradientClass(t.ticker)} flex items-center justify-center text-[10px] font-bold text-white`}>
                          {t.ticker.slice(0, 2)}
                        </div>
                        <Badge variant="outline" className="font-bold border-white/10 text-white/70">{t.ticker}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/60">{t.name}</TableCell>
                    <TableCell className="text-white/30 font-mono text-xs">{t.coingeckoId || '—'}</TableCell>
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
                            ? 'text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                            : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                        }`}
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
                <div className={`w-10 h-10 rounded-xl ${tokenGradientClass(t.ticker)} flex items-center justify-center text-xs font-bold text-white shadow-lg`}>
                  {t.ticker.slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-white/80">{t.ticker}</p>
                  <p className="text-xs text-white/30">{t.name}</p>
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
                <p className="text-white/25 text-xs">Prix</p>
                <p className="text-white/60 font-mono">{t.currentPrice ? fmt(t.currentPrice) + ' $' : '—'}</p>
              </div>
              <div>
                <p className="text-white/25 text-xs">Transactions</p>
                <p className="text-white/40 font-mono">{t._count.transactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              {t.active ? (
                <Badge className="bg-emerald-400/10 text-emerald-400 border-emerald-400/20 border text-xs">Actif</Badge>
              ) : (
                <Badge className="bg-red-400/10 text-red-400 border-red-400/20 border text-xs">Inactif</Badge>
              )}
              {t.coingeckoId && (
                <span className="text-xs text-white/15 font-mono">{t.coingeckoId}</span>
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
          <p className="text-white/35 mt-1">{exchanges.length} plateformes configurées</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 gap-2 rounded-xl h-10 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Ajouter un Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl border-white/10 dialog-mobile-fullscreen text-white">
            <DialogHeader>
              <DialogTitle className="text-white/90">Nouvel Exchange</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/50 text-xs">Nom</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="BINANCE"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 rounded-xl h-11 focus:border-violet-500/50 focus:ring-violet-500/20"
                />
              </div>
              <Button onClick={addExchange} className="w-full bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 rounded-xl shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]">Ajouter</Button>
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
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-white/40">Nom</TableHead>
                  <TableHead className="text-center text-white/40">Transactions</TableHead>
                  <TableHead className="text-center text-white/40">Statut</TableHead>
                  <TableHead className="text-right text-white/40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchanges.map((e) => (
                  <TableRow key={e.id} className="border-white/5 hover:bg-white/[0.02] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-cyan-400/60" />
                        </div>
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
                            ? 'text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                            : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                        }`}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-cyan-400/60" />
                </div>
                <div>
                  <p className="font-semibold text-white/80">{e.name}</p>
                  <p className="text-xs text-white/30">{e._count.transactions} transactions</p>
                </div>
              </div>
              <Switch
                checked={e.active}
                onCheckedChange={() => toggleActive(e.id, e.active)}
                className={`${e.active ? 'bg-emerald-500' : 'bg-white/10'}`}
              />
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
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
                    ? 'text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
                    : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10'
                }`}
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
// MAIN APP
// ============================================================
export default function Home() {
  const { user, loading, login, register, logout } = useAuth()
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [seeded, setSeeded] = useState(false)

  // Seed DB on first load
  useEffect(() => {
    if (!seeded) {
      fetch('/api/seed', { method: 'POST' }).then(() => setSeeded(true)).catch(() => setSeeded(true))
    }
  }, [seeded])

  if (loading) {
    return (
      <div className="login-gradient-bg min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center float-animation">
            <Wallet className="w-5 h-5 text-violet-400" />
          </div>
          <RefreshCw className="w-5 h-5 animate-spin text-violet-400/50" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen onLogin={login} onRegister={register} />
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <DashboardView user={user} />
      case 'transactions': return <TransactionsView user={user} />
      case 'profile': return <ProfileView user={user} />
      case 'admin-users': return <AdminUsersView />
      case 'admin-tokens': return <AdminTokensView />
      case 'admin-exchanges': return <AdminExchangesView />
      default: return <DashboardView user={user} />
    }
  }

  return (
    <div className="flex min-h-screen login-gradient-bg">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 p-4 md:p-8 overflow-auto pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
      <BottomNav
        currentView={currentView}
        setView={setCurrentView}
        user={user}
      />
    </div>
  )
}
