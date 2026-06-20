'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Pack, Card } from '@/types'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'
import PackOpeningScene from '@/components/pack/PackOpeningScene'

export default function PackPage() {
  const supabase = createClient()
  const [packs, setPacks] = useState<Pack[]>([])
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState(false)

  // active opening scene state
  const [activePack, setActivePack] = useState<Pack | null>(null)
  const [revealedCards, setRevealedCards] = useState<Card[]>([])

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

      // Pre-fetch results, then hand off to the opening scene —
      // the scene itself controls pacing (select → cut → reveal)
      setRevealedCards(data.cards)
      setActivePack(pack)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setOpening(false)
    }
  }

  const closeScene = () => {
    setActivePack(null)
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

      {/* Full-screen 3D pack opening experience:
          select pack (3D, swipe up to cut) → cutting animation → swipe through cards */}
      {activePack && (
        <PackOpeningScene
          packImageUrl={activePack.image_url}
          packName={activePack.name}
          cards={revealedCards}
          onClose={closeScene}
        />
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
