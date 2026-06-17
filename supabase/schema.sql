-- ============================================================
-- CardVault Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS / PROFILES
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  wallet      numeric(12,2) default 0 not null,
  role        text default 'user' check (role in ('user','admin')),
  created_at  timestamptz default now()
);

alter table profiles enable row level security;
create policy "Users can view all profiles"    on profiles for select using (true);
create policy "Users can update own profile"   on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"   on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CARD SERIES / SETS
-- ============================================================
create table card_series (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  image_url   text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table card_series enable row level security;
create policy "Anyone can view series" on card_series for select using (true);
create policy "Admin only insert"      on card_series for insert using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin only update"      on card_series for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- CARDS MASTER
-- ============================================================
create table cards (
  id          uuid primary key default uuid_generate_v4(),
  series_id   uuid references card_series(id) on delete set null,
  name        text not null,
  description text,
  image_url   text,
  rarity      text not null check (rarity in ('common','uncommon','rare','epic','legend','secret')),
  base_price  numeric(10,2) not null default 0,
  stock       int default 0,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table cards enable row level security;
create policy "Anyone can view active cards" on cards for select using (is_active = true);
create policy "Admin only manage cards"      on cards for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- SHOP ORDERS
-- ============================================================
create table orders (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  total       numeric(12,2) not null,
  status      text default 'pending' check (status in ('pending','paid','shipped','delivered','cancelled')),
  shipping    jsonb,
  created_at  timestamptz default now()
);

create table order_items (
  id        uuid primary key default uuid_generate_v4(),
  order_id  uuid references orders(id) on delete cascade,
  card_id   uuid references cards(id),
  qty       int not null default 1,
  price     numeric(10,2) not null
);

alter table orders enable row level security;
create policy "Users see own orders"   on orders for select using (auth.uid() = user_id);
create policy "Users create orders"    on orders for insert with check (auth.uid() = user_id);
create policy "Admin see all orders"   on orders for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table order_items enable row level security;
create policy "See own order items" on order_items for select using (
  exists (select 1 from orders where id = order_id and user_id = auth.uid())
);

-- ============================================================
-- PACK SYSTEM
-- ============================================================
create table packs (
  id           uuid primary key default uuid_generate_v4(),
  series_id    uuid references card_series(id),
  name         text not null,
  description  text,
  image_url    text,
  price        numeric(10,2) not null,
  cards_count  int default 5,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Pack rarity rates (sum must = 100)
create table pack_rarities (
  id         uuid primary key default uuid_generate_v4(),
  pack_id    uuid references packs(id) on delete cascade,
  rarity     text not null,
  rate       numeric(5,2) not null  -- percentage e.g. 60.00
);

-- Pack open history
create table pack_opens (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references profiles(id),
  pack_id    uuid references packs(id),
  cards_got  jsonb not null,  -- array of card ids
  opened_at  timestamptz default now()
);

alter table packs enable row level security;
create policy "Anyone view active packs" on packs for select using (is_active = true);

alter table pack_opens enable row level security;
create policy "User see own opens" on pack_opens for select using (auth.uid() = user_id);
create policy "User create opens"  on pack_opens for insert with check (auth.uid() = user_id);

-- ============================================================
-- USER CARD COLLECTION (VAULT)
-- ============================================================
create table user_cards (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id) on delete cascade,
  card_id     uuid references cards(id),
  source      text check (source in ('pack','auction','marketplace','shop')),
  obtained_at timestamptz default now()
);

alter table user_cards enable row level security;
create policy "User see own vault"    on user_cards for select using (auth.uid() = user_id);
create policy "User insert own vault" on user_cards for insert with check (auth.uid() = user_id);

-- ============================================================
-- AUCTION SYSTEM
-- ============================================================
create table auctions (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid references profiles(id),
  card_id       uuid references cards(id),
  user_card_id  uuid references user_cards(id),
  start_price   numeric(10,2) not null,
  current_price numeric(10,2) not null,
  buyout_price  numeric(10,2),
  min_increment numeric(10,2) default 10,
  start_at      timestamptz not null,
  end_at        timestamptz not null,
  status        text default 'upcoming' check (status in ('upcoming','active','ended','cancelled')),
  winner_id     uuid references profiles(id),
  is_flash      boolean default false,
  created_at    timestamptz default now()
);

create table auction_bids (
  id          uuid primary key default uuid_generate_v4(),
  auction_id  uuid references auctions(id) on delete cascade,
  user_id     uuid references profiles(id),
  amount      numeric(10,2) not null,
  bid_at      timestamptz default now()
);

alter table auctions enable row level security;
create policy "Anyone view auctions"  on auctions for select using (true);
create policy "User create auction"   on auctions for insert with check (auth.uid() = seller_id);
create policy "Admin manage auctions" on auctions for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

alter table auction_bids enable row level security;
create policy "Anyone view bids"   on auction_bids for select using (true);
create policy "User place bid"     on auction_bids for insert with check (auth.uid() = user_id);

-- ============================================================
-- MARKETPLACE
-- ============================================================
create table listings (
  id            uuid primary key default uuid_generate_v4(),
  seller_id     uuid references profiles(id),
  user_card_id  uuid references user_cards(id),
  card_id       uuid references cards(id),
  price         numeric(10,2) not null,
  status        text default 'active' check (status in ('active','sold','cancelled')),
  created_at    timestamptz default now()
);

create table listing_offers (
  id          uuid primary key default uuid_generate_v4(),
  listing_id  uuid references listings(id) on delete cascade,
  buyer_id    uuid references profiles(id),
  amount      numeric(10,2) not null,
  status      text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at  timestamptz default now()
);

alter table listings enable row level security;
create policy "Anyone view active listings" on listings for select using (status = 'active');
create policy "User create listing"         on listings for insert with check (auth.uid() = seller_id);
create policy "Seller manage listing"       on listings for update using (auth.uid() = seller_id);

-- ============================================================
-- WALLET TRANSACTIONS
-- ============================================================
create table transactions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles(id),
  type        text check (type in ('topup','purchase','sale','refund','bid_hold','bid_release')),
  amount      numeric(12,2) not null,
  ref_id      uuid,   -- order_id, auction_id, etc.
  note        text,
  created_at  timestamptz default now()
);

alter table transactions enable row level security;
create policy "User see own transactions" on transactions for select using (auth.uid() = user_id);

-- ============================================================
-- REALTIME SUBSCRIPTIONS (enable for auction)
-- ============================================================
alter publication supabase_realtime add table auctions;
alter publication supabase_realtime add table auction_bids;
