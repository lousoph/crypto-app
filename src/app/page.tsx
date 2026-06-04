'use client'

import dynamic from 'next/dynamic'
import { Wallet, RefreshCw } from 'lucide-react'

// Lightweight loading shell rendered during SSR
function LoadingShell() {
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#000000' }}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl border flex items-center justify-center" style={{ background: 'rgba(124,92,252,0.15)', borderColor: 'rgba(124,92,252,0.3)' }}>
              <Wallet className="w-6 h-6 text-violet-400" />
            </div>
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

// Dynamically import the heavy CryptoApp component with SSR disabled
// This prevents OOM during server-side rendering of the massive component tree
const CryptoApp = dynamic(
  () => import('./page-content').then(mod => mod.CryptoApp),
  {
    ssr: false,
    loading: () => <LoadingShell />,
  }
)

export default function Home() {
  return <CryptoApp />
}
