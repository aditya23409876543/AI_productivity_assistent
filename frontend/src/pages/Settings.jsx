import { useTheme, MOODS } from '../context/ThemeContext';
import { Palette } from 'lucide-react';

export default function Settings() {
  const { currentMood, setCurrentMood } = useTheme();

  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette /> Mood Color System
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
          Choose a color theme below. Your selection applies <strong>uniformly across all pages</strong> and is saved automatically.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.entries(MOODS).map(([key, moodVal]) => {
            const isActive = currentMood.name === moodVal.name;
            return (
              <div 
                key={key}
                onClick={() => setCurrentMood(moodVal)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '16px',
                  border: `2px solid ${isActive ? moodVal.headerColor : 'rgba(0,0,0,0.05)'}`,
                  background: isActive ? moodVal.accentLight : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: moodVal.headerColor, marginRight: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}></div>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', flex: 1 }}>{moodVal.name}</div>
                
                {/* Custom active radio style */}
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  border: `2px solid ${isActive ? moodVal.headerColor : '#ccc'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isActive && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: moodVal.headerColor }}></div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="card" style={{ marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Auto-detect mood based on activity</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>AI sets theme based on your stress and productivity levels.</p>
          </div>
          {/* Mock toggle switch */}
          <div style={{ width: '50px', height: '28px', borderRadius: '14px', background: 'var(--theme-header-color)', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'white', position: 'absolute', right: '2px', top: '2px' }}></div>
          </div>
        </div>
      </div>
    </>
  );
}
