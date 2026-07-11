export const runtime = 'edge';

export async function POST(req) {
  return new Response(JSON.stringify({ text: '你好小晴，我是测试消息！如果你能看到这条，说明前后端通信正常。' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
