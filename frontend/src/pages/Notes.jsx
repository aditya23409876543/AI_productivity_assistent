import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Sparkles, Trash2, Save, FileText, Plus,
  ChevronLeft, ChevronRight, Send, Bot, User,
  Lightbulb, ListChecks, HelpCircle, Tag
} from 'lucide-react';

const API = 'http://localhost:5000/api';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'insights' | 'chat'
  const [parsedInsights, setParsedInsights] = useState(null);

  // Note chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const fetchNotes = async () => {
    try {
      const res = await axios.get(`${API}/notes`);
      setNotes(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchNotes(); }, []);

  const loadNote = async (id) => {
    try {
      const res = await axios.get(`${API}/notes/${id}`);
      setActiveNote(res.data);
      setContent(res.data.content);
      setActiveTab('summary');
      setChatMessages([]);
      setStatusMsg('');
      // Parse stored insights if any
      if (res.data.insights) {
        try { setParsedInsights(JSON.parse(res.data.insights)); }
        catch { setParsedInsights(null); }
      } else {
        setParsedInsights(null);
      }
    } catch (err) { console.error(err); }
  };

  const startNewNote = () => {
    setActiveNote(null);
    setContent('');
    setStatusMsg('');
    setActiveTab('summary');
    setParsedInsights(null);
    setChatMessages([]);
  };

  const handleSaveAndSummarize = async () => {
    if (!content.trim()) return;
    setLoadingAI(true);
    setStatusMsg('🤖 Summarizing & extracting insights...');
    try {
      // Run summarize + insights in parallel
      const [sumRes, insRes] = await Promise.all([
        axios.post(`${API}/ai/summarize`, { text: content }),
        axios.post(`${API}/ai/insights`, { text: content })
      ]);
      const summary = sumRes.data.summary;
      const insights = insRes.data.insights;
      const insightsStr = JSON.stringify(insights);

      await axios.post(`${API}/notes`, { content, summary, insights: insightsStr });
      fetchNotes();
      setStatusMsg('✅ Note saved with AI summary & insights!');
      setContent('');
      setActiveNote(null);
      setParsedInsights(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setStatusMsg(`❌ Failed: ${msg}`);
    } finally {
      setLoadingAI(false);
      setTimeout(() => setStatusMsg(''), 6000);
    }
  };

  const handleGenerateInsights = async () => {
    if (!activeNote) return;
    setLoadingInsights(true);
    try {
      const res = await axios.post(`${API}/ai/insights`, { text: activeNote.content });
      const insights = res.data.insights;
      setParsedInsights(insights);
      // Persist insights to note
      await axios.patch
        ? null // notes route doesn't have PATCH yet, just store in state
        : null;
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/notes/${id}`);
      if (activeNote?._id === id) startNewNote();
      fetchNotes();
    } catch (err) { console.error(err); }
  };

  const sendNoteChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading || !activeNote) return;
    const question = chatInput.trim();
    const newMessages = [...chatMessages, { role: 'user', content: question }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post(`${API}/ai/note-chat`, {
        question,
        noteContent: activeNote.content,
        noteTitle: activeNote.summary?.slice(0, 60) || 'Note',
        history: chatMessages
      });
      setChatMessages([...newMessages, { role: 'ai', content: res.data.response }]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setChatMessages([...newMessages, { role: 'ai', content: `Error: ${msg}` }]);
    } finally {
      setChatLoading(false);
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

  const TAB_STYLE = (active) => ({
    flex: 1, padding: '8px', border: 'none', borderRadius: '10px', cursor: 'pointer',
    fontSize: '0.8rem', fontWeight: 600,
    background: active ? 'var(--theme-header-color)' : 'transparent',
    color: active ? 'white' : 'var(--text-muted)',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ height: '100%', display: 'flex', gap: '0', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? '220px' : '0px',
        minWidth: sidebarOpen ? '220px' : '0px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex', flexDirection: 'column',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        marginRight: sidebarOpen ? '12px' : '0',
        border: '1px solid rgba(0,0,0,0.07)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>MY NOTES</span>
          <button onClick={startNewNote} title="New Note"
            style={{ background: 'var(--theme-header-color)', border: 'none', width: '26px', height: '26px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Plus size={14} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {notes.length === 0 ? (
            <div style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>No notes yet.<br />Write your first one!</div>
          ) : notes.map(note => (
            <div key={note._id} onClick={() => loadNote(note._id)} style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px',
              borderRadius: '12px', cursor: 'pointer', marginBottom: '4px', transition: 'all 0.2s',
              background: activeNote?._id === note._id ? 'var(--theme-header-color)22' : 'transparent',
              border: activeNote?._id === note._id ? '1px solid var(--theme-header-color)44' : '1px solid transparent'
            }}>
              <FileText size={13} color={activeNote?._id === note._id ? 'var(--theme-header-color)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                  {(note.summary || 'Note').slice(0, 28)}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(note.createdAt)}</div>
              </div>
              <button onClick={(e) => handleDelete(e, note._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.5, flexShrink: 0 }}>
                <Trash2 size={12} color="var(--text-muted)" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, gap: '12px', overflow: 'hidden' }}>

        {/* Editor / Viewer */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setSidebarOpen(o => !o)}
              style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '8px', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>
              {activeNote ? '📖 Reading Note' : '✏️ New Note'}
            </span>
            {activeNote && (
              <button onClick={startNewNote}
                style={{ marginLeft: 'auto', background: 'var(--theme-header-color)', color: 'white', border: 'none', borderRadius: '10px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={12} /> New
              </button>
            )}
          </div>

          <textarea className="input-pastel"
            placeholder="Paste or type your note... The AI will summarize it, extract insights, and let you chat with it like NotebookLM."
            rows={activeNote ? 4 : 6}
            value={content}
            onChange={e => setContent(e.target.value)}
            readOnly={!!activeNote}
            style={{ resize: 'vertical', background: activeNote ? 'rgba(0,0,0,0.02)' : undefined, cursor: activeNote ? 'default' : 'text' }}
          />

          {statusMsg && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{statusMsg}</div>}

          {!activeNote && (
            <button className="btn-pastel" onClick={handleSaveAndSummarize}
              disabled={loadingAI || !content.trim()}
              style={{ width: '100%', background: 'var(--theme-header-color)', opacity: (loadingAI || !content.trim()) ? 0.6 : 1 }}>
              <Save size={16} />
              {loadingAI ? 'Analyzing...' : 'Save & Analyze with AI'}
            </button>
          )}
        </div>

        {/* NotebookLM Panels — only when a note is active */}
        {activeNote && (
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.01)' }}>
              <button style={TAB_STYLE(activeTab === 'summary')} onClick={() => setActiveTab('summary')}>
                <Sparkles size={12} style={{ marginRight: '4px' }} />Summary
              </button>
              <button style={TAB_STYLE(activeTab === 'insights')} onClick={() => setActiveTab('insights')}>
                <Lightbulb size={12} style={{ marginRight: '4px' }} />Insights
              </button>
              <button style={TAB_STYLE(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
                <Bot size={12} style={{ marginRight: '4px' }} />Chat with Note
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* ── Summary Tab ── */}
              {activeTab === 'summary' && (
                <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                  <div style={{ color: 'var(--theme-header-color)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '12px' }}>
                    <Sparkles size={16} /> AI Summary
                  </div>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
                    {activeNote.summary || 'No summary available.'}
                  </div>
                </div>
              )}

              {/* ── Insights Tab ── */}
              {activeTab === 'insights' && (
                <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
                  {!parsedInsights && !loadingInsights && (
                    <button className="btn-pastel" onClick={handleGenerateInsights}
                      style={{ width: '100%', marginBottom: '16px', background: 'var(--theme-header-color)' }}>
                      <Lightbulb size={16} /> Generate Deep Insights
                    </button>
                  )}
                  {loadingInsights && (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '12px' }}>🤖 Extracting insights...</div>
                  )}
                  {parsedInsights && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                      {/* Key Topics */}
                      {parsedInsights.keyTopics?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '8px', color: 'var(--theme-header-color)' }}>
                            <Tag size={14} /> Key Topics
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {parsedInsights.keyTopics.map((t, i) => (
                              <span key={i} className="pill-tag" style={{ background: 'var(--theme-header-color)22', color: 'var(--theme-header-color)', border: '1px solid var(--theme-header-color)44' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Items */}
                      {parsedInsights.actionItems?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '8px', color: '#22c55e' }}>
                            <ListChecks size={14} /> Action Items
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {parsedInsights.actionItems.map((item, i) => (
                              <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                <span style={{ color: '#22c55e', fontWeight: 700, flexShrink: 0 }}>→</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Follow-up Questions */}
                      {parsedInsights.questions?.length > 0 && (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, marginBottom: '8px', color: '#f59e0b' }}>
                            <HelpCircle size={14} /> Follow-up Questions
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {parsedInsights.questions.map((q, i) => (
                              <div key={i}
                                onClick={() => { setActiveTab('chat'); setChatInput(q); }}
                                style={{ display: 'flex', gap: '8px', fontSize: '0.9rem', lineHeight: '1.5', padding: '8px 12px', background: '#f59e0b11', borderRadius: '10px', border: '1px solid #f59e0b33', cursor: 'pointer' }}>
                                <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>?</span>
                                <span>{q}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontStyle: 'italic' }}>
                            💡 Click a question to ask it in Chat with Note
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Chat with Note Tab ── */}
              {activeTab === 'chat' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Welcome */}
                  {chatMessages.length === 0 && (
                    <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                      <Bot size={24} color="var(--theme-header-color)" /><br />
                      Ask anything about this note. The AI is grounded on its content.
                    </div>
                  )}

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} style={{
                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '90%', display: 'flex', gap: '8px',
                        flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                      }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0, background: msg.role === 'user' ? 'var(--text-main)' : 'var(--theme-header-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {msg.role === 'user' ? <User size={12} color="white" /> : <Bot size={12} color="white" />}
                        </div>
                        <div style={{
                          background: msg.role === 'user' ? 'var(--theme-accent-light)' : 'rgba(0,0,0,0.04)',
                          padding: '9px 13px', borderRadius: '14px', fontSize: '0.88rem', lineHeight: '1.6',
                          borderTopRightRadius: msg.role === 'user' ? '4px' : '14px',
                          borderTopLeftRadius: msg.role === 'user' ? '14px' : '4px',
                          whiteSpace: 'pre-wrap', color: 'var(--text-main)'
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-start' }}>
                        <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--theme-header-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bot size={12} color="white" />
                        </div>
                        <div style={{ background: 'rgba(0,0,0,0.04)', padding: '10px 14px', borderRadius: '14px', borderTopLeftRadius: '4px' }}>
                          <span style={{ display: 'inline-flex', gap: '4px' }}>
                            {[0,1,2].map(i => <span key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--theme-header-color)', animation: `bounce 1s ${i*0.2}s infinite`, display: 'inline-block' }} />)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendNoteChat} style={{ padding: '10px 14px', borderTop: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '8px' }}>
                    <input type="text" className="input-pastel"
                      placeholder="Ask about this note..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      style={{ flex: 1, padding: '9px 12px', fontSize: '0.9rem' }}
                    />
                    <button type="submit" className="btn-pastel" disabled={chatLoading || !chatInput.trim()}
                      style={{ padding: '9px 12px', height: 'auto', background: 'var(--theme-header-color)', opacity: (chatLoading || !chatInput.trim()) ? 0.6 : 1 }}>
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }`}</style>
    </div>
  );
}
