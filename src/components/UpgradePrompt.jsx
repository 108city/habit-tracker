import { X, Sparkles, BarChart3, Infinity, Ban } from 'lucide-react'

const benefits = [
  { icon: Infinity, label: 'Unlimited habits' },
  { icon: BarChart3, label: 'Detailed stats & analytics' },
  { icon: Ban, label: 'No ads' },
]

export default function UpgradePrompt({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <Sparkles className="text-purple-400 mx-auto mb-3" size={32} />
          <h2 className="text-xl font-black text-white">Go Premium</h2>
          <p className="text-white text-xs mt-1">Unlock the full SOSE experience</p>
        </div>

        <div className="space-y-3 mb-6">
          {benefits.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon size={16} className="text-purple-400 shrink-0" />
              <span className="text-white">{label}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-4">
          <span className="text-3xl font-black text-white">$1</span>
          <span className="text-white text-sm">/month</span>
        </div>

        <button
          onClick={() => {
            // TODO: Integrate with Google Play billing via Capacitor
            alert('Premium subscriptions will be available when the app launches on Google Play!')
          }}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl text-sm font-bold uppercase tracking-widest transition-all"
        >
          Upgrade Now
        </button>

        <p className="text-white text-[10px] text-center mt-3">Cancel anytime</p>
      </div>
    </div>
  )
}
