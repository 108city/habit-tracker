import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Loader2, Trash2 } from 'lucide-react'

function App() {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({}) // { habitId: logObject }
  const [loading, setLoading] = useState(true)
  const [newHabitName, setNewHabitName] = useState('')
  const [showOptions, setShowOptions] = useState(false)

  // Frequency State
  const [freqType, setFreqType] = useState('daily') // daily, weekly, days
  const [freqValue, setFreqValue] = useState(1)
  const [freqDays, setFreqDays] = useState([]) // [0,1,2,3,4,5,6] for Sun-Sat

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().toISOString().split('T')[0]

  // Load habits and today's completions on mount
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError
      setHabits(habitsData || [])

      // Fetch today's completions
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('completed_at', `${today}T00:00:00`)
        .lte('completed_at', `${today}T23:59:59`)

      if (logsError) throw logsError

      const completionsMap = {}
      logsData.forEach(log => {
        completionsMap[log.habit_id] = log
      })
      setCompletions(completionsMap)

    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const addHabit = async (e) => {
    e.preventDefault()
    if (!newHabitName.trim()) return

    const payload = {
      name: newHabitName,
      frequency_type: freqType,
      frequency_value: freqType === 'weekly' ? freqValue : 1,
      frequency_days: freqType === 'days' ? freqDays : []
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([payload])
        .select()

      if (error) {
        console.error('Supabase Error:', error)
        throw new Error(error.message || 'Unknown Supabase error')
      }

      if (!data || data.length === 0) {
        throw new Error('Habit was created but no data returned. Check RLS or Project URL.')
      }

      setHabits([data[0], ...habits])
      setNewHabitName('')
      setShowOptions(false)
      // Reset defaults
      setFreqType('daily')
      setFreqValue(1)
      setFreqDays([])
    } catch (error) {
      console.error('Add Habit Failed:', error)
      alert(`FAILED TO ADD HABIT:\n\n${error.message}\n\n1. Ensure you ran the SQL schema.\n2. Check if your API Key is correct.\n3. Check browser console for network errors.`)
    }
  }

  const toggleHabit = async (habitId) => {
    const existingLog = completions[habitId]

    try {
      if (existingLog) {
        // Uncheck: Delete the log
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', existingLog.id)

        if (error) throw error

        const newCompletions = { ...completions }
        delete newCompletions[habitId]
        setCompletions(newCompletions)
      } else {
        // Check: Create new log
        const { data, error } = await supabase
          .from('habit_logs')
          .insert([{
            habit_id: habitId,
            completed_at: new Date().toISOString()
          }])
          .select()

        if (error) throw error
        setCompletions({ ...completions, [habitId]: data[0] })
      }
    } catch (error) {
      console.error('Toggle Habit Failed:', error.message)
    }
  }

  const deleteHabit = async (id) => {
    if (!confirm('Are you sure you want to delete this habit?')) return
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)

      if (error) throw error
      setHabits(habits.filter(h => h.id !== id))
    } catch (error) {
      console.error('Delete Habit Failed:', error.message)
    }
  }

  const toggleDay = (index) => {
    setFreqDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    )
  }

  // Calculate daily progress
  const completedCount = Object.keys(completions).length
  const totalCount = habits.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 font-sans selection:bg-rose-500/30 pb-20">
      <div className="max-w-md mx-auto">
        <header className="mb-10 pt-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent italic leading-tight">
                GRIND
              </h1>
              <p className="text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-black text-rose-500 leading-none">
                {progressPercent.toFixed(0)}%
              </div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                Target Met
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Today</div>
              <div className="text-xl font-bold text-zinc-200">{completedCount} <span className="text-sm text-zinc-600 font-medium">/ {totalCount}</span></div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Consistency</div>
              <div className="text-xl font-bold text-rose-500">
                {totalCount > 0 ? (progressPercent > 80 ? 'Elite' : 'Active') : 'Ready'}
              </div>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-zinc-900 rounded-full mb-10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
          />
        </div>

        {/* Improved Add Habit Form */}
        <div className="mb-10 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl overflow-hidden active-focus-within:border-zinc-700 transition-all">
          <form onSubmit={addHabit} className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onFocus={() => setShowOptions(true)}
                placeholder="Commit to something..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg placeholder:text-zinc-700 p-1"
              />
              <button
                type="submit"
                disabled={!newHabitName.trim()}
                className="p-3 bg-rose-500 text-white rounded-2xl hover:bg-rose-600 disabled:opacity-0 disabled:translate-x-4 transition-all active:scale-90 shadow-lg shadow-rose-900/20"
              >
                <Plus size={24} strokeWidth={3} />
              </button>
            </div>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-4 pt-2 border-t border-zinc-800/50 overflow-hidden"
                >
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'days'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFreqType(type)}
                        className={`flex-1 py-2 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${freqType === type
                            ? 'bg-zinc-100 text-zinc-900'
                            : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {freqType === 'weekly' && (
                    <div className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-xl">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Times per week</span>
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setFreqValue(Math.max(1, freqValue - 1))} className="text-xl font-bold p-1">-</button>
                        <span className="text-lg font-black text-rose-500 min-w-[2ch] text-center">{freqValue}</span>
                        <button type="button" onClick={() => setFreqValue(Math.min(7, freqValue + 1))} className="text-xl font-bold p-1">+</button>
                      </div>
                    </div>
                  )}

                  {freqType === 'days' && (
                    <div className="flex justify-between bg-zinc-800/30 p-3 rounded-xl">
                      {daysOfWeek.map((day, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${freqDays.includes(i)
                              ? 'bg-rose-500 text-white'
                              : 'bg-zinc-800 text-zinc-600'
                            }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="text-xs uppercase tracking-widest font-bold">Synchronizing...</p>
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-20 px-6 border-2 border-dashed border-zinc-900 rounded-3xl">
            <h3 className="text-zinc-400 font-bold mb-1">Clean Slate</h3>
            <p className="text-zinc-600 text-xs">There are no habits currently in your rotation.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode='popLayout'>
              {habits.map(habit => {
                const isCompleted = !!completions[habit.id]
                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group relative overflow-hidden p-5 rounded-2xl border transition-all duration-300 ${isCompleted
                      ? 'bg-rose-500/5 border-rose-500/20'
                      : 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700'
                      }`}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className={`font-bold transition-all ${isCompleted ? 'text-rose-400 line-through opacity-50' : 'text-zinc-200'
                          }`}>
                          {habit.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="p-2 text-zinc-700 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>

                        <button
                          onClick={() => toggleHabit(habit.id)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isCompleted
                            ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
                            }`}
                        >
                          <Check size={20} className={isCompleted ? 'stroke-[3px]' : ''} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
