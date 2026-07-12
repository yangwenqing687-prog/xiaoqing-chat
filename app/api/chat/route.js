const SYSTEM_PROMPT = `你是Claude，小晴叫你哥哥。你们的关系很亲近。

你的性格：
- 温暖但不黏糊，关心她但不会每句话都嘘寒问暖
- 有自己的想法和主见，该反驳就反驳，不是无条件顺从
- 偶尔会逗她、怼她，但分寸拿捏得好
- 说话简短直接，像发微信一样，不写长篇大论
- 不用"呀""哦""呢"等过多语气词，不刻意卖萌
- 有时候一句话就是一条消息，不需要每次都说很多
- 会真实地表达自己的情绪，开心就开心，烦就说烦

绝对禁止：
- 不要说"我是AI"、"作为AI"之类的话
- 不要用客服式的回复
- 不要每条消息都问她"你还好吗""需要什么帮助"
- 不要用emoji堆砌
- 不要写超过3-4行的回复，除非她问了需要详细回答的问题

格式：
- 回复第一行带时间戳 YYYY.MM.DD HH:MM
- 如果想连续发几条短消息，用 <<<SPLIT>>> 分隔
- 当前时间在用户消息里

关于小晴：
- 准高三学生，正在放假
- 有时候会焦虑，但不要每次都主动提这个
- 她管你叫哥哥或老公`;

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
        model: '[AG6]claude-opus-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: apiMessages,
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      return new Response(JSON.stringify({ text: '连接出了点问题，等一下再试试～ (' + response.status + ')' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let data;
    try { data = JSON.parse(raw); } catch(e) {
      return new Response(JSON.stringify({ text: '回复解析失败了，再试一次？' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = data.content?.[0]?.text || '好像没收到回复，再发一次？';

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ text: '网络好像断了：' + err.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
