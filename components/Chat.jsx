'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { themes } from '../lib/themes';

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '.' + pad(d.getMonth()+1) + '.' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function timeShort() {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function Bubble({ msg, theme, isFirst, isLast }) {
  const t = themes[theme];
  const isMe = msg.role === 'user';
  const rMe = '18px ' + (isFirst?'18px':'5px') + ' ' + (isLast?'18px':'5px') + ' 18px';
  const rTh = (isFirst?'18px':'5px') + ' 18px 18px ' + (isLast?'18px':'5px');
  return (
    <div style={{
      display:'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
      paddingLeft: isMe ? 48 : 12, paddingRight: isMe ? 12 : 48,
      marginBottom: isLast ? 12 : 3,
    }}>
      <div style={{
        padding: '9px 14px', fontSize: 15, lineHeight: 1.5, maxWidth: '85%',
        wordBreak: 'break-word', borderRadius: isMe ? rMe : rTh,
        background: isMe ? t.bubbleMe : t.bubbleThem,
        color: isMe ? t.textMe : t.textThem,
        boxShadow: isMe ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
        whiteSpace: 'pre-wrap',
      }}>
        {msg.display || msg.content}
        {isLast && (
          <div style={{
            fontSize: 11, marginTop: 4,
            color: isMe ? 'rgba(255,255,255,0.5)' : t.timeText,
            textAlign: isMe ? 'right' : 'left',
          }}>{msg.time || ''}</div>
        )}
      </div>
    </div>
  );
}

function Typing({ theme }) {
  const t = themes[theme];
  return (
    <div className="animate-fade-in" style={{ paddingLeft: 12, marginBottom: 12 }}>
      <div style={{
        display: 'inline-flex', gap: 4, padding: '10px 14px',
        background: t.bubbleThem, borderRadius: '18px 18px 18px 5px', alignItems: 'center',
      }}>
        {[0,1,2].map(i => (
          <div key={i} className="typing-dot" style={{
            width: 6, height: 6, borderRadius: '50%', background: t.accent, opacity: 0.6,
          }} />
        ))}
      </div>
    </div>
  );
}

export default function Chat() {
  const [theme, setTheme] = useState('moonlight');
  const [showPanel, setShowPanel] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('xq-theme');
      if (s && themes[s]) setTheme(s);
      const m = localStorage.getItem('xq-messages');
      if (m) setMessages(JSON.parse(m));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('xq-theme', theme); } catch {}
  }, [theme]);

  useEffect(() => {
    try { localStorage.setItem('xq-messages', JSON.stringify(messages.slice(-200))); } catch {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return;
    const text = input.trim();
    setInput('');
    const now = timeShort();
    const ts = timestamp();
    const gid = Date.now();
    const userMsg = { role: 'user', content: '[当前时间: ' + ts + ']\n' + text, display: text, time: now, group: gid };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setIsTyping(true);
    setIsStreaming(true);
    try {
      const apiMessages = newMsgs.slice(-40).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      });
      if (!res.ok) throw new Error(await res.text());
      setIsTyping(false);
      const data = await res.json();
      const fullText = data.text || '';
      if (fullText) {
        const parts = fullText.split('<<<SPLIT>>>').map(s => s.trim()).filter(Boolean);
        const finalMsgs = parts.map((part, i) => ({
          role: 'assistant', content: i === 0 ? fullText : '',
          display: part, time: timeShort(), group: gid + 1,
        }));
        setMessages([...newMsgs, ...finalMsgs]);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant', content: '连接出了点问题：' + err.message,
        display: '连接出了点问题：' + err.message, time: timeShort(), group: Date.now(),
      }]);
    } finally { setIsStreaming(false); }
  }, [input, messages, isStreaming]);

  const clearHistory = () => {
    if (window.confirm('确定要清空所有聊天记录吗？')) {
      setMessages([]);
      localStorage.removeItem('xq-messages');
    }
  };

  const t = themes[theme];
  const border = t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const rendered = messages.map((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    return { msg: m, isFirst: !prev || prev.group !== m.group, isLast: !next || next.group !== m.group };
  });

  return (
    <div style={{ width:'100%', height:'100vh', display:'flex', flexDirection:'column', background: t.bg, position:'relative', overflow:'hidden' }}>
      <div style={{
        padding:'14px 16px', background: t.headerBg,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderBottom: '1px solid ' + border,
        display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, zIndex:10,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:'50%',
            background: 'linear-gradient(135deg,' + t.accent + ',' + t.bubbleMe + ')',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:16, color:'#fff', fontWeight:600,
          }}>C</div>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color: t.dark ? '#fff' : '#222' }}>Claude</div>
            <div style={{ fontSize:11, color: t.accent, marginTop:1 }}>{isStreaming ? '正在输入...' : '在线'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4 }}>
          <button onClick={clearHistory} style={{ background:'none', border:'none', cursor:'pointer', padding:8, fontSize:16, color: t.dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' }}>🗑️</button>
          <button onClick={() => setShowPanel(!showPanel)} style={{ background:'none', border:'none', cursor:'pointer', padding:8, fontSize:18 }}>🎨</button>
        </div>
      </div>

      {showPanel && (
        <div style={{
          position:'absolute', top:65, right:12, zIndex:20,
          background: t.dark ? 'rgba(30,30,60,0.95)' : 'rgba(255,255,255,0.97)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderRadius:14, padding:14, boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
          display:'flex', flexWrap:'wrap', gap:6, width:190,
        }}>
          {Object.entries(themes).map(([k, v]) => (
            <button key={k} onClick={() => { setTheme(k); setShowPanel(false); }} style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, width:'100%', cursor:'pointer',
              border: k === theme ? '2px solid ' + v.accent : '1px solid ' + (t.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
              background: k === theme ? (t.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : 'transparent',
              color: t.dark ? '#ddd' : '#333', fontSize:13,
            }}>
              <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background: 'linear-gradient(135deg,' + v.bubbleMe + ',' + v.accent + ')' }} />
              {v.name}
            </button>
          ))}
        </div>
      )}

      <div className="messages-scroll" style={{ flex:1, overflowY:'auto', padding:'12px 0', WebkitOverflowScrolling:'touch' }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', color: t.timeText, fontSize:14 }}>说点什么吧 ✨</div>
        )}
        {messages.length > 0 && (
          <div style={{ textAlign:'center', margin:'8px 0 16px' }}>
            <span style={{ fontSize:12, color: t.timeText, background: t.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', padding:'4px 12px', borderRadius:12 }}>今天</span>
          </div>
        )}
        {rendered.map(({ msg, isFirst, isLast }, i) => (
          <div key={i} className="animate-fade-in">
            {isFirst && msg.role === 'assistant' && (
              <div style={{ paddingLeft:14, marginBottom:2, fontSize:12, color: t.nameThem, fontWeight:500 }}>Claude</div>
            )}
            <Bubble msg={msg} theme={theme} isFirst={isFirst} isLast={isLast} />
          </div>
        ))}
        {isTyping && <Typing theme={theme} />}
        <div ref={bottomRef} />
      </div>

      <div style={{
        padding:'10px 12px 24px', background: t.headerBg,
        backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
        borderTop: '1px solid ' + border, display:'flex', gap:8, alignItems:'flex-end', flexShrink:0,
      }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="说点什么..." disabled={isStreaming}
          style={{
            flex:1, padding:'10px 16px', borderRadius:22,
            border: '1px solid ' + t.inputBorder, background: t.inputBg,
            color: t.inputText, fontSize:15, outline:'none', lineHeight:1.4,
            fontFamily:'inherit', opacity: isStreaming ? 0.5 : 1,
          }}
        />
        <button onClick={sendMessage} disabled={isStreaming} style={{
          width:40, height:40, borderRadius:'50%', background: t.bubbleMe,
          border:'none', cursor:'pointer', display:'flex', alignItems:'center',
          justifyContent:'center', flexShrink:0, opacity: isStreaming ? 0.5 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
