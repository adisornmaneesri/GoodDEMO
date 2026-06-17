'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Rarity, RARITY_CONFIG } from '@/types'
import CardItem from '@/components/cards/CardItem'
import toast from 'react-hot-toast'
import { ShoppingCart, Search, Filter } from 'lucide-react'

const RARITIES: Rarity[] = ['common','uncommon','rare','epic','legend','secret']

export default function ShopPage() {
  const supabase = createClient()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRarity, setFilterRarity] = useState<Rarity | ''>('')
  const [cart, setCart] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchCards()
  }, [search, filterRarity])

  const fetchCards = async () => {
    setLoading(true)
    let q = supabase.from('cards').select('*, series:card_series(*)').eq('is_active', true).gt('stock', 0)
    if (search)       q = q.ilike('name', `%${search}%`)
    if (filterRarity) q = q.eq('rarity', filterRarity)
    const { data } = await q.order('rarity')
    setCards(data || [])
    setLoading(false)
  }

  const addToCart = (card: Card) => {
    setCart(c => ({ ...c, [card.id]: (c[card.id] || 0) + 1 }))
    toast.success(`เพิ่ม ${card.name} ลงตะกร้าแล้ว`)
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const card = cards.find(c => c.id === id)
    return total + (card?.base_price || 0) * qty
  }, 0)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl text-white">ร้านค้าการ์ด</h1>
          <p className="text-gray-400 mt-1">เลือกซื้อการ์ดสะสมได้ที่นี่</p>
        </div>
        {cartCount > 0 && (
          <div className="flex items-center gap-4 card-dark px-4 py-3">
            <ShoppingCart size={20} className="text-gold-400" />
            <span className="text-white">{cartCount} ชิ้น</span>
            <span className="text-gold-400 font-semibold">฿{cartTotal.toLocaleString()}</span>
            <button className="btn-gold text-sm py-1.5 px-4">ชำระเงิน</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="ค้นหาการ์ด..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-dark pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            value={filterRarity}
            onChange={e => setFilterRarity(e.target.value as Rarity | '')}
            className="input-dark w-auto"
          >
            <option value="">ทุก Rarity</option>
            {RARITIES.map(r => (
              <option key={r} value={r}>{RARITY_CONFIG[r].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl shimmer-bg" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-4xl mb-4">🃏</p>
          <p>ไม่พบการ์ดที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {cards.map(card => (
            <div key={card.id} className="group relative">
              <CardItem card={card} showPrice size="md" />
              <button
                onClick={() => addToCart(card)}
                className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="btn-gold text-xs py-1 px-3">+ ตะกร้า</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
