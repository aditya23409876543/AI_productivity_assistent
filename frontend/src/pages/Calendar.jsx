import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Sparkles, ChevronLeft, ChevronRight, Clock, Tag } from 'lucide-react';

const API = 'http://localhost:5000/api';

const CATEGORIES = {
  work:     { label: 'Work',     color: '#6366f1', bg: '#6366f111' },
  personal: { label: 'Personal', color: '#f59e0b', bg: '#f59e0b11' },
  health:   { label: 'Health',   color: '#22c55e', bg: '#22c55e11' },
  learning: { label: 'Learning', color: '#8b5cf6', bg: '#8b5cf611' },
  other:    { label: 'Other',    color: '#94a3b8', bg: '#94a3b811' },
};

const toDateStr = (d) => d.toISOString().split('T')[0]; // 'YYYY-MM-DD'

export default function Calendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateStr(today));
  const [allEvents, setAllEvents] = useState({});   // { 'YYYY-MM-DD': [events] }
  const [dayEvents, setDayEvents] = useState([]);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Add event form
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState('work');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const monthKey = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;

  const fetchMonthEvents = async () => {
    try {
      const res = await axios.get(`${API}/events?month=${monthKey}`);
      // Group by date
      const grouped = {};
      res.data.forEach(ev => {
        if (!grouped[ev.date]) grouped[ev.date] = [];
        grouped[ev.date].push(ev);
      });
      setAllEvents(grouped);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchMonthEvents(); }, [monthKey]);

  useEffect(() => {
    setDayEvents(allEvents[selectedDate] || []);
  }, [selectedDate, allEvents]);

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const getDaysInMonth = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await axios.post(`${API}/events`, {
        title: newTitle.trim(),
        description: newDesc.trim(),
        date: selectedDate,
        time: newTime,
        category: newCategory,
        aiGenerated: false
      });
      setNewTitle(''); setNewTime(''); setNewDesc(''); setNewCategory('work');
      setShowForm(false);
      fetchMonthEvents();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const toggleEvent = async (ev) => {
    try {
      await axios.patch(`${API}/events/${ev._id}`, { completed: !ev.completed });
      fetchMonthEvents();
    } catch (err) { console.error(err); }
  };

  const deleteEvent = async (id) => {
    try {
      await axios.delete(`${API}/events/${id}`);
      fetchMonthEvents();
    } catch (err) { console.error(err); }
  };

  const generateDailyPlan = async () => {
    setGeneratingPlan(true);
    setStatusMsg('🤖 AI is building your daily plan...');
    try {
      const [tasksRes] = await Promise.all([
        axios.get(`${API}/tasks`)
      ]);
      const incompleteTasks = tasksRes.data.filter(t => !t.completed);
      const scheduledForDay = dayEvents.filter(e => !e.aiGenerated);

      const res = await axios.post(`${API}/ai/daily-plan`, {
        date: selectedDate,
        scheduledEvents: scheduledForDay,
        existingTasks: incompleteTasks
      });

      const plan = res.data.plan;
      // Bulk save the AI plan as events for this day
      await axios.post(`${API}/events/bulk`, {
        events: plan.map(item => ({
          title: item.title,
          description: item.description || '',
          date: selectedDate,
          time: item.time || '',
          category: item.category || 'work',
          aiGenerated: true
        }))
      });

      fetchMonthEvents();
      setStatusMsg(`✅ AI generated ${plan.length} tasks for your day!`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setStatusMsg(`❌ ${msg}`);
    } finally {
      setGeneratingPlan(false);
      setTimeout(() => setStatusMsg(''), 6000);
    }
  };

  const clearAIPlan = async () => {
    const aiEvents = dayEvents.filter(e => e.aiGenerated);
    await Promise.all(aiEvents.map(e => axios.delete(`${API}/events/${e._id}`)));
    fetchMonthEvents();
  };

  const cells = getDaysInMonth();
  const todayStr = toDateStr(today);
  const monthName = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const hasAIPlan = dayEvents.some(e => e.aiGenerated);
  const isToday = selectedDate === todayStr;

  return (
    <div className="calendar-layout" style={{ display: 'flex', gap: '12px', height: '100%', overflow: 'hidden' }}>

      {/* ── Monthly Grid ── */}
      <div className="calendar-grid-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '280px', minWidth: '280px' }}>
        <div className="card" style={{ padding: '16px' }}>
          {/* Month Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }}>
              <ChevronLeft size={18} color="var(--text-muted)" />
            </button>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{monthName}</span>
            <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }}>
              <ChevronRight size={18} color="var(--text-muted)" />
            </button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '6px' }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {cells.map((day, idx) => {
              if (!day) return <div key={idx} />;
              const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
              const hasEvents = !!(allEvents[dateStr]?.length);
              const isSelected = dateStr === selectedDate;
              const isTodayCell = dateStr === todayStr;
              return (
                <div key={idx} onClick={() => setSelectedDate(dateStr)} style={{
                  textAlign: 'center', padding: '6px 2px', borderRadius: '10px',
                  cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
                  background: isSelected ? 'var(--theme-header-color)' : isTodayCell ? 'var(--theme-accent-light)' : 'transparent',
                  fontWeight: isSelected || isTodayCell ? 700 : 400,
                  fontSize: '0.85rem',
                  color: isSelected ? 'rgba(0,0,0,0.7)' : 'var(--text-main)',
                }}>
                  {day}
                  {hasEvents && (
                    <div style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: isSelected ? 'rgba(0,0,0,0.4)' : 'var(--theme-header-color)',
                      margin: '2px auto 0'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>CATEGORIES</div>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: cat.color, flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Day Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0, overflow: 'hidden' }}>

        {/* Day header */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {isToday && <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: 'var(--theme-header-color)', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>TODAY</span>}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''} scheduled
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {hasAIPlan && (
              <button onClick={clearAIPlan}
                style={{ background: '#ef444411', color: '#ef4444', border: '1px solid #ef444433', borderRadius: '10px', padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                Clear AI Plan
              </button>
            )}
            <button onClick={() => setShowForm(f => !f)} className="btn-pastel"
              style={{ padding: '6px 12px', height: 'auto' }}>
              <Plus size={14} /> Add Event
            </button>
            <button onClick={generateDailyPlan} disabled={generatingPlan} className="btn-pastel"
              style={{ padding: '6px 12px', height: 'auto', background: 'var(--theme-header-color)', opacity: generatingPlan ? 0.6 : 1 }}>
              <Sparkles size={14} /> {generatingPlan ? 'Generating...' : 'AI Daily Plan'}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {statusMsg}
          </div>
        )}

        {/* Add event form */}
        {showForm && (
          <div className="card">
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px' }}>➕ New Event for {selectedDate}</div>
              <input type="text" className="input-pastel" placeholder="Event title *" value={newTitle}
                onChange={e => setNewTitle(e.target.value)} style={{ padding: '10px' }} required />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="time" className="input-pastel" value={newTime}
                  onChange={e => setNewTime(e.target.value)} style={{ padding: '10px', flex: 1 }} />
                <select className="input-pastel" value={newCategory}
                  onChange={e => setNewCategory(e.target.value)} style={{ padding: '10px', flex: 1 }}>
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <textarea className="input-pastel" placeholder="Description (optional)" rows={2} value={newDesc}
                onChange={e => setNewDesc(e.target.value)} style={{ padding: '10px', resize: 'none' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-pastel" disabled={saving}
                  style={{ flex: 1, background: 'var(--theme-header-color)', height: 'auto', padding: '10px' }}>
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 16px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {dayEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
              <Sparkles size={32} color="var(--theme-header-color)" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>No events yet</div>
              <div style={{ fontSize: '0.85rem' }}>Add events manually or tap <strong>AI Daily Plan</strong> to auto-generate a schedule.</div>
            </div>
          ) : (
            // Sort: by time first, then show AI-generated separately
            [...dayEvents].sort((a, b) => {
              if (a.time && b.time) return a.time.localeCompare(b.time);
              if (a.time) return -1;
              if (b.time) return 1;
              return 0;
            }).map(ev => {
              const cat = CATEGORIES[ev.category] || CATEGORIES.other;
              return (
                <div key={ev._id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px', borderRadius: '16px',
                  background: ev.completed ? 'rgba(0,0,0,0.02)' : 'white',
                  border: `1px solid ${ev.aiGenerated ? 'var(--theme-header-color)44' : 'rgba(0,0,0,0.06)'}`,
                  opacity: ev.completed ? 0.6 : 1,
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}>
                  {/* Check circle */}
                  <div onClick={() => toggleEvent(ev)} style={{
                    width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    border: ev.completed ? 'none' : `2px solid ${cat.color}`,
                    background: ev.completed ? cat.color : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px'
                  }}>
                    {ev.completed && <CheckCircle2 size={14} color="white" />}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontWeight: 600, textDecoration: ev.completed ? 'line-through' : 'none',
                        fontSize: '0.95rem', color: 'var(--text-main)'
                      }}>{ev.title}</span>
                      {ev.aiGenerated && (
                        <span style={{ fontSize: '0.65rem', background: 'var(--theme-header-color)33', color: 'var(--theme-header-color)', padding: '1px 6px', borderRadius: '20px', fontWeight: 700 }}>AI</span>
                      )}
                      <span style={{ fontSize: '0.72rem', background: cat.bg, color: cat.color, padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>{cat.label}</span>
                    </div>
                    {ev.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        <Clock size={11} /> {ev.time}
                      </div>
                    )}
                    {ev.description && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>{ev.description}</div>
                    )}
                  </div>

                  {/* Delete */}
                  <button onClick={() => deleteEvent(ev._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', opacity: 0.4, flexShrink: 0 }}>
                    <Trash2 size={15} color="var(--text-muted)" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
