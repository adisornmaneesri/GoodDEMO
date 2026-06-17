export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legend' | 'secret'

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  wallet: number
  role: 'user' | 'admin'
  created_at: string
}

export interface CardSeries {
  id: string
  name: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

export interface Card {
  id: string
  series_id: string | null
  name: string
  description: string | null
  image_url: string | null
  rarity: Rarity
  base_price: number
  stock: number
  is_active: boolean
  created_at: string
  series?: CardSeries
}

export interface Pack {
  id: string
  series_id: string | null
  name: string
  description: string | null
  image_url: string | null
  price: number
  cards_count: number
  is_active: boolean
  series?: CardSeries
  rarities?: PackRarity[]
}

export interface PackRarity {
  id: string
  pack_id: string
  rarity: Rarity
  rate: number
}

export interface PackOpen {
  id: string
  user_id: string
  pack_id: string
  cards_got: string[]
  opened_at: string
  pack?: Pack
  cards?: Card[]
}

export interface UserCard {
  id: string
  user_id: string
  card_id: string
  source: 'pack' | 'auction' | 'marketplace' | 'shop'
  obtained_at: string
  card?: Card
}

export interface Auction {
  id: string
  seller_id: string
  card_id: string
  user_card_id: string
  start_price: number
  current_price: number
  buyout_price: number | null
  min_increment: number
  start_at: string
  end_at: string
  status: 'upcoming' | 'active' | 'ended' | 'cancelled'
  winner_id: string | null
  is_flash: boolean
  created_at: string
  card?: Card
  seller?: Profile
  bids?: AuctionBid[]
}

export interface AuctionBid {
  id: string
  auction_id: string
  user_id: string
  amount: number
  bid_at: string
  profile?: Profile
}

export interface Listing {
  id: string
  seller_id: string
  user_card_id: string
  card_id: string
  price: number
  status: 'active' | 'sold' | 'cancelled'
  created_at: string
  card?: Card
  seller?: Profile
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
  shipping: Record<string, string> | null
  created_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  card_id: string
  qty: number
  price: number
  card?: Card
}

export interface Transaction {
  id: string
  user_id: string
  type: 'topup' | 'purchase' | 'sale' | 'refund' | 'bid_hold' | 'bid_release'
  amount: number
  ref_id: string | null
  note: string | null
  created_at: string
}

export const RARITY_CONFIG: Record<Rarity, { label: string; color: string; glow: string }> = {
  common:   { label: 'Common',   color: '#9ca3af', glow: 'rgba(156,163,175,0.4)' },
  uncommon: { label: 'Uncommon', color: '#34d399', glow: 'rgba(52,211,153,0.4)'  },
  rare:     { label: 'Rare',     color: '#60a5fa', glow: 'rgba(96,165,250,0.4)'  },
  epic:     { label: 'Epic',     color: '#a78bfa', glow: 'rgba(167,139,250,0.4)' },
  legend:   { label: 'Legend',   color: '#fbbf24', glow: 'rgba(251,191,36,0.4)'  },
  secret:   { label: 'Secret',   color: '#f472b6', glow: 'rgba(244,114,182,0.4)' },
}
