'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo, useMotionValue } from 'framer-motion'
import { Card, RARITY_CONFIG } from '@/types'

interface PackOpeningSceneProps {
  packImageUrl: string | null
  packName: string
  cards: Card[]
  onClose: () => void
}

type Phase = 'select' | 'cutting' | 'cards'

/**
 * Full-screen pack opening experience:
 *  1. select  — three packs shown in 3D perspective (left / center / right), pick the center one
 *  2. cutting — swipe-up "cut" gesture slices the pack open with a flash + rainbow burst
 *  3. cards   — cards are revealed one at a time, swipe left/right to flip through them
 */
export default function PackOpeningScene({ packImageUrl, packName, cards, onClose }: PackOpeningSceneProps) {
  const [phase, setPhase] = useState<Phase>('select')
  const [cardIdx, setCardIdx] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const dragY = useMotionValue(0)
  const guideTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (phase === 'select') {
      guideTimer.current = setTimeout(() => setShowGuide(true), 1600)
    }
    return () => { if (guideTimer.current) clearTimeout(guideTimer.current) }
  }, [phase])

  const handlePackDrag = (_: any, info: PanInfo) => {
    if (phase !== 'select') return
    if (info.offset.y < -60 && Math.abs(info.offset.x) < 80) {
      setPhase('cutting')
    }
  }

  const handleCutComplete = () => setPhase('cards')

  const isLastCard = cardIdx >= cards.length - 1
  const currentCard = cards[cardIdx]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" style={{ background: 'linear-gradient(180deg,#dbeafe 0%,#f0f7ff 45%,#ffffff 100%)' }}>

      {/* skip button always available */}
      {phase !== 'cards' && (
        <button
          onClick={() => setPhase('cards')}
          className="absolute top-6 right-6 z-30 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 text-black/50 hover:text-black/80 flex items-center justify-center text-lg transition-colors"
        >
          ⏭
        </button>
      )}

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div
            key="select"
            className="absolute inset-0 flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
          >
            <div className="text-center mb-10 px-6">
              <p className="text-black/40 text-sm tracking-widest uppercase mb-1">เลือกซองการ์ด</p>
              <h2 className="font-display text-2xl text-black/80">{packName}</h2>
            </div>

            <div className="relative flex items-center justify-center" style={{ perspective: 900 }}>
              {/* floor reflection */}
              <motion.div
                className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[220px] pointer-events-none"
                initial={{ opacity: 0, scaleY: 0.3 }}
                animate={{ opacity: 0.3, scaleY: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                style={{
                  transform: 'scaleY(-1)',
                  maskImage: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 70%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,.35) 0%, transparent 70%)',
                  filter: 'blur(3px)',
                }}
              >
                <PackArt url={packImageUrl} className="w-full" />
              </motion.div>

              {/* left ghost pack */}
              <motion.div
                className="absolute"
                style={{ right: 'calc(50% + 70px)', transformOrigin: 'right center' }}
                initial={{ opacity: 0, rotateY: 0, scale: 0.8 }}
                animate={{ opacity: 0.45, rotateY: 30, scale: 0.78 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <PackArt url={packImageUrl} className="w-[110px]" shadow />
              </motion.div>

              {/* right ghost pack */}
              <motion.div
                className="absolute"
                style={{ left: 'calc(50% + 70px)', transformOrigin: 'left center' }}
                initial={{ opacity: 0, rotateY: 0, scale: 0.8 }}
                animate={{ opacity: 0.45, rotateY: -30, scale: 0.78 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <PackArt url={packImageUrl} className="w-[110px]" shadow />
              </motion.div>

              {/* center pack — draggable */}
              <motion.div
                className="relative z-10 cursor-grab active:cursor-grabbing touch-none"
                initial={{ y: 140, scale: 0.6, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 18 }}
                drag="y"
                dragConstraints={{ top: -120, bottom: 30 }}
                dragElastic={0.3}
                style={{ y: dragY }}
                onDragEnd={handlePackDrag}
              >
                {/* glow aura */}
                <motion.div
                  className="absolute -inset-8 rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(212,160,23,.25) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [-1, 1, -1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <PackArt url={packImageUrl} className="w-[190px] relative z-10" shine seal />
                </motion.div>
              </motion.div>
            </div>

            {/* cut guide hint */}
            <AnimatePresence>
              {showGuide && (
                <motion.div
                  className="mt-8 text-center pointer-events-none"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="text-2xl text-amber-500 mb-1"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    ↑
                  </motion.div>
                  <p className="text-amber-600 font-semibold text-sm" style={{ textShadow: '0 0 10px rgba(212,160,23,.4)' }}>
                    รูดขึ้นเพื่อเปิดซอง
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {phase === 'cutting' && (
          <CuttingPhase key="cutting" packImageUrl={packImageUrl} onComplete={handleCutComplete} />
        )}

        {phase === 'cards' && (
          <motion.div
            key="cards"
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* "Got it!" label */}
            <motion.div
              key={`gotit-${cardIdx}`}
              className="absolute top-[8%] left-[6%] z-20 font-display font-black text-black/85 pointer-events-none"
              style={{ fontSize: 'clamp(28px,8vw,44px)', textShadow: '0 2px 12px rgba(255,255,255,.8)' }}
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              Got it!
            </motion.div>

            {/* counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/10 backdrop-blur-sm rounded-full px-4 py-1 text-sm font-semibold text-black/60">
              {cardIdx + 1} / {cards.length}
            </div>

            {/* card viewport */}
            <CardSwiper
              cards={cards}
              index={cardIdx}
              onIndexChange={setCardIdx}
            />

            {/* swipe hint */}
            {cardIdx === 0 && (
              <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 text-sm text-black/50 bg-white/60 backdrop-blur-sm rounded-full px-5 py-2"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 2.5, duration: 1 }}
              >
                <span>←</span> รูดดูการ์ดถัดไป <span>→</span>
              </motion.div>
            )}

            {/* collect button */}
            <AnimatePresence>
              {isLastCard && (
                <motion.button
                  className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 font-display font-bold tracking-wide text-dark-900 px-11 py-3.5 rounded-full bg-gold-gradient shadow-lg"
                  initial={{ scale: 0, x: '-50%' }}
                  animate={{ scale: 1, x: '-50%' }}
                  exit={{ scale: 0, x: '-50%' }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={onClose}
                >
                  ✓ เก็บการ์ดทั้งหมด
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ───────────────────────────── Pack artwork ───────────────────────────── */

function PackArt({
  url, className = '', shine = false, seal = false, shadow = false,
}: { url: string | null; className?: string; shine?: boolean; seal?: boolean; shadow?: boolean }) {
  return (
    <div className={`relative ${className}`} style={shadow ? { filter: 'drop-shadow(0 10px 20px rgba(0,0,0,.25))' } : { filter: 'drop-shadow(0 24px 48px rgba(0,0,0,.35))' }}>
      {url ? (
        <img src={url} alt="pack" className="w-full block select-none" draggable={false} />
      ) : (
        <div className="w-full aspect-[2/3] rounded-lg bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-5xl">🃏</div>
      )}
      {shine && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(115deg, transparent 25%, rgba(255,255,255,.35) 48%, rgba(255,255,255,.2) 52%, transparent 75%)',
            backgroundSize: '250% 250%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 3, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      )}
      {seal && (
        <motion.div
          className="absolute top-[2%] left-[8%] right-[8%] h-[8px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(80,210,255,.9), rgba(200,150,255,.9), transparent)',
            backgroundSize: '200% auto',
          }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}

/* ───────────────────────────── Cutting phase ───────────────────────────── */

function CuttingPhase({ packImageUrl, onComplete }: { packImageUrl: string | null; onComplete: () => void }) {
  const [slashesVisible, setSlashesVisible] = useState(0)
  const [flash, setFlash] = useState(0)
  const [split, setSplit] = useState(false)
  const [burst, setBurst] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSlashesVisible(1), 0)
    const t2 = setTimeout(() => setSlashesVisible(2), 90)
    const t3 = setTimeout(() => setSlashesVisible(3), 180)
    const t4 = setTimeout(() => setSlashesVisible(4), 270)
    const tFlash1 = setTimeout(() => setFlash(1), 260)
    const tFlash0 = setTimeout(() => setFlash(0), 480)
    const tSplit = setTimeout(() => { setSplit(true); setBurst(true) }, 420)
    const tDone = setTimeout(onComplete, 1500)
    return () => { [t1,t2,t3,t4,tFlash1,tFlash0,tSplit,tDone].forEach(clearTimeout) }
  }, [onComplete])

  const slashAngles = [-2, 1, -1, 3]
  const burstColors = ['#ff6bae', '#ffb347', '#ffff99', '#7fff00', '#00cfff', '#a06fff', '#ff6bae', '#ffb347']

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* white flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none z-30"
        animate={{ opacity: flash ? 0.9 : 0 }}
        transition={{ duration: 0.18 }}
      />

      {/* slash lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ mixBlendMode: 'screen' }}>
        {slashAngles.map((angle, i) => (
          <motion.line
            key={i}
            x1="10%" y1={`${48 + i}%`}
            x2="90%" y2={`${48 + i + angle}%`}
            stroke="white"
            strokeWidth={3 - i * 0.4}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(200,220,255,.9))' }}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={slashesVisible > i ? { pathLength: 1, opacity: [0, 1, 0] } : {}}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        ))}
      </svg>

      {/* pack split halves */}
      <div className="relative w-[190px] z-10">
        <motion.div
          className="absolute left-0 right-0 top-0 overflow-hidden"
          style={{ height: '14%' }}
          animate={split ? { y: -140, rotate: -8 } : { y: 0, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <img src={packImageUrl || ''} alt="" className="w-full block" />
        </motion.div>
        <motion.div
          className="absolute left-0 right-0 overflow-hidden"
          style={{ top: '14%', bottom: 0 }}
          animate={split ? { y: 36, scale: 0.95, rotate: 2 } : { y: 0, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <img src={packImageUrl || ''} alt="" className="w-full block" style={{ marginTop: '-14%' }} />
        </motion.div>

        {/* rainbow burst lines from the cut */}
        {burst && (
          <div className="absolute left-0 right-0 pointer-events-none" style={{ top: '14%' }}>
            {burstColors.map((color, i) => {
              const angle = -60 + i * 17
              return (
                <motion.div
                  key={i}
                  className="absolute left-0 right-0 h-[2px] origin-center"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                  initial={{ rotate: angle, scaleX: 0, opacity: 1 }}
                  animate={{ rotate: angle, scaleX: 2.4, opacity: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
                />
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ───────────────────────────── Card swiper ───────────────────────────── */

function CardSwiper({
  cards, index, onIndexChange,
}: { cards: Card[]; index: number; onIndexChange: (i: number) => void }) {
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 90
    if (info.offset.x < -threshold && index < cards.length - 1) {
      onIndexChange(index + 1)
    } else if (info.offset.x > threshold && index > 0) {
      onIndexChange(index - 1)
    }
  }

  const card = cards[index]
  const rarity = RARITY_CONFIG[card.rarity]
  const isLegendary = card.rarity === 'legend' || card.rarity === 'secret'

  return (
    <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          className="flex flex-col items-center px-8 cursor-grab active:cursor-grabbing touch-none"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.4, rotateY: -110, opacity: 0, filter: 'brightness(3)' }}
          animate={{ scale: 1, rotateY: 0, opacity: 1, filter: 'brightness(1)' }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        >
          {/* holo border wrapper for legendary/secret */}
          <div
            className="relative rounded-2xl p-[3px]"
            style={{
              border: `3px solid ${rarity.color}`,
              boxShadow: `0 0 40px ${rarity.glow}, 0 20px 60px rgba(0,0,0,.25)`,
            }}
          >
            {isLegendary && (
              <motion.div
                className="absolute -inset-1 rounded-2xl pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, #ff6bae 10%, #ffb347 20%, #ffff99 30%, #7fff00 40%, #00cfff 50%, #a06fff 60%, #ff6bae 70%, #ffb347 80%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  WebkitMask: 'linear-gradient(black,black) content-box, linear-gradient(black,black)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  padding: 3,
                }}
                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}

            <div
              className="relative rounded-xl overflow-hidden"
              style={{ width: 'min(260px,72vw)', aspectRatio: '2/3', background: `linear-gradient(160deg, ${rarity.color}33, #060410)` }}
            >
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl font-black text-white/10">
                  {card.name?.[0] || '?'}
                </div>
              )}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.2) 0%, transparent 40%)' }}
              />
              {isLegendary && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 60px ${rarity.glow}` }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
            </div>
          </div>

          {/* label */}
          <div className="mt-4 text-center">
            <span
              className="inline-block text-[11px] font-bold px-3 py-1 rounded-lg mb-1.5"
              style={{ color: rarity.color, background: `${rarity.color}22`, border: `1px solid ${rarity.color}` }}
            >
              {rarity.label.toUpperCase()}
            </span>
            <h3 className="font-display text-xl font-bold text-black/85">{card.name}</h3>
            {card.description && (
              <p className="text-sm text-black/45 mt-1 max-w-[260px]">{card.description}</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
