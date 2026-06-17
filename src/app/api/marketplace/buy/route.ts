import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listing_id } = await req.json()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, card:cards(*)')
    .eq('id', listing_id)
    .eq('status', 'active')
    .single()

  if (!listing) return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 })
  if (listing.seller_id === user.id) return NextResponse.json({ error: 'ไม่สามารถซื้อของตัวเองได้' }, { status: 400 })

  // Check buyer wallet
  const { data: buyer } = await supabase.from('profiles').select('wallet').eq('id', user.id).single()
  if (!buyer || buyer.wallet < listing.price) return NextResponse.json({ error: 'ยอดเงินไม่พอ' }, { status: 400 })

  // Deduct buyer wallet
  await supabase.from('profiles').update({ wallet: buyer.wallet - listing.price }).eq('id', user.id)

  // Add to seller wallet
  const { data: seller } = await supabase.from('profiles').select('wallet').eq('id', listing.seller_id).single()
  if (seller) {
    await supabase.from('profiles').update({ wallet: seller.wallet + listing.price }).eq('id', listing.seller_id)
  }

  // Transfer card ownership
  await supabase.from('user_cards').update({ user_id: user.id, source: 'marketplace' }).eq('id', listing.user_card_id)

  // Mark listing as sold
  await supabase.from('listings').update({ status: 'sold' }).eq('id', listing_id)

  // Transactions
  await supabase.from('transactions').insert([
    { user_id: user.id, type: 'purchase', amount: -listing.price, ref_id: listing_id, note: `ซื้อ: ${listing.card?.name}` },
    { user_id: listing.seller_id, type: 'sale', amount: listing.price, ref_id: listing_id, note: `ขาย: ${listing.card?.name}` },
  ])

  return NextResponse.json({ success: true })
}
