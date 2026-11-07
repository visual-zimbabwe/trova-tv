-- Relational representation of Trova TV's local-first state stores
-- (Implemented via AsyncStorage JSON documents + Go Torrent Engine state)

create table watchlist_entries (
  id text primary key,
  tmdb_id integer not null,
  imdb_id text,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  original_title text,
  year integer,
  poster_url text,
  backdrop_url text,
  rating numeric(3,1),
  original_language text,
  watched boolean not null default false,
  collection_ids jsonb not null default '["default"]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on watchlist_entries (media_type, created_at desc);

create table watchlist_collections (
  id text primary key,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table recent_viewed (
  id text primary key,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  year integer,
  poster_url text,
  backdrop_url text,
  rating numeric(3,1),
  viewed_at timestamptz not null default now()
);
create index on recent_viewed (viewed_at desc);

create table offline_downloads (
  id text primary key,
  info_hash text not null,
  file_idx integer not null default 0,
  title text not null,
  release_name text not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  tmdb_id integer,
  imdb_id text,
  season integer,
  episode integer,
  poster_url text,
  state text not null default 'resolving'
    check (state in ('resolving', 'downloading', 'paused', 'completed', 'error')),
  progress numeric(5,4) not null default 0,
  downloaded_bytes bigint not null default 0,
  total_bytes bigint not null default 0,
  cached_subtitle_url text,
  created_at timestamptz not null default now()
);
create index on offline_downloads (tmdb_id, season, episode);
