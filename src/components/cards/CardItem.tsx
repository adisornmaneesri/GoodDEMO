'use client'
import Image from 'next/image'
import { Card, RARITY_CONFIG } from '@/types'

interface CardProps {
  card: Card
  onClick?: () => void
  showPrice?: boolean
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export default function CardItem({ card, onClick, showPrice = false, size = 'md', animate = false }: CardProps) {
  const rarity = RARITY_CONFIG[card.rarity]

  const sizeClass = {
    sm: 'w-24 h-36',
    md: 'w-36 h-52',
    lg: 'w-48 h-72',
  }[size]

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border-2 overflow-hidden cursor-pointer card-hover
        rarity-${card.rarity} bg-card-gradient
        ${sizeClass}
        ${animate ? 'animate-float' : ''}
        ${onClick ? 'hover:scale-105' : ''}
      `}
      style={{ borderColor: rarity.color }}
    >
      {/* Card image */}
      <div className="relative w-full h-3/4">
        {card.image_url ? (
          <Image src={card.image_url} alt={card.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
               style={{ background: `${rarity.color}20` }}>
            <span className="text-4xl">🃏</span>
          </div>
        )}
        {/* Rarity shine overlay for legend/secret */}
        {(card.rarity === 'legend' || card.rarity === 'secret') && (
          <div className="absolute inset-0 bg-shimmer-gradient animate-shimmer opacity-50" />
        )}
      </div>

      {/* Card info */}
      <div className="p-2">
        <p className="text-white text-xs font-semibold truncate">{card.name}</p>
        <div className="flex items-center justify-between mt-0.5">
          <span className="rarity-badge text-[10px]" style={{ color: rarity.color, background: `${rarity.color}20` }}>
            {rarity.label}
          </span>
          {showPrice && (
            <span className="text-gold-400 text-xs font-semibold">฿{card.base_price}</span>
          )}
        </div>
      </div>
    </div>
  )
}
