'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { NavBar } from '@/components/common/NavBar'
import { RecordModal } from '@/components/river/RecordModal'
import type { MemoryRecord, BaziResult } from '@/types'
import toast from 'react-hot-toast'

// ── Demo data ─────────────────────────────────────────────────
const DEMO_RECORDS: MemoryRecord[] = [
  {
    id: '1', owner: 'demo', type: 'text',
    title: '首次同频相遇',
    preview: '在黑客松现场第一次见到了真正同频的人。我们的对话不需要铺垫，直接进入彼此的内心世界。那种感觉很奇妙，仿佛命中注定的相遇。',
    arweave_cid: 'ar://abc1', solana_tx_hash: 'Ax7Kp9mN',
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(), encrypted: false, is_nft: false,
  },
  {
    id: '2', owner: 'demo', type: 'text',
    title: '乙木觉察',
    preview: '意识到自己在逆境中的成长模式——不是硬撑，而是用柔软的方式找到缝隙，然后生长。这就是乙木的智慧。',
    arweave_cid: 'ar://abc2', solana_tx_hash: 'Bz3Lm4kR',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(), encrypted: true, is_nft: false,
  },
  {
    id: '3', owner: 'demo', type: 'image',
    title: '城市日落',
    preview: '拍下了今天的日落。橙色的光把整个城市染成了一幅画，天边的云彩像是被什么巨大的力量揉碎再重新排列。',
    arweave_cid: 'ar://abc3', solana_tx_hash: 'Cw9Jq2pS',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(), encrypted: false, is_nft: true,
  },
  {
    id: '4', owner: 'demo', type: 'text',
    title: '断夜的平静',
    preview: '今天做了一个很小的决定：不再在深夜刷手机。第一天，出奇的平静。早早入睡，梦里好像回到了小时候住过的那条老街。',
    arweave_cid: 'ar://abc4', solana_tx_hash: 'pending',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(), encrypted: false, is_nft: false,
  },
  {
    id: '5', owner: 'demo', type: 'audio',
    title: '和妈妈的通话',
    preview: '和妈妈打了一个小时的电话，聊了很多从前从未说过的话。原来我们都在等对方先开口。',
    arweave_cid: 'ar://abc5', solana_tx_hash: 'Dv5Nt7hW',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(), encrypted: true, is_nft: false,
  },
  {
    id: '6', owner: 'demo', type: 'text',
    title: '清晨六点',
    preview: '早晨六点，在楼顶看到了难得的晴天。城市还没完全醒来，只有远处偶尔驶过的车和鸟叫声。这样的清晨，安静得像是世界只属于我一个人。',
    arweave_cid: 'ar://abc6', solana_tx_hash: 'Ek2Mv3xC',
    created_at: new Date().toISOString(), encrypted: false, is_nft: false,
  },
]

// ── Bubble visual config ────────────────────────────────────────
const BUBBLE_CFG: Record<string, { size: number; icon: string; color: string; glow: string }> = {
  text:  { size: 100, icon: '✍️', color: '#60a5fa', glow: 'rgba(96,165,250,0.45)'  },
  image: { size: 120, icon: '🖼️', color: '#c084fc', glow: 'rgba(192,132,252,0.45)' },
  audio: { size: 92,  icon: '🎵', color: '#34d399', glow: 'rgba(52,211,153,0.45)'  },
  video: { size: 108, icon: '🎬', color: '#fb923c', glow: 'rgba(251,146,60,0.45)'  },
  file:  { size: 80,  icon: '📎', color: '#fbbf24', glow: 'rgba(251,191,36,0.45)'  },
}

// ── Deterministic star data ─────────────────────────────────────
const STARS = Array.from({ length: 170 }, (_, i) => ({
  x: ((i * 7919) % 9973) / 9973 * 100,
  y: ((i * 6271) % 8191) / 8191 * 72,
  r: ((i * 3571) % 130) / 100 + 0.3,
  opacity: ((i * 2017) % 60) / 100 + 0.15,
  dur: ((i * 1327) % 38) / 10 + 2.2,
  delay: ((i * 811) % 30) / 10,
  blue: i % 7 === 0,
}))

// ── Wave path generator ─────────────────────────────────────────
function makeWavePath(W: number, H: number, amplitude: number, yBase: number): string {
  const cycles = 3
  const halfPeriod = W / (cycles * 2)
  let d = `M 0 ${yBase}`
  for (let i = 0; i < cycles * 2; i++) {
    const x0 = i * halfPeriod
    const x2 = (i + 1) * halfPeriod
    const dir = i % 2 === 0 ? -1 : 1
    d += ` C ${x0 + halfPeriod * 0.28} ${yBase + dir * amplitude * 1.5},`
    d += `${x0 + halfPeriod * 0.72} ${yBase + dir * amplitude * 1.5},`
    d += `${x2} ${yBase}`
  }
  d += ` L ${W} ${H} L 0 ${H} Z`
  return d
}

// ── Star Background ─────────────────────────────────────────────
function StarBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {STARS.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.r * 2,
            height: s.r * 2,
            borderRadius: '50%',
            background: s.blue ? '#a8d8ff' : '#ffffff',
            boxShadow: s.r > 1 ? `0 0 ${s.r * 3}px ${s.blue ? '#60a5fa' : '#ffffff'}66` : 'none',
          }}
          animate={{ opacity: [s.opacity, s.opacity * 0.25, s.opacity] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </div>
  )
}

// ── Wave Layer ──────────────────────────────────────────────────
interface WaveLayerProps {
  fill: string
  opacity: number
  amplitude: number
  speed: number
  bottom: number
  height: number
}

function WaveLayer({ fill, opacity, amplitude, speed, bottom, height }: WaveLayerProps) {
  const path = useMemo(() => makeWavePath(1440, height, amplitude, amplitude + 24), [amplitude, height])
  return (
    <div style={{
      position: 'absolute', bottom, left: 0, right: 0,
      height, overflow: 'hidden', pointerEvents: 'none',
    }}>
      <motion.div
        style={{ position: 'absolute', display: 'flex', width: '200%', height: '100%' }}
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
      >
        {[0, 1].map(k => (
          <svg key={k} style={{ flex: '0 0 50%', height: '100%' }} viewBox={`0 0 1440 ${height}`}
            preserveAspectRatio="none">
            <path d={path} fill={fill} opacity={opacity} />
          </svg>
        ))}
      </motion.div>
    </div>
  )
}

// ── River shimmer sparkles ──────────────────────────────────────
const SPARKLES = Array.from({ length: 18 }, (_, i) => ({
  x: ((i * 3541) % 97) / 97 * 90 + 5, // 5-95% of width
  dur: ((i * 2213) % 25) / 10 + 1.8,
  delay: ((i * 1451) % 30) / 10,
  size: ((i * 1873) % 6) / 10 + 0.8,
}))

function RiverSparkles({ bottom }: { bottom: number }) {
  return (
    <div style={{ position: 'absolute', bottom: bottom + 10, left: 0, right: 0, height: 60, pointerEvents: 'none' }}>
      {SPARKLES.map((s, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: '50%',
            width: s.size * 2,
            height: s.size * 2,
            borderRadius: '50%',
            background: '#ffffff',
          }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1.4, 0] }}
          transition={{ duration: s.dur, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
        />
      ))}
    </div>
  )
}

// ── Memory Bubble ───────────────────────────────────────────────
function MemoryBubble({ record, index, onClick }: {
  record: MemoryRecord
  index: number
  onClick: (r: MemoryRecord) => void
}) {
  const cfg = BUBBLE_CFG[record.type] ?? BUBBLE_CFG.text
  const [hovered, setHovered] = useState(false)
  const [ripple, setRipple] = useState(false)
  const floatDur = 4.2 + (index * 0.71) % 2.2
  const floatDelay = (index * 0.55) % 2.5

  const handleClick = () => {
    setRipple(true)
    setTimeout(() => setRipple(false), 700)
    onClick(record)
  }

  const dateLabel = (() => {
    const diff = Date.now() - new Date(record.created_at).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7)  return `${days}天前`
    return new Date(record.created_at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  })()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 200, damping: 18 }}
      style={{ position: 'relative', flexShrink: 0, margin: '0 20px', cursor: 'pointer' }}
    >
      {/* Float animation wrapper */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: floatDur, repeat: Infinity, ease: 'easeInOut', delay: floatDelay }}
      >
        {/* Ripple ring */}
        <AnimatePresence>
          {ripple && (
            <motion.div
              style={{
                position: 'absolute',
                inset: -12,
                borderRadius: '50%',
                border: `2px solid ${cfg.color}`,
                pointerEvents: 'none',
              }}
              initial={{ scale: 0.8, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>

        {/* Main bubble */}
        <motion.div
          onClick={handleClick}
          onHoverStart={() => setHovered(true)}
          onHoverEnd={() => setHovered(false)}
          animate={{
            scale: hovered ? 1.12 : 1,
            boxShadow: hovered
              ? `0 0 32px ${cfg.glow}, 0 0 60px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`
              : `0 0 16px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.12)`,
          }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          style={{
            width: cfg.size,
            height: cfg.size,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.055)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1.5px solid ${cfg.color}55`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Inner radial light */}
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle at 38% 32%, ${cfg.color}22, transparent 65%)`,
            pointerEvents: 'none',
          }} />

          {/* Icon */}
          <span style={{ fontSize: cfg.size > 100 ? 28 : 22, lineHeight: 1 }}>{cfg.icon}</span>

          {/* Title text */}
          {record.title && (
            <span style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.82)',
              fontWeight: 500,
              textAlign: 'center',
              maxWidth: cfg.size - 16,
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              padding: '0 8px',
            }}>
              {record.title}
            </span>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', gap: 3, position: 'absolute', top: 8, right: 8 }}>
            {record.is_nft && (
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: 'rgba(251,191,36,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 7, fontWeight: 700,
              }}>N</div>
            )}
            {record.encrypted && (
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: 'rgba(168,85,247,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8,
              }}>🔐</div>
            )}
          </div>

          {/* Solana dot */}
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            width: 5, height: 5, borderRadius: '50%',
            background: record.solana_tx_hash && record.solana_tx_hash !== 'pending' ? '#22c55e' : '#666',
            boxShadow: record.solana_tx_hash && record.solana_tx_hash !== 'pending'
              ? '0 0 6px #22c55e' : 'none',
          }} />
        </motion.div>

        {/* Date label below bubble */}
        <div style={{
          textAlign: 'center', marginTop: 10,
          fontSize: 10, color: 'rgba(255,255,255,0.35)',
          fontWeight: 500, letterSpacing: '0.04em',
        }}>
          {dateLabel}
        </div>
      </motion.div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute',
              bottom: '110%',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10,15,26,0.92)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${cfg.color}44`,
              borderRadius: 12,
              padding: '10px 14px',
              width: 200,
              pointerEvents: 'none',
              zIndex: 20,
              boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${cfg.glow}`,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: cfg.color, marginBottom: 4 }}>
              {record.title ?? '记忆'}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {record.encrypted && !record.decrypted_content ? '🔐 加密内容' : record.preview}
            </div>
            {/* Arrow */}
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              width: 10, height: 6,
              background: `rgba(10,15,26,0.92)`,
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
              border: `1px solid ${cfg.color}44`,
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Timeline ────────────────────────────────────────────────────
function Timeline({ records, onBubbleClick }: {
  records: MemoryRecord[]
  onBubbleClick: (r: MemoryRecord) => void
}) {
  const sorted = useMemo(() =>
    [...records].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  [records])

  const scrollRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0 })

  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = { active: true, startX: e.clientX, scrollLeft: scrollRef.current?.scrollLeft ?? 0 }
    if (scrollRef.current) scrollRef.current.style.cursor = 'grabbing'
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current.active || !scrollRef.current) return
    e.preventDefault()
    scrollRef.current.scrollLeft = drag.current.scrollLeft - (e.clientX - drag.current.startX)
  }
  const onMouseUp = () => {
    drag.current.active = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          overflowX: 'auto',
          overflowY: 'visible',
          scrollbarWidth: 'none',
          paddingInline: 60,
          paddingTop: 24,
          paddingBottom: 40,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0,
          cursor: 'grab',
          userSelect: 'none',
        }}
        className="hide-scrollbar"
      >
        {/* Time axis line */}
        <div style={{
          position: 'absolute',
          top: '55%',
          left: 60,
          right: 60,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(96,165,250,0.15) 10%, rgba(96,165,250,0.3) 50%, rgba(96,165,250,0.15) 90%, transparent)',
          pointerEvents: 'none',
        }} />

        {/* Past label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            flexShrink: 0, fontSize: 11, color: 'rgba(255,255,255,0.22)',
            letterSpacing: '0.1em', fontWeight: 400, marginRight: 24,
            alignSelf: 'center', paddingBottom: 24,
          }}
        >
          过去
        </motion.div>

        {sorted.map((rec, i) => (
          <MemoryBubble key={rec.id} record={rec} index={i} onClick={onBubbleClick} />
        ))}

        {/* Future label + new bubble placeholder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          style={{ flexShrink: 0, marginLeft: 24, alignSelf: 'center', paddingBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em' }}>
            未来 →
          </div>
        </motion.div>
      </div>

      {/* Left fade mask */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 80,
        background: 'linear-gradient(to right, #0a0f1a, transparent)',
        pointerEvents: 'none',
      }} />
      {/* Right fade mask */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 80,
        background: 'linear-gradient(to left, #0a0f1a, transparent)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Record Detail Modal (inline dark) ──────────────────────────
function RecordDetailModal({ record, onClose }: { record: MemoryRecord; onClose: () => void }) {
  const cfg = BUBBLE_CFG[record.type] ?? BUBBLE_CFG.text
  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        background: 'rgba(5,8,16,0.7)', backdropFilter: 'blur(12px)',
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          width: '100%', maxWidth: 520, padding: 28,
          background: 'rgba(18,26,42,0.95)',
          border: `1px solid ${cfg.color}33`,
          borderRadius: 24,
          boxShadow: `0 32px 80px rgba(0,0,0,0.5), 0 0 40px ${cfg.glow}`,
        }}
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `${cfg.color}18`,
            border: `1.5px solid ${cfg.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            {cfg.icon}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
              {record.title ?? '记忆'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {new Date(record.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              {record.is_nft && ' · 💎 NFT'}
              {record.encrypted && ' · 🔐 加密'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)',
              borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 13,
            }}
          >✕</button>
        </div>

        {/* Content */}
        <div style={{
          fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.75)',
          padding: 16, borderRadius: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: 16,
        }}>
          {record.encrypted && !record.decrypted_content
            ? '🔐 内容已加密，连接钱包后解密查看'
            : record.preview}
        </div>

        {/* Chain info */}
        <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
          {record.solana_tx_hash && record.solana_tx_hash !== 'pending' ? (
            <span style={{
              padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.12)',
              color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)',
            }}>⛓ Solana 已存证</span>
          ) : (
            <span style={{
              padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)',
            }}>待上链</span>
          )}
          <span style={{
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.1)',
          }}>Arweave ♾</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Destiny Pulse Panel ─────────────────────────────────────────
function DestinyPulsePanel({ bazi }: { bazi: BaziResult | null }) {
  const TEN_GOD_COLOR: Record<string, string> = {
    '食神': '#34d399', '伤官': '#a3e635',
    '正财': '#fbbf24', '偏财': '#f59e0b',
    '正官': '#60a5fa', '七杀': '#818cf8',
    '正印': '#c084fc', '偏印': '#e879f9',
    '比肩': '#fb923c', '劫财': '#ef4444',
  }
  const tenGodColor = bazi ? (TEN_GOD_COLOR[bazi.day_ten_god] ?? '#60a5fa') : '#60a5fa'

  const dailyMsg = bazi
    ? `${bazi.day_master_label.slice(0, 2)}之气流动，宜静心观察，记录此刻的感悟。`
    : '连接命盘，感受今日天时脉搏，让命理为你指引记录方向。'

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      style={{
        position: 'fixed',
        right: 24,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 256,
        zIndex: 30,
        padding: '20px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.045)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Breathing glow animation */}
      <motion.div
        style={{
          position: 'absolute', inset: -1, borderRadius: 24, pointerEvents: 'none',
          border: '1px solid rgba(96,165,250,0.2)',
        }}
        animate={{ opacity: [0.4, 1, 0.4], boxShadow: [
          '0 0 12px rgba(96,165,250,0.1)',
          '0 0 28px rgba(96,165,250,0.25)',
          '0 0 12px rgba(96,165,250,0.1)',
        ]}}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <motion.div
          style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em' }}
          animate={{ textShadow: ['0 0 8px rgba(96,165,250,0)', '0 0 16px rgba(96,165,250,0.5)', '0 0 8px rgba(96,165,250,0)'] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          天时脉搏
        </motion.div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 2 }}>
          DESTINY PULSE
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(96,165,250,0.3), transparent)', marginBottom: 14 }} />

      {/* Ten God */}
      <div style={{
        padding: '10px 12px', borderRadius: 12,
        background: `${tenGodColor}10`,
        border: `1px solid ${tenGodColor}25`,
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4, letterSpacing: '0.06em' }}>
          今日流日
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: tenGodColor }}>
          ✦ {bazi ? `${bazi.day_ten_god}日` : '未排命盘'}
        </div>
        {bazi && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, lineHeight: 1.5 }}>
            {bazi.day_ten_god_description?.slice(0, 28) ?? ''}
          </div>
        )}
      </div>

      {/* Mercury retrograde */}
      <div style={{
        padding: '10px 12px', borderRadius: 12,
        background: 'rgba(129,140,248,0.08)',
        border: '1px solid rgba(129,140,248,0.2)',
        marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>☿</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(129,140,248,0.9)' }}>
            水星顺行中
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>适宜清晰表达</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 14 }} />

      {/* AI daily message */}
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 6 }}>
          ✦ AI 每日微语
        </div>
        <p style={{
          fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8,
          fontStyle: 'italic', margin: 0,
        }}>
          {dailyMsg}
        </p>
      </div>

      {/* Five element bar (simplified) */}
      {bazi && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginTop: 14, marginBottom: 12 }} />
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 8 }}>
            五行气场
          </div>
          {([['木', '#34d399'], ['火', '#fb923c'], ['土', '#fbbf24'], ['金', '#94a3b8'], ['水', '#60a5fa']] as [string, string][]).map(([el, color]) => {
            const score = bazi.five_elements_score[el as '木' | '火' | '土' | '金' | '水'] ?? 0
            const total = Object.values(bazi.five_elements_score).reduce((a, b) => a + b, 0)
            const pct = total > 0 ? (score / total) * 100 : 20
            return (
              <div key={el} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 14 }}>{el}</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: 2, background: color, opacity: 0.7 }}
                  />
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', width: 22, textAlign: 'right' }}>
                  {Math.round(pct)}%
                </span>
              </div>
            )
          })}
        </>
      )}
    </motion.div>
  )
}

// ── Dark CSS variable overrides ─────────────────────────────────
const DARK_VARS = {
  '--bg-base':    '#0a0f1a',
  '--bg-card':    'rgba(255,255,255,0.06)',
  '--bg-subtle':  'rgba(255,255,255,0.04)',
  '--text-primary':   '#e2eeff',
  '--text-secondary': '#8eb4d4',
  '--text-muted':     '#4a7a9b',
  '--border':         'rgba(255,255,255,0.12)',
  '--gold':           '#fbbf24',
  '--gold-light':     'rgba(251,191,36,0.15)',
} as React.CSSProperties

// ── Main Page ───────────────────────────────────────────────────
export default function RecordsPage() {
  const { connected, publicKey } = useWallet()
  const [records, setRecords] = useState<MemoryRecord[]>(DEMO_RECORDS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(null)
  const [bazi, setBazi] = useState<BaziResult | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('tr_bazi')
      if (stored) setBazi(JSON.parse(stored))
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (!connected || !publicKey) return
    fetch(`/api/records?wallet=${publicKey.toString()}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.records?.length) setRecords(data.records) })
      .catch(() => {})
  }, [connected, publicKey])

  const handleSaved = useCallback((record: MemoryRecord) => {
    setRecords(prev => [record, ...prev])
    setShowAddModal(false)
    toast.success('时光已永久封存 ✨')
  }, [])

  if (!mounted) return null

  return (
    <div style={{ ...DARK_VARS, minHeight: '100vh', background: '#0a0f1a', position: 'relative', overflow: 'hidden' }}>

      {/* ── Background layers ── */}
      {/* Radial gradient backdrop */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 50% 20%, #0d2040 0%, #0a0f1a 70%)',
      }} />

      {/* Stars */}
      <StarBackground />

      {/* ── River waves (bottom 40%) ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        {/* Layer 1 — far, slow, dark blue */}
        <WaveLayer fill="#1a3a5c" opacity={0.55} amplitude={28} speed={22} bottom={0} height={Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.44 : 400)} />
        {/* Layer 2 — mid */}
        <WaveLayer fill="#2a5a8c" opacity={0.65} amplitude={20} speed={14} bottom={0} height={Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.36 : 320)} />
        {/* Layer 3 — near, fast, bright */}
        <WaveLayer fill="#3a7ab5" opacity={0.75} amplitude={14} speed={9} bottom={0} height={Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.27 : 240)} />

        {/* Sparkle reflections */}
        <RiverSparkles bottom={Math.round(typeof window !== 'undefined' ? window.innerHeight * 0.28 : 240)} />
      </div>

      {/* ── NavBar (dark theme) ── */}
      <div style={{ position: 'relative', zIndex: 40 }}>
        <NavBar bazi={bazi ?? undefined} />
      </div>

      {/* ── Main content ── */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: '70px', minHeight: '100vh' }}>

        {/* Logo / title area */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ padding: '32px 0 0 40px' }}
        >
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.25)', fontWeight: 300, marginBottom: 6 }}>
            T I M E · R I V E R
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 300, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', margin: 0 }}>
            时光之河
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4, letterSpacing: '0.04em' }}>
            记录即修行，觉察即改命
          </p>
        </motion.div>

        {/* ── Timeline area ── */}
        <div style={{ marginTop: '8vh', marginRight: 300, position: 'relative' }}>
          <Timeline records={records} onBubbleClick={setSelectedRecord} />
        </div>

        {/* ── Scroll hint ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2.5, delay: 1.5, repeat: 3 }}
          style={{
            position: 'absolute',
            bottom: '45%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.12em',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          ← 滑动时间之河 →
        </motion.div>

        {/* ── Add Record CTA ── */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
          onClick={() => setShowAddModal(true)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: '52%',
            left: 40,
            zIndex: 30,
            padding: '12px 24px',
            borderRadius: 30,
            background: 'rgba(96,165,250,0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(96,165,250,0.4)',
            color: 'rgba(200,230,255,0.9)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: '0.04em',
            boxShadow: '0 0 24px rgba(96,165,250,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <motion.span
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: 16, lineHeight: 1 }}
          >
            ✦
          </motion.span>
          记录此刻
        </motion.button>
      </main>

      {/* ── Destiny Pulse Panel ── */}
      <DestinyPulsePanel bazi={bazi} />

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedRecord && (
          <RecordDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          /* Reset CSS vars to light theme so RecordModal text is readable */
          <div style={{
            '--bg-base':        '#F7F5F2',
            '--bg-card':        '#FFFFFF',
            '--bg-subtle':      '#F2EDE5',
            '--text-primary':   '#1A1714',
            '--text-secondary': '#4A4540',
            '--text-muted':     '#9C9690',
            '--border':         '#E8E2D8',
            '--gold':           '#A87C2A',
            '--gold-light':     '#FDF3DC',
          } as React.CSSProperties}>
            <RecordModal
              bazi={bazi ?? undefined}
              onClose={() => setShowAddModal(false)}
              onSaved={handleSaved}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
