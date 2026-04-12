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
11. **Required Profile Onboarding** — Force users to complete profile + metadata at first login. Improves directory quality, search, intros, and matchmaking.
    - Fields: name, photo, role/title, company, location, interests/expertise tags, what they're looking for, website, **Instagram handle**, other socials
    - Requires Supabase schema update to add new profile columns (e.g. `instagram_handle`, `socials`, `interests`, etc.)
    - Block access to app until required fields are complete
    - **Branching marketplace flow:** "Do you have a product or service?" → type (product / service / skill / event) → brand (pick existing or add new) → details. Auto-populates the brand directory and marketplace from signup.
12. **AI Matchmaker Chatbot** — Conversational chatbot where members describe what they need ("I'm looking for a photographer in Brooklyn," "need help with packaging," "want to collab on a dinner pop-up") and the bot returns recommendations with reasoning. Feeds into Intro Requests — bot can draft the outreach message.
    - **Search across three sources:**
      1. **Members** — profiles, skills, tags, marketplace listings
      2. **Brands / places** — brand directory, partner listings, venues
      3. **Chat history** — past messages in channels and DMs where members mentioned/recommended people, brands, or places (huge unlocked knowledge base)
    - Recommendation cards should have a **"Start chat"** CTA that opens a DM with that member directly from the UI
    - For chat-history results, show the quote + link back to the original message as context
13. **Curated Lists → Substack Content Pipeline** — Create themed lists ("Best coffee shops in NYC," "Favorite packaging suppliers," "Go-to kitchen tools under $50") and send to members. Members vote, add picks, and leave short recs. Crowdsourced results become polished Substack posts (e.g. "Myca Members' Top 10 Coffee Shops"). Drives growth (non-members discover content → join), engagement (members love contributing), and brand value (Myca becomes the trusted rec source in food/bev).

## Events
13. **Member Event Posting & RSVP** — Members host, post, and RSVP to events
14. **Email/Outbound Integration** — Automated comms tied to events
15. **AI Learning Sessions** — With calendar access

## Growth
16. **Public-Facing Member Directory** — Preview for non-members to drive conversions
17. **Brand Directory** — Curated brands/products members can shop; brands pay to be featured
18. **Member Outreach Pipeline** — Track and manage outreach to prospective members, sponsors, and collaborators

## Infrastructure
19. **Payment & Processing** — Stripe for memberships and job board

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

### Phase 3 — Premium & Partnership Layer
- Sponsorship/partnership page (needs member density first)
- Intro requests (high touch, needs operational flow)
- Member spotlight (table already exists, close to ready)
- AI matchmaker chatbot (needs member density + profile data to be useful)
- Stripe Connect for discount payments (v2, once volume justifies it)
