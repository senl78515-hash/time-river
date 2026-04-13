'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NavBar } from '@/components/common/NavBar'
import { DestinyPulse } from '@/components/pulse/DestinyPulse'
import type { BaziResult } from '@/types'

interface Profile {
  name: string
  gender: 'male' | 'female'
  birth_date: string
  birth_time: string
  birth_province: string
  birth_city: string
}

const TEN_GOD_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  比肩: { bg: '#EEF3FB', text: '#4A6FA5', border: '#C5D8F0' },
  劫财: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' },
  食神: { bg: '#F0FDF4', text: '#16a34a', border: '#BBF7D0' },
  伤官: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  正财: { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  偏财: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  正官: { bg: '#F0F9FF', text: '#0369A1', border: '#BAE6FD' },
  七杀: { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
  正印: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  偏印: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
}

const FIVE_ELEMENT_COLORS: Record<string, string> = {
  木: '#4D7C0F', 火: '#C2410C', 土: '#92400E', 金: '#525252', 水: '#1D4ED8',
}

const QUICK_ACTIONS = [
  { icon: '✍️', label: '写下此刻', desc: '记录你正在经历的', href: '/records?new=true', color: '#1C1917' },
  { icon: '✦', label: '查看命书', desc: '七维度 AI 深度解读', href: '/destiny', color: '#B8860B' },
  { icon: '📖', label: '时光之河', desc: '浏览所有记录', href: '/records', color: '#4A6FA5' },
  { icon: '💎', label: '经验市场', desc: '将经历变成资产', href: '/marketplace', color: '#7C3AED' },
]

const INSPIRATIONS = [
  '今天有什么让你感到意外的瞬间？',
  '此刻，你最想对一年后的自己说什么？',
  '今天你学到了什么，哪怕只是一点点？',
  '有什么事情，让你感到心里暖暖的？',
  '如果用一种天气形容今天，是什么？',
  '今天最让你骄傲的一个小决定是什么？',
]

export default function HomePage() {
  const { connected } = useWallet()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [bazi, setBazi] = useState<BaziResult | null>(null)
  const [inspiration, setInspiration] = useState('')
  const [recordCount, setRecordCount] = useState(0)
  const today = new Date()

  useEffect(() => {
    const stored = localStorage.getItem('tr_profile')
    if (stored) {
      const p: Profile = JSON.parse(stored)
      setProfile(p)
      fetchBazi(p)
    }
    setInspiration(INSPIRATIONS[Math.floor(Math.random() * INSPIRATIONS.length)])
  }, [])

  const fetchBazi = async (p: Profile) => {
    try {
      const res = await fetch('/api/bazi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birth_date: p.birth_date,
          birth_time: p.birth_time,
          birth_province: p.birth_province,
          birth_city: p.birth_city,
          gender: p.gender,
          is_lunar: false,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setBazi(data.bazi)
      }
    } catch { /* 静默 */ }
  }

  const tenGodStyle = bazi ? (TEN_GOD_COLOR[bazi.day_ten_god] || TEN_GOD_COLOR['比肩']) : null
  const totalScore = bazi ? Object.values(bazi.five_elements_score).reduce((a, b) => a + b, 0) : 1

  const weekday = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()]
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日 · 周${weekday}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <NavBar bazi={bazi ?? undefined} />
      <DestinyPulse bazi={bazi ?? undefined} />

      <main style={{ paddingTop: '60px' }}>
        <div className="page-container" style={{ paddingTop: '32px', paddingBottom: '60px' }}>

          {/* ── 顶部问候 ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '32px' }}
          >
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              {dateStr}
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {profile ? `${profile.name}，今天好 👋` : '你好 👋'}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {connected ? '钱包已连接，记录将加密存证到区块链' : '连接钱包后可永久保存你的时光记录'}
            </p>
          </motion.div>

          {/* ── 主区域：今日天时 + 快速操作 ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', marginBottom: '24px' }}>

            {/* 左：今日天时大卡片 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-lg"
              style={{ padding: '28px', minHeight: '200px' }}
            >
              {bazi ? (
                <>
                  {/* 十神 */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    padding: '6px 14px', borderRadius: '20px',
                    background: tenGodStyle?.bg, border: `1px solid ${tenGodStyle?.border}`,
                    marginBottom: '16px',
                  }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: tenGodStyle?.text }}>
                      {bazi.day_ten_god}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>今日流日</span>
                  </div>

                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '20px' }}>
                    {bazi.day_ten_god_description}
                  </p>

                  {/* 五行分布 */}
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '10px', letterSpacing: '0.05em' }}>
                      五行气场
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(bazi.five_elements_score).map(([el, score]) => (
                        <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: FIVE_ELEMENT_COLORS[el], width: '14px' }}>{el}</span>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                            <motion.div
                              style={{ height: '100%', background: FIVE_ELEMENT_COLORS[el], borderRadius: '3px' }}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round(score / totalScore * 100)}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', width: '32px', textAlign: 'right' }}>
                            {Math.round(score / totalScore * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : profile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px' }}>
                  <div className="loading-dots" style={{ marginBottom: '12px' }}><span /><span /><span /></div>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>正在计算今日天时...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '160px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>☯</div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    建立命理档案后<br />查看今日天时与五行气场
                  </p>
                  <Link href="/onboarding">
                    <button className="btn-primary" style={{ padding: '10px 20px' }}>建立档案</button>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* 右：今日灵感 */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              {/* 今日一问 */}
              <div className="card-lg" style={{ padding: '24px', flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  今日一问
                </p>
                <p style={{ fontSize: '16px', color: 'var(--text-primary)', lineHeight: 1.7, fontWeight: 500 }}>
                  {inspiration}
                </p>
                <Link href="/records?new=true" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary" style={{ marginTop: '16px', width: '100%', padding: '11px' }}>
                    ✍️ 写下我的回答
                  </button>
                </Link>
              </div>

              {/* 记录统计 */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>记录总数</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{recordCount}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>连续记录</p>
                    <p style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>🔥 7天</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── 快速操作 ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '32px' }}
          >
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '14px' }}>
              快速开始
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {QUICK_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Link href={action.href} style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '20px', cursor: 'pointer' }}>
                      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{action.icon}</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{action.label}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{action.desc}</div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── 四柱一览（有档案时显示）── */}
          {bazi && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  四柱简览
                </h2>
                <Link href="/destiny" style={{ fontSize: '13px', color: 'var(--blue)', textDecoration: 'none' }}>
                  查看完整命书 →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {[
                  { label: '年柱', pillar: bazi.year_pillar },
                  { label: '月柱', pillar: bazi.month_pillar },
                  { label: '日柱', pillar: bazi.day_pillar },
                  { label: '时柱', pillar: bazi.hour_pillar },
                ].map(({ label, pillar }) => (
                  <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>{label}</div>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '4px' }}>
                      {pillar.stem}
                    </div>
                    <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '8px auto' }} />
                    <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '4px' }}>
                      {pillar.branch}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
