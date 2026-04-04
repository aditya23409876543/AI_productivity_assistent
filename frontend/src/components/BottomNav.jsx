import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, FileText, MessageSquareMore, CalendarDays, Settings } from 'lucide-react';

export default function BottomNav() {
  return (
    <div className="bottom-nav-container">
      <nav className="bottom-nav-pill">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={21} />
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Activity size={21} />
        </NavLink>
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <CalendarDays size={21} />
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={21} />
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquareMore size={21} />
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={21} />
        </NavLink>
      </nav>
    </div>
  );
}
