export const PROVIDERS = {
  groq: {
    label: 'Groq',
    pill: 'Free · 1,000 req/day',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    fmt: 'openai',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (instant)' },
    ],
    limits: [['Requests / day', '1,000'], ['Tokens / min', '12,000']],
    headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }),
  },
  google: {
    label: 'Google AI Studio',
    pill: 'Free · 500 req/day',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    fmt: 'openai',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    ],
    limits: [['Requests / day', '500'], ['Tokens / min', '250,000']],
    headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }),
  },
  openrouter: {
    label: 'OpenRouter',
    pill: 'Free · 50 req/day',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    fmt: 'openai',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (free)' },
      { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (free)' },
    ],
    limits: [['Requests / day', '50'], ['Requests / min', '20']],
    headers: k => ({
      Authorization: `Bearer ${k}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://crucible.com',
      'X-Title': 'Crucible Lead Intelligence',
    }),
  },
  cerebras: {
    label: 'Cerebras',
    pill: 'Free · 14,400 req/day',
    url: 'https://api.cerebras.ai/v1/chat/completions',
    fmt: 'openai',
    models: [
      { id: 'llama3.1-8b', name: 'Llama 3.1 8B (ultra-fast)' },
      { id: 'llama3.3-70b', name: 'Llama 3.3 70B' },
    ],
    limits: [['Requests / day', '14,400'], ['Tokens / min', '60,000']],
    headers: k => ({ Authorization: `Bearer ${k}`, 'Content-Type': 'application/json' }),
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    pill: 'Paid · plan-based',
    url: 'https://api.anthropic.com/v1/messages',
    fmt: 'anthropic',
    models: [
      { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5 (fast)' },
      { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
    ],
    limits: [['Rate limits', 'Plan-based']],
    headers: k => ({
      'x-api-key': k,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
      'anthropic-dangerous-direct-browser-access': 'true',
    }),
  },
}

export const PROVIDER_KEYS = Object.keys(PROVIDERS)
