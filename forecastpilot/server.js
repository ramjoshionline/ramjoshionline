import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load system prompt at startup — fail fast if missing
const SYSTEM_PROMPT_PATH = path.join(__dirname, 'system_prompt.txt');
let systemPrompt;
try {
  systemPrompt = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8').trim();
  console.log(`[startup] System prompt loaded (${systemPrompt.length} chars)`);
} catch (err) {
  console.error(`[startup] FATAL: Could not read system_prompt.txt — ${err.message}`);
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('[startup] FATAL: ANTHROPIC_API_KEY is not set in environment / .env');
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * POST /api/forecast
 * Body: { messages: [{role, content}] }
 * Streams SSE events back to the client.
 *
 * SSE event types:
 *   data: {"type":"delta","text":"..."}   — streaming text chunk
 *   data: {"type":"done"}                  — stream finished cleanly
 *   data: {"type":"error","message":"..."} — something went wrong
 */
app.post('/api/forecast', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Validate message shape
  for (const msg of messages) {
    if (!msg.role || !msg.content || typeof msg.content !== 'string') {
      return res.status(400).json({ error: 'Each message must have role and content (string)' });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: `Invalid role: ${msg.role}` });
    }
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if present
  res.flushHeaders();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 8192,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        send({ type: 'delta', text: event.delta.text });
      }
    }

    send({ type: 'done' });
    res.end();
  } catch (err) {
    console.error('[/api/forecast] Anthropic error:', err.message);
    send({ type: 'error', message: err.message || 'Unexpected error from AI provider' });
    res.end();
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: 'claude-opus-4-6' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[server] ForecastPilot running at http://localhost:${PORT}`);
});
