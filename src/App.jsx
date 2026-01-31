import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Loader2, Trash2, Pencil, Save, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react'

function App() {
  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [newHabitName, setNewHabitName] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState(null) // ID of habit with open history

  // Edit State
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')

  // Frequency State
  const [freqType, setFreqType] = useState('daily')
  const [freqValue, setFreqValue] = useState(1)
  const [freqDays, setFreqDays] = useState([])
  const [targetDate, setTargetDate] = useState('')

  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*, habit_logs(*)')
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError
      setHabits(habitsData || [])

      // Map logs for today's display
      const completionsMap = {}
      habitsData?.forEach(habit => {
        const todayLog = habit.habit_logs?.find(log =>
          log.completed_at.split('T')[0] === today
        )
        if (todayLog) completionsMap[habit.id] = todayLog
      })
      setCompletions(completionsMap)
    } catch (error) {
      console.error('Error fetching data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleHistoryDay = async (habitId, dateStr, currentStatus) => {
    // Determine next status: completed -> skipped -> none -> completed
    let nextStatus = 'completed'
    if (currentStatus === 'completed') nextStatus = 'skipped'
    else if (currentStatus === 'skipped') nextStatus = null

    try {
      const { data: existingLogs } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('habit_id', habitId)
        .gte('completed_at', `${dateStr}T00:00:00`)
        .lte('completed_at', `${dateStr}T23:59:59`)

      if (existingLogs?.length > 0) {
        if (!nextStatus) {
          await supabase.from('habit_logs').delete().eq('id', existingLogs[0].id)
        } else {
          await supabase.from('habit_logs').update({ status: nextStatus }).eq('id', existingLogs[0].id)
        }
      } else if (nextStatus) {
        await supabase.from('habit_logs').insert([{
          habit_id: habitId,
          completed_at: `${dateStr}T12:00:00`,
          status: nextStatus
        }])
      }
      fetchData() // Refresh view
    } catch (error) {
      console.error('Toggle History Failed:', error.message)
    }
  }

  const addHabit = async (e) => {
    e.preventDefault()
    if (!newHabitName.trim()) return

    const payload = {
      name: newHabitName,
      frequency_type: freqType,
      frequency_value: freqType === 'weekly' ? freqValue : 1,
      frequency_days: freqType === 'days' ? freqDays : [],
      target_date: targetDate || null
    }

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert([payload])
        .select('*, habit_logs(status, created_at)')

      if (error) throw error
      setHabits([data[0], ...habits])
      setNewHabitName('')
      setShowOptions(false)
      setFreqType('daily')
      setFreqValue(1)
      setFreqDays([])
      setTargetDate('')
    } catch (error) {
      console.error('Add Habit Failed:', error)
      alert(`FAILED TO ADD HABIT:\n\n${error.message}`)
    }
  }

  const updateHabit = async (id) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ name: editName, target_date: editDate || null })
        .eq('id', id)

      if (error) throw error

      setHabits(habits.map(h => h.id === id ? { ...h, name: editName, target_date: editDate || null } : h))
      setEditingId(null)
    } catch (error) {
      console.error('Update Failed:', error.message)
    }
  }

  const startEdit = (habit) => {
    setEditingId(habit.id)
    setEditName(habit.name)
    setEditDate(habit.target_date || '')
  }

  const logStatus = async (habitId, status = 'completed') => {
    const existingLog = completions[habitId]

    try {
      if (existingLog) {
        // If clicking the SAME status, delete it (unarchive/uncheck)
        if (existingLog.status === status) {
          const { error } = await supabase
            .from('habit_logs')
            .delete()
            .eq('id', existingLog.id)
          if (error) throw error

          const newCompletions = { ...completions }
          delete newCompletions[habitId]
          setCompletions(newCompletions)
        } else {
          // If clicking a DIFFERENT status, update it
          const { data, error } = await supabase
            .from('habit_logs')
            .update({ status })
            .eq('id', existingLog.id)
            .select()
          if (error) throw error
          setCompletions({ ...completions, [habitId]: data[0] })
        }
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('habit_logs')
          .insert([{
            habit_id: habitId,
            completed_at: new Date().toISOString(),
            status
          }])
          .select()
        if (error) throw error
        setCompletions({ ...completions, [habitId]: data[0] })
      }
      // Re-fetch to update success rates
      fetchData()
    } catch (error) {
      console.error('Log Status Failed:', error.message)
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
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 font-sans selection:bg-rose-500/30 pb-20">
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

                  {/* Target Date Picker */}
                  <div className="bg-zinc-800/30 p-3 rounded-xl">
                    <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-2">Goal Date (Optional)</div>
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      min={today}
                      className="w-full bg-zinc-900 border border-zinc-700/50 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-rose-500/50 [color-scheme:dark]"
                    />
                  </div>
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
                const isEditing = editingId === habit.id
                const currentStatus = completions[habit.id]?.status
                const isCompleted = currentStatus === 'completed'
                const isSkipped = currentStatus === 'skipped'

                const daysRemaining = habit.target_date ? Math.ceil((new Date(habit.target_date) - new Date()) / (1000 * 60 * 60 * 24)) : null

                // Success Rate Calculation
                const allLogs = habit.habit_logs || []
                const completedLogs = allLogs.filter(l => l.status === 'completed').length
                const skippedLogs = allLogs.filter(l => l.status === 'skipped').length

                const habitCreatedDate = new Date(habit.created_at)
                const isValidDate = !isNaN(habitCreatedDate.getTime())
                const daysSinceCreation = isValidDate
                  ? Math.max(1, Math.ceil((new Date() - habitCreatedDate) / (1000 * 60 * 60 * 24)))
                  : 1

                const effectiveDays = Math.max(1, daysSinceCreation - skippedLogs)
                const successRate = Math.min(100, Math.round((completedLogs / effectiveDays) * 100)) || 0

                return (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isCompleted ? 'bg-rose-500/5 border-rose-500/20' :
                        isSkipped ? 'bg-amber-500/5 border-amber-500/20' :
                          'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700'
                      }`}
                  >
                    <div className="p-5 relative z-10 flex items-center justify-between">
                      <div className="flex-1">
                        {isEditing ? (
                          <div className="space-y-3 pr-4">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-500"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-[10px] [color-scheme:dark]"
                              />
                              <div className="flex-1" />
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
                              <button onClick={() => updateHabit(habit.id)} className="p-1.5 bg-rose-500 text-white rounded-lg"><Save size={16} /></button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="relative flex items-center justify-center shrink-0">
                              <svg className="w-10 h-10 -rotate-90">
                                <circle cx="20" cy="20" r="18" className="stroke-zinc-800 fill-none" strokeWidth="3.5" />
                                <motion.circle
                                  cx="20" cy="20" r="18"
                                  initial={{ strokeDasharray: "113", strokeDashoffset: "113" }}
                                  animate={{ strokeDashoffset: 113 - (113 * successRate) / 100 }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className={`fill-none ${successRate > 80 ? 'stroke-emerald-500' : successRate > 50 ? 'stroke-amber-500' : 'stroke-rose-500'}`}
                                  strokeWidth="3.5" strokeLinecap="round"
                                />
                              </svg>
                              <span className={`absolute text-[10px] font-black ${successRate > 80 ? 'text-emerald-500' : successRate > 50 ? 'text-amber-500' : 'text-zinc-500'}`}>
                                {successRate}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-bold transition-all ${isCompleted ? 'text-rose-400 line-through opacity-50' : isSkipped ? 'text-amber-500/60' : 'text-zinc-200'}`}>
                                  {habit.name}
                                </h3>
                                <button
                                  onClick={() => setExpandedHistory(expandedHistory === habit.id ? null : habit.id)}
                                  className={`p-1 rounded-md transition-all ${expandedHistory === habit.id ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                >
                                  <Calendar size={12} />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${successRate > 90 ? 'bg-emerald-500/10 text-emerald-500' : successRate > 75 ? 'bg-blue-500/10 text-blue-400' : successRate > 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-600'}`}>
                                  {successRate > 90 ? 'Mythic' : successRate > 75 ? 'Elite' : successRate > 50 ? 'Active' : 'Grinding'}
                                </span>
                                {daysRemaining !== null && (
                                  <span className={`text-[10px] font-black uppercase ${daysRemaining <= 3 ? 'text-rose-500' : 'text-zinc-600'}`}>
                                    {daysRemaining === 0 ? 'Last Day' : daysRemaining < 0 ? 'Expired' : `${daysRemaining}d left`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                            <button onClick={() => startEdit(habit)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><Pencil size={14} /></button>
                            <button onClick={() => deleteHabit(habit.id)} className="p-2 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                          </div>
                          <button onClick={() => logStatus(habit.id, 'skipped')} className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all active:scale-90 ${isSkipped ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-zinc-900/50 hover:bg-amber-500/5'}`}>😴</button>
                          <button onClick={() => logStatus(habit.id, 'completed')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isCompleted ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-100'}`}><Check size={22} className={isCompleted ? 'stroke-[3px]' : ''} /></button>
                        </div>
                      )}
                    </div>

                    {/* History Grid */}
                    <AnimatePresence>
                      {expandedHistory === habit.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-5 pb-5 pt-2 border-t border-zinc-800/50"
                        >
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Last 14 Days</div>
                          <div className="grid grid-cols-7 gap-2">
                            {[...Array(14)].map((_, i) => {
                              const d = new Date();
                              d.setDate(d.getDate() - (13 - i));
                              const dateStr = d.toISOString().split('T')[0];
                              const log = habit.habit_logs?.find(l => l.completed_at.split('T')[0] === dateStr);
                              const status = log?.status;

                              return (
                                <button
                                  key={i}
                                  onClick={() => toggleHistoryDay(habit.id, dateStr, status)}
                                  className={`aspect-square rounded-lg flex flex-col items-center justify-center border transition-all ${status === 'completed' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-500' :
                                      status === 'skipped' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' :
                                        dateStr === today ? 'bg-zinc-900 border-zinc-700 text-zinc-400' :
                                          'bg-zinc-950/50 border-zinc-900/50 text-zinc-700 hover:border-zinc-800'
                                    }`}
                                >
                                  <span className="text-[8px] font-bold uppercase">{d.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                                  <span className="text-[10px] font-black">{d.getDate()}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
