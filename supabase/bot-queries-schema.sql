-- Ask Myca query logs
-- Run this in your Supabase SQL editor

create table if not exists public.bot_queries (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  query text not null,
  reply text,
  recommended_emails text[] default '{}',
  source text default 'chat',
  session_id text,
  created_at timestamptz default now()
);

-- Index for looking up queries by user and time
create index if not exists bot_queries_user_email_idx on public.bot_queries (user_email);
create index if not exists bot_queries_created_at_idx on public.bot_queries (created_at desc);
create index if not exists bot_queries_session_id_idx on public.bot_queries (session_id);
