import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthProvider'
import { TrendingUp, Flame, Calendar, Target } from 'lucide-react'

export default function Stats() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const { data: habits } = await supabase
        .from('habits')
        .select('*, habit_logs(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!habits) return

      const today = new Date()
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() - i)
        return d.toLocaleDateString('sv-SE')
      })

      // Overall completion rate (last 30 days)
      let totalExpected = 0
      let totalCompleted = 0

      habits.forEach(habit => {
        const logs = habit.habit_logs || []
        last30Days.forEach(dateStr => {
          totalExpected++
          if (logs.some(l => (l.completed_at || '').split('T')[0] === dateStr && l.status === 'completed')) {
            totalCompleted++
          }
        })
      })

      const completionRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0

      // Current streak (consecutive days with all habits done)
      let streak = 0
      for (let i = 0; i < last30Days.length; i++) {
        const dateStr = last30Days[i]
        const allDone = habits.every(habit => {
          const logs = habit.habit_logs || []
          return logs.some(l => (l.completed_at || '').split('T')[0] === dateStr && l.status === 'completed')
        })
        if (allDone && habits.length > 0) streak++
        else break
      }

      // Best day of week
      const dayTotals = [0, 0, 0, 0, 0, 0, 0]
      const dayCounts = [0, 0, 0, 0, 0, 0, 0]
      habits.forEach(habit => {
        (habit.habit_logs || []).forEach(log => {
          if (log.status === 'completed' && log.completed_at) {
            const day = new Date(log.completed_at).getDay()
            dayTotals[day]++
          }
        })
      })
      last30Days.forEach(dateStr => {
        const day = new Date(dateStr).getDay()
        dayCounts[day] += habits.length
      })

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      let bestDayIdx = 0
      let bestDayRate = 0
      dayTotals.forEach((total, i) => {
        const rate = dayCounts[i] > 0 ? total / dayCounts[i] : 0
        if (rate > bestDayRate) { bestDayRate = rate; bestDayIdx = i }
      })

      // Per-habit stats
      const habitStats = habits.map(habit => {
        const logs = habit.habit_logs || []
        const completed = logs.filter(l => l.status === 'completed').length
        const total = last30Days.length
        return {
          name: habit.name,
          rate: Math.round((completed / total) * 100),
        }
      }).sort((a, b) => b.rate - a.rate)

      setStats({
        completionRate,
        streak,
        bestDay: dayNames[bestDayIdx],
        bestDayRate: Math.round(bestDayRate * 100),
        totalHabits: habits.length,
        habitStats,
      })
    } catch (error) {
      console.error('Stats fetch error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center text-white text-xs py-8">Loading stats...</div>
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Target} label="30-Day Rate" value={`${stats.completionRate}%`} />
        <StatCard icon={Flame} label="Current Streak" value={`${stats.streak}d`} />
        <StatCard icon={Calendar} label="Best Day" value={stats.bestDay} />
        <StatCard icon={TrendingUp} label="Active Habits" value={stats.totalHabits} />
      </div>

      {/* Per-Habit Breakdown */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
        <h3 className="text-[10px] uppercase font-black tracking-widest text-white mb-3">Habit Performance</h3>
        <div className="space-y-3">
          {stats.habitStats.map(({ name, rate }) => (
            <div key={name}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white font-medium">{name}</span>
                <span className="text-white font-mono">{rate}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${rate}%`,
                    backgroundColor: rate >= 80 ? '#10b981' : rate >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4">
      <Icon size={16} className="text-purple-400 mb-2" />
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[10px] uppercase font-black tracking-widest text-white mt-1">{label}</div>
    </div>
  )
}
