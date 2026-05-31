'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  LayoutDashboard, ArrowLeftRight, User, Shield, Coins, Building2,
  LogOut, LogIn, TrendingUp, TrendingDown, DollarSign, Wallet,
  Plus, Trash2, Edit3, ChevronDown, ChevronUp, RefreshCw,
  BarChart3, PieChart, Crown, AlertTriangle, Check, X, Menu
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
      // Auto-login after registration
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30">
            <Wallet className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            CryptoTracker
          </h1>
          <p className="text-muted-foreground">Suivez votre portefeuille crypto en temps réel</p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>{isRegister ? 'Créer un compte' : 'Connexion'}</CardTitle>
            <CardDescription>
              {isRegister
                ? 'Créez votre compte pour commencer à suivre vos investissements'
                : 'Connectez-vous pour accéder à votre portefeuille'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                    className="bg-background/50"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-background/50"
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                disabled={loading}
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                {isRegister ? 'Créer le compte' : 'Se connecter'}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isRegister ? (
                <>Déjà un compte ?{' '}
                  <button onClick={() => { setIsRegister(false); setError('') }} className="text-violet-400 hover:underline">
                    Se connecter
                  </button>
                </>
              ) : (
                <>Pas encore de compte ?{' '}
                  <button onClick={() => { setIsRegister(true); setError('') }} className="text-violet-400 hover:underline">
                    Créer un compte
                  </button>
                </>
              )}
            </div>

            {!isRegister && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Comptes de démonstration :</p>
                <p>Admin : admin@cryptotracker.com / admin123</p>
                <p>Premium : premium@cryptotracker.com / premium123</p>
                <p>Gratuit : demo@cryptotracker.com / demo123</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
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
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
          active
            ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        }`}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </button>
    )
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-border/50 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <Wallet className="w-5 h-5 text-violet-400" />
        </div>
        {!collapsed && <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">CryptoTracker</span>}
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {userItems.map(item => <NavItem key={item.id} item={item} />)}
        </div>

        {isAdmin && (
          <>
            <Separator className="my-4 bg-border/50" />
            <div className="space-y-1">
              {!collapsed && <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Admin</p>}
              {adminItems.map(item => <NavItem key={item.id} item={item} />)}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User info */}
      <div className={`border-t border-border/50 p-3 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? '' : 'w-full'}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
              <Badge variant="outline" className={`text-xs mt-0.5 ${
                user?.role === 'admin' ? 'border-violet-500 text-violet-400' :
                user?.role === 'user_premium' ? 'border-amber-500 text-amber-400' :
                'border-muted-foreground text-muted-foreground'
              }`}>
                {user?.role === 'admin' ? 'Admin' :
                 user?.role === 'user_premium' ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          )}
        </div>
        {!collapsed && (
          <Button variant="ghost" size="sm" onClick={onLogout} className="mt-2 w-full text-muted-foreground hover:text-foreground">
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
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
        className="fixed top-4 left-4 z-50 md:hidden bg-card/80 backdrop-blur border border-border/50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border/50 flex flex-col transform transition-transform md:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex flex-col h-screen bg-card border-r border-border/50 sticky top-0 transition-all ${
        collapsed ? 'w-16' : 'w-64'
      }`}>
        {sidebarContent}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-card border border-border/50 shadow-lg hidden md:flex"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
        </Button>
      </aside>
    </>
  )
}

// ============================================================
// DASHBOARD VIEW
// ============================================================
function DashboardView({ user }: { user: any }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Refresh prices first
      await fetch('/api/prices')
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const d = await res.json()
        setData(d)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast.success('Prix actualisés !')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse bg-card/50">
              <CardContent className="p-6"><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data || data.tokens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Aucune transaction</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Commencez par ajouter des transactions dans l&apos;onglet &quot;Transactions&quot; pour voir votre tableau de bord.
        </p>
      </div>
    )
  }

  const sortedTokens = [...data.tokens].sort((a, b) => b.valeurActuelle - a.valeurActuelle)

  // Chart data
  const pieData = sortedTokens.map(t => ({
    name: t.ticker,
    value: t.valeurActuelle,
  }))

  const barData = sortedTokens.map(t => ({
    name: t.ticker,
    investissement: t.montantInvesti,
    valeur: t.valeurActuelle,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tableau de Bord</h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble de votre portefeuille</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser les prix
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Investissement Total</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{fmt(data.investissementTotal)} $</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Valeur Actuelle</span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <p className="text-2xl font-bold">{fmt(data.valeurActuelle)} $</p>
          </CardContent>
        </Card>

        <Card className={`border-border/50 bg-card/80`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">P/L Global</span>
              <div className={`w-8 h-8 rounded-lg ${plBg(data.pl)} flex items-center justify-center`}>
                {data.pl >= 0
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />
                }
              </div>
            </div>
            <p className={`text-2xl font-bold ${plColor(data.pl)}`}>
              {data.pl >= 0 ? '+' : ''}{fmt(data.pl)} $
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">ROI</span>
              <div className={`w-8 h-8 rounded-lg ${plBg(data.roi)} flex items-center justify-center`}>
                {data.roi >= 0
                  ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                  : <TrendingDown className="w-4 h-4 text-red-400" />
                }
              </div>
            </div>
            <p className={`text-2xl font-bold ${plColor(data.roi)}`}>
              {data.roi >= 0 ? '+' : ''}{fmtPct(data.roi)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Répartition du Portefeuille</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [fmt(value) + ' $', 'Valeur']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Investissement vs Valeur Actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [fmt(value) + ' $', '']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="investissement" name="Investissement" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="valeur" name="Valeur Actuelle" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Détail par Token</CardTitle>
          <CardDescription>Analyse détaillée de chaque crypto-actif de votre portefeuille</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold">Token</TableHead>
                  <TableHead className="text-right font-semibold">Montant Investi</TableHead>
                  <TableHead className="text-right font-semibold">Quantité</TableHead>
                  <TableHead className="text-right font-semibold">PRU</TableHead>
                  <TableHead className="text-right font-semibold">Cours Actuel</TableHead>
                  <TableHead className="text-right font-semibold">Valeur Actuelle</TableHead>
                  <TableHead className="text-right font-semibold">P/L</TableHead>
                  <TableHead className="text-right font-semibold">Rentabilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTokens.map((t) => (
                  <TableRow key={t.ticker} className="border-border/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                          {t.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold">{t.ticker}</p>
                          <p className="text-xs text-muted-foreground">{t.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmt(t.montantInvesti)} $</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{fmtSmall(t.quantite)}</TableCell>
                    <TableCell className="text-right font-mono">{fmt(t.pru)} $</TableCell>
                    <TableCell className="text-right font-mono">{fmt(t.currentPrice)} $</TableCell>
                    <TableCell className="text-right font-mono">{fmt(t.valeurActuelle)} $</TableCell>
                    <TableCell className={`text-right font-mono font-semibold ${plColor(t.pl)}`}>
                      {t.pl >= 0 ? '+' : ''}{fmt(t.pl)} $
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={`${plColor(t.pl)} border-current`}>
                        {t.rentabilite >= 0 ? '+' : ''}{fmtPct(t.rentabilite)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

  const sorted = [...transactions].sort((a, b) => {
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
    return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Gérez vos achats de crypto-actifs</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Plus className="w-4 h-4" /> Nouvelle Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingTx ? 'Modifier la transaction' : 'Nouvelle transaction'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" {...register('date')} className="bg-background/50" />
                  {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Token</Label>
                  <Select onValueChange={v => setValue('tokenTicker', v)} defaultValue={editingTx?.tokenTicker}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      {tokens.map(t => (
                        <SelectItem key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tokenTicker && <p className="text-xs text-red-400">{errors.tokenTicker.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant investi ($)</Label>
                  <Input type="number" step="0.01" {...register('montantInvesti')} placeholder="15.70" className="bg-background/50" />
                  {errors.montantInvesti && <p className="text-xs text-red-400">{errors.montantInvesti.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Cours d&apos;achat ($)</Label>
                  <Input type="number" step="0.0001" {...register('coursAchat')} placeholder="82603.9" className="bg-background/50" />
                  {errors.coursAchat && <p className="text-xs text-red-400">{errors.coursAchat.message}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Exchange (optionnel)</Label>
                <Select onValueChange={v => setValue('exchangeId', v)} defaultValue={editingTx?.exchangeId || ''}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    {exchanges.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes (optionnel)</Label>
                <Input {...register('notes')} placeholder="Note facultative" className="bg-background/50" />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Annuler</Button>
                </DialogClose>
                <Button type="submit" className="bg-violet-600 hover:bg-violet-700">
                  {editingTx ? 'Modifier' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Freemium notice */}
      {user?.role === 'user_free' && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-amber-400">Plan Gratuit — Limité à 3 tokens et 10 transactions</p>
              <p className="text-muted-foreground">Passez en Premium pour débloquer l&apos;accès illimité.</p>
            </div>
            <Badge variant="outline" className="border-amber-500 text-amber-400">
              {transactions.length} / 10 transactions
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      {transactions.length === 0 ? (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="py-16 text-center">
            <ArrowLeftRight className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
            <p className="text-muted-foreground mb-4">Ajoutez votre première transaction pour commencer le suivi.</p>
            <Button onClick={openNew} className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Plus className="w-4 h-4" /> Ajouter une transaction
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('date')}>
                      <span className="flex items-center gap-1">Date <SortIcon field="date" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('tokenTicker')}>
                      <span className="flex items-center gap-1">Token <SortIcon field="tokenTicker" /></span>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('montantInvesti')}>
                      <span className="flex items-center justify-end gap-1">Montant <SortIcon field="montantInvesti" /></span>
                    </TableHead>
                    <TableHead className="text-right">Cours</TableHead>
                    <TableHead className="text-right">Quantité</TableHead>
                    <TableHead>Exchange</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((tx) => (
                    <TableRow key={tx.id} className="border-border/30">
                      <TableCell className="font-mono text-sm">
                        {new Date(tx.date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-semibold">
                          {tx.tokenTicker}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmt(tx.montantInvesti)} $</TableCell>
                      <TableCell className="text-right font-mono">{fmt(tx.coursAchat)} $</TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">{fmtSmall(tx.quantite)}</TableCell>
                      <TableCell>
                        {tx.exchange ? (
                          <Badge variant="secondary" className="text-xs">{tx.exchange.name}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}>
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          {deleteConfirm === tx.id ? (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => handleDelete(tx.id)}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => setDeleteConfirm(tx.id)}>
                              <Trash2 className="w-4 h-4" />
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
      )}
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Profil & Abonnement</h1>
        <p className="text-muted-foreground">Gérez votre compte et votre abonnement</p>
      </div>

      {/* User Info */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Informations du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-lg font-semibold">{user?.name || 'Utilisateur'}</p>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className={`mt-1 ${
                isAdmin ? 'border-violet-500 text-violet-400' :
                isPremium ? 'border-amber-500 text-amber-400' :
                'border-muted-foreground text-muted-foreground'
              }`}>
                {isAdmin ? 'Administrateur' : isPremium ? 'Premium' : 'Gratuit'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader>
          <CardTitle className="text-base">Comparatif des plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free Plan */}
            <div className={`p-4 rounded-xl border ${!isPremium && !isAdmin ? 'border-violet-500/50 bg-violet-500/5' : 'border-border/50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Gratuit</h3>
              </div>
              <p className="text-2xl font-bold mb-3">0 €<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Accès au tableau de bord</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 3 tokens maximum</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 10 transactions maximum</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Pas de graphiques avancés</li>
                <li className="flex items-center gap-2"><X className="w-4 h-4 text-red-400" /> Pas de métriques avancées</li>
              </ul>
              {!isPremium && !isAdmin && (
                <Badge className="mt-3 bg-violet-600">Plan actuel</Badge>
              )}
            </div>

            {/* Premium Plan */}
            <div className={`p-4 rounded-xl border ${isPremium ? 'border-amber-500/50 bg-amber-500/5' : 'border-border/50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold">Premium</h3>
              </div>
              <p className="text-2xl font-bold mb-3">9,99 €<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Accès au tableau de bord</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Tokens illimités</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Transactions illimitées</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Graphiques d&apos;évolution</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Métriques avancées</li>
              </ul>
              {isPremium ? (
                <Badge className="mt-3 bg-amber-500">Plan actuel</Badge>
              ) : !isAdmin ? (
                <Button className="mt-3 bg-amber-500 hover:bg-amber-600 text-black" disabled>
                  <Crown className="w-4 h-4 mr-2" /> Passer en Premium
                </Button>
              ) : null}
            </div>
          </div>
          {!isPremium && !isAdmin && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
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

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion Utilisateurs</h1>
        <p className="text-muted-foreground">{users.length} comptes enregistrés</p>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} className="border-border/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{u.name || 'Sans nom'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user_free">Gratuit</SelectItem>
                          <SelectItem value="user_premium">Premium</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">{u._count.transactions}</TableCell>
                    <TableCell>
                      {u.suspended ? (
                        <Badge variant="destructive">Suspendu</Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-500 text-emerald-400">Actif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSuspend(u.id, u.suspended)}
                          className={u.suspended ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}
                        >
                          {u.suspended ? 'Réactiver' : 'Suspendre'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-400 border-red-500/30" onClick={() => deleteUser(u.id)}>
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

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Tokens</h1>
          <p className="text-muted-foreground">{tokens.length} tokens configurés</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Plus className="w-4 h-4" /> Ajouter un Token
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Nouveau Token</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticker</Label>
                  <Input
                    value={newToken.ticker}
                    onChange={e => setNewToken({ ...newToken, ticker: e.target.value.toUpperCase() })}
                    placeholder="BTC"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={newToken.name}
                    onChange={e => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="Bitcoin"
                    className="bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>CoinGecko ID</Label>
                <Input
                  value={newToken.coingeckoId}
                  onChange={e => setNewToken({ ...newToken, coingeckoId: e.target.value })}
                  placeholder="bitcoin"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label>CryptoCompare ID</Label>
                <Input
                  value={newToken.cryptoCompareId}
                  onChange={e => setNewToken({ ...newToken, cryptoCompareId: e.target.value })}
                  placeholder="BTC"
                  className="bg-background/50"
                />
              </div>
              <Button onClick={addToken} className="w-full bg-violet-600 hover:bg-violet-700">Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Ticker</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>CoinGecko ID</TableHead>
                  <TableHead className="text-right">Prix Actuel</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id} className="border-border/30">
                    <TableCell><Badge variant="outline" className="font-bold">{t.ticker}</Badge></TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{t.coingeckoId || '-'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {t.currentPrice ? fmt(t.currentPrice) + ' $' : '-'}
                    </TableCell>
                    <TableCell className="text-center">{t._count.transactions}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={t.active ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}>
                        {t.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(t.id, t.active)}
                        className={t.active ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'}
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

  if (loading) return <div className="flex items-center justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Exchanges</h1>
          <p className="text-muted-foreground">{exchanges.length} plateformes configurées</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2">
              <Plus className="w-4 h-4" /> Ajouter un Exchange
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Nouvel Exchange</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase())}
                  placeholder="BINANCE"
                  className="bg-background/50"
                />
              </div>
              <Button onClick={addExchange} className="w-full bg-violet-600 hover:bg-violet-700">Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 bg-card/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-center">Transactions</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exchanges.map((e) => (
                  <TableRow key={e.id} className="border-border/30">
                    <TableCell className="font-semibold">{e.name}</TableCell>
                    <TableCell className="text-center">{e._count.transactions}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={e.active ? 'border-emerald-500 text-emerald-400' : 'border-red-500 text-red-400'}>
                        {e.active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(e.id, e.active)}
                        className={e.active ? 'text-red-400 border-red-500/30' : 'text-emerald-400 border-emerald-500/30'}
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
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
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
    <div className="flex min-h-screen">
      <Sidebar
        currentView={currentView}
        setView={setCurrentView}
        user={user}
        onLogout={logout}
      />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
