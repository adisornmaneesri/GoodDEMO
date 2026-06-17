'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Auction } from '@/types'
import { Gavel, Clock, Zap, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'

export default function AuctionPage() {
  const supabase = createClient()
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Auction | null>(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null))
    fetchAuctions()

    // Real-time subscription
    const ch = supabase
      .channel('auctions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'auctions' }, payload => {
        setAuctions(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a))
        if (selected?.id === payload.new.id) {
          setSelected(prev => prev ? { ...prev, ...payload.new } : null)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  const fetchAuctions = async () => {
    const { data } = await supabase
      .from('auctions')
      .select('*, card:cards(*), seller:profiles!auctions_seller_id_fkey(*), bids:auction_bids(*, profile:profiles(username))')
      .in('status', ['active', 'upcoming'])
      .order('end_at', { ascending: true })
    setAuctions(data || [])
    setLoading(false)
  }

  const placeBid = async () => {
    if (!userId) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return }
    if (!selected) return
    const amount = parseFloat(bidAmount)
    const minBid = selected.current_price + selected.min_increment

    if (amount < minBid) {
      toast.error(`ราคาต่ำสุดที่เสนอได้คือ ฿${minBid}`)
      return
    }

    setBidding(true)
    const res = await fetch('/api/auction/bid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auction_id: selected.id, amount }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('เสนอราคาสำเร็จ!')
      setBidAmount('')
    } else {
      toast.error(data.error || 'เสนอราคาไม่สำเร็จ')
    }
    setBidding(false)
  }

  const getTimeLeft = (endAt: string) => {
    const end = new Date(endAt)
    if (end < new Date()) return 'สิ้นสุดแล้ว'
    return formatDistanceToNow(end, { locale: th, addSuffix: false })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Gavel className="text-gold-400" size={32} />
        <div>
          <h1 className="font-display text-3xl text-white">ประมูลการ์ด</h1>
          <p className="text-gray-400">ชิงการ์ดหายาก — อัปเดต real-time</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Auction list */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl shimmer-bg" />)
          ) : auctions.length === 0 ? (
            <div className="text-center py-20 text-gray-500 card-dark">
              <Gavel size={48} className="mx-auto mb-4 opacity-30" />
              <p>ยังไม่มีการประมูลขณะนี้</p>
            </div>
          ) : auctions.map(auction => (
            <div
              key={auction.id}
              onClick={() => { setSelected(auction); setBidAmount(String(auction.current_price + auction.min_increment)) }}
              className={`card-dark p-4 cursor-pointer hover:border-gold-500/50 transition-all ${selected?.id === auction.id ? 'border-gold-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-dark-600">
                  {auction.card?.image_url ? (
                    <Image src={auction.card.image_url} alt={auction.card.name} width={64} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🃏</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {auction.is_flash && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap size={10} /> Flash
                      </span>
                    )}
                    <h3 className="font-semibold text-white truncate">{auction.card?.name}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gold-400 font-bold text-lg">฿{auction.current_price.toLocaleString()}</span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {getTimeLeft(auction.end_at)}
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <TrendingUp size={12} /> {auction.bids?.length || 0} bids
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bid panel */}
        <div className="card-dark p-6 h-fit sticky top-20">
          {selected ? (
            <>
              <h2 className="font-display text-xl text-white mb-4">{selected.card?.name}</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ราคาปัจจุบัน</span>
                  <span className="text-gold-400 font-bold text-lg">฿{selected.current_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ราคาขั้นต่ำ</span>
                  <span className="text-white">฿{(selected.current_price + selected.min_increment).toLocaleString()}</span>
                </div>
                {selected.buyout_price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">ซื้อทันที</span>
                    <span className="text-green-400">฿{selected.buyout_price.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">สิ้นสุดใน</span>
                  <span className="text-red-400 font-semibold">{getTimeLeft(selected.end_at)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm text-gray-400 block mb-2">ราคาที่ต้องการเสนอ (฿)</label>
                <input
                  type="number"
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  min={selected.current_price + selected.min_increment}
                  className="input-dark text-lg font-semibold"
                />
              </div>

              <button onClick={placeBid} disabled={bidding || !userId} className="btn-gold w-full flex items-center justify-center gap-2">
                <Gavel size={18} />
                {bidding ? 'กำลังเสนอ...' : 'เสนอราคา'}
              </button>
              {selected.buyout_price && (
                <button className="mt-2 w-full btn-outline text-green-400 border-green-500 hover:bg-green-500">
                  ซื้อทันที ฿{selected.buyout_price.toLocaleString()}
                </button>
              )}

              {/* Recent bids */}
              {selected.bids && selected.bids.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm text-gray-400 mb-3">ประวัติการเสนอราคา</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {[...selected.bids].sort((a, b) => b.amount - a.amount).slice(0, 10).map((bid, i) => (
                      <div key={bid.id} className="flex justify-between text-sm">
                        <span className={i === 0 ? 'text-gold-400 font-semibold' : 'text-gray-400'}>
                          {bid.profile?.username || 'ผู้ใช้'}
                        </span>
                        <span className={i === 0 ? 'text-gold-400 font-semibold' : 'text-gray-500'}>
                          ฿{bid.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Gavel size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">เลือกการประมูลเพื่อเสนอราคา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
