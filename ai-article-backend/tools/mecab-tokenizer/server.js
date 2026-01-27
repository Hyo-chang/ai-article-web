// Minimal  tokenizer microservice for Korean
// Requires: apt install mecab mecab-ko mecab-ko-dic; npm i express body-parser mecab-ya

const express = require('express');
const bodyParser = require('body-parser');
// mecab-ya exports functions (pos/morphs/nouns), not a constructor
const mecab = require('mecab-ya');

const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

// Simple request/response logger
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`[REQ] ${req.method} ${req.url} from ${req.ip}`);
  res.on('finish', () => {
    console.log(`[RES] ${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// POS filtering: keep only content-bearing categories
const STOP_POS = new Set([
  // Particles, adverbs, interjections, symbols
  'JKS','JKC','JKG','JKO','JKB','JKV','JKQ','JX','JC',
  'MAG','MAJ','IC',
  'SF','SP','SS','SE','SO','SW'
]);
// Allow only core content words (nouns + verbs/adjectives)
// Exclude numerals NR(수사) and SN(숫자), and NNB/NP/VCP/VX
const ALLOW_POS = new Set(['NNG','NNP','VV','VA','VCN']);

// Additional lexical pruning
const MIN_TOKEN_LEN = parseInt(process.env.MIN_TOKEN_LEN || '2', 10);
const STOP_WORDS = new Set([
  '것','수','등','및','중','이','있','있다','되다','하다','이다'
]);

function handleTokenize(req, res) {
  const text = (req.body?.text || '').toString();
  if (!text.trim()) {
    console.log('[TOKENIZE] empty text');
    return res.json({ tokens: [] });
  }
  console.log(`[TOKENIZE] input length=${text.length}`);
  // Use POS tagging to get [surface, POS] pairs
  mecab.pos(text, (err, result) => {
    if (err) {
      console.error('[MECAB] error:', err);
      return res.status(500).json({ error: err.message });
    }
    let tokens = [];
    for (const row of result) {
      const surface = row[0];
      const pos = (row[1] || '').toString();
      if (ALLOW_POS.has(pos) && !STOP_POS.has(pos) && surface && surface.trim()) {
        tokens.push(surface.trim());
      }
    }
    // Post-filters: min length, stopwords, and numeric strings
    const isNumeric = (s) => /^[0-9]+([.,][0-9]+)?%?$/.test(s);
    tokens = tokens.filter(t => t.length >= MIN_TOKEN_LEN && !STOP_WORDS.has(t) && !isNumeric(t));
    return res.json({ tokens });
  });
}

// Primary endpoint used by Java service
app.post('/tokenize', handleTokenize);

// Optional alias for manual testing tools
app.post('/analyze', handleTokenize);

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3100;
// Default bind (localhost). Use Windows->localhost port forwarding to reach from host.
app.listen(port, () => console.log(`MeCab tokenizer listening on ${port}`));
