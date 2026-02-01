import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, Loader2, Trash2, Pencil, Save, X, Calendar, ChevronDown, ChevronUp, Trophy, Sparkles, Archive } from 'lucide-react'

function App() {
  const today = new Date().toLocaleDateString('sv-SE')
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const [habits, setHabits] = useState([])
  const [completions, setCompletions] = useState({})
  const [loading, setLoading] = useState(true)
  const [newHabitName, setNewHabitName] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState(null) // ID of habit with open history

  // Edit State
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editFreqType, setEditFreqType] = useState('daily')
  const [editFreqValue, setEditFreqValue] = useState(1)
  const [editFreqDays, setEditFreqDays] = useState([])

  // Frequency State (for new habits)
  const [freqType, setFreqType] = useState('daily')
  const [freqValue, setFreqValue] = useState(1)
  const [freqDays, setFreqDays] = useState([])

  // Archived Habits
  const [archivedHabits, setArchivedHabits] = useState([])

  // Navigation State
  const [activeView, setActiveView] = useState('today') // 'today' | 'archive'

  const [milestones, setMilestones] = useState([])
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({ title: '', start_date: today, end_date: '' })
  const [editingMilestoneId, setEditingMilestoneId] = useState(null)
  const [editMilestoneData, setEditMilestoneData] = useState({ title: '', start_date: '', end_date: '' })
  const [showCelebration, setShowCelebration] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch active habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*, habit_logs(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError
      setHabits(habitsData || [])

      // Fetch archived habits
      const { data: archivedData } = await supabase
        .from('habits')
        .select('*, habit_logs(*)')
        .eq('is_active', false)
        .order('created_at', { ascending: false })
      setArchivedHabits(archivedData || [])

      // Fetch Milestones
      const { data: milestonesData } = await supabase
        .from('milestones')
        .select('*')
        .order('end_date', { ascending: true })
      setMilestones(milestonesData || [])

      // Map logs for today's display
      const completionsMap = {}
      habitsData?.forEach(habit => {
        const todayLog = habit.habit_logs?.find(log =>
          (log.completed_at || '').split('T')[0] === today
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
      frequency_days: freqType === 'days' ? freqDays : []
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
    } catch (error) {
      console.error('Add Habit Failed:', error)
      alert(`FAILED TO ADD HABIT:\n\n${error.message}`)
    }
  }

  const updateHabit = async (id) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({
          name: editName,
          frequency_type: editFreqType,
          frequency_value: editFreqValue,
          frequency_days: editFreqDays
        })
        .eq('id', id)

      if (error) throw error

      setHabits(habits.map(h => h.id === id ? {
        ...h,
        name: editName,
        frequency_type: editFreqType,
        frequency_value: editFreqValue,
        frequency_days: editFreqDays
      } : h))
      setEditingId(null)
    } catch (error) {
      console.error('Update Failed:', error.message)
    }
  }

  const startEdit = (habit) => {
    setEditingId(habit.id)
    setEditName(habit.name)
    setEditFreqType(habit.frequency_type || 'daily')
    setEditFreqValue(habit.frequency_value || 1)
    setEditFreqDays(habit.frequency_days || [])
  }

  const logStatus = async (habitId, status = 'completed') => {
    const existingLog = completions[habitId]

    try {
      if (existingLog) {
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
          const { data, error } = await supabase
            .from('habit_logs')
            .update({ status })
            .eq('id', existingLog.id)
            .select()
          if (error) throw error
          const updatedCompletions = { ...completions, [habitId]: data[0] }
          setCompletions(updatedCompletions)

          // Check for 100% completion
          if (status === 'completed') {
            const completedCount = Object.values(updatedCompletions).filter(c => c.status === 'completed').length
            if (completedCount === habits.length && habits.length > 0) {
              setShowCelebration(true)
              setTimeout(() => setShowCelebration(false), 5000)
            }
          }
        }
      } else {
        const { data, error } = await supabase
          .from('habit_logs')
          .insert([{
            habit_id: habitId,
            completed_at: new Date().toLocaleDateString('sv-SE') + 'T' + new Date().toLocaleTimeString('en-GB'),
            status
          }])
          .select()
        if (error) throw error
        const updatedCompletions = { ...completions, [habitId]: data[0] }
        setCompletions(updatedCompletions)

        // Check for 100% completion to trigger celebration
        if (status === 'completed') {
          const completedCount = Object.values(updatedCompletions).filter(c => c.status === 'completed').length
          if (completedCount === habits.length && habits.length > 0) {
            setShowCelebration(true)
            setTimeout(() => setShowCelebration(false), 5000)
          }
        }
      }
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

  const archiveHabit = async (id) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      fetchData() // Refresh to move habit to archived list
    } catch (error) {
      console.error('Archive Habit Failed:', error.message)
    }
  }

  const reactivateHabit = async (id) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update({ is_active: true })
        .eq('id', id)

      if (error) throw error
      fetchData() // Refresh to move habit back to active list
    } catch (error) {
      console.error('Reactivate Habit Failed:', error.message)
    }
  }

  const toggleDay = (index) => {
    setFreqDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    )
  }

  const toggleEditDay = (index) => {
    setEditFreqDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    )
  }

  const addMilestone = async (e) => {
    e.preventDefault()
    if (!newMilestone.title || !newMilestone.end_date) return
    try {
      const { data, error } = await supabase
        .from('milestones')
        .insert([newMilestone])
        .select()
      if (error) throw error
      setMilestones([...milestones, data[0]])
      setNewMilestone({ title: '', start_date: today, end_date: '' })
      setShowMilestoneForm(false)
    } catch (error) {
      console.error('Add Milestone Failed:', error.message)
    }
  }

  const deleteMilestone = async (id) => {
    if (!confirm('Delete this milestone?')) return
    try {
      await supabase.from('milestones').delete().eq('id', id)
      setMilestones(milestones.filter(m => m.id !== id))
    } catch (error) {
      console.error('Delete Milestone Failed:', error.message)
    }
  }

  const startEditMilestone = (milestone) => {
    setEditingMilestoneId(milestone.id)
    setEditMilestoneData({
      title: milestone.title,
      start_date: milestone.start_date,
      end_date: milestone.end_date
    })
  }

  const updateMilestone = async (id) => {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .update(editMilestoneData)
        .eq('id', id)
        .select()

      if (error) throw error
      setMilestones(milestones.map(m => m.id === id ? data[0] : m))
      setEditingMilestoneId(null)
    } catch (error) {
      console.error('Update Milestone Failed:', error.message)
      alert(`FAILED TO UPDATE MILESTONE:\n\n${error.message}`)
    }
  }

  // Calculate daily progress
  const completedCount = Object.keys(completions).length
  const totalCount = habits.length
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 font-sans selection:bg-purple-500/30 pb-20">
      <div className="max-w-md mx-auto">
        <header className="mb-10 pt-12">
          <div className="flex items-end justify-between mb-8">
            <div className="flex items-center gap-4">
              <img src="/sose_logo.png" alt="SOSE Logo" className="w-16 h-16 rounded-2xl shadow-2xl shadow-purple-900/40 border border-purple-500/20" />
              <div>
                <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-white via-purple-300 to-purple-600 bg-clip-text text-transparent italic leading-tight">
                  SOSE
                </h1>
                <p className="text-purple-400 text-[10px] uppercase tracking-[0.2em] font-bold mt-1">
                  Some Of Small Efforts
                </p>
                <p className="text-zinc-600 text-[9px] uppercase tracking-[0.1em] font-medium mt-0.5 opacity-50">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-mono font-black text-purple-500 leading-none">
                {progressPercent.toFixed(0)}%
              </div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mt-1">
                Target Met
              </div>
            </div>
          </div>

          <div className="flex gap-1 bg-zinc-900/40 p-1 rounded-2xl border border-zinc-800/50 mb-8">
            <button
              onClick={() => setActiveView('today')}
              className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${activeView === 'today' ? 'bg-zinc-100 text-zinc-900 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveView('archive')}
              className={`flex-1 py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all ${activeView === 'archive' ? 'bg-zinc-100 text-zinc-900 shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Archive
            </button>
          </div>

          {activeView === 'today' ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Today</div>
                  <div className="text-xl font-bold text-zinc-200">{completedCount} <span className="text-sm text-zinc-600 font-medium">/ {totalCount}</span></div>
                </div>
                <div className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl">
                  <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest mb-1">Consistency</div>
                  <div className="text-xl font-bold text-purple-500">
                    {totalCount > 0 ? (progressPercent > 80 ? 'Elite' : 'Active') : 'Ready'}
                  </div>
                </div>
              </div>

              {/* Milestones Section */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Current Milestones</h2>
                  <button
                    onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                    className="text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest"
                  >
                    {showMilestoneForm ? 'Cancel' : '+ New Block'}
                  </button>
                </div>

                <AnimatePresence>
                  {showMilestoneForm && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={addMilestone}
                      className="bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl space-y-3 overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Block Title (e.g. 75 Hard)"
                        value={newMilestone.title}
                        onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-purple-500 outline-none"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[8px] uppercase font-black text-zinc-600 ml-1">Start</label>
                          <input
                            type="date"
                            value={newMilestone.start_date}
                            onChange={e => setNewMilestone({ ...newMilestone, start_date: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] [color-scheme:dark]"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[8px] uppercase font-black text-zinc-600 ml-1">End</label>
                          <input
                            type="date"
                            value={newMilestone.end_date}
                            onChange={e => setNewMilestone({ ...newMilestone, end_date: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] [color-scheme:dark]"
                            required
                          />
                        </div>
                      </div>
                      <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 transition-colors">
                        Initialize Block
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  {milestones.filter(m => new Date(m.end_date) >= new Date(today)).map(m => {
                    const start = new Date(m.start_date + 'T00:00:00')
                    const end = new Date(m.end_date + 'T23:59:59')
                    const now = new Date()
                    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
                    const daysPassed = now < start ? 0 : Math.min(totalDays, Math.round((now - start) / (1000 * 60 * 60 * 24)) + 1)
                    const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
                    const timeProgress = Math.min(100, Math.round((daysPassed / totalDays) * 100))

                    let milestoneCompletions = 0
                    let totalPossible = 0
                    habits.forEach(h => {
                      const logs = h.habit_logs?.filter(l => {
                        const logDate = (l.completed_at || '').split('T')[0]
                        return logDate >= m.start_date && logDate <= m.end_date
                      }) || []
                      milestoneCompletions += logs.filter(l => l.status === 'completed').length

                      const habitCreated = new Date(h.created_at)
                      const milestoneStart = new Date(m.start_date + 'T00:00:00')
                      const milestoneEnd = new Date(m.end_date + 'T23:59:59')
                      const nowObj = new Date()

                      const effectiveStart = habitCreated > milestoneStart ? habitCreated : milestoneStart
                      const effectiveEnd = nowObj < milestoneEnd ? nowObj : milestoneEnd

                      const startDay = new Date(effectiveStart.toLocaleDateString('sv-SE'))
                      const endDay = new Date(effectiveEnd.toLocaleDateString('sv-SE'))

                      if (isNaN(startDay.getTime()) || isNaN(endDay.getTime())) return

                      const calcDays = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1
                      const skips = logs.filter(l => l.status === 'skipped').length
                      totalPossible += Math.max(0, calcDays - skips)
                    })
                    const mSuccessRate = Math.min(100, totalPossible > 0 ? Math.round((milestoneCompletions / totalPossible) * 100) : 0)

                    return (
                      <div key={m.id} className="relative bg-zinc-900 border border-zinc-800 p-5 rounded-3xl overflow-hidden group">
                        <div className="absolute top-0 left-0 h-full bg-purple-600/5 transition-all duration-1000" style={{ width: `${timeProgress}%` }} />

                        {editingMilestoneId === m.id ? (
                          <div className="relative space-y-3">
                            <input
                              type="text"
                              value={editMilestoneData.title}
                              onChange={e => setEditMilestoneData({ ...editMilestoneData, title: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:border-purple-500 outline-none"
                              placeholder="Title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={editMilestoneData.start_date}
                                onChange={e => setEditMilestoneData({ ...editMilestoneData, start_date: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] [color-scheme:dark]"
                              />
                              <input
                                type="date"
                                value={editMilestoneData.end_date}
                                onChange={e => setEditMilestoneData({ ...editMilestoneData, end_date: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] [color-scheme:dark]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingMilestoneId(null)}
                                className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-zinc-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => updateMilestone(m.id)}
                                className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-500"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="relative flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-black tracking-tight text-white mb-1 uppercase italic">{m.title}</h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{daysLeft} Days Remaining</span>
                                  <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{timeProgress}% Time Elapsed</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`text-2xl font-mono font-black ${mSuccessRate > 80 ? 'text-emerald-500' : mSuccessRate > 50 ? 'text-purple-500' : 'text-red-500'}`}>
                                  {mSuccessRate}%
                                </div>
                                <div className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Block Success</div>
                              </div>
                            </div>
                            <div className="relative h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600" style={{ width: `${timeProgress}%` }} />
                            </div>
                            <div className="absolute top-4 right-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => startEditMilestone(m)}
                                className="p-1.5 bg-zinc-800/80 text-zinc-400 hover:text-purple-400 rounded-lg backdrop-blur-sm"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => deleteMilestone(m.id)}
                                className="p-1.5 bg-zinc-800/80 text-zinc-500 hover:text-red-500 rounded-lg backdrop-blur-sm"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Completed Cycles</h2>
              </div>
              <div className="grid gap-3">
                {milestones.filter(m => new Date(m.end_date) < new Date(today)).length === 0 ? (
                  <div className="text-center py-20 px-6 border-2 border-dashed border-zinc-900 rounded-3xl">
                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">No achievements archived yet.</p>
                  </div>
                ) : (
                  milestones.filter(m => new Date(m.end_date) < new Date(today)).map(m => {
                    let milestoneCompletions = 0
                    let totalPossible = 0
                    habits.forEach(h => {
                      const logs = h.habit_logs?.filter(l => {
                        const logDate = (l.completed_at || '').split('T')[0]
                        return logDate >= m.start_date && logDate <= m.end_date
                      }) || []
                      milestoneCompletions += logs.filter(l => l.status === 'completed').length

                      const habitCreated = new Date(h.created_at)
                      const milestoneStart = new Date(m.start_date + 'T00:00:00')
                      const milestoneEnd = new Date(m.end_date + 'T23:59:59')
                      const effectiveStart = habitCreated > milestoneStart ? habitCreated : milestoneStart
                      const effectiveEnd = milestoneEnd

                      const startDay = new Date(effectiveStart.toLocaleDateString('sv-SE'))
                      const endDay = new Date(effectiveEnd.toLocaleDateString('sv-SE'))

                      if (isNaN(startDay.getTime()) || isNaN(endDay.getTime())) return

                      const calcDays = Math.round((endDay - startDay) / (1000 * 60 * 60 * 24)) + 1
                      const skips = logs.filter(l => l.status === 'skipped').length
                      totalPossible += Math.max(0, calcDays - skips)
                    })
                    const mSuccessRate = Math.min(100, totalPossible > 0 ? Math.round((milestoneCompletions / totalPossible) * 100) : 0)

                    return (
                      <div key={m.id} className="bg-zinc-950 border border-zinc-900/50 p-4 rounded-2xl group flex flex-col gap-3">
                        {editingMilestoneId === m.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editMilestoneData.title}
                              onChange={e => setEditMilestoneData({ ...editMilestoneData, title: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:border-purple-500 outline-none"
                              placeholder="Title"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="date"
                                value={editMilestoneData.start_date}
                                onChange={e => setEditMilestoneData({ ...editMilestoneData, start_date: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-zinc-400 [color-scheme:dark]"
                              />
                              <input
                                type="date"
                                value={editMilestoneData.end_date}
                                onChange={e => setEditMilestoneData({ ...editMilestoneData, end_date: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-[10px] text-zinc-400 [color-scheme:dark]"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingMilestoneId(null)}
                                className="flex-1 py-1.5 bg-zinc-900 text-zinc-500 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:text-zinc-300"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => updateMilestone(m.id)}
                                className="flex-1 py-1.5 bg-purple-900/40 text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-purple-900/60"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-tight italic">{m.title}</h4>
                              <p className="text-[8px] text-zinc-700 uppercase font-bold mt-1 tracking-widest leading-none">
                                {new Date(m.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} — {new Date(m.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className={`text-lg font-mono font-black ${mSuccessRate > 80 ? 'text-emerald-500/40' : mSuccessRate > 50 ? 'text-purple-500/40' : 'text-zinc-800'}`}>
                                  {mSuccessRate}%
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => startEditMilestone(m)}
                                  className="opacity-40 group-hover:opacity-100 p-2 text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  onClick={() => deleteMilestone(m.id)}
                                  className="opacity-40 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all rounded-lg"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              {/* Archived Habits Section */}
              <div className="mt-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-4">Archived Habits</h2>
                {archivedHabits.length === 0 ? (
                  <div className="text-center py-12 px-6 border-2 border-dashed border-zinc-900 rounded-3xl">
                    <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">No archived habits.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {archivedHabits.map(habit => (
                      <div key={habit.id} className="bg-zinc-950 border border-zinc-900/50 p-4 rounded-2xl group flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-zinc-500">{habit.name}</h4>
                          <p className="text-[8px] text-zinc-700 uppercase font-bold mt-1 tracking-widest">
                            {habit.frequency_type === 'daily' ? 'Daily' :
                              habit.frequency_type === 'weekly' ? `${habit.frequency_value}x/week` :
                                `${daysOfWeek.filter((_, i) => (habit.frequency_days || []).includes(i)).join(', ')}`}
                          </p>
                        </div>
                        <button
                          onClick={() => reactivateHabit(habit.id)}
                          className="px-4 py-2 bg-purple-900/40 text-purple-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-purple-900/60 transition-all"
                        >
                          Reactivate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {activeView === 'today' && (
          <>
            <div className="h-1 w-full bg-zinc-900 rounded-full mb-10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-red-600 via-purple-600 to-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              />
            </div>

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
                    className="p-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-500 disabled:opacity-0 disabled:translate-x-4 transition-all active:scale-90 shadow-lg shadow-purple-900/20"
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
                            <span className="text-lg font-black text-purple-500 min-w-[2ch] text-center">{freqValue}</span>
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
                                ? 'bg-purple-600 text-white'
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-700">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="text-xs uppercase tracking-widest font-bold">Synchronizing...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                  {(() => {
                    const activeMilestone = milestones.find(m => {
                      const start = new Date(m.start_date + 'T00:00:00')
                      const end = new Date(m.end_date + 'T23:59:59')
                      const now = new Date()
                      return now >= start && now <= end
                    })

                    return habits.map(habit => {
                      const isEditing = editingId === habit.id
                      const currentStatus = completions[habit.id]?.status
                      const isCompleted = currentStatus === 'completed'
                      const isSkipped = currentStatus === 'skipped'

                      const allLogs = habit.habit_logs || []

                      let filteredLogs = allLogs
                      let calculationStartDay = new Date(new Date(habit.created_at || Date.now()).toLocaleDateString('sv-SE'))

                      if (activeMilestone) {
                        const mStartStr = activeMilestone.start_date
                        filteredLogs = allLogs.filter(l => (l.completed_at || '').split('T')[0] >= mStartStr)

                        const habitCreatedDate = new Date(habit.created_at || Date.now())
                        const milestoneStartDate = new Date(mStartStr + 'T00:00:00')
                        const effectiveStart = habitCreatedDate > milestoneStartDate ? habitCreatedDate : milestoneStartDate
                        calculationStartDay = new Date(effectiveStart.toLocaleDateString('sv-SE'))
                      }

                      const completedLogs = filteredLogs.filter(l => l.status === 'completed').length
                      const skippedLogs = filteredLogs.filter(l => l.status === 'skipped').length

                      const endDay = new Date(new Date().toLocaleDateString('sv-SE'))
                      const daysInRange = Math.round((endDay - calculationStartDay) / (1000 * 60 * 60 * 24)) + 1

                      const effectiveDays = Math.max(1, daysInRange - skippedLogs)
                      const successRate = isNaN(effectiveDays) ? 0 : (Math.min(100, Math.round((completedLogs / effectiveDays) * 100)) || 0)

                      return (
                        <motion.div
                          key={habit.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isCompleted ? 'bg-purple-500/5 border-purple-500/20' :
                            isSkipped ? 'bg-amber-500/5 border-amber-500/20' :
                              'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700'
                            }`}
                        >
                          <div className="p-5 relative z-10">
                            <div>
                              {isEditing ? (
                                <div className="space-y-3 pr-4">
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                                  />

                                  {/* Frequency Selector */}
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      {['daily', 'weekly', 'days'].map(type => (
                                        <button
                                          key={type}
                                          type="button"
                                          onClick={() => setEditFreqType(type)}
                                          className={`flex-1 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-lg transition-all ${editFreqType === type
                                            ? 'bg-zinc-100 text-zinc-900'
                                            : 'bg-zinc-800/50 text-zinc-500 hover:bg-zinc-800'
                                            }`}
                                        >
                                          {type}
                                        </button>
                                      ))}
                                    </div>

                                    {editFreqType === 'weekly' && (
                                      <div className="flex items-center justify-between bg-zinc-800/30 p-2 rounded-lg">
                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Times/week</span>
                                        <div className="flex items-center gap-3">
                                          <button type="button" onClick={() => setEditFreqValue(Math.max(1, editFreqValue - 1))} className="text-sm font-bold p-1">-</button>
                                          <span className="text-sm font-black text-purple-500 min-w-[2ch] text-center">{editFreqValue}</span>
                                          <button type="button" onClick={() => setEditFreqValue(Math.min(7, editFreqValue + 1))} className="text-sm font-bold p-1">+</button>
                                        </div>
                                      </div>
                                    )}

                                    {editFreqType === 'days' && (
                                      <div className="flex justify-between bg-zinc-800/30 p-2 rounded-lg">
                                        {daysOfWeek.map((day, i) => (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => toggleEditDay(i)}
                                            className={`w-6 h-6 rounded-md text-[9px] font-black transition-all ${editFreqDays.includes(i)
                                              ? 'bg-purple-600 text-white'
                                              : 'bg-zinc-800 text-zinc-600'
                                              }`}
                                          >
                                            {day}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="flex-1" />
                                    <button onClick={() => setEditingId(null)} className="p-1.5 text-zinc-500 hover:text-zinc-300"><X size={16} /></button>
                                    <button onClick={() => updateHabit(habit.id)} className="p-1.5 bg-purple-600 text-white rounded-lg"><Save size={16} /></button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Top Row: Wheel, Name, Snooze, Tick */}
                                  <div className="flex items-start gap-3">
                                    <div className="relative flex items-center justify-center shrink-0">
                                      <svg className="w-10 h-10 -rotate-90">
                                        <circle cx="20" cy="20" r="18" className="stroke-zinc-800 fill-none" strokeWidth="3.5" />
                                        <motion.circle
                                          cx="20" cy="20" r="18"
                                          initial={{ strokeDasharray: "113", strokeDashoffset: "113" }}
                                          animate={{ strokeDashoffset: 113 - (113 * successRate) / 100 }}
                                          transition={{ duration: 1, ease: "easeOut" }}
                                          className={`fill-none ${successRate > 80 ? 'stroke-emerald-500' : successRate > 50 ? 'stroke-purple-500' : 'stroke-red-600'}`}
                                          strokeWidth="3.5" strokeLinecap="round"
                                        />
                                      </svg>
                                      <span className={`absolute text-[10px] font-black ${successRate > 80 ? 'text-emerald-400' : successRate > 50 ? 'text-purple-400' : 'text-red-400'}`}>
                                        {successRate}%
                                      </span>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h3 className={`font-bold transition-all ${isCompleted ? 'text-emerald-400 line-through opacity-50' : isSkipped ? 'text-amber-500/60' : 'text-zinc-200'}`}>
                                          {habit.name}
                                        </h3>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${successRate > 90 ? 'bg-emerald-500/10 text-emerald-400' : successRate > 75 ? 'bg-purple-500/10 text-purple-400' : successRate > 50 ? 'bg-zinc-800 text-zinc-400' : 'bg-red-500/10 text-red-500'}`}>
                                          {successRate > 90 ? 'Mythic' : successRate > 75 ? 'Elite' : successRate > 50 ? 'Active' : 'Grinding'}
                                        </span>
                                        {activeMilestone && (
                                          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1 border-l border-zinc-800/50 pl-2">Current Cycle</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => logStatus(habit.id, 'skipped')} className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all active:scale-90 ${isSkipped ? 'bg-amber-500/20 border border-amber-500/40' : 'bg-zinc-900/50 hover:bg-amber-500/5'}`}>😴</button>
                                      <button onClick={() => logStatus(habit.id, 'completed')} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isCompleted ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-100'}`}><Check size={22} className={isCompleted ? 'stroke-[3px]' : ''} /></button>
                                    </div>
                                  </div>

                                  {/* Bottom Row: Management Buttons */}
                                  <div className="flex items-center gap-2 pl-[52px]">
                                    <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                                      <button
                                        onClick={() => setExpandedHistory(expandedHistory === habit.id ? null : habit.id)}
                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                      >
                                        <Calendar size={14} />
                                      </button>
                                      <button onClick={() => startEdit(habit)} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"><Pencil size={14} /></button>
                                      <button onClick={() => archiveHabit(habit.id)} className="p-2 text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"><Archive size={14} /></button>
                                      <button onClick={() => deleteHabit(habit.id)} className="p-2 text-zinc-500 hover:text-purple-500 hover:bg-purple-500/10 rounded-lg transition-all"><Trash2 size={14} /></button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {expandedHistory === habit.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-5 pb-5 pt-2 border-t border-zinc-800/50"
                              >
                                <div className="flex items-center justify-between mb-3 px-1">
                                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Last 14 Days</div>
                                  <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-tighter text-zinc-600">
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" /> Done</div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" /> Snoozed</div>
                                    <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500/10" /> Missed</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                  {[...Array(14)].map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (13 - i));
                                    const dateStr = d.toLocaleDateString('sv-SE');
                                    const isToday = dateStr === today;

                                    const log = habit.habit_logs?.find(l => (l.completed_at || '').split('T')[0] === dateStr);
                                    const status = log?.status;

                                    return (
                                      <button
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleHistoryDay(habit.id, dateStr, status);
                                        }}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center border transition-all relative group/day ${status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' :
                                          status === 'skipped' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                            isToday ? 'bg-zinc-800 border-zinc-600 text-zinc-400' :
                                              'bg-zinc-950/40 border-zinc-900 text-zinc-800 hover:border-zinc-700'
                                          }`}
                                      >
                                        <span className={`text-[7px] font-black mb-0.5 ${status ? 'opacity-40' : 'opacity-20'}`}>
                                          {d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                                        </span>
                                        {status === 'completed' ? (
                                          <Check size={10} strokeWidth={4} />
                                        ) : status === 'skipped' ? (
                                          <span className="text-[10px] leading-none font-bold">Z</span>
                                        ) : (
                                          <span className="text-[10px] font-bold">{d.getDate()}</span>
                                        )}

                                        {/* Hover Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-zinc-800 text-white text-[9px] font-black rounded-lg opacity-0 group-hover/day:opacity-100 pointer-events-none transition-all scale-75 group-hover/day:scale-100 whitespace-nowrap z-20 border border-zinc-700 shadow-2xl">
                                          {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      )
                    })
                  })()}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCelebration(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
          >
            {/* Particle Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: Math.random() * window.innerWidth,
                    y: window.innerHeight + 100,
                    scale: Math.random() * 0.5 + 0.5,
                    opacity: 1
                  }}
                  animate={{
                    y: -100,
                    rotate: 360,
                    opacity: 0
                  }}
                  transition={{
                    duration: Math.random() * 2 + 2,
                    ease: "easeOut",
                    delay: Math.random() * 1
                  }}
                  className="absolute"
                >
                  <Sparkles size={Math.random() * 20 + 10} className="text-purple-500/40" />
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: 20, opacity: 0 }}
              className="relative max-w-xs w-full bg-zinc-900 border border-purple-500/30 p-8 rounded-[2.5rem] text-center shadow-[0_0_50px_rgba(147,51,234,0.2)]"
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.5)] border-4 border-black">
                <Trophy size={40} className="text-white" strokeWidth={2.5} />
              </div>

              <div className="mt-8 space-y-4">
                <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-tight">
                  DOMINANCE<br />ACHIEVED
                </h2>
                <div className="h-0.5 w-12 bg-purple-500 mx-auto rounded-full" />
                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] leading-relaxed">
                  Every target met.<br />The standard has been set.
                </p>
              </div>

              <motion.div
                className="mt-8 pt-6 border-t border-zinc-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center gap-2 text-purple-400 font-black text-sm italic">
                  <span>100% COMPLETE</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
