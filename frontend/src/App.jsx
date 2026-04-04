import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import TaskManager from './pages/TaskManager';
import Notes from './pages/Notes';
import AIChat from './pages/AIChat';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import { useTheme } from './context/ThemeContext';
import { Wifi, WifiOff, BatteryFull, BatteryMedium, BatteryLow, BatteryCharging } from 'lucide-react';

const PAGE_NAMES = {
  '/': 'TODAY',
  '/tasks': 'TASKS',
  '/notes': 'NOTES',
  '/chat': 'AI CHAT',
  '/calendar': 'CALENDAR',
  '/settings': 'SETTINGS',
};

function App() {
  const { currentMood } = useTheme();
  const location = useLocation();

  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isCharging, setIsCharging] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);
        battery.addEventListener('levelchange', () => setBatteryLevel(Math.round(battery.level * 100)));
        battery.addEventListener('chargingchange', () => setIsCharging(battery.charging));
      }).catch(() => {});
    }

    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const generateDates = () => {
    const days = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dateNum: d.getDate(),
        isToday: i === 0
      });
    }
    return days;
  };
  const dates = generateDates();

  let BatteryIcon = BatteryFull;
  if (isCharging) BatteryIcon = BatteryCharging;
  else if (batteryLevel > 70) BatteryIcon = BatteryFull;
  else if (batteryLevel > 30) BatteryIcon = BatteryMedium;
  else BatteryIcon = BatteryLow;

  const pageTitle = PAGE_NAMES[location.pathname] || location.pathname.replace('/', '').toUpperCase();

  return (
    <>
      <div className="app-header">
        {/* Status Bar */}
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{time}</span>
          <h1 style={{ fontSize: '1rem', flex: 1, textAlign: 'center', margin: 0 }}>{pageTitle}</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isOnline ? <Wifi size={18} /> : <WifiOff size={18} color="#ef4444" />}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BatteryIcon size={18} />
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="date-selector">
          {dates.map((d, i) => (
            <div key={i} className={`date-item ${d.isToday ? 'active' : ''}`}>
              <span>{d.dayName}</span>
              <div className="date-circle">{d.dateNum}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskManager />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/chat" element={<AIChat />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <BottomNav />
    </>
  );
}

export default App;
