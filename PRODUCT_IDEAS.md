# Myca Collective — Product Ideas

## Revenue Drivers
1. **Stripe Membership Payments** — $50/mo x 800 members = $480K ARR, paywalled access
2. **Sponsorship & Partnership Page** — Brands pay $5–10K per partnership
3. **Job Board** — Members + companies pay to list
4. **Brand & Skill Marketplace** — Members and brands list their products, services, and skills for the community to browse and shop. Brands pay for featured/premium listings. Members can offer consulting, catering, recipe dev, etc.

## Engagement Drivers
5. **Weekly Digest Email** — Auto-generated: new members, popular messages, upcoming events
6. **Member Spotlight** — Featured member weekly on homepage (`spotlight_submissions` table exists)
7. **Intro Requests** — Curated introductions, premium value
8. **Company Logo Wall** — Social proof on homepage
9. **Unread Message Badges** — Notification dots on Chat nav
10. **Required Profile Onboarding** — Force users to complete profile + metadata at first login. Improves directory quality, search, intros, and matchmaking.
    - Fields: name, photo, role/title, company, location, interests/expertise tags, what they're looking for, website, **Instagram handle**, other socials
    - Requires Supabase schema update to add new profile columns (e.g. `instagram_handle`, `socials`, `interests`, etc.)
    - Block access to app until required fields are complete

## Events
10. **Member Event Posting & RSVP** — Members host, post, and RSVP to events
11. **Email/Outbound Integration** — Automated comms tied to events
12. **AI Learning Sessions** — With calendar access

## Growth
13. **Public-Facing Member Directory** — Preview for non-members to drive conversions
14. **Brand Directory** — Curated brands/products members can shop; brands pay to be featured
15. **Member Outreach Pipeline** — Track and manage outreach to prospective members, sponsors, and collaborators

## Infrastructure
16. **Payment & Processing** — Stripe for memberships and job board

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

### Phase 3 — Premium & Partnership Layer
- Sponsorship/partnership page (needs member density first)
- Intro requests (high touch, needs operational flow)
- Member spotlight (table already exists, close to ready)
