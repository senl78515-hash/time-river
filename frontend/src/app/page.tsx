'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(m => m.WalletMultiButton),
  { ssr: false }
)

// ── 词云（每个词带有专属颜色）─────────────────────────────────
const WORDS = [
  // 金色系：命运/改变
  { text: '频繁记录能改命',     size: 28, weight: 700, color: '#A07020' },
  { text: '命运因觉察而转',     size: 26, weight: 700, color: '#B8860B' },
  { text: '每一条记录都在改写命运', size: 22, weight: 600, color: '#9A6B1A' },
  { text: '改变就已发生',       size: 20, weight: 600, color: '#C49A3C' },
  { text: '觉察是第一步',       size: 16, weight: 500, color: '#B8951E' },

  // 蓝色系：时间/永恒/链上
  { text: '写下来就是永恒',     size: 22, weight: 600, color: '#2B5FA0' },
  { text: '文字是时间的琥珀',   size: 24, weight: 700, color: '#3B6FA0' },
  { text: '链上存证永不磨灭',   size: 18, weight: 500, color: '#1E5D9B' },
  { text: '记忆会褪色',         size: 16, weight: 400, color: '#4A7AB8' },
  { text: '文字不会',           size: 20, weight: 600, color: '#2A4F8A' },
  { text: '看见过去',           size: 15, weight: 400, color: '#5B82B8' },
  { text: '才能看清未来',       size: 17, weight: 500, color: '#3D6090' },

  // 绿色系：觉察/成长/记录
  { text: '觉察即是改变',       size: 24, weight: 600, color: '#2D6B3A' },
  { text: '记录让你看见自己',   size: 26, weight: 700, color: '#3B8048' },
  { text: '持续记录七天',       size: 16, weight: 400, color: '#356B40' },
  { text: '你会发现不一样的自己', size: 20, weight: 500, color: '#2A5E35' },
  { text: '当你开始记录',       size: 16, weight: 400, color: '#48885A' },

  // 紫色系：思考/感受/内心
  { text: '记录让混沌变清晰',   size: 22, weight: 600, color: '#6B3A9B' },
  { text: '你是自己生命的作者', size: 22, weight: 600, color: '#7B4BA8' },
  { text: '写给未来的自己',     size: 20, weight: 500, color: '#5A2E8A' },
  { text: '用文字锚定当下',     size: 18, weight: 500, color: '#8B5FC8' },
  { text: '今日所思',           size: 17, weight: 500, color: '#7040A8' },
  { text: '明日所得',           size: 19, weight: 600, color: '#6030A0' },

  // 玫瑰/暖红系：情感/感受
  { text: '把感受写下来',       size: 18, weight: 500, color: '#9B3A50' },
  { text: '情绪就有了出口',     size: 20, weight: 500, color: '#C04060' },
  { text: '每一个瞬间都值得',   size: 22, weight: 600, color: '#8A2840' },
  { text: '回望来路',           size: 16, weight: 400, color: '#B04868' },
  { text: '才知去向',           size: 18, weight: 500, color: '#9C3858' },

  // 青色/水色系：河流/流动
  { text: '把生活过成故事',     size: 19, weight: 500, color: '#1E7070' },
  { text: '你记录的就是你在乎的', size: 17, weight: 500, color: '#258888' },
  { text: '过去塑造今天的你',   size: 19, weight: 500, color: '#2B8080' },
  { text: '生命中的微小瞬间',   size: 16, weight: 400, color: '#1E6868' },
  { text: '才是最珍贵的',       size: 18, weight: 500, color: '#307878' },
]

interface WordPosition {
  text: string; size: number; weight: number; color: string
  x: number; y: number; rotate: number; opacity: number; delay: number
}

function generateWordCloud(width: number, height: number): WordPosition[] {
  const cx = width / 2
  const cy = height * 0.44
  const positions: WordPosition[] = []

  WORDS.forEach((word, i) => {
    // 螺旋 + 随机扰动，密度由外向内递减
    const t = (i / WORDS.length)
    const spiralAngle = t * Math.PI * 5.5 + i * 0.27
    // 内环半径小（中心留白给 CTA），外环大
    const minR = 0.22
    const maxR = 0.82
    const r = minR + (maxR - minR) * Math.pow(t, 0.55)
    const rx = width  * r * 0.50
    const ry = height * r * 0.34

    const jx = (Math.random() - 0.5) * width  * 0.06
    const jy = (Math.random() - 0.5) * height * 0.05

    const rawX = cx + rx * Math.cos(spiralAngle) + jx
    const rawY = cy + ry * Math.sin(spiralAngle) + jy

    // 避开中心 CTA 区域（半径约 200px）
    const dx = rawX - cx, dy = rawY - cy
    const distFromCenter = Math.sqrt(dx * dx + dy * dy)
    const scaledX = distFromCenter < 200
      ? cx + (dx / Math.max(distFromCenter, 1)) * (200 + Math.random() * 60)
      : rawX

    const charLen = word.text.length * word.size * 0.56
    positions.push({
      ...word,
      x: Math.max(charLen / 2 + 10, Math.min(width - charLen / 2 - 10, scaledX)),
      y: Math.max(70, Math.min(height - 80, rawY)),
      rotate: (Math.random() - 0.5) * 22,
      opacity: 0.35 + Math.random() * 0.55,
      delay: i * 0.045,
    })
  })
  return positions
}

// ── 示例记录卡片 ──────────────────────────────────────────────
const SAMPLE_CARDS = [
  {
    icon: '✍️', color: '#3D2B1F', soft: '#FAF6F0', border: '#E8DDD0',
    tag: '今日记录', time: '2小时前', encrypted: true,
    text: '在黑客松现场第一次见到了真正同频的人。我们的对话不需要铺垫，直接进入彼此内心……',
  },
  {
    icon: '✦', color: '#A87C2A', soft: '#FBF7EE', border: '#EDD89A',
    tag: '命理洞见', time: '今日', encrypted: false,
    text: '今日正财当道，宜沉稳推进长期计划，避免冲动决策。水木相生，灵感与执行力同步上线。',
  },
  {
    icon: '🌤️', color: '#2B6FA8', soft: '#EEF5FC', border: '#BDD4EE',
    tag: '情绪气象', time: '昨天', encrypted: true,
    text: '今天的心情像是雨后的晴天。有一种说不清楚的轻盈感，仿佛卸下了什么一直压着的重量……',
  },
  {
    icon: '🌟', color: '#5A2E8A', soft: '#F5F0FE', border: '#D4B8F8',
    tag: '感恩三事', time: '3天前', encrypted: false,
    text: '一、妈妈发来一张老照片，那时候我还很小。二、地铁里有人给老人让座。三、今天的咖啡刚好合适。',
  },
]

const FEATURES = [
  { icon: '🔐', title: 'AES-256 端对端加密', desc: '加密密钥由私钥派生，平台永远无法读取你的内容', color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE' },
  { icon: '♾️', title: 'Arweave 永久存储',   desc: '每条记录上传 Arweave，200 年不消失，无需续费',  color: '#065F46', bg: '#ECFDF5', border: '#A7F3D0' },
  { icon: '✦',  title: 'AI 东西方命理引擎', desc: '八字十神 × 占星流年，七维度 AI 深度解读命格',    color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  { icon: '⛓',  title: 'Solana 链上存证',   desc: '记录生成 SBT 勋章，铸造 cNFT 成为生命资产',     color: '#1E3A8A', bg: '#EEF4FF', border: '#BFDBFE' },
]

const HOW_IT_WORKS = [
  { title: '连接钱包', desc: '用 Phantom / Solflare 登录，钱包即身份，无需注册', icon: '👛', color: '#A87C2A' },
  { title: '输入生辰排盘', desc: '一次输入，AI 生成七维命书，数据永远属于你',   icon: '✦',  color: '#7C3AED' },
  { title: '开始记录人生', desc: '每天写下所思所感，链上永存，AI 持续解读命运', icon: '🌊', color: '#0369A1' },
]

// ── 背景光晕 Blob ─────────────────────────────────────────────
const BLOBS = [
  { color: 'rgba(168,124,42,0.22)',  size: '70vw', top: '-25%', left: '-20%',  dur: 9,  delay: 0 },
  { color: 'rgba(93,154,181,0.22)', size: '60vw', top: '-15%', right: '-18%', dur: 11, delay: 2 },
  { color: 'rgba(155,100,200,0.16)',size: '55vw', bottom: '-20%', left: '-10%', dur: 13, delay: 1 },
  { color: 'rgba(190,80,110,0.14)', size: '50vw', bottom: '-15%', right: '-12%', dur: 10, delay: 3 },
  { color: 'rgba(45,130,80,0.13)',  size: '45vw', top: '25%',  left: '10%',  dur: 14, delay: 4 },
]

export default function LandingPage() {
  const { connected } = useWallet()
  const router = useRouter()
  const [words, setWords] = useState<WordPosition[]>([])
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState(0)

  useEffect(() => {
    const update = () => setWords(generateWordCloud(window.innerWidth, window.innerHeight))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveCard(p => (p + 1) % SAMPLE_CARDS.length), 3200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (connected) {
      router.push(localStorage.getItem('tr_profile') ? '/home' : '/onboarding')
    }
  }, [connected, router])

  return (
    <div style={{ background: '#F2EDE6', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* ═══════════════════════════════════════════════════════
          HERO（全屏）
      ══════════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

        {/* ── 动态光晕背景 ── */}
        {BLOBS.map((b, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: b.size, height: b.size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
              filter: 'blur(72px)',
              ...(b.top    !== undefined ? { top: b.top }       : {}),
              ...(b.bottom !== undefined ? { bottom: b.bottom } : {}),
              ...(b.left   !== undefined ? { left: b.left }     : {}),
              ...(b.right  !== undefined ? { right: b.right }   : {}),
            }}
            animate={{ scale: [1, 1.12, 1], x: [0, i % 2 === 0 ? 18 : -18, 0], y: [0, i % 2 === 0 ? -12 : 12, 0] }}
            transition={{ duration: b.dur, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
          />
        ))}

        {/* ── 细粒度噪点纹理（增加质感）── */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.035, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px',
        }} />

        {/* ── 彩色词云层 ── */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: hoveredWord === word.text ? 1 : word.opacity, scale: 1 }}
              transition={{ delay: word.delay, duration: 0.65, ease: 'easeOut' }}
              onMouseEnter={() => setHoveredWord(word.text)}
              onMouseLeave={() => setHoveredWord(null)}
              style={{
                position: 'absolute', left: word.x, top: word.y,
                transform: `translate(-50%, -50%) rotate(${word.rotate}deg)`,
                fontSize: word.size, fontWeight: word.weight,
                color: hoveredWord === word.text ? '#fff' : word.color,
                textShadow: hoveredWord === word.text
                  ? `0 0 20px ${word.color}, 0 0 40px ${word.color}88`
                  : 'none',
                background: hoveredWord === word.text ? word.color : 'transparent',
                padding: hoveredWord === word.text ? '2px 8px' : '0',
                borderRadius: hoveredWord === word.text ? '6px' : '0',
                whiteSpace: 'nowrap', pointerEvents: 'auto', cursor: 'default',
                userSelect: 'none', lineHeight: 1.2,
                transition: 'all 0.25s ease',
              }}
            >
              {word.text}
            </motion.span>
          ))}
        </div>

        {/* ── 中心玻璃渐变遮罩 ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 52% 52% at 50% 48%, rgba(242,237,230,0.94) 0%, rgba(242,237,230,0.62) 48%, transparent 100%)',
          ].join(','),
        }} />

        {/* ── 中心主内容 ── */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center', zIndex: 10, width: '100%', maxWidth: 500, padding: '0 24px',
        }}>
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9 }}>

            {/* Logo 光晕 */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
              <motion.div
                style={{ fontSize: 56 }}
                className="float"
                animate={{ filter: ['drop-shadow(0 0 0px rgba(93,154,181,0))', 'drop-shadow(0 0 18px rgba(93,154,181,0.5))', 'drop-shadow(0 0 0px rgba(93,154,181,0))'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >🌊</motion.div>
            </div>

            <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: '-0.035em', marginBottom: 4, lineHeight: 1.05,
              background: 'linear-gradient(135deg, #1A1714 0%, #3D2B1F 45%, #2B5FA0 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Time River
            </h1>
            <p style={{ fontSize: 15, color: '#8B7355', marginBottom: 5, letterSpacing: '0.04em' }}>时光流</p>
            <p style={{ fontSize: 18, color: '#4A3D30', marginBottom: 34, fontWeight: 500, letterSpacing: '-0.01em' }}>
              记录即修行，觉察即改命
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 11 }}>
              <WalletMultiButton />

              <Link href="/home" style={{ textDecoration: 'none', width: '100%', maxWidth: 296 }}>
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(26,23,20,0.12)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '13px 24px', borderRadius: 14,
                    border: '1.5px solid rgba(168,124,42,0.35)',
                    background: 'rgba(255,252,245,0.88)',
                    backdropFilter: 'blur(12px)',
                    fontSize: 14, fontWeight: 600, color: '#4A3D30',
                    cursor: 'pointer', width: '100%',
                    boxShadow: '0 2px 12px rgba(168,124,42,0.12)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>👀</span>
                  <span>无需钱包，先浏览体验</span>
                  <span style={{ color: '#A87C2A', fontWeight: 700 }}>→</span>
                </motion.div>
              </Link>

              <p style={{ fontSize: 11.5, color: '#9B8870', marginTop: 2, letterSpacing: '0.02em' }}>
                支持 Phantom · Solflare · Backpack
              </p>
            </div>

            {/* 小标签装饰 */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2, duration: 0.8 }}
              style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}
            >
              {[
                { text: '🔐 AES-256', color: '#4338CA', bg: 'rgba(67,56,202,0.08)' },
                { text: '♾️ Arweave', color: '#065F46', bg: 'rgba(6,95,70,0.08)' },
                { text: '✦ AI 命理',  color: '#92400E', bg: 'rgba(146,64,14,0.08)' },
                { text: '⛓ Solana',  color: '#1E3A8A', bg: 'rgba(30,58,138,0.08)' },
              ].map(t => (
                <span key={t.text} style={{
                  fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                  color: t.color, background: t.bg,
                  border: `1px solid ${t.color}22`,
                }}>
                  {t.text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* 向下指引 */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 1 }}
          style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
        >
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 2, repeat: Infinity }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              fontSize: 11, color: '#9B8870', letterSpacing: '0.07em' }}
          >
            <span>探索更多</span>
            <span style={{ fontSize: 18 }}>↓</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          示例卡片 + 数字亮点
      ══════════════════════════════════════════════════════════ */}
      <div style={{ background: 'linear-gradient(180deg, #EDE8E0 0%, #EEF5FB 60%, #EDE8E0 100%)', padding: '96px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.7 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}
          >
            {/* 左：轮播卡片 */}
            <div>
              <div style={{ position: 'relative', height: 300 }}>
                <AnimatePresence mode="wait">
                  {SAMPLE_CARDS.map((card, i) => i !== activeCard ? null : (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 24, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.96 }}
                      transition={{ duration: 0.55 }}
                      style={{
                        position: 'absolute', inset: 0,
                        background: '#FFFFFF',
                        borderRadius: 24, border: `1.5px solid ${card.border}`,
                        padding: '28px 30px',
                        boxShadow: '0 12px 48px rgba(26,23,20,0.10)',
                        display: 'flex', flexDirection: 'column', gap: 14,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: card.soft, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {card.icon}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: card.color }}>{card.tag}</div>
                            <div style={{ fontSize: 11, color: '#9B8870' }}>{card.time}</div>
                          </div>
                        </div>
                        {card.encrypted && (
                          <span style={{ fontSize: 11, color: '#4338CA', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 20, padding: '3px 10px', fontWeight: 600 }}>
                            🔐 加密
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 15, color: '#2A1F14', lineHeight: 1.85, fontWeight: 400 }}>{card.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto' }}>
                        <span style={{ fontSize: 11, color: '#9B8870' }}>⛓ Arweave 永久存储 · Solana 存证</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {/* 切换点 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 20 }}>
                {SAMPLE_CARDS.map((_, i) => (
                  <div key={i} onClick={() => setActiveCard(i)} style={{
                    width: i === activeCard ? 22 : 7, height: 7, borderRadius: 4,
                    background: i === activeCard ? '#5D9AB5' : '#D4C9BA',
                    transition: 'all 0.3s', cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>

            {/* 右：文案 + 数字 */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#5D9AB5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                你的人生值得被永久记录
              </div>
              <h2 style={{ fontSize: 38, fontWeight: 900, letterSpacing: '-0.025em', color: '#1A1714', lineHeight: 1.15, marginBottom: 18 }}>
                每一条记录<br />都在悄悄改写命运
              </h2>
              <p style={{ fontSize: 16, color: '#6B5A48', lineHeight: 1.85, marginBottom: 36 }}>
                Time River 将你的生活片段、情绪洞见与命理数据永久融合，构建一条只属于你的、链上可证的生命长河。
              </p>
              <div style={{ display: 'flex', gap: 28 }}>
                {[
                  { n: '200年', l: 'Arweave 存储寿命', c: '#065F46' },
                  { n: '7维度', l: 'AI 命书解读深度',  c: '#6B3A9B' },
                  { n: '0泄露', l: '端对端加密保障',   c: '#C04060' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 30, fontWeight: 900, color: s.c, lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: 12, color: '#9B8870', marginTop: 5 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          核心特性 4 列
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '96px 24px', background: '#F2EDE6' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', color: '#1A1714', marginBottom: 12 }}>
              市场唯一同时融合五个维度的协议
            </h2>
            <p style={{ fontSize: 15, color: '#8B7355' }}>没有中间商，没有数据泄露，只有你和你的命运</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                whileHover={{ y: -6, boxShadow: '0 16px 48px rgba(26,23,20,0.13)' }}
                style={{
                  background: '#FFFFFF', borderRadius: 22, padding: '28px 22px',
                  border: `1.5px solid ${f.border}`,
                  boxShadow: '0 2px 16px rgba(26,23,20,0.06)',
                  transition: 'box-shadow 0.25s, transform 0.25s',
                }}
              >
                <div style={{ width: 50, height: 50, borderRadius: 15, background: f.bg, border: `1.5px solid ${f.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#7A6850', lineHeight: 1.75 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          三步流程
      ══════════════════════════════════════════════════════════ */}
      <div style={{ padding: '96px 24px', background: 'linear-gradient(180deg, #EDE8E0 0%, #E8F2F8 50%, #EDE8E0 100%)' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 60 }}
          >
            <h2 style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.02em', color: '#1A1714', marginBottom: 12 }}>
              三步开启你的时光之河
            </h2>
            <p style={{ fontSize: 15, color: '#8B7355' }}>简单、优雅，专注于最重要的事：记录你的人生</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40 }}>
            {HOW_IT_WORKS.map((h, i) => (
              <motion.div
                key={h.title}
                initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.14 }}
                style={{ textAlign: 'center' }}
              >
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 22 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: `${h.color}14`,
                    border: `2px solid ${h.color}38`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32,
                  }}>
                    {h.icon}
                  </div>
                  <div style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 26, height: 26, borderRadius: '50%',
                    background: h.color, color: '#fff',
                    fontSize: 12, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 4px 12px ${h.color}50`,
                  }}>
                    {i + 1}
                  </div>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1714', marginBottom: 10 }}>{h.title}</h3>
                <p style={{ fontSize: 14, color: '#7A6850', lineHeight: 1.78 }}>{h.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* 底部双 CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.4 }}
            style={{ textAlign: 'center', marginTop: 72 }}
          >
            <p style={{ fontSize: 21, fontWeight: 800, color: '#1A1714', marginBottom: 8, letterSpacing: '-0.02em' }}>
              你的命运，不该消失在记忆的洪流里
            </p>
            <p style={{ fontSize: 14, color: '#8B7355', marginBottom: 30 }}>开始第一条记录，就是改变的起点</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <WalletMultiButton />
              <Link href="/home" style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.03, boxShadow: '0 8px 24px rgba(168,124,42,0.18)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '13px 28px', borderRadius: 14,
                    border: '1.5px solid rgba(168,124,42,0.35)',
                    background: 'rgba(255,252,245,0.9)',
                    fontSize: 14, fontWeight: 600, color: '#4A3D30',
                    cursor: 'pointer',
                    boxShadow: '0 2px 12px rgba(168,124,42,0.1)',
                  }}
                >
                  <span>👀</span> 先看看再说
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ borderTop: '1px solid rgba(168,124,42,0.2)', padding: '28px 24px', background: '#EDE8E0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🌊</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1A1714' }}>Time River</span>
          <span style={{ fontSize: 12, color: '#9B8870' }}>时光流</span>
        </div>
        <p style={{ fontSize: 12, color: '#9B8870' }}>
          记录即修行，觉察即改命 · Built on Solana × Arweave × Claude AI
        </p>
      </div>

    </div>
  )
}
