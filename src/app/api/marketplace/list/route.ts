import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { user_card_id, price } = await req.json()

  // Verify ownership
  const { data: uc } = await supabase
    .from('user_cards')
    .select('*, card:cards(*)')
    .eq('id', user_card_id)
    .eq('user_id', user.id)
    .single()

  if (!uc) return NextResponse.json({ error: 'ไม่พบการ์ดนี้ในคลังของคุณ' }, { status: 404 })

  // Check not already listed
  const { data: existing } = await supabase
    .from('listings')
    .select('id')
    .eq('user_card_id', user_card_id)
    .eq('status', 'active')
    .single()

  if (existing) return NextResponse.json({ error: 'การ์ดนี้ถูกลิสต์ขายอยู่แล้ว' }, { status: 400 })

  await supabase.from('listings').insert({
    seller_id: user.id,
    user_card_id,
    card_id: uc.card_id,
    price,
  })

  return NextResponse.json({ success: true })
}
