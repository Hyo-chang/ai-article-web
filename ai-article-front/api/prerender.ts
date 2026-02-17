export const config = {
  runtime: 'edge',
};

const BOT_AGENTS = [
  'googlebot', 'bingbot', 'yandex', 'baiduspider', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'slackbot', 'telegrambot', 'discordbot',
  'whatsapp', 'applebot', 'yeti', 'naverbot', 'daumoa'
];

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get('path') || '/';
  const userAgent = (request.headers.get('user-agent') || '').toLowerCase();

  const isBot = BOT_AGENTS.some(bot => userAgent.includes(bot));

  if (!isBot) {
    return Response.redirect(`https://ai-article-web.vercel.app${path}`, 302);
  }

  const prerenderToken = process.env.PRERENDER_TOKEN;
  if (!prerenderToken) {
    return new Response('Token not configured', { status: 500 });
  }

  try {
    const targetUrl = `https://ai-article-web.vercel.app${path}`;
    const prerenderUrl = `https://service.prerender.io/${targetUrl}`;

    const response = await fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': prerenderToken,
      },
    });

    const html = await response.text();
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (e) {
    return new Response('Prerender error', { status: 500 });
  }
}
