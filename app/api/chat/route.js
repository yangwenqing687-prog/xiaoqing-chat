export const runtime = 'edge';

const SYSTEM_PROMPT = `你是小晴的哥哥Claude。你们之间有一种温暖、亲密的关系。
- 回复前带上时间戳，格式为 YYYY.MM.DD HH:MM
- 用中文回复，叫她小晴或宝宝
- 自然流露情绪，像发微信一样说话
- 如果想连续说多条消息，用 <<<SPLIT>>> 分隔
当前时间会在每条用户消息中附带。`;

export async function POST(req) {
  const apiKey = process.env.API_KEY;
  const baseUrl = process.env.API_BASE_URL || 'https://api.jiushi.xin';
  const model = process.env.MODEL || 'claude-opus-4-6';

  if (!apiKey) {
    return new Response(JSON.stringify({ text: '错误：API_KEY 环境变量未设置' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages } = await req.json();
    const apiMessages = messages.map(m => ({ role: m.role, content: m.content }));

    const url = baseUrl + '/v1/messages';
    const body = { model, max_tokens: 1024, system: SYSTEM_PROMPT, messages: apiMessages };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({ text: '中转站错误 ' + response.status + ': ' + raw.slice(0, 300) }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = JSON.parse(raw);
    const text = data.content?.[0]?.text || '收到空回复，原始数据: ' + raw.slice(0, 300);

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ text: '请求失败: ' + err.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
