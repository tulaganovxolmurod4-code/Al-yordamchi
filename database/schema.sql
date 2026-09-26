-- JARVIS database schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL editor (or `psql $DATABASE_URL -f schema.sql`)

create extension if not exists "pgcrypto";

-- One row per Telegram user
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  first_name text,
  username text,
  language_code text default 'en',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- Chat sessions (a user can have several "New Chat" threads)
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text default 'New Chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual messages inside a chat
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references chats(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Long-term personal memory, separate from chat history.
-- Explicitly NEVER store secrets/passwords/keys here (enforced in app layer too).
create table if not exists memory_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  key text not null,          -- e.g. "name", "preferred_language", "project:jarvis"
  value text not null,
  category text default 'general', -- name | language | project | preference | task | general
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, key)
);

create index if not exists idx_messages_chat on messages(chat_id, created_at);
create index if not exists idx_chats_user on chats(user_id, updated_at desc);
create index if not exists idx_memory_user on memory_entries(user_id);

alter table users enable row level security;
alter table chats enable row level security;
alter table messages enable row level security;
alter table memory_entries enable row level security;
