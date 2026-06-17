import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { pack_id } = await req.json()

  // Get pack info
  const { data: pack } = await supabase
    .from('packs')
    .select('*, rarities:pack_rarities(*)')
    .eq('id', pack_id)
    .eq('is_active', true)
    .single()

  if (!pack) return NextResponse.json({ error: 'ไม่พบแพ็คนี้' }, { status: 404 })

  // Check user wallet
  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet')
    .eq('id', user.id)
    .single()

  if (!profile || profile.wallet < pack.price)
    return NextResponse.json({ error: 'ยอดเงินไม่พอ' }, { status: 400 })

  // Roll cards using weighted rarity
  const rarityRates = pack.rarities as { rarity: string; rate: number }[]
  const drawnCards: any[] = []

  for (let i = 0; i < pack.cards_count; i++) {
    const rarity = rollRarity(rarityRates)

    const { data: candidates } = await supabase
      .from('cards')
      .select('*')
      .eq('rarity', rarity)
      .eq('is_active', true)

    if (!candidates || candidates.length === 0) continue

    const card = candidates[Math.floor(Math.random() * candidates.length)]
    drawnCards.push(card)
  }

  // Deduct wallet
  await supabase.from('profiles').update({ wallet: profile.wallet - pack.price }).eq('id', user.id)

  // Save pack open record
  await supabase.from('pack_opens').insert({
    user_id: user.id,
    pack_id: pack.id,
    cards_got: drawnCards.map(c => c.id),
  })

  // Add cards to user vault
  const userCards = drawnCards.map(card => ({
    user_id: user.id,
    card_id: card.id,
    source: 'pack',
  }))
  await supabase.from('user_cards').insert(userCards)

  // Record transaction
  await supabase.from('transactions').insert({
    user_id: user.id,
    type: 'purchase',
    amount: -pack.price,
    ref_id: pack.id,
    note: `เปิดแพ็ค: ${pack.name}`,
  })

  return NextResponse.json({ cards: drawnCards })
}

function rollRarity(rates: { rarity: string; rate: number }[]): string {
  const roll = Math.random() * 100
  let cumulative = 0
  for (const { rarity, rate } of rates) {
    cumulative += rate
    if (roll < cumulative) return rarity
  }
  return rates[0]?.rarity || 'common'
}
