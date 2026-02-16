export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|.*\\..*).*)'],
};

const BOT_AGENTS = [
  'googlebot', 'bingbot', 'yandex', 'baiduspider', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'slackbot', 'telegrambot', 'discordbot',
  'whatsapp', 'applebot', 'yeti', 'naverbot', 'daumoa'
];

export default async function middleware(request: Request) {
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot));

  if (!isBot) {
    return;
  }

  const prerenderToken = process.env.PRERENDER_TOKEN;
  if (!prerenderToken) {
    return;
  }

  try {
    const prerenderUrl = `https://service.prerender.io/${request.url}`;
    const response = await fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': prerenderToken,
      },
    });

    if (response.ok) {
      const html = await response.text();
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  } catch (e) {
    console.error('Prerender error:', e);
  }

  return;
}
