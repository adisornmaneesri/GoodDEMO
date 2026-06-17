import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { auction_id, amount } = await req.json()

  // Get auction
  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auction_id)
    .eq('status', 'active')
    .single()

  if (!auction) return NextResponse.json({ error: 'ไม่พบการประมูลนี้หรือสิ้นสุดแล้ว' }, { status: 404 })
  if (auction.seller_id === user.id) return NextResponse.json({ error: 'ไม่สามารถประมูลของตัวเองได้' }, { status: 400 })

  const minBid = auction.current_price + auction.min_increment
  if (amount < minBid) return NextResponse.json({ error: `ราคาต่ำสุดคือ ฿${minBid}` }, { status: 400 })

  // Check wallet
  const { data: profile } = await supabase.from('profiles').select('wallet').eq('id', user.id).single()
  if (!profile || profile.wallet < amount) return NextResponse.json({ error: 'ยอดเงินไม่พอ' }, { status: 400 })

  // Place bid
  await supabase.from('auction_bids').insert({ auction_id, user_id: user.id, amount })

  // Update auction current price
  const updateData: any = { current_price: amount, winner_id: user.id }

  // Check if buyout
  if (auction.buyout_price && amount >= auction.buyout_price) {
    updateData.status = 'ended'
    updateData.current_price = auction.buyout_price
  }

  await supabase.from('auctions').update(updateData).eq('id', auction_id)

  return NextResponse.json({ success: true })
}
