'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Pack, CardSeries } from '@/types'
import { Settings, Plus, Package, Sparkles, Layers } from 'lucide-react'
import toast from 'react-hot-toast'

type AdminTab = 'cards' | 'packs' | 'series' | 'auctions'

export default function AdminPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<AdminTab>('cards')
  const [cards, setCards] = useState<Card[]>([])
  const [packs, setPacks] = useState<Pack[]>([])
  const [series, setSeries] = useState<CardSeries[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)

  // Add card form
  const [cardForm, setCardForm] = useState({
    name: '', description: '', rarity: 'common', base_price: '', stock: '', series_id: '', image_url: ''
  })

  useEffect(() => {
    checkAdmin()
    fetchData()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (data?.role !== 'admin') { window.location.href = '/'; return }
  }

  const fetchData = async () => {
    const [{ data: c }, { data: p }, { data: s }] = await Promise.all([
      supabase.from('cards').select('*, series:card_series(*)').order('created_at', { ascending: false }),
      supabase.from('packs').select('*').order('created_at', { ascending: false }),
      supabase.from('card_series').select('*').order('name'),
    ])
    setCards(c || [])
    setPacks(p || [])
    setSeries(s || [])
    setLoading(false)
  }

  const addCard = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('cards').insert({
      name: cardForm.name,
      description: cardForm.description,
      rarity: cardForm.rarity,
      base_price: parseFloat(cardForm.base_price),
      stock: parseInt(cardForm.stock),
      series_id: cardForm.series_id || null,
      image_url: cardForm.image_url || null,
    })
    if (error) { toast.error(error.message); return }
    toast.success('เพิ่มการ์ดสำเร็จ!')
    setShowAddCard(false)
    setCardForm({ name:'', description:'', rarity:'common', base_price:'', stock:'', series_id:'', image_url:'' })
    fetchData()
  }

  const toggleCard = async (id: string, current: boolean) => {
    await supabase.from('cards').update({ is_active: !current }).eq('id', id)
    fetchData()
  }

  const TABS = [
    { id: 'cards',  label: 'จัดการการ์ด', icon: Package },
    { id: 'packs',  label: 'จัดการแพ็ค',  icon: Sparkles },
    { id: 'series', label: 'ซีรีส์',       icon: Layers },
  ] as const

  const RARITIES = ['common','uncommon','rare','epic','legend','secret']

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Settings className="text-gold-400" size={28} />
        <h1 className="font-display text-3xl text-white">Admin Panel</h1>
      </div>

      <div className="flex gap-1 mb-6 bg-dark-700 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as AdminTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-gold-500 text-dark-900' : 'text-gray-400 hover:text-white'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Cards tab */}
      {tab === 'cards' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddCard(true)} className="btn-gold flex items-center gap-2">
              <Plus size={16} /> เพิ่มการ์ด
            </button>
          </div>
          <div className="card-dark overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-dark-600 text-gray-400">
                <tr>
                  <th className="text-left px-4 py-3">ชื่อ</th>
                  <th className="text-left px-4 py-3">Rarity</th>
                  <th className="text-right px-4 py-3">ราคา</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-center px-4 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {cards.map(card => (
                  <tr key={card.id} className="border-t border-dark-500 hover:bg-dark-600">
                    <td className="px-4 py-3 text-white">{card.name}</td>
                    <td className="px-4 py-3">
                      <span className="rarity-badge text-[10px]" style={{
                        color: { common:'#9ca3af',uncommon:'#34d399',rare:'#60a5fa',epic:'#a78bfa',legend:'#fbbf24',secret:'#f472b6' }[card.rarity] || '#9ca3af',
                        background: `${{ common:'#9ca3af',uncommon:'#34d399',rare:'#60a5fa',epic:'#a78bfa',legend:'#fbbf24',secret:'#f472b6' }[card.rarity] || '#9ca3af'}20`,
                      }}>{card.rarity}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gold-400">฿{card.base_price}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{card.stock}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleCard(card.id, card.is_active)}
                        className={`text-xs px-3 py-1 rounded-full font-medium ${card.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {card.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Packs tab */}
      {tab === 'packs' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map(pack => (
            <div key={pack.id} className="card-dark p-4">
              <h3 className="font-semibold text-white mb-1">{pack.name}</h3>
              <p className="text-gold-400 font-bold">฿{pack.price} / {pack.cards_count} การ์ด</p>
              <p className={`text-xs mt-2 ${pack.is_active ? 'text-green-400' : 'text-gray-500'}`}>
                {pack.is_active ? '● Active' : '○ Hidden'}
              </p>
            </div>
          ))}
          <div className="card-dark p-4 flex items-center justify-center cursor-pointer hover:border-gold-500/50 border-2 border-dashed border-dark-500">
            <div className="text-center text-gray-500">
              <Plus size={24} className="mx-auto mb-2" />
              <p className="text-sm">เพิ่มแพ็คใหม่</p>
            </div>
          </div>
        </div>
      )}

      {/* Series tab */}
      {tab === 'series' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {series.map(s => (
            <div key={s.id} className="card-dark p-4">
              <h3 className="font-semibold text-white">{s.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{s.description || 'ไม่มีคำอธิบาย'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add card modal */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-dark-800 rounded-2xl p-6 max-w-md w-full border border-dark-500 my-4">
            <h2 className="font-display text-xl text-white mb-6">เพิ่มการ์ดใหม่</h2>
            <form onSubmit={addCard} className="space-y-4">
              <div><label className="text-sm text-gray-400 block mb-1.5">ชื่อการ์ด *</label>
                <input value={cardForm.name} onChange={e => setCardForm(f => ({...f, name: e.target.value}))} required className="input-dark" /></div>
              <div><label className="text-sm text-gray-400 block mb-1.5">คำอธิบาย</label>
                <textarea value={cardForm.description} onChange={e => setCardForm(f => ({...f, description: e.target.value}))} rows={2} className="input-dark resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-gray-400 block mb-1.5">Rarity *</label>
                  <select value={cardForm.rarity} onChange={e => setCardForm(f => ({...f, rarity: e.target.value}))} className="input-dark">
                    {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select></div>
                <div><label className="text-sm text-gray-400 block mb-1.5">ซีรีส์</label>
                  <select value={cardForm.series_id} onChange={e => setCardForm(f => ({...f, series_id: e.target.value}))} className="input-dark">
                    <option value="">ไม่ระบุ</option>
                    {series.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm text-gray-400 block mb-1.5">ราคา (฿) *</label>
                  <input type="number" value={cardForm.base_price} onChange={e => setCardForm(f => ({...f, base_price: e.target.value}))} required className="input-dark" /></div>
                <div><label className="text-sm text-gray-400 block mb-1.5">Stock *</label>
                  <input type="number" value={cardForm.stock} onChange={e => setCardForm(f => ({...f, stock: e.target.value}))} required className="input-dark" /></div>
              </div>
              <div><label className="text-sm text-gray-400 block mb-1.5">URL รูปภาพ</label>
                <input value={cardForm.image_url} onChange={e => setCardForm(f => ({...f, image_url: e.target.value}))} placeholder="https://..." className="input-dark" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddCard(false)} className="btn-outline flex-1">ยกเลิก</button>
                <button type="submit" className="btn-gold flex-1">เพิ่มการ์ด</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
