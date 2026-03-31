import { X } from 'lucide-react'

const helpItems = [
  {
    icon: '✅',
    title: 'Complete a Habit',
    description: 'Tap the purple tick to mark a habit as done for today.',
  },
  {
    icon: '😴',
    title: 'Intentional Skip',
    description: "Skip a habit without breaking your streak — perfect for rest days or planned breaks. It won't count against your success rate.",
  },
  {
    icon: '📦',
    title: 'Blocks',
    description: 'A block is a set period to focus on a specific routine or goal — like a 30-day challenge. Your success rate is tracked within the block.',
  },
  {
    icon: '📅',
    title: 'History',
    description: 'Tap the calendar icon on any habit to see and edit your last 14 days. Tap a day to cycle through: done, skipped, or not done.',
  },
  {
    icon: '📊',
    title: 'Stats (Premium)',
    description: 'View detailed analytics including 30-day completion rates, streaks, best days, and per-habit performance.',
  },
  {
    icon: '📁',
    title: 'Archive',
    description: "Archive habits you've paused. You can reactivate them any time from the Archive tab.",
  },
]

export default function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-black text-white uppercase tracking-tight italic mb-1">
          How It Works
        </h2>
        <p className="text-purple-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-6">
          SOSE Guide
        </p>

        <div className="space-y-5">
          {helpItems.map(({ icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <div className="text-xl shrink-0 mt-0.5">{icon}</div>
              <div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
                <p className="text-white/60 text-xs leading-relaxed mt-0.5">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
