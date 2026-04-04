import { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Search, Bell, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/tasks')
      .then(res => { setTasks(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const score = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <>
      {/* Primary Focus Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--theme-header-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={24} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{width: '6px', height: '6px', background: '#34D399', borderRadius: '50%', display: 'inline-block'}}></span> LIVE
              </div>
              <div style={{ fontWeight: 700 }}>AI is tracking your tasks</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 Desk</div>
            </div>
          </div>
          <div style={{ fontWeight: 700 }}>{loading ? '--' : `Score: ${score}%`}</div>
        </div>
        
        {/* Interaction Tags below the top card matching the 'Meowing, Licking' tags from image */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
          <div className="pill-tag">🎯 Focusing</div>
          <div className="pill-tag">☕ Coffee Break</div>
          <div className="pill-tag">🚀 Shipping</div>
        </div>
      </div>

      {/* Grid of 4 colored Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <div className="metric-card metric-orange">
          <div className="card-value">{score}%</div>
          <div className="card-title" style={{ color: 'rgba(0,0,0,0.6)'}}>Task Completion</div>
        </div>
        <div className="metric-card metric-green">
          <div className="card-value">62%</div>
          <div className="card-title" style={{ color: 'rgba(0,0,0,0.6)'}}>Focus Goal</div>
        </div>
        <div className="metric-card metric-purple">
          <div className="card-value">87%</div>
          <div className="card-title" style={{ color: 'rgba(0,0,0,0.6)'}}>Deep Work</div>
        </div>
        <div className="metric-card metric-red">
          <div className="card-value">76%</div>
          <div className="card-title" style={{ color: 'rgba(0,0,0,0.6)'}}>AI Score</div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span className="card-title">INSIGHTS</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>2 New Notifications</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: '40px', textAlign: 'center' }}>
            {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
          <div style={{ flex: 1, fontSize: '0.9rem', lineHeight: '1.5' }}>
            It seems that your most productive hours are early mornings. Scheduling complex backend tasks before 10 AM may increase your task completion rate by 22%.
          </div>
        </div>
      </div>
    </>
  );
}
