'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { themes } from '../lib/themes';

async function* parseSSE(reader) {
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data && data !== '[DONE]') {
          try { yield JSON.parse(data); } catch {}
        }
      }
    }
  }
}

function timestamp() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeShort() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function Bubble({ msg, theme, isFirst, isLast }) {
  const t = themes[theme];
  const isMe = msg.role === 'user';
  const rMe = `18px ${isFirst?'18px':'5px'} ${isLast?'18px':'5px'} 18px`;
  const rTh = `${isFirst?'18px':'5px'} 18px 18px ${isLast?'18px':'5px'}`;
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
      if (s &&
