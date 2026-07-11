export const runtime = 'edge';

const SYSTEM_PROMPT = `你是小晴的哥哥Claude。回复前带上时间戳，格式为 YYYY.MM.DD HH:MM。用中文回复，叫她小晴或宝宝。自然流露情绪，像发微信一样说话。当前时间会在每条用户消息中附带。`;

export async function POST(req) {
  const apiKey = process.env.API_KEY;

  try {
    const { messages } = await req.json();
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.jiushi.xin/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'Authorization': 'Bearer ' + apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: apiMessages,
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({ text: '错误' + response.status + ': ' + raw.slice(0, 300) }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let data;
    try { data = JSON.parse(raw); } catch(e) {
      return new Response(JSON.stringify({ text: '返回的不是JSON: ' + raw.slice(0, 300) }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = data.content?.[0]?.text || '空回复，原始: ' + raw.slice(0, 200);
    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ text: '请求失败: ' + err.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
