# Forge — Lead Intelligence Engine

> Discover local businesses that need your product. Score them. Close faster.

**Live:** [forge-lead-intelligence.netlify.app](https://forge-lead-intelligence.netlify.app)

Built on three open-source layers:

| Layer | Repo | Role |
|-------|------|------|
| 🔍 Discovery | [local-client-prospector-skill](https://github.com/Kappaemme-git/local-client-prospector-skill) | Find businesses near a location, check website vs social-only |
| 🕷️ Enrichment | [ScrapeGraphAI](https://github.com/ScrapeGraphAI/Scrapegraph-ai) | Deep-scrape each site: services, team, tech stack, contact info |
| ⚡ Inference | [free-llm-api-resources](https://github.com/cheahjs/free-llm-api-resources) | Route to free LLM APIs — zero inference cost |

---

## What it does

1. Enter a **location**, **business type**, and your **value proposition**
2. The pipeline runs three stages — Prospector → ScrapeGraphAI → LLM Router
3. You get a scored lead sheet: **Hot / Warm / Low / Skip** with enriched data
4. Filter by score, copy outreach angles, or export to CSV

---

## Tech Stack

- **React 18** + **Vite** — component-based UI with fast HMR
- **No backend** — LLM API calls go directly from the browser
- **Netlify** — static hosting with instant deploys
- **localStorage** — persists your provider choice and API key across sessions

### Project structure

```
src/
├── App.jsx                  # Main state machine (idle → running → done → error)
├── App.css                  # Global styles (Crucible design system)
├── config/
│   └── providers.js         # LLM provider configs (Groq, Google, OpenRouter, Cerebras, Anthropic)
├── utils/
│   ├── llm.js               # callLLM() — handles OpenAI-compatible + Anthropic message formats
│   └── csv.js               # exportCSV()
└── components/
    ├── Sidebar.jsx           # Provider / model / API key selector
    ├── Pipeline.jsx          # Animated stage nodes + live log
    └── Results.jsx           # Filter tabs, lead table, copy button, CSV export
```

---

## Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/forge-lead-intelligence
cd forge-lead-intelligence
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

### Deploy to Netlify

```bash
npm run build
npx netlify-cli deploy --prod --dir=dist
```

Or connect the repo in the [Netlify dashboard](https://app.netlify.com) and set:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

---

## Getting a Free API Key

Pick any one provider — all except Anthropic have free tiers.

### Groq *(recommended — fast, generous)*
1. Sign up at [console.groq.com](https://console.groq.com)
2. Go to **API Keys** → Create key
3. **Limits:** 1,000 req/day, 12,000 tokens/min — free, no card required

### Google AI Studio *(highest token limits)*
1. Visit [aistudio.google.com](https://aistudio.google.com)
2. Click **Get API Key**
3. **Limits:** 500 req/day (Gemini 2.0 Flash), 250,000 tokens/min

### OpenRouter *(multi-model fallback)*
1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Go to **Keys** → Create key
3. **Limits:** 50 req/day free; 1,000 req/day with $10 lifetime top-up

### Cerebras *(ultra-fast inference)*
1. Sign up at [cloud.cerebras.ai](https://cloud.cerebras.ai)
2. Generate API key
3. **Limits:** 14,400 req/day, 60,000 tokens/min

### Anthropic (Claude)
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Note: paid tier — use Haiku 4.5 for lowest cost

---

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│  INPUT: location + business type + value prop            │
└──────────────────────┬──────────────────────────────────┘
                       ↓
         ┌─────────────────────────┐
         │  local-client-prospector│
         │  Google Maps, Yelp, BBB │
         │  Website vs social check│
         └────────────┬────────────┘
                      ↓
         ┌─────────────────────────┐
         │  ScrapeGraphAI          │
         │  SmartScraperMultiGraph │
         │  Services, tech, team,  │
         │  contact, copy quality  │
         └────────────┬────────────┘
                      ↓
         ┌─────────────────────────┐
         │  Free LLM Router        │
         │  Groq → AI Studio →     │
         │  OpenRouter (fallback)  │
         │  Lead scoring + angles  │
         └────────────┬────────────┘
                      ↓
         ┌─────────────────────────┐
         │  Lead Sheet             │
         │  Hot / Warm / Low / Skip│
         │  Filter + CSV export    │
         └─────────────────────────┘
```

---

## Lead Score Criteria

| Score | Meaning |
|-------|---------|
| 🔥 **Hot** | No website OR terrible site (Wix, outdated, broken). Active business. Clear need. |
| **Warm** | Basic site, obvious improvement opportunity. Real prospect. |
| **Low** | Decent presence, marginal fit. Worth a cold outreach only. |
| **Skip** | Strong online presence. Not a fit for this value prop. |

---

## Running at Scale (Python backend)

For production use, wire the real Python libraries behind an API endpoint:

```bash
pip install scrapegraphai playwright
playwright install
```

```python
from scrapegraphai.graphs import SmartScraperMultiGraph

graph_config = {
    "llm": {
        "model": "groq/llama-3.3-70b-versatile",
        "api_key": "your-groq-key",
    },
}

graph = SmartScraperMultiGraph(
    prompt="""Extract: company name, services, tech stack (from page source),
              contact info, website quality score 1-10, pain points.""",
    source=["https://example1.com", "https://example2.com"],
    config=graph_config,
)

result = graph.run()
```

---

## Brand

Built with the [Crucible](https://crucible.com) design system — DM Serif Display, DM Mono, DM Sans. Forge orange `#C8460A`.

---

## License

MIT
