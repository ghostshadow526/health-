/**
 * health+ backend server
 * Serves static files + proxies health insights to Meta Llama 3.3 via OpenRouter
 *
 * Start locally:  node server.js
 * Deploy:         Render (Node web service) — see render.yaml
 */

require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 8000;
const IS_VERCEL = process.env.VERCEL === '1';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));   // serve all static assets

// Free models to try in order — verified against live OpenRouter model list
const FREE_MODELS = [
   'meta-llama/llama-3.3-70b-instruct:free',         // Llama 3.3 70B (primary)
   'mistralai/mistral-small-3.1-24b-instruct:free',   // Mistral 24B — good fallback
   'meta-llama/llama-3.2-3b-instruct:free',           // Llama 3.2 3B — fast
   'google/gemma-3-27b-it:free',                      // Gemma 27B
   'nousresearch/hermes-3-llama-3.1-405b:free'        // Hermes 405B
];

async function queryOpenRouter(apiKey, prompt, referer) {
   let lastError = '';
   for (const model of FREE_MODELS) {
      let response;
      try {
         response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
               'Authorization': `Bearer ${apiKey}`,
               'Content-Type': 'application/json',
               'HTTP-Referer': referer || 'https://lifecare.onrender.com',
               'X-Title': 'health+ AI Insights'
            },
            body: JSON.stringify({
               model,
               messages: [{ role: 'user', content: prompt }],
               temperature: 0.7,
               max_tokens: 600
            })
         });
      } catch (fetchErr) {
         lastError = fetchErr.message;
         continue;
      }

      // Rate-limited or unavailable → try next model
      if (response.status === 429 || response.status === 503 || response.status === 404 || response.status === 405) {
         const text = await response.text().catch(() => '');
         console.warn(`${model} unavailable (${response.status}), trying next...`);
         lastError = `${model} returned ${response.status}`;
         continue;
      }

      if (!response.ok) {
         const errText = await response.text().catch(() => '');
         throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const insight = data?.choices?.[0]?.message?.content;
      if (insight) {
         console.log(`[OpenRouter] Served by: ${model}`);
         return insight;
      }
   }
   throw new Error(`All free OpenRouter models are currently rate-limited. ${lastError}`);
}

// ─── POST /get_insight ────────────────────────────────────────────────────────
// Receives { prompt } from the dashboard JS, forwards to OpenRouter, returns { insight }.
app.post('/get_insight', async (req, res) => {
   const { prompt } = req.body;

   if (!prompt) {
      return res.status(400).json({ error: 'No prompt provided.' });
   }

   const apiKey = process.env.OPENROUTER_API_KEY;
   if (!apiKey) {
      return res.status(500).json({ error: 'OpenRouter API key not configured on the server.' });
   }

   try {
      const insight = await queryOpenRouter(apiKey, prompt, req.headers.origin);
      return res.json({ insight });
   } catch (err) {
      console.error('Server error calling OpenRouter:', err.message);
      return res.status(503).json({ error: err.message });
   }
});

// ─── SPA catch-all — serve index.html for any non-API route ──────────────────
app.get('*', (req, res) => {
   res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start (local) / export (Vercel) ─────────────────────────────────────────
if (!IS_VERCEL) {
   app.listen(PORT, () => {
      console.log(`\n  health+ server running at http://localhost:${PORT}\n`);
   });
}

module.exports = app;
