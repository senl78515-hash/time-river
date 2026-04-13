'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { NavBar } from '@/components/common/NavBar'
import { useLang } from '@/lib/i18n'
import type { ExperienceNFT } from '@/types'

// ── Demo data ─────────────────────────────────────────────────
const DEMO_NFTS: ExperienceNFT[] = [
  {
    mint: 'Fg6PaFpoh7u9JMgBT8UfJJJJxXDvAWmtgSKRPpfFpHjG',
    title: '2024 年灵魂独白',
    description: '一整年的内心旅程，从迷茫到清醒，记录了 47 条私密日记，每一篇都是与自己的对话',
    record_ids: Array.from({ length: 47 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://abc123',
    creator: '8xvnKm9pRQsT4uBn',
    price: 0.5,
    royalty_bps: 500,
    created_at: '2024-12-31T00:00:00Z',
    sold_count: 23,
    tags: ['心灵成长', '日记', '2024'],
  },
  {
    mint: '3vYm8JKaZ8hE1pGN7XwSuGgKBLmj5nFr2qVeTT7nYR4s',
    title: '深圳创业三年',
    description: '从月薪 5000 到第一次融资，18 个月的血泪创业史，记录了每一次低谷与突破',
    record_ids: Array.from({ length: 89 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://def456',
    creator: 'AK129mPqLRnvW5sX',
    price: 1.2,
    royalty_bps: 800,
    created_at: '2025-09-15T00:00:00Z',
    sold_count: 61,
    tags: ['创业', '成长', '深圳'],
  },
  {
    mint: 'Jm7KsVnQ2pWxZ9fRdT4bL6eC1uMYh8kEgNaOiDvFwRcA',
    title: '异国恋 300 天',
    description: '跨越十三个时区的思念，被时光冲刷却愈发清晰的脸，300 天每日一记',
    record_ids: Array.from({ length: 300 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://ghi789',
    creator: 'Bm4n7xKwPsQeL3vD',
    price: 0.3,
    royalty_bps: 1000,
    created_at: '2026-01-01T00:00:00Z',
    sold_count: 142,
    tags: ['爱情', '异地', '情感'],
  },
  {
    mint: 'P9kTsZ3WmF7uBnN5yHxQjR4eVgC2aKdL8oMiE6vDwJXs',
    title: '马拉松备赛日记',
    description: '从不能跑 5km 到完成全马，6 个月蜕变全记录，156 条训练日志',
    record_ids: Array.from({ length: 156 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://jkl012',
    creator: 'Cn5o8yLxTmRqK7wG',
    price: 0.8,
    royalty_bps: 500,
    created_at: '2025-11-20T00:00:00Z',
    sold_count: 38,
    tags: ['运动', '马拉松', '健康'],
  },
  {
    mint: 'Qs2wZxYvP8uNmBkH3jRfL7tGcM4eKd9rVaFoIxWnCgDs',
    title: '学中文两年记',
    description: '一个法国人从零开始学汉语，到能用中文写诗的完整旅程，附 200 张手写卡片照片',
    record_ids: Array.from({ length: 200 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://mno345',
    creator: 'Dn6p9zMyUnSrL8xH',
    price: 0.6,
    royalty_bps: 600,
    created_at: '2026-03-10T00:00:00Z',
    sold_count: 55,
    tags: ['语言', '文化', '成长'],
  },
  {
    mint: 'Rt4eXwYuO7iNlAjG2kQfK8sHbN5dJm1rVbGoIyWoCfEt',
    title: '父亲的最后一年',
    description: '陪伴父亲走过生命最后阶段，记录了无数次病床边的对话与告别，每一字都是珍藏',
    record_ids: Array.from({ length: 73 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://pqr678',
    creator: 'Eo7q0aNvVoTsM9yI',
    price: 0.1,
    royalty_bps: 1500,
    created_at: '2026-02-14T00:00:00Z',
    sold_count: 89,
    tags: ['家庭', '生命', '情感'],
  },
]

// ── Types ──────────────────────────────────────────────────────
type SortBy = 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'most_sold' | 'most_records'
type TimeFilter = 'all' | 'week' | 'month' | '3month'
type Tab = 'all' | 'mine'

const COVER_PALETTES = [
  { from: '#FEF3C7', to: '#FDE68A', accent: '#B8860B', icon: '📖' },
  { from: '#EEF3FB', to: '#C5D8F0', accent: '#4A6FA5', icon: '🌊' },
  { from: '#F0FDF4', to: '#BBF7D0', accent: '#16a34a', icon: '🌿' },
  { from: '#F5F3FF', to: '#DDD6FE', accent: '#7C3AED', icon: '✨' },
  { from: '#FFF1F2', to: '#FECDD3', accent: '#E11D48', icon: '🌸' },
  { from: '#ECFEFF', to: '#A5F3FC', accent: '#0891B2', icon: '💙' },
]

// ── NFT Card ───────────────────────────────────────────────────
function NFTCard({ nft, index, onBuy }: { nft: ExperienceNFT; index: number; onBuy: (nft: ExperienceNFT) => void }) {
  const { t } = useLang()
  const palette = COVER_PALETTES[index % COVER_PALETTES.length]
  const dateStr = new Date(nft.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' })
  const shortAddr = nft.creator.slice(0, 6) + '...' + nft.creator.slice(-4)

  return (
    <motion.div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      whileHover={{ scale: 1.02, y: -4, boxShadow: '0 12px 40px rgba(28,25,23,0.12)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      {/* Cover */}
      <div style={{
        height: '148px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '56px', opacity: 0.2 }}>{palette.icon}</span>
        </div>

        {/* Tags row */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px' }}>
          <div style={{
            padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
            fontSize: '11px', color: palette.accent, fontWeight: 600,
          }}>
            {nft.record_ids.length} {t('mkt_records_count')}
          </div>
        </div>
        <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <div style={{
            padding: '3px 10px', borderRadius: '20px',
            background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
            fontSize: '11px', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.04em',
          }}>
            NFT
          </div>
        </div>

        {/* Bottom info */}
        <div style={{
          position: 'absolute', bottom: '10px', insetInline: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: '11px', color: palette.accent, opacity: 0.75 }}>
            {t('mkt_royalty')} {nft.royalty_bps / 100}%
          </div>
          <div style={{
            fontSize: '11px', color: palette.accent, opacity: 0.75,
            display: 'flex', alignItems: 'center', gap: '4px',
          }}>
            <span>🤝</span> {nft.sold_count ?? 0} {t('mkt_sold_count')}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {nft.title}
        </h3>
        <p style={{
          fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.65, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {nft.description}
        </p>

        {/* Tags */}
        {nft.tags && nft.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {nft.tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                padding: '2px 8px', borderRadius: '20px',
                background: 'var(--bg-subtle)', fontSize: '10px', color: 'var(--text-muted)',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          <span>{t('creator')} {shortAddr}</span>
          <span>{dateStr}</span>
        </div>

        {/* Price + Buy */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
          <div>
            <div style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {nft.price} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>SOL</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              ≈ ¥{((nft.price ?? 0) * 800).toFixed(0)}
            </div>
          </div>
          <button
            onClick={() => onBuy(nft)}
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '13px' }}
          >
            {t('mkt_buy')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ── Buy Modal ──────────────────────────────────────────────────
function BuyModal({ nft, onClose }: { nft: ExperienceNFT; onClose: () => void }) {
  const { connected } = useWallet()
  const { t } = useLang()
  const [step, setStep] = useState<'confirm' | 'buying' | 'done'>('confirm')

  const royalty = ((nft.price ?? 0) * nft.royalty_bps / 10000)
  const total = (nft.price ?? 0) + royalty

  const handleBuy = async () => {
    if (!connected) return
    setStep('buying')
    await new Promise(resolve => setTimeout(resolve, 2200))
    setStep('done')
  }

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        background: 'rgba(28,25,23,0.55)', backdropFilter: 'blur(10px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        style={{
          width: '100%', maxWidth: '440px', padding: '28px',
          background: 'var(--bg-card)', borderRadius: '20px',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 60px rgba(28,25,23,0.2)',
        }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        {step === 'confirm' && (
          <>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              {t('buy_title')}
            </h3>

            {/* NFT preview */}
            <div style={{
              padding: '14px', borderRadius: '12px',
              background: 'var(--bg-subtle)', marginBottom: '20px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {nft.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {nft.description}
              </div>
            </div>

            {/* Fee breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>{t('buy_price')}</span>
                <span>{nft.price} SOL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>{t('buy_royalty')} ({nft.royalty_bps / 100}%)</span>
                <span>{royalty.toFixed(4)} SOL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>{t('buy_fee')}</span>
                <span>~0.000005 SOL</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                color: 'var(--text-primary)', fontWeight: 700,
                borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px',
              }}>
                <span>{t('buy_total')}</span>
                <span style={{ color: 'var(--gold)', fontSize: '16px' }}>{total.toFixed(4)} SOL</span>
              </div>
            </div>

            {!connected && (
              <p style={{ color: 'var(--gold)', fontSize: '13px', textAlign: 'center', marginBottom: '14px' }}>
                ⚠ {t('buy_need_wallet')}
              </p>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '13px' }}>
                {t('buy_cancel')}
              </button>
              <button
                onClick={handleBuy}
                disabled={!connected}
                className="btn-primary"
                style={{ flex: 1, padding: '13px', opacity: connected ? 1 : 0.4 }}
              >
                {t('buy_confirm')}
              </button>
            </div>
          </>
        )}

        {step === 'buying' && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <motion.div
              style={{ fontSize: '52px', marginBottom: '18px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
            >
              ⏳
            </motion.div>
            <p style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 500 }}>
              {t('buy_processing')}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
              {t('buy_approve')}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <motion.div
              style={{ fontSize: '56px', marginBottom: '16px' }}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              🎉
            </motion.div>
            <p style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {t('buy_success')}
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.7 }}>
              {t('buy_success_desc')}
            </p>
            <button onClick={onClose} className="btn-primary" style={{ padding: '13px 40px' }}>
              {t('buy_done')}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Sell Panel ─────────────────────────────────────────────────
function SellPanel() {
  const { t } = useLang()
  const steps = [
    { n: '①', label: t('sell_step1') },
    { n: '②', label: t('sell_step2') },
    { n: '③', label: t('sell_step3') },
  ]
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{ overflow: 'hidden', marginBottom: '28px' }}
    >
      <div style={{
        padding: '24px', borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--gold)',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)', marginBottom: '6px' }}>
          {t('sell_title')}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.7 }}>
          {t('sell_desc')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {steps.map(s => (
            <div key={s.n} style={{
              padding: '14px 10px', borderRadius: '12px',
              background: 'var(--bg-subtle)', textAlign: 'center',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '20px', color: 'var(--gold)', marginBottom: '6px' }}>{s.n}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <button className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '14px' }}>
          {t('sell_go')}
        </button>
      </div>
    </motion.div>
  )
}

// ── Helpers ────────────────────────────────────────────────────
function cutoffDate(filter: TimeFilter): Date | null {
  const now = new Date()
  if (filter === 'week')   { const d = new Date(now); d.setDate(d.getDate() - 7);  return d }
  if (filter === 'month')  { const d = new Date(now); d.setDate(d.getDate() - 30); return d }
  if (filter === '3month') { const d = new Date(now); d.setDate(d.getDate() - 90); return d }
  return null
}

// ── Page ───────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { t } = useLang()
  const { publicKey } = useWallet()

  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [addrFilter, setAddrFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [sellOpen, setSellOpen] = useState(false)
  const [buyingNft, setBuyingNft] = useState<ExperienceNFT | null>(null)

  const myAddr = publicKey?.toBase58() ?? ''

  const filtered = useMemo(() => {
    const cutoff = cutoffDate(timeFilter)
    return DEMO_NFTS
      .filter(n => {
        if (tab === 'mine') {
          // In demo, show none under "mine" unless wallet matches
          return myAddr && n.creator.startsWith(myAddr.slice(0, 4))
        }
        return true
      })
      .filter(n => {
        if (!search) return true
        const q = search.toLowerCase()
        return n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q) ||
          (n.tags?.some(tg => tg.toLowerCase().includes(q)) ?? false)
      })
      .filter(n => {
        if (!addrFilter) return true
        return n.creator.toLowerCase().includes(addrFilter.toLowerCase())
      })
      .filter(n => {
        if (!cutoff) return true
        return new Date(n.created_at) >= cutoff
      })
      .sort((a, b) => {
        if (sortBy === 'oldest')       return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'price_asc')    return (a.price ?? 0) - (b.price ?? 0)
        if (sortBy === 'price_desc')   return (b.price ?? 0) - (a.price ?? 0)
        if (sortBy === 'most_sold')    return (b.sold_count ?? 0) - (a.sold_count ?? 0)
        if (sortBy === 'most_records') return b.record_ids.length - a.record_ids.length
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [tab, search, addrFilter, timeFilter, sortBy, myAddr])

  const totalSold = DEMO_NFTS.reduce((s, n) => s + (n.sold_count ?? 0), 0)

  const SORT_OPTIONS: [SortBy, string][] = [
    ['newest',       t('mkt_sort_newest')],
    ['oldest',       t('mkt_sort_oldest')],
    ['price_asc',    t('mkt_sort_price_asc')],
    ['price_desc',   t('mkt_sort_price_desc')],
    ['most_sold',    t('mkt_sort_sold')],
    ['most_records', t('mkt_sort_records')],
  ]

  const TIME_OPTIONS: [TimeFilter, string][] = [
    ['all',    t('mkt_time_all')],
    ['week',   t('mkt_time_week')],
    ['month',  t('mkt_time_month')],
    ['3month', t('mkt_time_3month')],
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <NavBar />

      <main style={{ paddingTop: '60px' }}>
        <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: '36px' }}
          >
            <div style={{ fontSize: '44px', marginBottom: '12px' }}>💎</div>
            <h1 style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {t('mkt_title')}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
              {t('mkt_subtitle')}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}
          >
            {[
              { label: t('mkt_stat_listed'),   value: DEMO_NFTS.length, icon: '📚' },
              { label: t('mkt_stat_sold'),      value: totalSold.toLocaleString(), icon: '🤝' },
              { label: t('mkt_stat_creators'),  value: '89', icon: '✍️' },
            ].map(s => (
              <div key={s.label} style={{
                padding: '20px', textAlign: 'center', borderRadius: '16px',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '26px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}
          >
            {(['all', 'mine'] as Tab[]).map(tabVal => (
              <button
                key={tabVal}
                onClick={() => setTab(tabVal)}
                style={{
                  padding: '9px 22px', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: tab === tabVal ? 600 : 400,
                  border: tab === tabVal ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                  background: tab === tabVal ? 'var(--bg-subtle)' : 'var(--bg-card)',
                  color: tab === tabVal ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {tabVal === 'all' ? t('mkt_tab_all') : t('mkt_tab_mine')}
              </button>
            ))}

            {/* List button on right */}
            <div style={{ marginLeft: 'auto' }}>
              <button
                onClick={() => setSellOpen(o => !o)}
                style={{
                  padding: '9px 20px', borderRadius: '10px', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600,
                  border: sellOpen ? '2px solid var(--gold)' : '1px solid var(--border)',
                  background: sellOpen ? 'var(--gold-light)' : 'var(--bg-card)',
                  color: sellOpen ? 'var(--gold)' : 'var(--text-secondary)',
                  transition: 'all 0.15s',
                }}
              >
                {t('mkt_sell_btn')}
              </button>
            </div>
          </motion.div>

          {/* Sell Panel */}
          <AnimatePresence>
            {sellOpen && <SellPanel />}
          </AnimatePresence>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.16 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px', alignItems: 'center' }}
          >
            {/* Keyword search */}
            <input
              type="text"
              className="input"
              placeholder={t('mkt_search_ph')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: '1 1 200px', minWidth: '180px' }}
            />

            {/* Creator address */}
            <input
              type="text"
              className="input"
              placeholder={t('mkt_addr_ph')}
              value={addrFilter}
              onChange={e => setAddrFilter(e.target.value)}
              style={{ flex: '1 1 180px', minWidth: '160px' }}
            />

            {/* Time filter */}
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {TIME_OPTIONS.map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setTimeFilter(val)}
                  style={{
                    padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
                    border: timeFilter === val ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                    background: timeFilter === val ? 'var(--bg-subtle)' : 'var(--bg-card)',
                    color: timeFilter === val ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: timeFilter === val ? 600 : 400,
                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortBy)}
              className="input"
              style={{ minWidth: '140px', cursor: 'pointer' }}
            >
              {SORT_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </motion.div>

          {/* Results count */}
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            {filtered.length} / {DEMO_NFTS.length} {t('mkt_stat_listed')}
          </div>

          {/* Grid */}
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ textAlign: 'center', padding: '80px 0' }}
              >
                <div style={{ fontSize: '44px', marginBottom: '14px' }}>🔍</div>
                {tab === 'mine' ? (
                  <>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '12px' }}>
                      {t('mkt_no_mine')}
                    </p>
                    <p style={{ color: 'var(--gold)', fontSize: '13px', cursor: 'pointer' }}>
                      {t('mkt_go_records')}
                    </p>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{t('mkt_empty')}</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '20px',
                }}
              >
                {filtered.map((nft, i) => (
                  <motion.div
                    key={nft.mint}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <NFTCard nft={nft} index={DEMO_NFTS.indexOf(nft)} onBuy={setBuyingNft} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div style={{
            marginTop: '56px', padding: '18px 24px', borderRadius: '14px',
            background: 'var(--bg-subtle)', textAlign: 'center',
            border: '1px solid var(--border)',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              {t('mkt_footer')}
            </p>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {buyingNft && (
          <BuyModal nft={buyingNft} onClose={() => setBuyingNft(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
