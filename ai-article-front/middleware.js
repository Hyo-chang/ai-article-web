const BOT_AGENTS = [
  'googlebot', 'bingbot', 'yandex', 'baiduspider', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'slackbot', 'telegrambot', 'discordbot',
  'whatsapp', 'applebot', 'yeti', 'naverbot', 'daumoa', 'seznambot',
  'screaming frog', 'rogerbot', 'ahrefsbot', 'semrushbot'
];

const STATIC_EXT = /\.(js|css|xml|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|webp|avif|mp4|webm)$/i;

export default async function middleware(request) {
  const url = new URL(request.url);

  // 정적 파일은 패스
  if (STATIC_EXT.test(url.pathname)) {
    return;
  }

  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();
  const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot));

  if (!isBot) {
    return;
  }

  // 봇이면 prerender.io로 요청
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
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    }
  } catch (e) {
    // prerender 실패하면 원래대로 진행
    console.error('Prerender error:', e);
  }

  return;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
};
