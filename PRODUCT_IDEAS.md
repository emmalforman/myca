# Myca Collective — Product Ideas

## Revenue Drivers
1. **Stripe Membership Payments** — $50/mo x 800 members = $480K ARR, paywalled access
2. **Sponsorship & Partnership Page** — Brands pay $5–10K per partnership
3. **Job Board** — Members + companies pay to list
4. **Brand & Skill Marketplace** — Members and brands list their products, services, and skills for the community to browse and shop. Brands pay for featured/premium listings. Members can offer consulting, catering, recipe dev, etc.
5. **Member Discounts Program** — Exclusive discounts at Myca member businesses. v1: discount codes + affiliate links (no infra needed). v2: Stripe Connect for platform-facilitated payments with a Myca fee. Huge retention driver — "your membership pays for itself."

## Engagement Drivers
6. **Weekly Digest Email** — Auto-generated: new members, popular messages, upcoming events
7. **Member Spotlight** — Featured member weekly on homepage (`spotlight_submissions` table exists)
8. **Intro Requests** — Curated introductions, premium value
9. **Company Logo Wall** — Social proof on homepage
10. **Unread Message Badges** — Notification dots on Chat nav
11. **Member Content Feed on Homepage** — Auto-pull latest posts from member Substacks, newsletters, podcasts, and blogs to feature on the homepage. Keeps homepage fresh, elevates member work, gives non-members a reason to keep visiting. Members link their feeds in their profile; ingested via RSS. Can highlight "Latest from the community" with post title, excerpt, author, and link out.
12. **Required Profile Onboarding** — Force users to complete profile + metadata at first login. Improves directory quality, search, intros, and matchmaking.
    - Fields: name, photo, role/title, company, location, interests/expertise tags, what they're looking for, website, **Instagram handle**, other socials
    - Requires Supabase schema update to add new profile columns (e.g. `instagram_handle`, `socials`, `interests`, etc.)
    - Block access to app until required fields are complete
    - **Branching marketplace flow:** "Do you have a product or service?" → type (product / service / skill / event) → brand (pick existing or add new) → details. Auto-populates the brand directory and marketplace from signup.
13. **AI Matchmaker Chatbot** — Conversational chatbot where members describe what they need ("I'm looking for a photographer in Brooklyn," "need help with packaging," "want to collab on a dinner pop-up") and the bot returns recommendations with reasoning. Feeds into Intro Requests — bot can draft the outreach message.
    - **Search across three sources:**
      1. **Members** — profiles, skills, tags, marketplace listings
      2. **Brands / places** — brand directory, partner listings, venues
      3. **Chat history** — past messages in channels and DMs where members mentioned/recommended people, brands, or places (huge unlocked knowledge base)
    - Recommendation cards should have a **"Start chat"** CTA that opens a DM with that member directly from the UI
    - For chat-history results, show the quote + link back to the original message as context
14. **Curated Lists → Substack Content Pipeline** — Create themed lists ("Best coffee shops in NYC," "Favorite packaging suppliers," "Go-to kitchen tools under $50") and send to members. Members vote, add picks, and leave short recs. Crowdsourced results become polished Substack posts (e.g. "Myca Members' Top 10 Coffee Shops"). Drives growth (non-members discover content → join), engagement (members love contributing), and brand value (Myca becomes the trusted rec source in food/bev).
    - **Submission format:** photo (of place/product/brand), name, blurb (1-2 sentences why they love it), auto-attributed with member name + photo
    - **Collection methods:** in-app submission form, email link, or bot prompt in chat ("Drop your favorite olive oil — photo + why you love it")
    - **Trend monitoring (online + internal):**
      - Myca chat channels (what members are already talking about)
      - Instagram hashtags, TikTok food trends, Google Trends
      - Industry newsletters (Eater, Food52, Bon Appetit, etc.)
      - Agent runs weekly, suggests 3-5 list topics from combined signals
    - **AI Agent for scalability** — automates the full pipeline:
      1. **Topic generation** — surfaces trends from chat + online monitoring
      2. **Distribution** — sends submission form to members via email/in-app, sets deadline
      3. **Nudging** — reminds non-respondents ("12 members shared picks — add yours!")
      4. **Aggregation** — tallies votes, ranks results, pulls member quotes + photos
      5. **Draft generation** — auto-writes Substack post with rankings, quotes, photos, links
      6. **Cross-posting** — formats for Instagram (carousel), email digest, and Myca site
    - You just approve the topic and review the final draft. Could run weekly on autopilot.

## Events
15. **Member Event Posting & RSVP** — Members host, post, and RSVP to events
16. **Email/Outbound Integration** — Automated comms tied to events
17. **AI Learning Sessions** — With calendar access
18. **Member Cohorts** — Batch new members into onboarding cohorts (monthly or bi-weekly). Host a welcome Zoom/event where they meet each other. Could be grouped by city, industry, or interest. Auto-create a cohort chat channel so they stay connected. Builds instant belonging and stronger retention vs. solo signups.

## Growth
19. **Public-Facing Member Directory** — Preview for non-members to drive conversions
20. **Brand Directory** — Curated brands/products members can shop; brands pay to be featured
21. **Member Outreach Pipeline** — Track and manage outreach to prospective members, sponsors, and collaborators
22. **Job Board Teaser for Non-Members** — Show a blurred/preview list of open roles on the public site ("12 open roles from companies like Sweetgreen, Greycroft, and Soho House") with a CTA to sign in or apply. Creates FOMO and drives conversions without giving away the full content.
23. **Member-Submitted Jobs with Link Parser** — Instead of syncing mass feeds (Instacart, Gopuff, etc. = too noisy), let members submit jobs via a link. Parser auto-extracts title, company, location, description. Keeps the board curated and relevant to the Myca network.

## Infrastructure
24. **Payment & Processing** — Stripe for memberships and job board

## On Hold
- **Paid Intros for Non-Members** — Paused. Concern: too much noise from random intro requests before member density is built. Revisit once the platform has gatekeeping/filtering and enough members to sustain it.

---

## Build Priority

### Phase 1 — Unblocks Revenue
- Stripe membership payments (the $500K engine)
- Job board (immediate monetization)
- Brand & skill marketplace (revenue from featured listings + massive engagement)

### Phase 2 — Drives Growth + Retention
- Public directory (top of funnel)
- Weekly digest email (retention, largely automated)
- Unread message badges (quick win, platform feels alive)
- Member discounts program (starts with codes/affiliate links, zero infra)
- Member content feed on homepage (RSS-powered, low effort, keeps site alive)

### Phase 3 — Premium & Partnership Layer
- Sponsorship/partnership page (needs member density first)
- Intro requests (high touch, needs operational flow)
- Member spotlight (table already exists, close to ready)
- AI matchmaker chatbot (needs member density + profile data to be useful)
- Stripe Connect for discount payments (v2, once volume justifies it)
