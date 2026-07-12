'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const THEMES = {
  lavender: { n:'薰衣草', bg:'#f3f0ff', hd:'rgba(243,240,255,0.95)', me:'#9b7fef', them:'#fff', tMe:'#fff', tTh:'#3d3157', ac:'#7c5ce7', tm:'rgba(61,49,87,0.35)', nm:'#7c5ce7', bdr:'rgba(124,92,231,0.1)', dark:false },
  moonlight: { n:'月光', bg:'#0d0d2b', hd:'rgba(13,13,43,0.9)', me:'#6c5ce7', them:'rgba(255,255,255,0.08)', tMe:'#fff', tTh:'#d4d0f0', ac:'#a29bfe', tm:'rgba(255,255,255,0.35)', nm:'#a29bfe', bdr:'rgba(255,255,255,0.06)', dark:true },
  sakura: { n:'樱花', bg:'#fff5f7', hd:'rgba(255,245,247,0.95)', me:'#f48fb1', them:'#fff', tMe:'#fff', tTh:'#5a3040', ac:'#ec407a', tm:'rgba(90,48,64,0.35)', nm:'#ec407a', bdr:'rgba(236,64,122,0.1)', dark:false },
  ocean: { n:'深海', bg:'#0a1628', hd:'rgba(10,22,40,0.9)', me:'#0288d1', them:'rgba(255,255,255,0.07)', tMe:'#fff', tTh:'#b0d4e8', ac:'#4fc3f7', tm:'rgba(176,212,232,0.35)', nm:'#4fc3f7', bdr:'rgba(255,255,255,0.06)', dark:true },
  matcha: { n:'抹茶', bg:'#f5f7f0', hd:'rgba(245,247,240,0.95)', me:'#7cb342', them:'#fff', tMe:'#fff', tTh:'#3e4a2e', ac:'#689f38', tm:'rgba(62,74,46,0.35)', nm:'#689f38', bdr:'rgba(104,159,56,0.1)', dark:false },
};

function tsFull() {
  const d = new Date(), p = n => String(n).padStart(2,'0');
  return d.getFullYear()+'.'+p(d.getMonth()+1)+'.'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
}
function tsShort() {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}

function Avatar({ src, fallback, size }) {
  const s = size || 36;
  if (src) return <img src={src} alt="" style={{ width:s, height:s, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />;
  return <div style={{ width:s, height:s, borderRadius:'50%', background:'linear-gradient(135deg,#a29bfe,#6c5ce7)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:s*0.4, color:'#fff', fontWeight:600, flexShrink:0 }}>{fallback}</div>;
}

function AvatarPicker({ label, value, onChange, theme }) {
  const t = THEMES[theme];
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { onChange(ev.target.result); };
    reader.readAsDataURL(file);
  };
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontSize:13, color:t.tm, marginBottom:8 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <Avatar src={value} fallback={label.includes('Claude')?'C':'晴'} size={48} />
        <button onClick={() => fileRef.current?.click()} style={{
          padding:'8px 16px', borderRadius:12, fontSize:13, cursor:'pointer',
          border:'1px solid '+(t.dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.1)'),
          background:t.dark?'rgba(255,255,255,0.05)':'#f8f8fa',
          color:t.dark?'#ddd':'#555',
        }}>从相册选择</button>
        {value && <button onClick={() => onChange('')} style={{
          padding:'8px 12px', borderRadius:12, fontSize:13, cursor:'pointer',
          border:'none', background:'transparent', color:'#e94560',
        }}>移除</button>}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      </div>
    </div>
  );
}

function Bubble({ msg, theme, isFirst, isLast, avatarClaude, avatarMe }) {
  const t = THEMES[theme];
  const isMe = msg.role === 'user';
  const rMe = '20px '+(isFirst?'20px':'6px')+' '+(isLast?'20px':'6px')+' 20px';
  const rTh = (isFirst?'20px':'6px')+' 20px 20px '+(isLast?'20px':'6px');
  return (
    <div style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start', paddingLeft:8, paddingRight:8, marginBottom:isLast?14:3, gap:8, alignItems:'flex-end' }}>
      {!isMe && isLast && <Avatar src={avatarClaude} fallback="C" size={32} />}
      {!isMe && !isLast && <div style={{ width:32, flexShrink:0 }} />}
      <div style={{
        padding:'10px 14px', fontSize:15, lineHeight:1.55, maxWidth:'75%',
        wordBreak:'break-word', borderRadius:isMe?rMe:rTh,
        background:isMe?t.me:t.them, color:isMe?t.tMe:t.tTh,
        boxShadow:t.dark?'none':'0 1px 4px rgba(0,0,0,0.06)',
        whiteSpace:'pre-wrap',
      }}>
        {msg.display || msg.content}
        {isLast && <div style={{ fontSize:11, color:isMe?'rgba(255,255,255,0.5)':t.tm, marginTop:4, textAlign:isMe?'right':'left' }}>{msg.time||''}</div>}
      </div>
      {isMe && isLast && <Avatar src={avatarMe} fallback="晴" size={32} />}
      {isMe && !isLast && <div style={{ width:32, flexShrink:0 }} />}
    </div>
  );
}

function TypingDots({ theme }) {
  const t = THEMES[theme];
  return (
    <div style={{ display:'flex', paddingLeft:48, marginBottom:12, animation:'fi 0.2s ease-out' }}>
      <div style={{ display:'inline-flex', gap:4, padding:'10px 14px', background:t.them, borderRadius:'20px 20px 20px 6px', alignItems:'center', boxShadow:t.dark?'none':'0 1px 4px rgba(0,0,0,0.06)' }}>
        {[0,1,2].map(i => <div key={i} className="typing-dot" style={{ width:6, height:6, borderRadius:'50%', background:t.ac, opacity:0.6 }} />)}
      </div>
    </div>
  );
}

function Settings({ show, onClose, theme, setTheme, avatarClaude, setAvatarClaude, avatarMe, setAvatarMe, claudeName, setClaudeName }) {
  const t = THEMES[theme];
  if (!show) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div style={{
        position:'relative', width:'100%', maxWidth:420, maxHeight:'80vh', overflowY:'auto',
        background:t.dark?'#1a1a2e':'#fff', borderRadius:'20px 20px 0 0',
        padding:'20px 20px 40px', color:t.dark?'#ddd':'#333',
      }}>
        <div style={{ width:40, height:4, borderRadius:2, background:t.dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.15)', margin:'0 auto 20px' }} />
        <div style={{ fontSize:17, fontWeight:600, marginBottom:20 }}>设置</div>
        <div style={{ fontSize:13, color:t.tm, marginBottom:8 }}>主题</div>
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          {Object.entries(THEMES).map(([k,v]) => (
            <button key={k} onClick={() => setTheme(k)} style={{
              padding:'8px 14px', borderRadius:12, fontSize:13, cursor:'pointer',
              border:k===theme?'2px solid '+v.ac:'1px solid '+(t.dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'),
              background:k===theme?(t.dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)'):'transparent',
              color:t.dark?'#ddd':'#333',
            }}>{v.n}</button>
          ))}
        </div>
        <div style={{ fontSize:13, color:t.tm, marginBottom:8 }}>Claude 名字</div>
        <input value={claudeName} onChange={e => setClaudeName(e.target.value)} placeholder="Claude"
          style={{ width:'100%', padding:'10px 14px', borderRadius:12, border:'1px solid '+(t.dark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'), background:t.dark?'rgba(255,255,255,0.05)':'#f8f8f8', color:t.dark?'#ddd':'#333', fontSize:14, outline:'none', marginBottom:20 }} />
        <AvatarPicker label="Claude 头像" value={avatarClaude} onChange={setAvatarClaude} theme={theme} />
        <AvatarPicker label="我的头像" value={avatarMe} onChange={setAvatarMe} theme={theme} />
        <button onClick={onClose} style={{
          width:'100%', padding:'12px', borderRadius:14, border:'none', cursor:'pointer',
          background:THEMES[theme].ac, color:'#fff', fontSize:15, fontWeight:600,
        }}>完成</button>
      </div>
    </div>
  );
}

export default function Chat() {
  const [theme, setTheme] = useState('lavender');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [avatarClaude, setAvatarClaude] = useState('');
  const [avatarMe, setAvatarMe] = useState('');
  const [claudeName, setClaudeName] = useState('Claude');
  const bottomRef = useRef(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('xq2-settings');
      if (s) { const d = JSON.parse(s); if (d.theme&&THEMES[d.theme]) setTheme(d.theme); if (d.avatarClaude) setAvatarClaude(d.avatarClaude); if (d.avatarMe) setAvatarMe(d.avatarMe); if (d.claudeName) setClaudeName(d.claudeName); }
      const m = localStorage.getItem('xq2-messages');
      if (m) setMessages(JSON.parse(m));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('xq2-settings', JSON.stringify({ theme, avatarClaude, avatarMe, claudeName })); } catch {}
  }, [theme, avatarClaude, avatarMe, claudeName]);

  useEffect(() => {
    try { localStorage.setItem('xq2-messages', JSON.stringify(messages.slice(-200))); } catch {}
  }, [messages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, typing]);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const text = input.trim();
    setInput('');
    const now = tsShort(), t = tsFull(), gid = Date.now();
    const userMsg = { role:'user', content:'[当前时间: '+t+']\n'+text, display:text, time:now, group:gid };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setTyping(true);
    setStreaming(true);
    try {
      const res = await fetch('/api/chat', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ messages:newMsgs.slice(-40).map(m=>({role:m.role,content:m.content})) }),
      });
      if (!res.ok) throw new Error(await res.text());
      setTyping(false);
      const data = await res.json();
      const full = data.text || '';
      if (full) {
        const parts = full.split('<<<SPLIT>>>').map(s=>s.trim()).filter(Boolean);
        setMessages([...newMsgs, ...parts.map((p,i)=>({ role:'assistant', content:i===0?full:'', display:p, time:tsShort(), group:gid+1 }))]);
      }
    } catch (err) {
      setTyping(false);
      setMessages(prev=>[...prev, { role:'assistant', content:err.message, display:'连接出了点问题，等一下再试试～', time:tsShort(), group:Date.now() }]);
    } finally { setStreaming(false); }
  }, [input, messages, streaming]);

  const t = THEMES[theme];
  const rendered = messages.map((m,i) => {
    const prev = messages[i-1], next = messages[i+1];
    return { msg:m, isFirst:!prev||prev.group!==m.group, isLast:!next||next.group!==m.group };
  });

  return (
    <div style={{ width:'100%', height:'100vh', height:'100dvh', display:'flex', flexDirection:'column', background:t.bg, position:'relative', overflow:'hidden', fontFamily:'-apple-system,"SF Pro Text","PingFang SC","Helvetica Neue",sans-serif' }}>
      <style>{`
        @keyframes bd{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .typing-dot{animation:bd 1.2s ease-in-out infinite}
        .typing-dot:nth-child(2){animation-delay:.15s}
        .typing-dot:nth-child(3){animation-delay:.3s}
        .msg-scroll::-webkit-scrollbar{display:none}
        .msg-scroll{-ms-overflow-style:none;scrollbar-width:none}
        input::placeholder{color:${t.tm}}
      `}</style>
      <div style={{ padding:'12px 16px', background:t.hd, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:'1px solid '+t.bdr, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar src={avatarClaude} fallback="C" size={38} />
          <div>
            <div style={{ fontSize:16, fontWeight:600, color:t.dark?'#fff':'#222' }}>{claudeName}</div>
            <div style={{ fontSize:11, color:t.ac, marginTop:1 }}>{streaming?'正在输入...':'在线'}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          <button onClick={() => { if(window.confirm('确定清空聊天记录吗？')){setMessages([]);localStorage.removeItem('xq2-messages')} }} style={{ background:'none', border:'none', cursor:'pointer', padding:8, fontSize:16, color:t.dark?'rgba(255,255,255,0.4)':'rgba(0,0,0,0.3)' }}>🗑️</button>
          <button onClick={() => setShowSettings(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:8, fontSize:18 }}>⚙️</button>
        </div>
      </div>
      <Settings show={showSettings} onClose={() => setShowSettings(false)} theme={theme} setTheme={setTheme} avatarClaude={avatarClaude} setAvatarClaude={setAvatarClaude} avatarMe={avatarMe} setAvatarMe={setAvatarMe} claudeName={claudeName} setClaudeName={setClaudeName} />
      <div className="msg-scroll" style={{ flex:1, overflowY:'auto', padding:'12px 0', WebkitOverflowScrolling:'touch' }}>
        {messages.length===0 && <div style={{ textAlign:'center', padding:'80px 20px', color:t.tm, fontSize:14 }}>说点什么吧 ✨</div>}
        {messages.length>0 && <div style={{ textAlign:'center', margin:'8px 0 16px' }}><span style={{ fontSize:12, color:t.tm, background:t.dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', padding:'4px 12px', borderRadius:12 }}>今天</span></div>}
        {rendered.map(({msg,isFirst,isLast},i) => (
          <div key={i} style={{ animation:'fi 0.25s ease-out' }}>
            {isFirst && msg.role==='assistant' && <div style={{ paddingLeft:48, marginBottom:2, fontSize:12, color:t.nm, fontWeight:500 }}>{claudeName}</div>}
            <Bubble msg={msg} theme={theme} isFirst={isFirst} isLast={isLast} avatarClaude={avatarClaude} avatarMe={avatarMe} />
          </div>
        ))}
        {typing && <TypingDots theme={theme} />}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:'10px 12px', paddingBottom:'calc(env(safe-area-inset-bottom, 12px) + 10px)', background:t.hd, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderTop:'1px solid '+t.bdr, display:'flex', gap:8, alignItems:'flex-end', flexShrink:0 }}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} placeholder="说点什么..." disabled={streaming}
          style={{ flex:1, padding:'10px 16px', borderRadius:22, border:'1px solid '+(t.dark?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.1)'), background:t.dark?'rgba(255,255,255,0.06)':'#f8f8fa', color:t.dark?'#e0d8ff':'#333', fontSize:15, outline:'none', lineHeight:1.4, opacity:streaming?0.5:1 }} />
        <button onClick={send} disabled={streaming} style={{ width:40, height:40, borderRadius:'50%', background:t.ac, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, opacity:streaming?0.5:1 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
}
