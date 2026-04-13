'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import toast from 'react-hot-toast'
import { NavBar } from '@/components/common/NavBar'
import { BaziChart } from '@/components/destiny/BaziChart'
import { DestinyReportView } from '@/components/destiny/DestinyReportView'
import { MajorCycleTimeline } from '@/components/destiny/MajorCycleTimeline'
import type { DestinyInput, BaziResult, DestinyReport } from '@/types'

interface Profile {
  name: string
  gender: 'male' | 'female'
  birth_date: string
  birth_time: string
  birth_province: string
  birth_city: string
}

export default function DestinyPage() {
  const { connected } = useWallet()
  const [step, setStep] = useState<'form' | 'loading' | 'report'>('form')
  const [form, setForm] = useState<DestinyInput>({
    name: '',
    gender: 'male',
    birth_date: '',
    birth_time: '12:00',
    birth_province: '',
    birth_city: '',
    is_lunar: false,
  })
  const [bazi, setBazi] = useState<BaziResult | null>(null)
  const [report, setReport] = useState<DestinyReport | null>(null)
  const [loadingText, setLoadingText] = useState('排盘中...')
  const [activeTab, setActiveTab] = useState<'report' | 'chart' | 'cycles'>('report')
  const [profileLoaded, setProfileLoaded] = useState(false)

  // 从 localStorage 自动填入 profile
  useEffect(() => {
    const stored = localStorage.getItem('tr_profile')
    if (stored) {
      const p: Profile = JSON.parse(stored)
      setForm(prev => ({
        ...prev,
        name: p.name || prev.name,
        gender: p.gender || prev.gender,
        birth_date: p.birth_date || prev.birth_date,
        birth_time: p.birth_time || prev.birth_time,
        birth_province: p.birth_province || prev.birth_province,
        birth_city: p.birth_city || prev.birth_city,
      }))
      setProfileLoaded(true)
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.birth_date || !form.birth_time || !form.birth_province || !form.birth_city) return

    setStep('loading')
    setLoadingText('天干地支排盘中...')

    try {
      const baziRes = await fetch('/api/bazi/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!baziRes.ok) throw new Error('八字计算失败')
      const { bazi: baziData } = await baziRes.json()
      setBazi(baziData)
      // 写入 localStorage，供 records / home 页面读取
      try { localStorage.setItem('tr_bazi', JSON.stringify(baziData)) } catch { /* 静默 */ }

      setLoadingText('AI 命师运算七维度命书中...')

      const reportRes = await fetch('/api/ai/destiny', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: form, bazi: baziData }),
      })
      if (!reportRes.ok) {
        const errData = await reportRes.json().catch(() => ({}))
        const detail = errData.detail || errData.error || '命书生成失败'
        throw new Error(detail)
      }
      const reportData = await reportRes.json()
      setReport(reportData)
      setStep('report')
    } catch (err) {
      console.error(err)
      setStep('form')
      const msg = err instanceof Error ? err.message : '未知错误'
      if (msg.includes('credit') || msg.includes('balance') || msg.includes('billing')) {
        toast.error('API 额度不足，请前往 console.anthropic.com 充值后重试', { duration: 6000 })
      } else {
        toast.error(`计算失败：${msg}`, { duration: 4000 })
      }
    }
  }, [form])

  const handleFeedback = useCallback(async (dimensionKey: string, feedback: 'accurate' | 'inaccurate') => {
    if (!report) return
    setReport(prev => {
      if (!prev) return prev
      return {
        ...prev,
        dimensions: prev.dimensions.map(d =>
          d.key === dimensionKey ? { ...d, feedback } : d
        )
      }
    })
    try {
      await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'destiny_feedback',
          report_id: report.id,
          dimension: dimensionKey,
          feedback,
        }),
      })
    } catch { /* 静默失败 */ }
  }, [report])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <NavBar bazi={bazi ?? undefined} />

      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <AnimatePresence mode="wait">

          {/* ── 输入表单 ── */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 24px 80px' }}
            >
              {/* 标题 */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <motion.div
                  style={{ fontSize: '48px', marginBottom: '12px' }}
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  ☯
                </motion.div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  命书测算
                </h1>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                  融合八字命理 · AI 深度解读七维度命格
                </p>
              </div>

              {profileLoaded && (
                <div style={{
                  padding: '12px 16px', marginBottom: '20px', borderRadius: '12px',
                  background: '#F0FDF4', border: '1px solid #BBF7D0',
                  fontSize: '13px', color: '#16a34a',
                }}>
                  ✓ 已从你的档案自动填入信息，可直接测算
                </div>
              )}

              <form onSubmit={handleSubmit} className="card-lg" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* 姓名 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                    姓名 <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>（选填）</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="如实填写更准，可匿名"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* 性别 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                    性别
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {(['male', 'female'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, gender: g }))}
                        style={{
                          flex: 1, padding: '13px', borderRadius: '14px', cursor: 'pointer',
                          border: form.gender === g ? '2px solid rgba(42,31,26,0.6)' : '1.5px solid var(--border-input)',
                          background: form.gender === g ? 'linear-gradient(135deg,#F5EFE6,#EDE4D6)' : 'var(--bg-input)',
                          color: form.gender === g ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '14px', fontWeight: form.gender === g ? 700 : 400,
                          transition: 'all 0.18s',
                          boxShadow: form.gender === g ? '0 2px 8px rgba(42,31,26,0.12)' : 'var(--shadow-input)',
                        }}
                      >
                        {g === 'male' ? '♂  男命' : '♀  女命'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 出生日期 */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      出生日期
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, is_lunar: !p.is_lunar }))}
                      style={{
                        fontSize: '11px', padding: '2px 10px', borderRadius: '20px', cursor: 'pointer',
                        border: '1px solid var(--border)',
                        background: form.is_lunar ? 'var(--gold-light)' : 'var(--bg-card)',
                        color: form.is_lunar ? 'var(--gold)' : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {form.is_lunar ? '农历' : '公历'}
                    </button>
                  </div>
                  <input
                    type="date"
                    required
                    className="input"
                    value={form.birth_date}
                    onChange={e => setForm(p => ({ ...p, birth_date: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* 出生时间 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                    出生时间
                  </label>
                  <input
                    type="time"
                    required
                    className="input"
                    value={form.birth_time}
                    onChange={e => setForm(p => ({ ...p, birth_time: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    时辰影响时柱，不知确切时间可填 12:00
                  </p>
                </div>

                {/* 出生省份 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                    出生省份
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="输入省份，如：广东省"
                    value={form.birth_province}
                    onChange={e => setForm(p => ({ ...p, birth_province: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>

                {/* 出生城市 */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>
                    出生城市
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="输入城市名，如：深圳"
                    value={form.birth_city}
                    onChange={e => setForm(p => ({ ...p, birth_city: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    用于真太阳时校正（经度修正）
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600 }}
                >
                  ✨ 开始排盘，解读命书
                </button>

                {!connected && (
                  <p style={{ textAlign: 'center', color: 'var(--gold)', fontSize: '12px' }}>
                    连接钱包后可将命书永久存证到 Arweave
                  </p>
                )}
              </form>

              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                {[
                  { icon: '⚡', text: '真太阳时校正' },
                  { icon: '🔮', text: '七维度深度解读' },
                  { icon: '🔒', text: '加密永久存证' },
                ].map(item => (
                  <div key={item.text} className="card" style={{ padding: '16px 8px' }}>
                    <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── 加载状态 ── */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: '70vh', gap: '24px'
              }}
            >
              <motion.div
                style={{ fontSize: '64px' }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                ☯
              </motion.div>
              <p style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 500 }}>{loadingText}</p>
              <div className="loading-dots"><span /><span /><span /></div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI 正在参阅千年命理古籍...</p>
            </motion.div>
          )}

          {/* ── 报告视图 ── */}
          {step === 'report' && bazi && report && (
            <motion.div
              key="report"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 24px 80px' }}
            >
              {/* 报告头 */}
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {form.name ? `${form.name} 的命书` : '命书解读'}
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {form.birth_date} {form.birth_time} · {form.birth_province} {form.birth_city}
                  · {form.gender === 'male' ? '男' : '女'}命
                </p>
              </div>

              {/* 总纲 */}
              <motion.div
                className="card-lg"
                style={{ padding: '24px', marginBottom: '20px', borderLeft: '4px solid var(--gold)' }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '18px' }}>📜</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '15px' }}>命书总纲</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '14px' }}>{report.summary}</p>
              </motion.div>

              {/* 标签切换 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {[
                  { key: 'report', label: '七维命书' },
                  { key: 'chart', label: '四柱排盘' },
                  { key: 'cycles', label: '大运走势' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    style={{
                      padding: '8px 20px', borderRadius: '10px', cursor: 'pointer',
                      border: activeTab === tab.key ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                      background: activeTab === tab.key ? 'var(--bg-subtle)' : 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '14px', fontWeight: activeTab === tab.key ? 600 : 400,
                      transition: 'all 0.2s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'report' && (
                <DestinyReportView report={report} onFeedback={handleFeedback} />
              )}
              {activeTab === 'chart' && (
                <BaziChart bazi={bazi} form={form} />
              )}
              {activeTab === 'cycles' && (
                <MajorCycleTimeline bazi={bazi} />
              )}

              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button
                  onClick={() => setStep('form')}
                  className="btn-outline"
                  style={{ flex: 1, padding: '14px', fontSize: '14px' }}
                >
                  重新测算
                </button>
                {connected && (
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: '14px', fontSize: '14px' }}
                  >
                    🔒 永久存证命书
                  </button>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
