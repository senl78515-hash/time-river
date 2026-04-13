'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { NavBar } from '@/components/common/NavBar'
import type { ExperienceNFT } from '@/types'

const DEMO_NFTS: ExperienceNFT[] = [
  {
    mint: 'Fg6PaFpoh7u9JMgBT8UfJJJJxXDvAWmtgSKRPpfFpHjG',
    title: '2024 年灵魂独白',
    description: '一整年的内心旅程，从迷茫到清醒，记录了 47 条私密日记',
    record_ids: Array.from({ length: 47 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://abc123',
    creator: '8xvn...Km9p',
    price: 0.5,
    royalty_bps: 500,
    created_at: '2024-12-31T00:00:00Z',
  },
  {
    mint: '3vYm8JKaZ8hE1pGN7XwSuGgKBLmj5nFr2qVeTT7nYR4s',
    title: '深圳创业三年',
    description: '从月薪 5000 到第一次融资，18 个月的血泪创业史',
    record_ids: Array.from({ length: 89 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://def456',
    creator: 'AK12...9mPq',
    price: 1.2,
    royalty_bps: 800,
    created_at: '2024-09-15T00:00:00Z',
  },
  {
    mint: 'Jm7KsVnQ2pWxZ9fRdT4bL6eC1uMYh8kEgNaOiDvFwRcA',
    title: '异国恋 300 天',
    description: '跨越十三个时区的思念，被时光冲刷却愈发清晰的脸',
    record_ids: Array.from({ length: 300 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://ghi789',
    creator: 'Bm4n...7xKw',
    price: 0.3,
    royalty_bps: 1000,
    created_at: '2024-07-01T00:00:00Z',
  },
  {
    mint: 'P9kTsZ3WmF7uBnN5yHxQjR4eVgC2aKdL8oMiE6vDwJXs',
    title: '马拉松备赛日记',
    description: '从不能跑 5km 到完成全马，6 个月蜕变全记录',
    record_ids: Array.from({ length: 156 }, (_, i) => `rec_${i}`),
    arweave_cid: 'ar://jkl012',
    creator: 'Cn5o...8yLx',
    price: 0.8,
    royalty_bps: 500,
    created_at: '2024-11-20T00:00:00Z',
  },
]

const COVER_COLORS = [
  { from: '#FEF3C7', to: '#FDE68A', accent: '#B8860B' },
  { from: '#EEF3FB', to: '#C5D8F0', accent: '#4A6FA5' },
  { from: '#F0FDF4', to: '#BBF7D0', accent: '#16a34a' },
  { from: '#F5F3FF', to: '#DDD6FE', accent: '#7C3AED' },
]

type SortBy = 'newest' | 'price_low' | 'price_high' | 'popular'

function NFTCard({ nft, index, onBuy }: { nft: ExperienceNFT; index: number; onBuy: (nft: ExperienceNFT) => void }) {
  const date = new Date(nft.created_at)
  const dateStr = date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
  const colors = COVER_COLORS[index % COVER_COLORS.length]

  return (
    <motion.div
      className="card"
      style={{ overflow: 'hidden', cursor: 'pointer' }}
      whileHover={{ scale: 1.02, y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* 封面 */}
      <div style={{
        height: '140px', position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '48px', opacity: 0.25 }}>📖</span>
        </div>
        <div style={{
          position: 'absolute', top: '10px', left: '10px',
          padding: '3px 10px', borderRadius: '20px',
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
          fontSize: '11px', color: colors.accent, fontWeight: 600,
        }}>
          {nft.record_ids.length} 条记录
        </div>
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          padding: '3px 10px', borderRadius: '20px',
          background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)',
          fontSize: '11px', color: 'var(--gold)', fontWeight: 600,
        }}>
          NFT
        </div>
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px',
          fontSize: '11px', color: colors.accent, opacity: 0.7,
        }}>
          版税 {nft.royalty_bps / 100}%
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          {nft.title}
        </h3>
        <p style={{
          fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6,
          marginBottom: '12px', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {nft.description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          <span>作者 {nft.creator}</span>
          <span>{dateStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {nft.price} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>SOL</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              ≈ ¥{((nft.price ?? 0) * 800).toFixed(0)}
            </div>
          </div>
          <button
            onClick={() => onBuy(nft)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            购买
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function BuyModal({ nft, onClose }: { nft: ExperienceNFT; onClose: () => void }) {
  const { connected } = useWallet()
  const [step, setStep] = useState<'confirm' | 'buying' | 'done'>('confirm')

  const handleBuy = async () => {
    if (!connected) return
    setStep('buying')
    await new Promise(resolve => setTimeout(resolve, 2000))
    setStep('done')
  }

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        background: 'rgba(28, 25, 23, 0.5)', backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card-lg"
        style={{ width: '100%', maxWidth: '420px', padding: '28px' }}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {step === 'confirm' && (
          <>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
              确认购买
            </h3>
            <div style={{
              padding: '14px', borderRadius: '12px',
              background: 'var(--bg-subtle)', marginBottom: '16px',
            }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {nft.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{nft.description}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>商品价格</span><span>{nft.price} SOL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>版税（{nft.royalty_bps / 100}%）</span>
                <span>{((nft.price ?? 0) * nft.royalty_bps / 10000).toFixed(4)} SOL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>网络费</span><span>~0.000005 SOL</span>
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                color: 'var(--text-primary)', fontWeight: 600,
                borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px',
              }}>
                <span>合计</span>
                <span style={{ color: 'var(--gold)' }}>{nft.price} SOL</span>
              </div>
            </div>
            {!connected && (
              <p style={{ color: 'var(--gold)', fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
                请先连接钱包
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={onClose} className="btn-outline" style={{ flex: 1, padding: '12px' }}>取消</button>
              <button
                onClick={handleBuy}
                disabled={!connected}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', opacity: connected ? 1 : 0.4 }}
              >
                确认支付
              </button>
            </div>
          </>
        )}

        {step === 'buying' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <motion.div
              style={{ fontSize: '48px', marginBottom: '16px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              ⏳
            </motion.div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Solana 链上交易处理中...</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>请在钱包中确认交易</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <motion.div
              style={{ fontSize: '52px', marginBottom: '16px' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              🎉
            </motion.div>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>购买成功！</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              NFT 已转入你的钱包，可在「我的记录」查看
            </p>
            <button onClick={onClose} className="btn-primary" style={{ padding: '12px 32px' }}>完成</button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function MarketplacePage() {
  const [nfts] = useState<ExperienceNFT[]>(DEMO_NFTS)
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [search, setSearch] = useState('')
  const [buyingNft, setBuyingNft] = useState<ExperienceNFT | null>(null)
  const [myListingMode, setMyListingMode] = useState(false)

  const filtered = nfts
    .filter(n => {
      if (!search) return true
      const q = search.toLowerCase()
      return n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return (a.price ?? 0) - (b.price ?? 0)
      if (sortBy === 'price_high') return (b.price ?? 0) - (a.price ?? 0)
      if (sortBy === 'popular') return b.record_ids.length - a.record_ids.length
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <NavBar />

      <main style={{ paddingTop: '60px' }}>
        <div className="page-container" style={{ paddingTop: '40px', paddingBottom: '80px' }}>

          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: '40px' }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>💎</div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              经验市场
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              每一段真实经历，都值得被珍视 · 以 NFT 形式永久传承
            </p>
          </motion.div>

          {/* 统计 */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}
          >
            {[
              { label: '上架经历', value: nfts.length, icon: '📚' },
              { label: '成交总量', value: '1,247', icon: '🤝' },
              { label: '创作者', value: '89', icon: '✍️' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{s.icon}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* 搜索 + 排序 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
            <input
              type="text"
              className="input"
              placeholder="搜索经历..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {([
                ['newest', '最新'],
                ['price_low', '价格↑'],
                ['price_high', '价格↓'],
                ['popular', '最多记录'],
              ] as [SortBy, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setSortBy(val)}
                  style={{
                    padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                    border: sortBy === val ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                    background: sortBy === val ? 'var(--bg-subtle)' : 'var(--bg-card)',
                    color: 'var(--text-primary)', fontWeight: sortBy === val ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMyListingMode(m => !m)}
              style={{
                padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                border: myListingMode ? '2px solid var(--gold)' : '1px solid var(--border)',
                background: myListingMode ? 'var(--gold-light)' : 'var(--bg-card)',
                color: myListingMode ? 'var(--gold)' : 'var(--text-secondary)',
                fontWeight: myListingMode ? 600 : 400, transition: 'all 0.15s',
              }}
            >
              + 出售我的经历
            </button>
          </div>

          {/* 出售提示 */}
          <AnimatePresence>
            {myListingMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginBottom: '24px' }}
              >
                <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--gold)' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>
                    将你的经历铸造为 NFT
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                    选择你的记录，设置价格，每次转手你将获得版税收益
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {[
                      { step: '①', text: '选择记录' },
                      { step: '②', text: '设置价格' },
                      { step: '③', text: 'Mint & 上架' },
                    ].map(item => (
                      <div key={item.step} style={{
                        padding: '14px', borderRadius: '12px',
                        background: 'var(--bg-subtle)', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '18px', color: 'var(--gold)', marginBottom: '4px' }}>{item.step}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.text}</div>
                      </div>
                    ))}
                  </div>
                  <button className="btn-primary" style={{ width: '100%', padding: '13px' }}>
                    前往「我的记录」选择要出售的内容
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* NFT 网格 */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
              <p style={{ color: 'var(--text-muted)' }}>未找到匹配经历</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {filtered.map((nft, i) => (
                <motion.div
                  key={nft.mint}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <NFTCard nft={nft} index={i} onBuy={setBuyingNft} />
                </motion.div>
              ))}
            </div>
          )}

          {/* 底部说明 */}
          <div style={{
            marginTop: '48px', padding: '20px', borderRadius: '12px',
            background: 'var(--bg-subtle)', textAlign: 'center',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              经验市场由 Solana 区块链 + Metaplex 协议驱动 · 所有交易链上可查 · Time River 收取 2.5% 平台费
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
