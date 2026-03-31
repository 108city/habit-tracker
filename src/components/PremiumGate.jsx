import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import UpgradePrompt from './UpgradePrompt'

export default function PremiumGate({ children, isPremium, featureName = 'this feature' }) {
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (isPremium) return children

  return (
    <>
      <div
        onClick={() => setShowUpgrade(true)}
        className="relative cursor-pointer group"
      >
        <div className="opacity-40 pointer-events-none blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-zinc-900/90 border border-purple-500/30 rounded-xl px-4 py-2 flex items-center gap-2 group-hover:border-purple-500/60 transition-colors">
            <Sparkles size={14} className="text-purple-400" />
            <span className="text-xs font-bold text-white">Upgrade to unlock {featureName}</span>
          </div>
        </div>
      </div>
      {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} />}
    </>
  )
}
