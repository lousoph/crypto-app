'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Crown, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { update: updateSession } = useSession()
  const [capturing, setCapturing] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Token de commande manquant')
      setCapturing(false)
      return
    }

    async function captureOrder() {
      try {
        const res = await fetch('/api/paypal/capture-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: token }),
        })
        const data = await res.json()

        if (res.ok && data.success) {
          setSuccess(true)
          toast.success(data.message || 'Premium activé !')
          await updateSession({})
        } else {
          setError(data.error || 'Erreur lors de la capture du paiement')
          toast.error(data.error || 'Erreur de paiement')
        }
      } catch (err: any) {
        setError('Erreur réseau lors de la capture')
        toast.error('Erreur réseau')
      } finally {
        setCapturing(false)
      }
    }

    captureOrder()
  }, [searchParams, updateSession])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-6">
        {capturing ? (
          <Card className="glass-card border-border rounded-2xl overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-amber-500/10">
                <Crown className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Traitement du paiement...</h1>
              <p className="text-sm text-muted-foreground">Veuillez patienter pendant que nous confirmons votre abonnement Premium.</p>
              <div className="mt-4 flex justify-center">
                <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
              </div>
            </CardContent>
          </Card>
        ) : success ? (
          <Card className="glass-card border-border rounded-2xl overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)' }} />
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Paiement réussi !</h1>
              <p className="text-sm text-muted-foreground mb-6">Votre abonnement Premium est maintenant actif. Profitez de toutes les fonctionnalités avancées.</p>
              <Button
                onClick={() => router.push('/')}
                className="text-foreground rounded-xl font-medium"
                style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }}
              >
                Accéder au Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-border rounded-2xl overflow-hidden">
            <div className="h-1" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-red-500/10">
                <Crown className="w-8 h-8 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">Erreur de paiement</h1>
              <p className="text-sm text-muted-foreground mb-6">{error || 'Une erreur est survenue lors du traitement.'}</p>
              <Button
                onClick={() => router.push('/')}
                className="text-foreground rounded-xl font-medium"
                style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }}
              >
                Retour à l&apos;accueil <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  )
}
