# Curcible Automation Suite — Products Reference

> Context document for Claude. Contains all 8 products, feature sets, workflow nodes, credentials, and use cases.
> Last updated: 2026-06-05

---

## Product Index

| ID | Name | Category | Price | Nodes | Setup | Complexity |
|---|---|---|---|---|---|---|
| P01 | InboxCore™ | Email Automation | $79 | 11 | 1–2h | Beginner |
| P02 | ContentCore™ | Content Creation | $79 | 11 | 2–3h | Beginner |
| P03 | LeadCore™ | Sales Automation | $79 | 12 | 2–4h | Intermediate |
| P04 | PostCore™ | Social Media | $79 | 12 | 3–5h | Intermediate |
| P05 | ReportCore™ | Analytics & Reporting | $79 | 14 | 2–4h | Intermediate |
| P06 | KnowCore™ | Customer Service | $99 | 12 | 4–6h | Advanced |
| P07 | MeetCore™ | Productivity | $79 | 16 | 2–4h | Intermediate |
| P08 | SchedCore™ | Scheduling | $79 | 13 | 2–3h | Intermediate |

All products are one-time purchases. Delivered as import-ready n8n workflow JSON with README.md, CREDENTIALS.md, and full documentation.

---

## P01 — InboxCore™

**AI Email Triage & Auto-Reply**

> Stop drowning in email. InboxCore classifies every inbound Gmail into 6 categories, writes the reply, applies the label, and syncs to your CRM — without touching your inbox.

### What It Does

InboxCore connects to Gmail and processes every new unread email through a GPT-4o classification pipeline. Each message is categorised as urgent, sales, support, newsletter, spam, or general. Based on the category, the workflow generates a context-aware auto-reply, applies the correct Gmail label, syncs sales emails to HubSpot as contacts, creates Notion support tickets, and fires a Slack alert for anything urgent. Spam and newsletters are labelled and archived silently.

### Workflow Nodes (11)

| Node | Function |
|---|---|
| Gmail Trigger | Polls for new unread emails every minute |
| Normalise Email | Extracts from, subject, body, and thread ID |
| OpenAI GPT-4o | Classifies category, scores urgency, drafts reply |
| Code — Parse Triage | Extracts structured JSON from AI response |
| Switch — Route by Category | 6-way routing based on category |
| Slack | Fires urgent alert to #urgent-inbox channel |
| HubSpot | Creates/updates contact for sales emails |
| Notion | Creates support ticket for support emails |
| Gmail — Send Reply | Sends auto-reply for non-spam categories |
| Gmail — Apply Label | Tags email with AI-assigned label |
| Airtable | Logs every processed email for analytics |

### Features

- 6-category AI triage classifier (customisable prompt): urgent, sales, support, newsletter, spam, general
- Context-aware auto-reply generation tuned to business context
- HubSpot contact sync for sales emails
- Notion support ticket creation for support emails
- Slack urgent alert routing
- Silent archive for spam and newsletters
- Full email log in Airtable

### Required Credentials

Gmail OAuth 2.0 · OpenAI API Key (GPT-4o) · HubSpot Private App Token · Notion Integration Token · Slack Bot Token · Airtable Personal Access Token

### Running Cost

~$0.02–0.05 per email processed

### Best For

Founders handling 50+ emails/day · Sales teams needing inbound leads auto-pushed to CRM · Support teams wanting tickets created without manual triage · Operators who want a permanent record of all inbound communication

---

## P02 — ContentCore™

**Auto SEO Blog Writer**

> Keyword in. Published draft out. ContentCore researches the SERP, writes a 1,500-word SEO article, generates a featured image with DALL-E 3, and publishes to WordPress — in under 3 minutes.

### What It Does

Send a keyword to the ContentCore webhook and the full pipeline runs automatically. SerpAPI fetches the top-ranking results for competitive context. GPT-4o writes a 1,500-word SEO-optimised article with H2/H3 structure, meta description, focus keyword, and internal link placeholders — tuned to brand voice. DALL-E 3 generates a matching featured image. The post is pushed to WordPress as a draft, logged to Notion content calendar, and a Slack notification is sent with the title and meta summary.

### Workflow Nodes (11)

| Node | Function |
|---|---|
| Webhook / Manual Trigger | Accepts keyword, audience, tone, word count |
| Set Content Defaults | Normalises inputs and sets defaults |
| HTTP Request — SerpAPI | Fetches top 5 SERP results for research context |
| HTTP Request — OpenAI GPT-4o | Writes full article with SEO structure |
| Code — Parse Article | Extracts title, slug, meta, body, image prompt |
| HTTP Request — DALL-E 3 | Generates featured image from AI prompt |
| Code — Prepare WP Payload | Assembles WordPress-ready post object |
| HTTP Request — WordPress | Publishes post as draft via REST API |
| Notion | Logs to content calendar database |
| Slack | Notifies team with title and meta description |
| Airtable | Records keyword, word count, slug, status |

### Features

- SerpAPI SERP research integration (competitive context)
- GPT-4o article generation with customisable brand voice prompt
- DALL-E 3 featured image generation
- WordPress REST API auto-publish as draft
- Notion content calendar logging
- Configurable word count (500–4,000 words, default 1,500)
- Brand voice prompt customisation (3 example variants in README)
- Compatible with any CMS with a REST API (Webflow, Ghost, Contentful)

### Required Credentials

OpenAI API Key (GPT-4o + DALL-E 3) · SerpAPI Key (free tier: 100 searches/mo) · WordPress Application Password · Notion Integration Token · Slack Bot Token · Airtable Personal Access Token

### Running Cost

~$0.10–0.20/article (GPT-4o) + $0.04/image (DALL-E 3)

### Best For

Content marketers publishing 2+ posts/week · SEO agencies running client content programs · SaaS companies building inbound traffic with limited writing resources · Founders who want organic traffic without a content team

---

## P03 — LeadCore™

**AI Lead Qualification & CRM Push**

> Every lead enriched, scored, and routed in seconds. LeadCore enriches with Apollo.io, applies BANT + ICP scoring via GPT-4o, routes to HubSpot, and fires a personalised outreach email — automatically.

### What It Does

LeadCore receives inbound leads from any source via webhook — web forms, LinkedIn imports, event sign-ups, or direct API calls. Apollo.io enriches each contact with company size, industry, department, seniority, and tech stack data. GPT-4o runs a BANT + ICP qualification, assigning a 0–100 score and a grade of hot, warm, cold, or disqualified. Hot leads trigger a Slack alert and create a HubSpot deal in the correct pipeline stage. All qualified leads get a HubSpot contact upsert and a personalised outreach email written by GPT-4o based on the lead's actual context. Everything is logged to Airtable.

### Workflow Nodes (12)

| Node | Function |
|---|---|
| Webhook / Manual Trigger | Accepts lead data from any source |
| Set — Normalise Lead | Standardises fields and sets defaults |
| HTTP Request — Apollo.io | Enriches contact with company and personal data |
| Code — Merge Enrichment | Combines original lead + Apollo enrichment |
| HTTP Request — OpenAI GPT-4o | Runs BANT + ICP scoring, writes outreach email |
| Code — Parse Qualification | Extracts score, grade, and email from AI response |
| Switch — Route by Grade | 4-way routing: hot / warm / cold / disqualified |
| HubSpot — Create Deal | Creates deal for hot leads in correct stage |
| Slack | Fires alert for hot leads to #leads channel |
| HubSpot — Upsert Contact | Creates/updates contact for warm and cold leads |
| Gmail | Sends personalised outreach email |
| Airtable | Logs all leads with score, grade, and action taken |

### Features

- Apollo.io enrichment: company size, industry, department, seniority, tech stack
- BANT + ICP AI scoring (0–100 scale, fully customisable ICP criteria)
- 4-tier routing: hot / warm / cold / disqualified
- HubSpot deal creation for hot leads (correct pipeline stage)
- HubSpot contact upsert for all qualified leads
- GPT-4o personalised outreach email per lead
- Slack hot-lead alerts
- Full lead log with score, grade, and action in Airtable
- Compatible with Salesforce, Pipedrive, or any CRM with HTTP API

### Required Credentials

OpenAI API Key (GPT-4o) · Apollo.io API Key (free: 50 credits/mo) · HubSpot Private App Token · Gmail OAuth 2.0 · Airtable Personal Access Token

### Running Cost

~$0.05/lead (OpenAI) + Apollo.io free tier sufficient for most use cases

### Best For

B2B SaaS teams receiving inbound demo requests · Sales teams needing leads enriched and scored before outreach · Agencies running lead generation programs · Revenue ops teams building a structured qualification process

---

## P04 — PostCore™

**Social Media Auto-Publisher**

> One topic. Four platforms. One workflow. PostCore generates platform-native posts for Twitter/X, LinkedIn, Instagram, and Facebook, creates a DALL-E 3 image, and publishes everything simultaneously.

### What It Does

Send a topic to the PostCore webhook (or let the schedule trigger fire) and GPT-4o generates platform-native posts optimised for each network's format and character constraints. DALL-E 3 generates a matching featured image. Posts are published simultaneously to all four platforms. Slack confirms the publish. Airtable logs the run with theme, posts, image URL, and timestamp.

### Workflow Nodes (12)

| Node | Function |
|---|---|
| Webhook / Schedule Trigger | On-demand or Mon/Wed/Fri 9am schedule |
| Set Post Defaults | Normalises topic, brand voice, audience |
| HTTP Request — OpenAI GPT-4o | Generates 4 platform-native posts + image prompt |
| Code — Parse Posts | Extracts posts and image prompt from response |
| HTTP Request — DALL-E 3 | Generates featured image |
| Code — Attach Image URL | Merges image URL with post data |
| HTTP Request — Twitter/X API v2 | Posts tweet |
| HTTP Request — LinkedIn UGC API | Posts to LinkedIn |
| HTTP Request — Instagram Graph API | Posts to Instagram Business |
| HTTP Request — Facebook Graph API | Posts to Facebook Page |
| Slack | Notifies team with post summary |
| Airtable | Logs theme, posts, image URL, timestamp |

### Features

- GPT-4o platform-native post generation (4 platforms simultaneously)
- DALL-E 3 image generation per run
- Dual trigger: webhook (on-demand) + cron schedule (default Mon/Wed/Fri 9am)
- Configurable schedule (any cron expression)
- Slack publish confirmation
- Individual platform nodes — disable any platform without affecting others
- Full Airtable run log

### Required Credentials

OpenAI API Key (GPT-4o + DALL-E 3) · Twitter/X API v2 Bearer Token · LinkedIn OAuth 2.0 Access Token · Meta Graph API Access Token (Instagram + Facebook) · Slack Bot Token · Airtable Personal Access Token

### Running Cost

~$0.05–0.10/run (GPT-4o) + $0.04/image (DALL-E 3)

### Best For

Marketing teams needing daily social presence without a content team · Agencies managing multiple client social accounts · Founders who want consistent posting without dedicating hours to it · Growth teams running content-led acquisition

---

## P05 — ReportCore™

**Weekly Analytics Digest**

> Your Monday morning briefing, automated. ReportCore pulls GA4, Stripe, and HubSpot data every Monday at 8am, generates an executive narrative with GPT-4o, and delivers to Notion, Slack, and Gmail.

### What It Does

ReportCore runs on a Monday morning schedule (or on-demand via Manual Trigger). It fetches Google Analytics 4 session and user data, Stripe revenue from the past 7 days, and HubSpot pipeline deal counts and values — all three in parallel. A Code node aggregates the metrics into a clean data object. GPT-4o writes an executive narrative with four sections: highlights (what went well), concerns (what needs attention), insights (3 data-driven observations), and recommendations (3 specific actions). The report is published to a Notion page, posted as a structured Slack message, and emailed as an HTML digest via Gmail.

### Workflow Nodes (14)

| Node | Function |
|---|---|
| Schedule Trigger | Every Monday at 8am (configurable) |
| Manual Trigger | For ad-hoc report runs anytime |
| Set Report Window | Sets period_start, period_end, report_title |
| HTTP Request — GA4 | Fetches sessions, users, bounce rate, conversions |
| HTTP Request — Stripe | Fetches charges for the period |
| HTTP Request — HubSpot | Fetches open deals, closed-won, pipeline value |
| Merge | Waits for all 3 data sources before proceeding |
| Code — Aggregate Metrics | Calculates totals and formats data object |
| HTTP Request — OpenAI GPT-4o | Generates executive narrative |
| Code — Parse Report | Extracts sections from AI response |
| Notion | Creates formatted report page in database |
| Slack | Posts digest with key numbers and top insight |
| Gmail | Sends HTML email digest to distribution list |
| Airtable | Logs report metadata for trend tracking |

### Features

- Parallel data fetch from GA4, Stripe, and HubSpot
- GPT-4o executive narrative: highlights, concerns, insights, recommendations
- Notion report page creation
- Slack block-format digest
- Gmail HTML email delivery to distribution list
- Manual trigger for ad-hoc runs
- Extensible: add any additional data source (Shopify, Mixpanel, Airtable, etc.)
- Configurable schedule (any cron expression)
- 3 narrative prompt variants for different business types (README)

### Required Credentials

OpenAI API Key (GPT-4o) · Google Analytics 4 OAuth Token · Stripe Secret Key · HubSpot Private App Token · Notion Integration Token · Slack Bot Token · Gmail OAuth 2.0 · Airtable Personal Access Token

### Running Cost

~$0.10–0.15/report. All data source API queries are free.

### Best For

Founders who want a weekly business pulse without building dashboards · Marketing leads tracking content and pipeline performance · Operations teams reporting to leadership weekly · Agencies preparing weekly client reports

---

## P06 — KnowCore™

**WhatsApp AI Chatbot + RAG**

> A WhatsApp assistant that knows your business. Pinecone RAG, intent classification, human escalation, and full conversation logging.

### What It Does

KnowCore receives incoming WhatsApp messages via a Twilio webhook. GPT-4o-mini classifies each message into one of five intents — question, complaint, booking, sales, or escalate — quickly and cheaply before the expensive model runs. A Pinecone vector search retrieves the 5 most relevant chunks from your knowledge base. GPT-4o generates a grounded response using only that context, ensuring answers are accurate and brand-consistent. The reply is sent back via Twilio WhatsApp. If confidence falls below threshold or the user requests a human, a Slack alert fires to the support team. Every conversation pair is logged to Airtable with intent, confidence score, and response.

### Workflow Nodes (12)

| Node | Function |
|---|---|
| Webhook | Receives incoming WhatsApp messages from Twilio |
| Set — Extract Message | Parses phone number, message text, session ID |
| HTTP Request — OpenAI GPT-4o-mini | Fast intent classification |
| Code — Parse Intent | Extracts intent and confidence |
| HTTP Request — Pinecone | Vector similarity search over knowledge base |
| Code — Build RAG Context | Formats top 5 matches as context string |
| HTTP Request — OpenAI GPT-4o | Generates grounded response |
| Code — Prepare Reply | Checks confidence, flags escalation if needed |
| HTTP Request — Twilio | Sends WhatsApp reply to user |
| If — Check Escalation | Routes to Slack if needs_escalation = true |
| Slack | Fires human escalation alert |
| Airtable | Logs every conversation pair |

### Features

- Twilio WhatsApp Business integration
- GPT-4o-mini fast intent classification (5 intents: question, complaint, booking, sales, escalate)
- Pinecone vector search RAG (top 5 chunks from knowledge base)
- GPT-4o grounded response generation (no hallucinations — answers only from KB)
- Automatic human escalation to Slack (confidence threshold or explicit request)
- Full conversation logging: intent, confidence, response, session ID
- Multilingual — GPT-4o detects language and responds in kind
- Fallback to 'I don't have that information' when no KB match found
- Compatible with Supabase pgvector, Weaviate, or Qdrant as vector DB alternatives
- Python ingestion script included for knowledge base setup

### Required Credentials

OpenAI API Key (GPT-4o + GPT-4o-mini) · Twilio Account SID + Auth Token (WhatsApp Business) · Pinecone API Key (free tier: 1 index) · Slack Bot Token · Airtable Personal Access Token

### Running Cost

~$0.01–0.03/message (OpenAI) + ~$0.005/message (Twilio WhatsApp)

### Best For

E-commerce stores with high repeat question volume · Hospitality businesses fielding availability and booking queries · Clinics and service businesses answering appointment questions · Any SMB with 50+ repetitive WhatsApp inquiries per day

---

## P07 — MeetCore™

**AI Meeting Summary & Follow-Up**

> Audio in. Action items out. MeetCore transcribes, analyses, and distributes your meetings — summary, action items, follow-up email, HubSpot note, calendar event, and Slack digest, all in one run.

### What It Does

MeetCore accepts either an audio URL (transcribed by AssemblyAI with speaker labels) or a direct transcript paste. GPT-4o analyses the content and extracts: a 2-paragraph executive summary, action items with owner/due date/priority, decisions made, open questions, meeting sentiment, and a complete follow-up email draft. All six outputs fire in parallel: Notion page, Slack digest, Gmail follow-up to attendees, HubSpot engagement note (for sales meetings), Google Calendar follow-up event 3 days out, and Airtable log entry.

### Workflow Nodes (16)

| Node | Function |
|---|---|
| Webhook / Manual Trigger | Accepts audio URL or transcript text |
| Set Meeting Defaults | Normalises all input fields |
| Switch — Route Input | Audio URL path vs direct transcript path |
| HTTP Request — AssemblyAI Submit | Submits audio for transcription |
| Wait Node — 90 seconds | Waits for transcription to complete |
| HTTP Request — AssemblyAI GET | Retrieves completed transcript |
| Set — Extract Transcript Text | Normalises transcript for AI |
| HTTP Request — OpenAI GPT-4o | Analyses transcript, extracts all outputs |
| Code — Parse AI Output | Extracts and merges all structured data |
| Notion | Creates meeting page with summary and action items |
| Slack | Posts digest with key numbers and follow-up link |
| Gmail | Sends follow-up email to all attendees |
| If — Sales Meeting | Routes to HubSpot if is_sales_meeting = true |
| HubSpot | Creates meeting engagement on contact record |
| Google Calendar | Creates follow-up event 3 days out |
| Airtable | Logs meeting metadata and action item count |

### Features

- AssemblyAI audio transcription with speaker labels
- GPT-4o extraction: executive summary, action items (owner + due date + priority), decisions, open questions, sentiment
- Follow-up email drafted automatically and sent to all attendees
- 6 parallel output integrations: Notion, Slack, Gmail, HubSpot, Google Calendar, Airtable
- Sales meeting mode: auto HubSpot engagement creation
- Dual input: audio URL or direct transcript paste (AssemblyAI not required for transcript path)
- Zoom webhook compatible (meeting.ended event)
- Extensible: parsed data object (summary, action items, decisions, sentiment) available to any additional node

### Required Credentials

OpenAI API Key (GPT-4o) · AssemblyAI API Key · Notion Integration Token · Slack Bot Token · Gmail OAuth 2.0 · HubSpot Private App Token · Google Calendar OAuth 2.0 · Airtable Personal Access Token

### Running Cost

~$0.00025/sec audio (AssemblyAI) + ~$0.05–0.15/meeting (GPT-4o)

### Best For

Teams running 5+ meetings/week who need automatic documentation · Sales teams who need call notes logged to HubSpot without manual entry · Ops leads who want meeting accountability and follow-up built in · Consultants who bill by the meeting and need clean records

---

## P08 — SchedCore™

**AI Scheduling & Booking Automation**

> Booking handled. No back-and-forth. SchedCore checks your calendar, picks the best slot with GPT-4o, creates the event, and sends a confirmation email and SMS — fully automated.

### What It Does

SchedCore receives booking requests from any source — web forms, Calendly webhooks, or WhatsApp. It queries the Google Calendar free/busy API for the next 7 business days and generates up to 6 available slots in working hours (9am–5pm). GPT-4o reviews the slots alongside the meeting type and requester notes to recommend the optimal time. The workflow creates a Google Calendar event with an AI-generated agenda, sends a branded Gmail confirmation email, fires a Twilio SMS confirmation, logs the engagement in HubSpot, and records everything in Airtable. Two webhook triggers included: one for direct bookings, one for Calendly.

### Workflow Nodes (13)

| Node | Function |
|---|---|
| Webhook — Booking | Direct booking requests from forms or API |
| Webhook — Calendly | Calendly booking.created webhook |
| Set — Normalise Booking | Standardises all booking fields |
| HTTP Request — Google Calendar freeBusy | Checks availability for next 7 days |
| Code — Compute Available Slots | Generates up to 6 open slot options |
| HTTP Request — OpenAI GPT-4o | Recommends best slot, writes confirmation copy |
| Code — Select Slot | Extracts recommended slot and merges data |
| Google Calendar | Creates event with attendees and AI agenda |
| Gmail | Sends branded HTML confirmation email |
| HTTP Request — Twilio SMS | Sends SMS confirmation to requester |
| HubSpot | Logs meeting engagement on contact record |
| Slack | Notifies team of new booking |
| Airtable | Logs booking record |

### Features

- Google Calendar free/busy availability check (7-day look-ahead, configurable)
- GPT-4o AI slot recommendation based on meeting type and requester context
- Google Calendar event creation with AI-generated agenda
- Gmail branded HTML confirmation email
- Twilio SMS confirmation
- Dual webhook: direct booking + Calendly booking.created
- HubSpot engagement logging
- Configurable working hours (default 9am–5pm Mon–Fri)
- 'No availability' response when calendar is full
- SMS is optional — disable Twilio node without affecting email/calendar

### Required Credentials

OpenAI API Key (GPT-4o) · Google Calendar OAuth 2.0 · Gmail OAuth 2.0 · Twilio Account SID + Auth Token · HubSpot Private App Token · Airtable Personal Access Token

### Running Cost

~$0.02/booking (GPT-4o) + ~$0.0079/SMS (Twilio)

### Best For

Consultants and agencies fielding discovery call requests · Clinics and service businesses managing appointment bookings · Teams using Calendly who want post-booking automation · Businesses receiving bookings via web forms or WhatsApp

---

## Cross-Product Notes

### Shared Infrastructure

All 8 products use n8n as the workflow engine. All are delivered as import-ready JSON files with README.md and CREDENTIALS.md.

**Common integrations across the suite:**

- Airtable — used in all 8 products as the universal log layer
- OpenAI GPT-4o — used in all 8 products as the AI reasoning layer
- Slack — used in 7 of 8 products for team alerts and digests
- HubSpot — used in P01, P03, P05, P07, P08 for CRM operations
- Notion — used in P01, P02, P05, P07 for documentation and content
- Gmail — used in P01, P03, P05, P07, P08 for email send/receive
- Google Calendar — used in P07, P08 for event management
- Twilio — used in P06, P08 for WhatsApp and SMS

### Pricing Summary

7 products at $79 · 1 product (KnowCore) at $99 · All one-time purchases · No subscription

### Complexity Tiers

- Beginner (1–2h setup): P01, P02
- Intermediate (2–4h setup): P03, P04, P05, P07, P08
- Advanced (4–6h setup): P06
