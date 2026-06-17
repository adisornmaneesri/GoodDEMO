'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserCard, Transaction, Profile, RARITY_CONFIG } from '@/types'
import { LayoutDashboard, Package, History, Wallet, Tag, LogOut } from 'lucide-react'
import CardItem from '@/components/cards/CardItem'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

type Tab = 'vault' | 'history' | 'topup'

export default function DashboardPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tab, setTab] = useState<Tab>('vault')
  const [topupAmount, setTopupAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [listingCard, setListingCard] = useState<UserCard | null>(null)
  const [listPrice, setListPrice] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    const [{ data: prof }, { data: cards }, { data: txns }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_cards').select('*, card:cards(*, series:card_series(*))').eq('user_id', user.id).order('obtained_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ])
    setProfile(prof)
    setUserCards(cards || [])
    setTransactions(txns || [])
    setLoading(false)
  }

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount)
    if (!amount || amount < 10) { toast.error('จำนวนขั้นต่ำ 10 บาท'); return }
    toast.success(`เติมเงิน ฿${amount} (Demo — ต่อ Omise จริงได้เลย)`)
    // In production: call Omise API here
    setTopupAmount('')
  }

  const listForSale = async () => {
    if (!listingCard || !listPrice) return
    const price = parseFloat(listPrice)
    if (price < 1) { toast.error('ราคาต้องมากกว่า 0'); return }

    const res = await fetch('/api/marketplace/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_card_id: listingCard.id, price }),
    })
    const data = await res.json()
    if (res.ok) {
      toast.success('ลิสต์ขายสำเร็จ!')
      setListingCard(null)
      setListPrice('')
      fetchData()
    } else {
      toast.error(data.error || 'ไม่สำเร็จ')
    }
  }

  const TABS = [
    { id: 'vault',   label: 'คลังการ์ด', icon: Package },
    { id: 'history', label: 'ประวัติ',    icon: History },
    { id: 'topup',   label: 'เติมเงิน',   icon: Wallet },
  ] as const

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-gold-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-500/20 flex items-center justify-center">
            <LayoutDashboard size={28} className="text-gold-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-white">{profile?.username}</h1>
            <p className="text-gold-400 font-semibold">฿{profile?.wallet.toLocaleString()} ในกระเป๋า</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Package size={16} /> {userCards.length} การ์ด
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-dark-700 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-gold-500 text-dark-900' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Vault */}
      {tab === 'vault' && (
        <>
          {userCards.length === 0 ? (
            <div className="text-center py-20 card-dark text-gray-500">
              <Package size={48} className="mx-auto mb-4 opacity-30" />
              <p>ยังไม่มีการ์ดในคลัง ลองสุ่มแพ็คดูสิ!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {userCards.map(uc => (
                <div key={uc.id} className="group relative">
                  {uc.card && <CardItem card={uc.card} size="md" />}
                  <button
                    onClick={() => { setListingCard(uc); setListPrice('') }}
                    className="absolute bottom-2 left-0 right-0 mx-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="btn-outline text-xs py-1 w-full flex items-center justify-center gap-1">
                      <Tag size={12} /> ลิสต์ขาย
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="card-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-dark-600 text-gray-400">
              <tr>
                <th className="text-left px-4 py-3">ประเภท</th>
                <th className="text-left px-4 py-3">หมายเหตุ</th>
                <th className="text-right px-4 py-3">จำนวน</th>
                <th className="text-right px-4 py-3">วันที่</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.id} className="border-t border-dark-500 hover:bg-dark-600 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`rarity-badge ${txn.amount > 0 ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300">{txn.note || '-'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${txn.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.amount > 0 ? '+' : ''}฿{txn.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {format(new Date(txn.created_at), 'dd MMM', { locale: th })}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="text-center py-12 text-gray-500">ยังไม่มีประวัติ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Top-up */}
      {tab === 'topup' && (
        <div className="max-w-md">
          <div className="card-dark p-6">
            <h2 className="font-display text-xl text-white mb-6">เติมเครดิต</h2>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[100, 300, 500, 1000, 2000, 5000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(String(amt))}
                  className={`py-3 rounded-lg text-sm font-semibold border transition-all ${
                    topupAmount === String(amt) ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-dark-500 text-gray-400 hover:border-gold-500/50'
                  }`}
                >
                  ฿{amt.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">หรือกรอกจำนวนเอง (บาท)</label>
              <input
                type="number"
                value={topupAmount}
                onChange={e => setTopupAmount(e.target.value)}
                placeholder="ระบุจำนวน"
                className="input-dark"
              />
            </div>
            <button onClick={handleTopup} className="btn-gold w-full">
              เติมเงิน {topupAmount ? `฿${parseFloat(topupAmount).toLocaleString()}` : ''}
            </button>
            <p className="text-xs text-gray-500 mt-3 text-center">ชำระผ่าน PromptPay / บัตรเครดิต (Omise)</p>
          </div>
        </div>
      )}

      {/* List for sale modal */}
      {listingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-800 rounded-2xl p-6 max-w-sm w-full border border-dark-500">
            <h2 className="font-display text-xl text-white mb-4">ลิสต์ขายการ์ด</h2>
            {listingCard.card && (
              <div className="flex justify-center mb-4">
                <CardItem card={listingCard.card} size="md" />
              </div>
            )}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">ราคาขาย (฿)</label>
              <input
                type="number"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
                placeholder="ระบุราคา"
                className="input-dark"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setListingCard(null)} className="btn-outline flex-1">ยกเลิก</button>
              <button onClick={listForSale} className="btn-gold flex-1">ยืนยันลิสต์ขาย</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
