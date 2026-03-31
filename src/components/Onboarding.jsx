import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, Sparkles } from 'lucide-react'

const slides = [
  {
    title: 'Welcome to SOSE',
    subtitle: 'Sum Of Small Efforts',
    description: 'Track your daily habits and build consistency over time. Small efforts compound into big results.',
    icon: '🎯',
  },
  {
    title: 'Track Habits',
    subtitle: 'Tap to complete',
    description: 'Tap the purple tick to mark a habit as done for the day. Your success rate updates automatically.',
    icon: '✅',
  },
  {
    title: 'Intentional Skips',
    subtitle: 'Rest without breaking streaks',
    description: "Tap 😴 to skip a habit intentionally — like a rest day from exercise. It won't count against your streak or success rate.",
    icon: '😴',
  },
  {
    title: 'Blocks',
    subtitle: 'Focused tracking periods',
    description: 'Create a block to track habits over a set period — like a 30-day challenge or training phase. Your stats are calculated within the block.',
    icon: '📦',
  },
  {
    title: "You're all set!",
    subtitle: '7 days of Premium included',
    description: 'Enjoy unlimited habits, full stats, and all features free for your first week. Start building your routine.',
    icon: '🚀',
  },
]

export default function Onboarding({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const isLast = currentSlide === slides.length - 1
  const slide = slides[currentSlide]

  const next = () => {
    if (isLast) {
      onComplete()
    } else {
      setCurrentSlide(currentSlide + 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-6xl mb-6">{slide.icon}</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
              {slide.title}
            </h2>
            <p className="text-purple-400 text-[10px] uppercase tracking-[0.2em] font-bold mt-1 mb-4">
              {slide.subtitle}
            </p>
            <p className="text-white/70 text-sm leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-center gap-2 mt-10 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === currentSlide ? 'w-6 bg-purple-500' : 'w-1.5 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
        >
          {isLast ? (
            <>
              Get Started <Sparkles size={14} />
            </>
          ) : (
            <>
              Next <ChevronRight size={14} />
            </>
          )}
        </button>

        {!isLast && (
          <button
            onClick={onComplete}
            className="mt-3 text-white/30 text-[10px] uppercase tracking-widest font-bold"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
