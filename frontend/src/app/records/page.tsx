'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { NavBar } from '@/components/common/NavBar'
import { RecordModal } from '@/components/river/RecordModal'
import { InspirationZone } from '@/components/inspiration/InspirationZone'
import type { MemoryRecord, BaziResult } from '@/types'
import toast from 'react-hot-toast'

const DEMO_RECORDS: MemoryRecord[] = [
  {
    id: '1', owner: 'demo', type: 'text',
    preview: '在黑客松现场第一次见到了真正同频的人。我们的对话不需要铺垫，直接进入彼此的内心世界。那种感觉很奇妙，仿佛命中注定的相遇。有些人，一见面就知道会是一辈子的朋友。',
    arweave_cid: 'ar://abc1', solana_tx_hash: 'Ax7Kp9mN',
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(), encrypted: false, is_nft: false,
  },
  {
    id: '2', owner: 'demo', type: 'text',
    preview: '意识到自己在逆境中的成长模式——不是硬撑，而是用柔软的方式找到缝隙，然后生长。这就是乙木的智慧。今天的命课让我对自己多了一份接纳，不再为自己的敏感而羞耻。',
    arweave_cid: 'ar://abc2', solana_tx_hash: 'Bz3Lm4kR',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(), encrypted: true, is_nft: false,
  },
  {
    id: '3', owner: 'demo', type: 'image',
    preview: '拍下了今天的日落。橙色的光把整个城市染成了一幅画，天边的云彩像是被什么巨大的力量揉碎再重新排列。这种美好是属于这一刻的，没有人能带走，只有经历它的人才懂。',
    arweave_cid: 'ar://abc3', solana_tx_hash: 'Cw9Jq2pS',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(), encrypted: false, is_nft: true,
  },
  {
    id: '4', owner: 'demo', type: 'text',
    preview: '今天做了一个很小的决定：不再在深夜刷手机。第一天，出奇的平静。早早入睡，梦里好像回到了小时候住过的那条老街，石板路上有积水，倒映着灯光。',
    arweave_cid: 'ar://abc4', solana_tx_hash: 'pending',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(), encrypted: false, is_nft: false,
  },
  {
    id: '5', owner: 'demo', type: 'text',
    preview: '和妈妈打了一个小时的电话，聊了很多从前从未说过的话。原来我们都在等对方先开口。有些话，不说出来真的会后悔一辈子。今天决定，要更常联系她，不要等到"有时间"。',
    arweave_cid: 'ar://abc5', solana_tx_hash: 'Dv5Nt7hW',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(), encrypted: true, is_nft: false,
  },
  {
    id: '6', owner: 'demo', type: 'text',
    preview: '早晨六点，在楼顶看到了难得的晴天。城市还没完全醒来，只有远处偶尔驶过的车和鸟叫声。这样的清晨，安静得像是世界只属于我一个人。值得被记下来。',
    arweave_cid: 'ar://abc6', solana_tx_hash: 'Ek2Mv3xC',
    created_at: new Date().toISOString(), encrypted: false, is_nft: false,
  },
]

const TYPE_CONFIG: Record<string, { icon: string; label: string; accent: string; soft: string; border: string }> = {
  text:  { icon: '✍️', label: '文字', accent: '#3D2B1F', soft: '#FAF6F0', border: '#E8DDD0' },
  image: { icon: '🖼️', label: '图片', accent: '#2B4A80', soft: '#EEF4FC', border: '#C0D4F0' },
  audio: { icon: '🎵', label: '音频', accent: '#5B2D8E', soft: '#F4EFFE', border: '#D4B8F8' },
  video: { icon: '🎬', label: '视频', accent: '#8E2D2D', soft: '#FEF0EE', border: '#F8C0B8' },
  file:  { icon: '📎', label: '文件', accent: '#1A6B45', soft: '#EDFAF3', border: '#A8E8CC' },
}

function formatRelative(dateStr: string) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/* ─── 河流 SVG（沉浸式宽幅版）──────────────────────────── */
function MajesticRiver({ height }: { height: number }) {
  // 使用 1200 单位宽度，中心 600，左右摆幅 ±210
  const W = 1200
  const cx = 600
  const swing = 210
  const segs = Math.ceil(height / 180)

  // 主河道路径（平滑蜿蜒）
  let mainPath = `M ${cx} 0`
  // 左河岸偏移路径
  let bankL = `M ${cx - 90} 0`
  // 右河岸偏移路径
  let bankR = `M ${cx + 90} 0`

  for (let i = 0; i < segs; i++) {
    const y1 = (i + 0.5) * 180
    const y2 = (i + 1) * 180
    const dir = i % 2 === 0 ? 1 : -1
    const ox = cx + dir * swing
    const oxL = cx + dir * swing - 80
    const oxR = cx + dir * swing + 80
    mainPath += ` Q ${ox} ${y1} ${cx} ${y2}`
    bankL   += ` Q ${oxL} ${y1} ${cx - 90} ${y2}`
    bankR   += ` Q ${oxR} ${y1} ${cx + 90} ${y2}`
  }

  const totalDash = height * 0.18

  return (
    <svg
      style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', overflow: 'visible', pointerEvents: 'none' }}
      width={W} height={height} viewBox={`0 0 ${W} ${height}`}
    >
      <defs>
        {/* 主河道渐变 */}
        <linearGradient id="rvMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8EAFA" />
          <stop offset="30%" stopColor="#7ABFDF" />
          <stop offset="70%" stopColor="#4A9BBE" />
          <stop offset="100%" stopColor="#2E7A9C" />
        </linearGradient>
        {/* 水体填充渐变 */}
        <linearGradient id="rvBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8F0FA" />
          <stop offset="100%" stopColor="#9DCFE8" />
        </linearGradient>
        {/* 源头径向光晕 */}
        <radialGradient id="srcGlow" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#B8E8F8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#5D9AB5" stopOpacity="0" />
        </radialGradient>
        {/* 主辉光滤镜 */}
        <filter id="glowStrong" x="-80%" y="-10%" width="260%" height="120%">
          <feGaussianBlur stdDeviation="18" result="b1" />
          <feGaussianBlur stdDeviation="6"  result="b2" />
          <feMerge>
            <feMergeNode in="b1" />
            <feMergeNode in="b2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* 柔和辉光 */}
        <filter id="glowSoft" x="-50%" y="-5%" width="200%" height="110%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* 水面涟漪纹理 */}
        <filter id="ripple" x="-10%" y="-5%" width="120%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.004" numOctaves="3" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* 左侧雾气遮罩 */}
        <linearGradient id="fogL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#F7F5F2" stopOpacity="1" />
          <stop offset="100%" stopColor="#F7F5F2" stopOpacity="0" />
        </linearGradient>
        {/* 右侧雾气遮罩 */}
        <linearGradient id="fogR" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#F7F5F2" stopOpacity="1" />
          <stop offset="100%" stopColor="#F7F5F2" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ── 层 1：超宽背景漫散光（氛围底色）── */}
      <path d={mainPath} fill="none" stroke="#D8F2FC" strokeWidth="580" strokeLinecap="round" opacity="0.28" />

      {/* ── 层 2：宽水域光晕 ── */}
      <path d={mainPath} fill="none" stroke="#C0E5F5" strokeWidth="380" strokeLinecap="round" opacity="0.38" />

      {/* ── 层 3：主水体（带涟漪纹理）── */}
      <path d={mainPath} fill="none" stroke="url(#rvBody)" strokeWidth="220" strokeLinecap="round" opacity="0.55" filter="url(#ripple)" />

      {/* ── 层 4：内层水体 ── */}
      <path d={mainPath} fill="none" stroke="#90CBE6" strokeWidth="130" strokeLinecap="round" opacity="0.7" />

      {/* ── 层 5：左河岸边缘 ── */}
      <path d={bankL} fill="none" stroke="#6AB8D8" strokeWidth="18" strokeLinecap="round" opacity="0.35" />
      {/* ── 层 6：右河岸边缘 ── */}
      <path d={bankR} fill="none" stroke="#6AB8D8" strokeWidth="18" strokeLinecap="round" opacity="0.35" />

      {/* ── 层 7：主流道（强辉光）── */}
      <path d={mainPath} fill="none" stroke="url(#rvMain)" strokeWidth="52" strokeLinecap="round" filter="url(#glowStrong)" />

      {/* ── 层 8：核心亮流（白色）── */}
      <path d={mainPath} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="14" strokeLinecap="round" filter="url(#glowSoft)" />

      {/* ── 层 9：流动高光 A（快）── */}
      <path d={mainPath} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="5"
        strokeLinecap="round" strokeDasharray={`${totalDash * 0.14} ${totalDash * 0.22}`}>
        <animate attributeName="stroke-dashoffset" from="0" to={`-${totalDash}`} dur="2.8s" repeatCount="indefinite" />
      </path>

      {/* ── 层 10：流动高光 B（中速，偏移）── */}
      <path d={mainPath} fill="none" stroke="rgba(200,240,255,0.75)" strokeWidth="3"
        strokeLinecap="round" strokeDasharray={`${totalDash * 0.08} ${totalDash * 0.3}`}
        strokeDashoffset={totalDash * 0.2}>
        <animate attributeName="stroke-dashoffset" from={totalDash * 0.2} to={`-${totalDash * 0.8}`} dur="4.2s" repeatCount="indefinite" />
      </path>

      {/* ── 层 11：流动高光 C（慢，宽条）── */}
      <path d={mainPath} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="24"
        strokeLinecap="round" strokeDasharray={`${totalDash * 0.06} ${totalDash * 0.5}`}
        strokeDashoffset={totalDash * 0.4}>
        <animate attributeName="stroke-dashoffset" from={totalDash * 0.4} to={`-${totalDash * 0.6}`} dur="6s" repeatCount="indefinite" />
      </path>

      {/* ── 层 12：左岸流光 ── */}
      <path d={bankL} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5"
        strokeLinecap="round" strokeDasharray={`${totalDash * 0.1} ${totalDash * 0.35}`}>
        <animate attributeName="stroke-dashoffset" from="0" to={`-${totalDash}`} dur="3.5s" repeatCount="indefinite" />
      </path>

      {/* ── 层 13：右岸流光 ── */}
      <path d={bankR} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"
        strokeLinecap="round" strokeDasharray={`${totalDash * 0.07} ${totalDash * 0.4}`}
        strokeDashoffset={totalDash * 0.15}>
        <animate attributeName="stroke-dashoffset" from={totalDash * 0.15} to={`-${totalDash * 0.85}`} dur="5s" repeatCount="indefinite" />
      </path>

      {/* ── 源头光晕（顶部）── */}
      <ellipse cx={cx} cy={0} rx={220} ry={80}
        fill="url(#srcGlow)" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.9;0.7" dur="3s" repeatCount="indefinite" />
      </ellipse>
      {/* 源头亮点 */}
      <circle cx={cx} cy={0} r={18} fill="white" opacity="0.95" filter="url(#glowSoft)" />
      <circle cx={cx} cy={0} r={8}  fill="white" opacity="1" />

      {/* ── 左侧雾气边缘 ── */}
      <rect x="0" y="0" width="220" height={height} fill="url(#fogL)" opacity="0.85" />
      {/* ── 右侧雾气边缘 ── */}
      <rect x={W - 220} y="0" width="220" height={height} fill="url(#fogR)" opacity="0.85" />
    </svg>
  )
}

/* ─── 节点 ──────────────────────────────────────────────── */
function Node({ cfg, delay }: { cfg: typeof TYPE_CONFIG[string]; delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 180, damping: 16, delay }}
      style={{
        width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
        background: `radial-gradient(circle at 35% 35%, #fff, ${cfg.soft})`,
        border: `2.5px solid ${cfg.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, zIndex: 4,
        boxShadow: `0 0 0 6px rgba(255,255,255,0.95), 0 0 0 9px ${cfg.border}66, 0 6px 24px rgba(0,0,0,0.10)`,
      }}
    >
      {cfg.icon}
      <motion.div
        style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          border: `1.5px solid ${cfg.border}88`,
        }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, delay: Math.random() * 2 }}
      />
    </motion.div>
  )
}

/* ─── 卡片 ──────────────────────────────────────────────── */
function RecordCard({ record, index, onOpen }: {
  record: MemoryRecord; index: number; onOpen: (r: MemoryRecord) => void
}) {
  const isLeft = index % 2 === 0
  const cfg = TYPE_CONFIG[record.type] || TYPE_CONFIG.text
  const content = record.decrypted_content || record.preview

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 140px 1fr',
      alignItems: 'center',
      marginBottom: '64px',
    }}>
      {/* 左侧 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: '32px' }}>
        {isLeft && <CardBody record={record} cfg={cfg} content={content} onOpen={onOpen} side="left" />}
      </div>

      {/* 中间节点 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 4 }}>
        <Node cfg={cfg} delay={0.1} />
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
          background: 'rgba(247,245,242,0.96)', padding: '3px 10px',
          borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: '0.02em',
        }}>
          {formatRelative(record.created_at)}
        </div>
      </div>

      {/* 右侧 */}
      <div style={{ paddingLeft: '32px' }}>
        {!isLeft && <CardBody record={record} cfg={cfg} content={content} onOpen={onOpen} side="right" />}
      </div>
    </div>
  )
}

function CardBody({ record, cfg, content, onOpen, side }: {
  record: MemoryRecord
  cfg: typeof TYPE_CONFIG[string]
  content: string
  onOpen: (r: MemoryRecord) => void
  side: 'left' | 'right'
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onClick={() => onOpen(record)}
      style={{
        width: '100%', maxWidth: 520,
        background: '#FFFFFF',
        borderRadius: 24,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)`,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'box-shadow 0.25s ease',
      }}
    >
      {/* 顶部渐变色带 */}
      <div style={{
        height: 5,
        background: `linear-gradient(90deg, ${cfg.accent}22, ${cfg.accent}99, ${cfg.accent}22)`,
      }} />

      <div style={{ padding: '24px 28px 22px' }}>
        {/* 标签行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{
            padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: cfg.soft, color: cfg.accent, border: `1px solid ${cfg.border}`,
            letterSpacing: '0.02em',
          }}>
            {cfg.icon} {cfg.label}
          </span>
          {record.encrypted && (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: '#F4EFFE', color: '#5B2D8E', border: '1px solid #D4B8F8',
            }}>🔐 端对端加密</span>
          )}
          {record.is_nft && (
            <span style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: '#FDF3DC', color: '#A87C2A', border: '1px solid #EDD898',
            }}>💎 NFT</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {new Date(record.created_at).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* 大引号 */}
        {record.type === 'text' && (
          <div style={{
            fontSize: 56, lineHeight: 0.8, color: cfg.border,
            fontFamily: 'Georgia, "Times New Roman", serif',
            marginBottom: 10,
            textAlign: side === 'left' ? 'left' : 'right',
          }}>"</div>
        )}

        {/* 正文 */}
        <p style={{
          fontSize: 15.5, lineHeight: 1.9, color: '#3A3530',
          display: '-webkit-box',
          WebkitLineClamp: 5,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontWeight: 400,
          letterSpacing: '0.01em',
        }}>
          {record.encrypted && !record.decrypted_content
            ? '🔐 内容已加密，连接钱包后解密查看'
            : content}
        </p>

        {/* 底部信息条 */}
        <div style={{
          marginTop: 20, paddingTop: 14,
          borderTop: `1px dashed ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {record.solana_tx_hash && record.solana_tx_hash !== 'pending' ? (
              <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e88' }} />
                <span style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 600 }}>Solana 已存证</span>
              </>
            ) : (
              <>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4C8BC', display: 'inline-block' }} />
                <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>待上链</span>
              </>
            )}
          </div>
          <span style={{
            fontSize: 11.5, color: cfg.accent, fontWeight: 600,
            opacity: 0.7, letterSpacing: '0.03em',
          }}>
            点击查看全文 →
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── 月份横幅 ──────────────────────────────────────────── */
function MonthBanner({ label }: { label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 48, position: 'relative', zIndex: 5,
      }}
    >
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--border))' }} />
      <div style={{
        padding: '8px 24px', borderRadius: 24,
        background: 'rgba(93,154,181,0.1)',
        border: '1.5px solid rgba(93,154,181,0.25)',
        fontSize: 13, fontWeight: 700, color: 'var(--river-dark)',
        letterSpacing: '0.06em',
        backdropFilter: 'blur(12px)',
      }}>
        🗓 {label}
      </div>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--border))' }} />
    </motion.div>
  )
}

/* ─── 主页面 ─────────────────────────────────────────────── */
export default function RecordsPage() {
  const { connected, publicKey } = useWallet()
  const [records, setRecords] = useState<MemoryRecord[]>(DEMO_RECORDS)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MemoryRecord | null>(null)
  const [bazi, setBazi] = useState<BaziResult | null>(null)
  const [modalPrefill, setModalPrefill] = useState<string | undefined>()
  const [modalTemplate, setModalTemplate] = useState<string | undefined>()

  // 从 localStorage 加载八字数据
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tr_bazi')
      if (stored) setBazi(JSON.parse(stored))
    } catch { /* 静默 */ }
  }, [])

  useEffect(() => {
    if (connected && publicKey) fetchRecords()
  }, [connected, publicKey])

  const fetchRecords = useCallback(async () => {
    if (!publicKey) return
    setLoading(true)
    try {
      const res = await fetch(`/api/records?wallet=${publicKey.toString()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.records?.length > 0) setRecords(data.records)
      }
    } catch { /* 静默 */ } finally { setLoading(false) }
  }, [publicKey])

  const handleAddRecord = useCallback((template?: string, prefill?: string) => {
    setModalTemplate(template)
    setModalPrefill(prefill)
    setShowModal(true)
  }, [])

  const handleSaved = useCallback((record: MemoryRecord) => {
    setRecords(prev => [record, ...prev])
    setShowModal(false)
    setModalPrefill(undefined)
    setModalTemplate(undefined)
    toast.success('时光已永久封存 ✨')
  }, [])

  const sorted = [...records].sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // 插入月份分隔
  const items: Array<{ type: 'month'; label: string } | { type: 'record'; record: MemoryRecord; index: number }> = []
  let lastMonth = ''
  let ri = 0
  for (const rec of sorted) {
    const d = new Date(rec.created_at)
    const m = `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`
    if (m !== lastMonth) { items.push({ type: 'month', label: m }); lastMonth = m }
    items.push({ type: 'record', record: rec, index: ri++ })
  }

  const riverH = Math.max(800, sorted.length * 180 + 320)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <NavBar />

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg, #DDF0FA 0%, #EEF6FB 40%, var(--bg-base) 100%)',
        borderBottom: '1px solid var(--border)',
        paddingTop: 100, paddingBottom: 52,
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--river)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
                Time River · 时光之河
              </div>
              <h1 style={{ fontSize: 44, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 14 }}>
                你的人生长河
              </h1>
              <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 460 }}>
                每一条记录，都是命运轨迹上的一滴水珠<br />
                汇聚成你独一无二、永不消散的生命之流
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 16 }}>
              {/* 统计 */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { n: records.length, l: '条记录', color: 'var(--text-primary)' },
                  { n: records.filter(r => r.encrypted).length, l: '条加密', color: '#5B2D8E' },
                  { n: records.filter(r => r.is_nft).length, l: '条 NFT', color: '#A87C2A' },
                ].map(s => (
                  <div key={s.l} style={{
                    padding: '12px 20px', borderRadius: 16,
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(12px)',
                    textAlign: 'center', minWidth: 72,
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 500 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <motion.button
                className="btn-primary"
                style={{ padding: '14px 28px', fontSize: 15, borderRadius: 16 }}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleAddRecord()}
              >
                ✍️ &nbsp;记录此刻
              </motion.button>
            </div>
          </motion.div>

          {/* 灵感引导区 */}
          <div style={{ marginTop: 36 }}>
            <InspirationZone bazi={bazi ?? undefined} onAddRecord={handleAddRecord} />
          </div>
        </div>
      </div>

      {/* ── 河流主体 ── */}
      <div style={{
        background: 'linear-gradient(180deg, #EDF6FB 0%, #F2F8FC 30%, #EBF4F9 60%, #F0F6FA 100%)',
        borderTop: '1px solid rgba(93,154,181,0.15)',
      }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 48px 120px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <div className="loading-dots"><span /><span /><span /></div>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 20 }}>记忆浮现中...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '120px 0' }}>
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: 72, marginBottom: 24 }}>🌊</motion.div>
            <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>你的时光之河尚未开始</p>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>第一条记录，就是改变命运的起点</p>
            <button className="btn-primary" style={{ padding: '14px 36px', fontSize: 15 }} onClick={() => handleAddRecord()}>
              ✍️ 写下第一条记录
            </button>
          </div>
        ) : (
          <div style={{ position: 'relative', minHeight: riverH }}>

            <MajesticRiver height={riverH} />

            {/* 源头日期标注（SVG 已渲染光晕，这里只补日期文字）*/}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 64, position: 'relative', zIndex: 5 }}
            >
              <div style={{
                fontSize: 12, color: 'var(--river)', fontWeight: 600,
                letterSpacing: '0.08em', background: 'rgba(247,245,242,0.85)',
                padding: '4px 16px', borderRadius: 20,
                border: '1px solid rgba(93,154,181,0.25)',
              }}>
                {new Date(sorted[0]?.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </motion.div>

            {/* 记录列表 */}
            {items.map((item, i) =>
              item.type === 'month'
                ? <MonthBanner key={`m${i}`} label={item.label} />
                : <RecordCard key={item.record.id} record={item.record} index={item.index} onOpen={setSelectedRecord} />
            )}

            {/* 底部 CTA */}
            <motion.div
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, position: 'relative', zIndex: 5 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 2, height: 64, background: 'linear-gradient(to bottom, #5D9AB5, transparent)' }} />
                <motion.button
                  className="btn-primary"
                  style={{ padding: '16px 40px', fontSize: 16, borderRadius: 50, letterSpacing: '-0.01em' }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleAddRecord()}
                >
                  ✍️ &nbsp;记录当下这一刻
                </motion.button>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
                  每一次记录，都是改命的开始
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      </div>

      {/* 新建弹窗 */}
      <AnimatePresence>
        {showModal && (
          <RecordModal
            template={modalTemplate}
            prefill={modalPrefill}
            bazi={bazi ?? undefined}
            onClose={() => { setShowModal(false); setModalPrefill(undefined); setModalTemplate(undefined) }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedRecord && (() => {
          const cfg = TYPE_CONFIG[selectedRecord.type] || TYPE_CONFIG.text
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0, zIndex: 50,
                background: 'rgba(20,16,14,0.5)', backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
              }}
              onClick={e => e.target === e.currentTarget && setSelectedRecord(null)}
            >
              <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 24 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                style={{ width: '100%', maxWidth: 580, background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.18)' }}
              >
                <div style={{ height: 6, background: `linear-gradient(90deg, ${cfg.accent}33, ${cfg.accent}, ${cfg.accent}33)` }} />
                <div style={{ padding: '32px 36px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 16, background: cfg.soft, border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                        {cfg.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{cfg.label}记录</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                          {new Date(selectedRecord.created_at).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedRecord(null)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-subtle)', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>

                  {selectedRecord.type === 'text' && (
                    <div style={{ fontSize: 48, lineHeight: 0.9, color: cfg.border, fontFamily: 'Georgia, serif', marginBottom: 12 }}>"</div>
                  )}
                  <p style={{ fontSize: 16, lineHeight: 1.9, color: 'var(--text-primary)', marginBottom: 28 }}>
                    {selectedRecord.decrypted_content || selectedRecord.preview}
                  </p>

                  <div style={{ padding: 18, borderRadius: 16, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>链上存证</div>
                    {[{ l: 'Arweave', v: selectedRecord.arweave_cid }, { l: 'Solana', v: selectedRecord.solana_tx_hash }].filter(f => f.v).map(f => (
                      <div key={f.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', width: 54, flexShrink: 0 }}>{f.l}</span>
                        <code style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '3px 10px', borderRadius: 8, border: '1px solid var(--border)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f.v?.slice(0, 32)}...
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
