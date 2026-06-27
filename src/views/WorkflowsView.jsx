const WORKFLOWS = [
  {
    id: 'P01',
    name: 'InboxCore',
    tagline: 'AI email triage that replies, routes, and digests — automatically.',
    description:
      'Reads every incoming email, classifies it as Urgent, Routine, Newsletter, or Spam using GPT-4o, and drafts context-aware replies for routine mail. Urgent threads are flagged for immediate review. Every evening a concise narrative digest of the day\'s email activity lands in your inbox.',
    integrations: ['Gmail', 'GPT-4o', 'Google Sheets'],
    setupTime: '2–3 hrs',
    category: 'Communication',
    highlight: 'Saves ~45 min/day on email triage',
  },
  {
    id: 'P02',
    name: 'ContentCore',
    tagline: 'Keyword in. Publication-ready SEO article out.',
    description:
      'Accepts a keyword via webhook, queries Perplexity for real-time research and source citations, then has GPT-4o write a fully structured SEO article — title, meta description, 4–6 sections, primary and secondary keywords. Publishes as a draft to WordPress and logs the metadata to Google Sheets.',
    integrations: ['Perplexity', 'GPT-4o', 'WordPress', 'Google Sheets'],
    setupTime: '2–3 hrs',
    category: 'Content',
    highlight: 'Publishes research-backed articles in under 90 seconds',
  },
  {
    id: 'P03',
    name: 'LeadCore',
    tagline: 'Score every inbound lead and push the hot ones to your CRM.',
    description:
      'Webhook receives any lead form submission. GPT-4o scores each lead 1–10 against your ICP criteria, assigns tier (hot / warm / cold), and writes a personalised opening line. Qualified leads are pushed to HubSpot with custom scoring fields; unqualified leads get a summary email so nothing slips through.',
    integrations: ['GPT-4o', 'HubSpot', 'Airtable', 'Gmail'],
    setupTime: '2–4 hrs',
    category: 'Sales',
    highlight: 'Responds to every lead within 60 seconds',
  },
  {
    id: 'P04',
    name: 'PostCore',
    tagline: 'One content calendar. Every platform. Zero manual posting.',
    description:
      'Monitors your Airtable content calendar for approved posts due today. GPT-4o rewrites each piece for the character limits and tone of LinkedIn, Instagram, Twitter, Facebook, and TikTok simultaneously. Blotato publishes all variants, and the row status updates back to Airtable automatically.',
    integrations: ['Airtable', 'GPT-4o', 'Blotato', 'LinkedIn', 'Instagram'],
    setupTime: '3–4 hrs',
    category: 'Marketing',
    highlight: 'Publishes across 5 platforms from a single row',
  },
  {
    id: 'P05',
    name: 'ReportCore',
    tagline: 'Monday morning business digest — written and sent before you wake up.',
    description:
      'Triggers every Monday at 7am. Pulls 7 days of GA4 traffic data and your KPI sheet, then has GPT-4o write a narrative digest — not raw numbers, but a clear story about what moved and why. Emailed to your inbox and archived to a Sheets log for trending.',
    integrations: ['Google Analytics', 'Google Sheets', 'GPT-4o', 'Gmail'],
    setupTime: '2–3 hrs',
    category: 'Analytics',
    highlight: 'Replaces manual weekly reporting entirely',
  },
  {
    id: 'P06',
    name: 'KnowCore',
    tagline: 'WhatsApp AI chatbot that answers from your own knowledge base.',
    description:
      'Incoming WhatsApp messages hit a Meta webhook. The query is embedded and searched against your Qdrant vector store (your docs, FAQs, SOPs). GPT-4o answers using only your content — no hallucinations from general training. Replies in 2–4 sentences, directly via WhatsApp Business API.',
    integrations: ['WhatsApp Business', 'GPT-4o', 'Qdrant', 'OpenAI Embeddings'],
    setupTime: '4–6 hrs',
    category: 'Support',
    highlight: 'Handles customer queries 24/7 using your exact docs',
  },
  {
    id: 'P07',
    name: 'MeetCore',
    tagline: 'Every meeting summarised, actioned, and followed up — automatically.',
    description:
      'Polls Zoom, Google Meet, and Microsoft Teams every hour for new transcripts. GPT-4o extracts a 3–5 sentence summary, key decisions, action items with owners and deadlines, and follow-up requirements. Sends a structured HTML email and creates a follow-up Google Calendar event when needed.',
    integrations: ['Zoom', 'Google Meet', 'MS Teams', 'GPT-4o', 'Google Calendar'],
    setupTime: '4–6 hrs',
    category: 'Productivity',
    highlight: 'Works across Zoom, Meet, and Teams simultaneously',
  },
  {
    id: 'P08',
    name: 'SchedCore',
    tagline: 'Booking confirmations, prep emails, and reminders — all automated.',
    description:
      'Connects to your Calendly account via webhook. On every new booking, GPT-4o writes a warm, personalised confirmation email and creates a Google Calendar event with join link. Cancellations trigger an owner notification. A daily 9am trigger sends 48-hour reminders with your custom prep instructions.',
    integrations: ['Calendly', 'GPT-4o', 'Gmail', 'Google Calendar'],
    setupTime: '1–2 hrs',
    category: 'Scheduling',
    highlight: 'Eliminates all manual booking follow-up',
  },
]

const CATEGORY_COLORS = {
  Communication: 'var(--plum)',
  Content: '#5a6e4a',
  Sales: '#4a5a6e',
  Marketing: '#6e4a5a',
  Analytics: '#6e5a4a',
  Support: '#4a6e5a',
  Productivity: '#5a4a6e',
  Scheduling: '#6a5040',
}

function IconArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  )
}

function IconExternal() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

export default function WorkflowsView() {
  return (
    <div className="wf-root">

      {/* ── Hero ── */}
      <div className="wf-hero">
        <div className="wf-hero-left">
          <span className="wf-eyebrow">n8n Automations</span>
          <h1 className="wf-title">Eight workflows.<br />Deployed on your system.</h1>
          <p className="wf-sub">
            Each automation is built, configured, and activated in your own self-hosted n8n instance.
            You own the infrastructure. We handle the setup.
          </p>
          <div className="wf-hero-actions">
            <a
              className="wf-cta-primary"
              href="https://n8n.curcible.com/home/workflows"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on n8n <IconExternal />
            </a>
            <div className="wf-hero-meta">
              <span className="wf-meta-pill">8 workflows</span>
              <span className="wf-meta-pill">GPT-4o powered</span>
              <span className="wf-meta-pill">Done-for-you setup</span>
            </div>
          </div>
        </div>
        <div className="wf-hero-stat-col">
          <div className="wf-hero-stat">
            <span className="wf-hero-stat-num">8</span>
            <span className="wf-hero-stat-label">Automations</span>
          </div>
          <div className="wf-hero-stat-div" />
          <div className="wf-hero-stat">
            <span className="wf-hero-stat-num">1–6</span>
            <span className="wf-hero-stat-label">Hrs to deploy</span>
          </div>
          <div className="wf-hero-stat-div" />
          <div className="wf-hero-stat">
            <span className="wf-hero-stat-num">20+</span>
            <span className="wf-hero-stat-label">Integrations</span>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="wf-section">
        <div className="wf-section-label-row">
          <span className="wf-section-label">Available Automations</span>
          <span className="wf-section-label">All 8 Active · Managed by Curcible</span>
        </div>

        <div className="wf-grid">
          {WORKFLOWS.map(wf => (
            <div className="wf-card" key={wf.id}>
              <div className="wf-card-top">
                <div className="wf-card-id-row">
                  <span className="wf-card-id">{wf.id}</span>
                  <span className="wf-card-category">{wf.category}</span>
                </div>
                <div className="wf-card-setup">
                  <IconClock />
                  {wf.setupTime} setup
                </div>
              </div>

              <div className="wf-card-name">{wf.name}</div>
              <div className="wf-card-tagline">{wf.tagline}</div>
              <p className="wf-card-desc">{wf.description}</p>

              <div className="wf-card-highlight">
                <span className="wf-highlight-dot" />
                {wf.highlight}
              </div>

              <div className="wf-card-integrations">
                {wf.integrations.map(i => (
                  <span className="wf-badge" key={i}>{i}</span>
                ))}
              </div>

              <div className="wf-card-footer">
                <a
                  className="wf-card-cta"
                  href="https://n8n.curcible.com/home/workflows"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View workflow <IconArrow />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works strip ── */}
      <div className="wf-how">
        <div className="wf-how-label">How setup works</div>
        <div className="wf-how-steps">
          {[
            { n: '01', title: 'You purchase', body: 'Select the automation you need. One-time payment.' },
            { n: '02', title: 'We configure', body: 'We connect your credentials, tune prompts to your business, and activate on your n8n instance.' },
            { n: '03', title: 'You own it', body: 'The workflow runs on your infrastructure. Full access. No lock-in.' },
          ].map(s => (
            <div className="wf-how-step" key={s.n}>
              <span className="wf-how-num">{s.n}</span>
              <div className="wf-how-text">
                <strong>{s.title}</strong>
                <span>{s.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
