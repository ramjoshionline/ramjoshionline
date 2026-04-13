# ForecastPilot — AI Revenue Forecasting Agent

A browser-based chat agent that takes a TAM + AI feature description and returns a rigorous 3-scenario revenue forecast with full assumption transparency.

## What it does

1. You describe your total addressable market and AI feature.
2. The agent may ask up to 3 clarifying questions, then runs an 8-step forecasting framework.
3. It streams back a structured markdown report covering SOM derivation, adoption curve, usage segmentation, revenue model, cohort retention, 3-scenario table (Conservative / Base / Optimistic), validation checks, and a full assumption log.
4. A **Download JSON** button appears when the forecast is complete — saves the structured output as a machine-readable file.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Single HTML file, vanilla JS, [marked.js](https://marked.js.org/) from CDN |
| Backend | Node.js + Express |
| AI | Anthropic SDK → `claude-opus-4-6` |
| Streaming | SSE (Server-Sent Events) |

## Project structure

```
forecastpilot/
├── server.js          Express server, /api/forecast SSE endpoint
├── system_prompt.txt  Agent system prompt (loaded at startup)
├── package.json
├── .env.example
└── public/
    └── index.html     Chat UI with markdown renderer + JSON download
```

## Setup

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)

### 1. Install dependencies

```bash
cd forecastpilot
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
```

Edit `.env` and set:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Start the server

```bash
node server.js
# or for auto-reload during development:
node --watch server.js
```

### 4. Open the app

Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

**Minimum input:** Tell the agent your TAM (total user base size) and describe the AI feature.

**Example prompt:**
> TAM: 50,000 enterprise users. Feature: AI-powered contract summarisation inside a legal workflow SaaS. Pricing: $15/user/mo base plan.

The agent will either ask clarifying questions or proceed immediately, then stream the full 8-step analysis.

## The 8-step forecasting framework

1. **SOM derivation** — filters TAM by role relevance, account health, compliance
2. **Adoption curve** — B2B SaaS benchmarks adjusted for workflow embeddedness
3. **Usage segmentation** — Light / Moderate / Heavy tiers with blended average
4. **Revenue paths** — subscription upgrades vs. on-demand overages
5. **Cohort retention** — retention curve with Month 12+ floor at 25–40%
6. **3 scenarios** — Conservative / Base / Optimistic (adoption rate × usage × growth)
7. **Triangulation checks** — AI revenue % of ARR, gross margin, revenue-per-user vs. Copilot/Firefly/Autodesk benchmarks
8. **Confidence rating** — High / Medium / Low with full assumption log

## Output

Every forecast produces:
- A **structured markdown report** rendered in the chat UI
- A **downloadable JSON file** with the same data in machine-readable form

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `PORT` | No | HTTP port (default: `3000`) |

## License

MIT
