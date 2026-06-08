'use client'

import { Crown, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

function CancelContent() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card className="glass-card border-border rounded-2xl overflow-hidden">
          <div className="h-1" style={{ background: 'linear-gradient(90deg,#f97316,#eab308)' }} />
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-amber-500/10">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">Paiement annulé</h1>
            <p className="text-sm text-muted-foreground mb-6">Le paiement a été annulé. Vous pouvez réessayer à tout moment depuis votre profil.</p>
            <Button
              onClick={() => router.push('/')}
              className="text-foreground rounded-xl font-medium"
              style={{ background: 'linear-gradient(135deg,#7c5cfc,#06b6d4)' }}
            >
              Retour à l&apos;accueil <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function PaymentCancelPage() {
  return (
    <Suspense>
      <CancelContent />
    </Suspense>
  )
}
