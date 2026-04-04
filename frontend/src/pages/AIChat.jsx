import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Bot, User, Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

const API = 'http://localhost:5000/api';
const WELCOME = 'Your AI Assistant is here! How can I help you today?';

export default function AIChat() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([{ role: 'ai', content: WELCOME }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load conversation list on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${API}/conversations`);
      setConversations(res.data);
    } catch (err) { console.error(err); }
  };

  const loadConversation = async (id) => {
    try {
      const res = await axios.get(`${API}/conversations/${id}`);
      setActiveId(id);
      setMessages(res.data.messages.map(m => ({ role: m.role, content: m.content })));
    } catch (err) { console.error(err); }
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([{ role: 'ai', content: WELCOME }]);
    setInput('');
  };

  const deleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/conversations/${id}`);
      if (activeId === id) startNewChat();
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  const saveConversation = async (updatedMessages) => {
    // Don't save if only welcome message
    const realMessages = updatedMessages.filter(m => !(m.role === 'ai' && m.content === WELCOME));
    if (realMessages.length === 0) return;

    setSaving(true);
    try {
      const title = realMessages.find(m => m.role === 'user')?.content?.slice(0, 40) || 'New Chat';
      const payload = { title, messages: realMessages };

      if (activeId) {
        await axios.patch(`${API}/conversations/${activeId}`, payload);
      } else {
        const res = await axios.post(`${API}/conversations`, payload);
        setActiveId(res.data._id);
      }
      fetchConversations();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const tasksRes = await axios.get(`${API}/tasks`);
      const aiRes = await axios.post(`${API}/ai/chat`, {
        message: userMessage,
        contextTasks: tasksRes.data
      });
      const finalMessages = [...newMessages, { role: 'ai', content: aiRes.data.response }];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Network or API error occurred.';
      const finalMessages = [...newMessages, { role: 'ai', content: `Error: ${errorMsg}` }];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: '0', overflow: 'hidden', position: 'relative' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? '220px' : '0px',
        minWidth: sidebarOpen ? '220px' : '0px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        marginRight: sidebarOpen ? '12px' : '0',
        border: '1px solid rgba(0,0,0,0.07)'
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>HISTORY</span>
          <button
            onClick={startNewChat}
            title="New Chat"
            style={{ background: 'var(--theme-header-color)', border: 'none', width: '26px', height: '26px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              No past chats yet.<br />Start a conversation!
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv._id}
                onClick={() => loadConversation(conv._id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 10px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: activeId === conv._id ? 'var(--theme-header-color)22' : 'transparent',
                  border: activeId === conv._id ? '1px solid var(--theme-header-color)44' : '1px solid transparent',
                  marginBottom: '4px',
                  transition: 'all 0.2s'
                }}
              >
                <MessageSquare size={13} color={activeId === conv._id ? 'var(--theme-header-color)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                    {conv.title}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => deleteConversation(e, conv._id)}
                  title="Delete"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', opacity: 0.5, flexShrink: 0 }}
                >
                  <Trash2 size={12} color="var(--text-muted)" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative' }}>

          {/* Chat Header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              title={sidebarOpen ? 'Hide history' : 'Show history'}
              style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            <Bot size={18} color="var(--theme-header-color)" />
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Assistant</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {saving ? '💾 Saving...' : activeId ? '✅ Auto-saved' : '🆕 New chat'}
            </span>
            {activeId && (
              <button onClick={startNewChat} style={{ background: 'var(--theme-header-color)', color: 'white', border: 'none', borderRadius: '10px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={12} /> New
              </button>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                gap: '8px',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: msg.role === 'user' ? 'var(--text-main)' : 'var(--theme-header-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {msg.role === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="white" />}
                </div>
                <div style={{
                  background: msg.role === 'user' ? 'var(--theme-accent-light)' : 'rgba(0,0,0,0.04)',
                  padding: '10px 14px',
                  borderRadius: '16px',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: msg.role === 'user' ? '16px' : '4px',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--theme-header-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.04)', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px' }}>
                  <span style={{ display: 'inline-flex', gap: '4px' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{
                        width: '6px', height: '6px', borderRadius: '50%',
                        background: 'var(--theme-header-color)',
                        animation: `bounce 1s ${i * 0.2}s infinite`,
                        display: 'inline-block'
                      }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="input-pastel"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              style={{ flex: 1, padding: '10px 14px' }}
            />
            <button
              type="submit"
              className="btn-pastel"
              disabled={loading || !input.trim()}
              style={{ padding: '10px 14px', height: 'auto', background: 'var(--theme-header-color)', opacity: (loading || !input.trim()) ? 0.6 : 1 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
