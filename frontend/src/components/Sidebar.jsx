import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, FileText, MessageSquareMore, Sparkles } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Sparkles className="brand-icon" size={28} />
        <span>AI Assist</span>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <CheckSquare size={20} />
          Tasks
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <FileText size={20} />
          Notes
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <MessageSquareMore size={20} />
          AI Chat
        </NavLink>
      </nav>
    </aside>
  );
}
