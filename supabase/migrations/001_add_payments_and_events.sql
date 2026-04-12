-- Migration: Add payment/subscription fields to contacts + events system
-- Run this in your Supabase SQL editor

-- 1. Add subscription/tier columns to contacts
alter table public.contacts add column if not exists tier text check (tier in ('member', 'founding'));
alter table public.contacts add column if not exists stripe_customer_id text unique;
alter table public.contacts add column if not exists stripe_subscription_id text;
alter table public.contacts add column if not exists subscription_status text check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'unpaid'));
alter table public.contacts add column if not exists billing_interval text check (billing_interval in ('month', 'year'));
alter table public.contacts add column if not exists current_period_end timestamptz;
alter table public.contacts add column if not exists trial_ends_at timestamptz;

-- Index for Stripe lookups
create index if not exists idx_contacts_stripe_customer on public.contacts(stripe_customer_id);
create index if not exists idx_contacts_subscription_status on public.contacts(subscription_status);

-- 2. Events table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  location text,
  event_date timestamptz not null,
  end_date timestamptz,
  capacity int,
  min_tier text default 'member' check (min_tier in ('member', 'founding')),
  is_published boolean default true,
  created_at timestamptz default now()
);

-- 3. Event RSVPs
create table if not exists public.event_rsvps (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade,
  contact_id text not null,
  email text not null,
  status text default 'going' check (status in ('going', 'maybe', 'canceled')),
  created_at timestamptz default now(),
  unique(event_id, contact_id)
);

-- Indexes
create index if not exists idx_events_date on public.events(event_date);
create index if not exists idx_event_rsvps_event on public.event_rsvps(event_id);
create index if not exists idx_event_rsvps_contact on public.event_rsvps(contact_id);

-- RLS for events
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;

create policy "Events are viewable by everyone" on public.events for select using (true);
create policy "RSVPs are viewable by everyone" on public.event_rsvps for select using (true);
create policy "Anyone can RSVP" on public.event_rsvps for insert with check (true);
create policy "Anyone can update their RSVP" on public.event_rsvps for update using (true);
