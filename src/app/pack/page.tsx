'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pack, Card } from '@/types'
import CardItem from '@/components/cards/CardItem'
import toast from 'react-hot-toast'
import { Sparkles, Star } from 'lucide-react'

export default function PackPage() {
  const supabase = createClient()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)
  const [revealedCards, setRevealedCards] = useState<Card[]>([])
  const [showReveal, setShowReveal] = useState(false)
  const [flipped, setFlipped] = useState<boolean[]>([])

  useEffect(() => { fetchPacks() }, [])

  const fetchPacks = async () => {
    const { data } = await supabase.from('packs').select('*, series:card_series(*), rarities:pack_rarities(*)').eq('is_active', true)
    setPacks(data || [])
    setLoading(false)
  }

  const openPack = async (pack: Pack) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return }

    setOpening(true)
    try {
      const res = await fetch('/api/pack/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: pack.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เปิดแพ็คไม่สำเร็จ')

      setRevealedCards(data.cards)
      setFlipped(new Array(data.cards.length).fill(false))
      setShowReveal(true)

      // Auto flip cards with delay
      data.cards.forEach((_: Card, i: number) => {
        setTimeout(() => {
          setFlipped(f => { const n = [...f]; n[i] = true; return n })
        }, 300 + i * 400)
      })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setOpening(false)
    }
  }

  const closeReveal = () => {
    setShowReveal(false)
    setRevealedCards([])
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl text-white mb-3">
          <Sparkles className="inline mr-3 text-gold-400" size={36} />
          สุ่มแพ็คการ์ด
        </h1>
        <p className="text-gray-400">ลุ้นการ์ดหายากจากแพ็คสุ่ม</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packs.map(pack => (
          <div key={pack.id} className="card-dark overflow-hidden group">
            <div className="relative h-48 overflow-hidden">
              {pack.image_url ? (
                <img src={pack.image_url} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-dark-600">
                  <Sparkles size={64} className="text-gold-400 animate-float" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <h2 className="font-display text-xl text-white">{pack.name}</h2>
                <p className="text-gray-400 text-sm">{pack.cards_count} การ์ดต่อแพ็ค</p>
              </div>
            </div>

            <div className="p-4">
              {pack.rarities && (
                <div className="grid grid-cols-3 gap-1 mb-4">
                  {pack.rarities.map(r => (
                    <div key={r.id} className="text-center p-1.5 rounded-lg" style={{ background: `${getColor(r.rarity as any)}15` }}>
                      <div className="text-xs font-semibold" style={{ color: getColor(r.rarity as any) }}>{r.rarity}</div>
                      <div className="text-gray-400 text-xs">{r.rate}%</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-gold-400 font-bold text-2xl">฿{pack.price}</span>
                  <span className="text-gray-500 text-sm ml-1">/ แพ็ค</span>
                </div>
                <button
                  onClick={() => openPack(pack)}
                  disabled={opening}
                  className="btn-gold flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  {opening ? 'กำลังเปิด...' : 'เปิดแพ็ค'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Reveal Modal */}
      {showReveal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-800 rounded-2xl p-8 max-w-3xl w-full border border-dark-500">
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl text-gold-gradient">การ์ดที่ได้รับ!</h2>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className="text-gold-400" fill="#f59e0b" />)}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {revealedCards.map((card, i) => (
                <div
                  key={i}
                  className="transition-all duration-500"
                  style={{ opacity: flipped[i] ? 1 : 0, transform: flipped[i] ? 'scale(1)' : 'scale(0.5)' }}
                >
                  <CardItem card={card} size="md" animate={card.rarity === 'legend' || card.rarity === 'secret'} />
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              <button onClick={closeReveal} className="btn-outline">ปิด</button>
              <button onClick={closeReveal} className="btn-gold">ดูคลังการ์ด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getColor(rarity: string) {
  const colors: Record<string, string> = {
    common:'#9ca3af', uncommon:'#34d399', rare:'#60a5fa',
    epic:'#a78bfa', legend:'#fbbf24', secret:'#f472b6'
  }
  return colors[rarity] || '#9ca3af'
}
