import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckCircle2, Sparkles, Trash2, CalendarDays, Clock } from 'lucide-react';

const API = 'http://localhost:5000/api';

const toDateStr = (d) => d.toISOString().split('T')[0];

const CATEGORY_COLORS = {
  work:     '#6366f1',
  personal: '#f59e0b',
  health:   '#22c55e',
  learning: '#8b5cf6',
  other:    '#94a3b8',
};

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [todayEvents, setTodayEvents] = useState([]);
  const [todayStr, setTodayStr] = useState(() => toDateStr(new Date()));
  const [title, setTitle] = useState('');
  const [prioritizing, setPrioritizing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/tasks`);
      setTasks(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTodayEvents = async () => {
    try {
      const res = await axios.get(`${API}/events?date=${todayStr}`);
      setTodayEvents(res.data);
    } catch (err) { console.error(err); }
  };

  // Midnight auto-refresh: check every minute if the date has changed
  useEffect(() => {
    const midnightCheck = setInterval(() => {
      const newDate = toDateStr(new Date());
      if (newDate !== todayStr) {
        setTodayStr(newDate);
      }
    }, 60_000); // check every 60s
    return () => clearInterval(midnightCheck);
  }, [todayStr]);

  // Fetch both tasks and today's events whenever the date changes
  useEffect(() => {
    fetchTasks();
    fetchTodayEvents();
  }, [todayStr]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await axios.post(`${API}/tasks`, { title });
      setTitle('');
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const toggleTask = async (task) => {
    try {
      await axios.patch(`${API}/tasks/${task._id}`, { completed: !task.completed });
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id) => {
    try {
      await axios.delete(`${API}/tasks/${id}`);
      fetchTasks();
    } catch (err) { console.error(err); }
  };

  // Toggle calendar event from within Tasks section
  const toggleEvent = async (ev) => {
    try {
      await axios.patch(`${API}/events/${ev._id}`, { completed: !ev.completed });
      fetchTodayEvents();
    } catch (err) { console.error(err); }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API}/events/${id}`);
      fetchTodayEvents();
    } catch (err) { console.error(err); }
  };

  const prioritize = async () => {
    if (tasks.length === 0) {
      setStatusMsg('⚠️ Add some tasks first!');
      setTimeout(() => setStatusMsg(''), 3000);
      return;
    }
    setPrioritizing(true);
    setStatusMsg('🤖 AI is analyzing your tasks...');
    try {
      const cleanTasks = tasks.map(t => ({ _id: t._id, title: t.title }));
      const res = await axios.post(`${API}/ai/prioritize`, { tasks: cleanTasks });

      const priorities = res.data.suggestedPriorities;
      if (!Array.isArray(priorities) || priorities.length === 0) {
        throw new Error('AI returned empty priorities.');
      }
      await Promise.all(
        priorities.map(s => axios.patch(`${API}/tasks/${s.id}`, { aiPriority: s.aiPriority }))
      );
      await fetchTasks();
      setStatusMsg('✅ Tasks prioritized successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      setStatusMsg(`❌ Failed: ${msg}`);
    } finally {
      setPrioritizing(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const completedEventsCount = todayEvents.filter(e => e.completed).length;

  const priorityStyle = {
    High:   { background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' },
    Medium: { background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44' },
    Low:    { background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44' },
  };

  return (
    <>
      {/* ── Stats Header ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-value" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              {tasks.length + todayEvents.length}
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>TOTAL TODAY</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '2px' }}>
              {completedCount + completedEventsCount} completed · {todayEvents.length} from calendar
            </div>
          </div>
          <button
            className="btn-pastel"
            onClick={prioritize}
            disabled={prioritizing}
            style={{ padding: '0.5rem 1rem', opacity: prioritizing ? 0.6 : 1, cursor: prioritizing ? 'not-allowed' : 'pointer' }}
          >
            <Sparkles size={15} /> {prioritizing ? 'Analyzing...' : 'Prioritize'}
          </button>
        </div>
        {statusMsg && (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{statusMsg}</div>
        )}
      </div>

      {/* ── TODAY'S CALENDAR EVENTS ── */}
      {todayEvents.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            background: 'var(--theme-accent-light)',
          }}>
            <CalendarDays size={15} color="var(--text-main)" />
            <span style={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Today's Schedule from Calendar
            </span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {completedEventsCount}/{todayEvents.length} done
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[...todayEvents]
              .sort((a, b) => {
                if (a.time && b.time) return a.time.localeCompare(b.time);
                if (a.time) return -1;
                if (b.time) return 1;
                return 0;
              })
              .map((ev, idx) => {
                const catColor = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.other;
                return (
                  <div key={ev._id} style={{
                    display: 'flex', alignItems: 'center', padding: '13px 16px',
                    borderBottom: idx !== todayEvents.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                    opacity: ev.completed ? 0.5 : 1,
                    transition: 'opacity 0.2s',
                    gap: '12px'
                  }}>
                    {/* Colored checkbox */}
                    <div
                      onClick={() => toggleEvent(ev)}
                      style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        border: ev.completed ? 'none' : `2px solid ${catColor}`,
                        background: ev.completed ? catColor : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                    >
                      {ev.completed && <CheckCircle2 size={12} color="white" />}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.92rem', textDecoration: ev.completed ? 'line-through' : 'none', color: 'var(--text-main)' }}>
                        {ev.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                        {ev.time && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <Clock size={10} /> {ev.time}
                          </span>
                        )}
                        <span style={{ fontSize: '0.68rem', color: catColor, background: catColor + '18', padding: '1px 7px', borderRadius: '20px', fontWeight: 600 }}>
                          {ev.category}
                        </span>
                        {ev.aiGenerated && (
                          <span style={{ fontSize: '0.65rem', background: 'var(--theme-header-color)33', color: 'var(--text-main)', padding: '1px 6px', borderRadius: '20px', fontWeight: 700 }}>AI</span>
                        )}
                      </div>
                    </div>

                    <Trash2 size={14} color="var(--text-muted)" onClick={() => deleteEvent(ev._id)}
                      style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.5 }} />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ── MY TASKS ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Add task form */}
        <form onSubmit={handleAddTask} style={{ display: 'flex', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Add new task..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.95rem', color: 'var(--text-main)' }}
          />
          <button type="submit" style={{ background: 'var(--theme-header-color)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            <Plus size={16} />
          </button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {tasks.map((task, idx) => (
            <div key={task._id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 16px',
              borderBottom: idx !== tasks.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              opacity: task.completed ? 0.5 : 1,
              transition: 'opacity 0.2s',
              gap: '12px'
            }}>
              <div onClick={() => toggleTask(task)} style={{
                width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                border: task.completed ? 'none' : '2px solid var(--theme-header-color)',
                background: task.completed ? 'var(--theme-header-color)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                {task.completed && <CheckCircle2 size={12} color="white" />}
              </div>

              <div style={{ flex: 1, textDecoration: task.completed ? 'line-through' : 'none', fontWeight: 500, fontSize: '0.92rem' }}>
                {task.title}
              </div>

              {task.aiPriority && task.aiPriority !== 'Unassigned' && priorityStyle[task.aiPriority] && (
                <span className="pill-tag" style={{ fontSize: '0.68rem', fontWeight: 700, ...priorityStyle[task.aiPriority] }}>
                  {task.aiPriority}
                </span>
              )}

              <Trash2 size={14} color="var(--text-muted)" onClick={() => deleteTask(task._id)}
                style={{ cursor: 'pointer', flexShrink: 0, opacity: 0.5 }} />
            </div>
          ))}
          {tasks.length === 0 && (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.88rem' }}>
              ✨ Add your first task above!
            </div>
          )}
        </div>
      </div>
    </>
  );
}
