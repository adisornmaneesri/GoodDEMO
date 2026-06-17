'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Listing, RARITY_CONFIG } from '@/types'
import { ShoppingBag, Search, Tag } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

export default function MarketplacePage() {
  const supabase = createClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [buying, setBuying] = useState<string | null>(null)

  useEffect(() => { fetchListings() }, [search])

  const fetchListings = async () => {
    let q = supabase
      .from('listings')
      .select('*, card:cards(*), seller:profiles!listings_seller_id_fkey(*)')
      .eq('status', 'active')
    if (search) q = q.ilike('cards.name', `%${search}%`)
    const { data } = await q.order('created_at', { ascending: false })
    setListings(data || [])
    setLoading(false)
  }

  const buyNow = async (listing: Listing) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return }
    if (listing.seller_id === user.id) { toast.error('ไม่สามารถซื้อของตัวเองได้'); return }

    setBuying(listing.id)
    const res = await fetch('/api/marketplace/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listing.id }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('ซื้อสำเร็จ! การ์ดอยู่ในคลังของคุณแล้ว')
      fetchListings()
    } else {
      toast.error(data.error || 'ซื้อไม่สำเร็จ')
    }
    setBuying(null)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-display text-3xl text-white flex items-center gap-3">
            <ShoppingBag className="text-gold-400" /> Marketplace
          </h1>
          <p className="text-gray-400 mt-1">ซื้อขายการ์ดระหว่างผู้ใช้</p>
        </div>
        <a href="/marketplace/sell" className="btn-gold flex items-center gap-2 w-fit">
          <Tag size={16} /> ลิสต์การ์ดขาย
        </a>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="ค้นหาการ์ด..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-dark pl-10 max-w-md"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <div key={i} className="h-80 rounded-xl shimmer-bg" />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-20 text-gray-500 card-dark">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
          <p>ยังไม่มีการ์ดวางขาย</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {listings.map(listing => {
            const rarity = listing.card ? RARITY_CONFIG[listing.card.rarity] : null
            return (
              <div key={listing.id} className="card-dark overflow-hidden group">
                <div className="relative h-48 bg-dark-600">
                  {listing.card?.image_url ? (
                    <Image src={listing.card.image_url} alt={listing.card.name || ''} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🃏</div>
                  )}
                  {rarity && (
                    <div className="absolute top-2 right-2 rarity-badge text-[10px]"
                         style={{ color: rarity.color, background: `${rarity.color}20` }}>
                      {rarity.label}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-white text-sm font-semibold truncate mb-1">{listing.card?.name}</h3>
                  <p className="text-gray-500 text-xs mb-3">โดย {listing.seller?.username}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-gold-400 font-bold text-lg">฿{listing.price.toLocaleString()}</span>
                    <button
                      onClick={() => buyNow(listing)}
                      disabled={buying === listing.id}
                      className="btn-gold text-xs py-1.5 px-3"
                    >
                      {buying === listing.id ? '...' : 'ซื้อเลย'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
