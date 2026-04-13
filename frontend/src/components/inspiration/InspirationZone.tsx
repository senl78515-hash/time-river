'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { BaziResult, DayMaster } from '@/types'
import { getDayMasterRecordingStyle } from '@/lib/bazi/engine'

interface InspirationZoneProps {
  bazi?: BaziResult
  onAddRecord: (template?: string, prefill?: string) => void
}

const DAILY_QUESTIONS = [
  '今天哪个瞬间让你觉得「活着真好」？',
  '如果今天是一部电影，它的名字会是什么？',
  '今天有没有一个让你内心一暖的小细节？',
  '你上一次对自己感到满意，是什么时候？',
  '此刻你最想感谢生命里的哪个人，为什么？',
]

const TEMPLATES = [
  {
    key: 'gratitude',
    icon: '🌟',
    title: '感恩三事',
    description: '列出今天三件值得感谢的小事',
    prefill: '今天感谢的三件事：\n1. \n2. \n3. ',
  },
  {
    key: 'emotion_weather',
    icon: '🌤️',
    title: '情绪气象站',
    description: '用天气形容此刻心情',
    prefill: '今天的心情天气：\n如果用天气来形容，此刻是_____，因为_____。',
  },
  {
    key: 'highlight',
    icon: '✨',
    title: '高光时刻',
    description: '记录今天最强烈的一个体验',
    prefill: '今天的高光时刻：\n发生了什么：\n我的感受是：\n这让我想到：',
  },
]

export function InspirationZone({ bazi, onAddRecord }: InspirationZoneProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showStyleGuide, setShowStyleGuide] = useState(false)
  const [showAIDialogue, setShowAIDialogue] = useState(false)

  useEffect(() => {
    const dayIndex = new Date().getDate() % DAILY_QUESTIONS.length
    setCurrentQuestionIndex(dayIndex)
  }, [])

  const currentQuestion = DAILY_QUESTIONS[currentQuestionIndex]
  const styleGuide = bazi?.day_master_label
    ? getDayMasterRecordingStyle(bazi.day_master_label)
    : null

  const refreshQuestion = () => {
    setCurrentQuestionIndex(prev => (prev + 1) % DAILY_QUESTIONS.length)
  }

  return (
    <div style={{ width: '300px', pointerEvents: 'auto' }}>
      {/* 今日记录灵感卡片 */}
      <motion.div
        className="card"
        style={{ padding: '16px', marginBottom: '10px' }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* 标题行 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px' }}>💡</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              今日记录灵感
            </span>
          </div>
          {bazi && (
            <button
              style={{
                fontSize: '11px', color: 'var(--gold)', background: 'var(--gold-light)',
                border: '1px solid rgba(168,124,42,0.2)', borderRadius: '20px',
                padding: '2px 8px', cursor: 'pointer',
              }}
              onClick={() => setShowStyleGuide(!showStyleGuide)}
            >
              {bazi.day_master_label.slice(0, 2)}风格
            </button>
          )}
        </div>

        {/* 每日一问 */}
        <AnimatePresence mode="wait">
          <motion.button
            key={currentQuestionIndex}
            style={{
              width: '100%', textAlign: 'left', padding: '12px 14px',
              borderRadius: '12px', marginBottom: '12px', cursor: 'pointer',
              background: 'var(--bg-subtle)', border: '1.5px solid var(--border)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onClick={() => onAddRecord(undefined, currentQuestion + '\n\n')}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            whileHover={{ borderColor: 'var(--gold)' }}
          >
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: '6px', fontWeight: 500 }}>
              {currentQuestion}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>点击开始记录 →</p>
          </motion.button>
        </AnimatePresence>

        {/* 模板卡片 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          {TEMPLATES.map(template => (
            <button
              key={template.key}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 4px', borderRadius: '10px', cursor: 'pointer',
                background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onClick={() => onAddRecord(template.key, template.prefill)}
              title={template.description}
            >
              <span style={{ fontSize: '16px', marginBottom: '4px' }}>{template.icon}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>
                {template.title}
              </span>
            </button>
          ))}
        </div>

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={refreshQuestion}
            style={{
              flex: 1, fontSize: '12px', padding: '7px',
              borderRadius: '10px', cursor: 'pointer',
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            换一题 ↻
          </button>
          <button
            onClick={() => setShowAIDialogue(true)}
            style={{
              flex: 1, fontSize: '12px', padding: '7px',
              borderRadius: '10px', cursor: 'pointer',
              background: 'var(--bg-subtle)', border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            不知记什么？
          </button>
        </div>
      </motion.div>

      {/* 日主记录风格指南 */}
      <AnimatePresence>
        {showStyleGuide && styleGuide && (
          <motion.div
            className="card"
            style={{ padding: '14px', marginBottom: '10px' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--gold)' }}>
                ✦ {styleGuide.title}
              </span>
              <button
                onClick={() => setShowStyleGuide(false)}
                style={{ fontSize: '14px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '8px' }}>
              {styleGuide.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              {styleGuide.tips.map((tip, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ color: 'var(--gold)', fontSize: '12px', marginTop: '2px' }}>·</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tip}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {styleGuide.keywords.map(kw => (
                <span
                  key={kw}
                  style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '20px',
                    background: 'var(--gold-light)', border: '1px solid rgba(168,124,42,0.2)',
                    color: 'var(--gold)',
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI 对话引导 */}
      <AnimatePresence>
        {showAIDialogue && (
          <AIInspirationDialogue
            bazi={bazi}
            onClose={() => setShowAIDialogue(false)}
            onUseDraft={(draft) => {
              setShowAIDialogue(false)
              onAddRecord(undefined, draft)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── AI 对话引导组件 ────────────────────────────────────────────
interface AIInspirationDialogueProps {
  bazi?: BaziResult
  onClose: () => void
  onUseDraft: (draft: string) => void
}

interface DialogueMessage {
  role: 'ai' | 'user'
  content: string
}

function AIInspirationDialogue({ bazi, onClose, onUseDraft }: AIInspirationDialogueProps) {
  const [messages, setMessages] = useState<DialogueMessage[]>([
    { role: 'ai', content: '今天有遇到什么人吗？或者有什么让你印象深刻的瞬间？' },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMessage: DialogueMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/inspiration-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
          dayTenGod: bazi?.day_ten_god || '比肩',
          dayMaster: bazi?.day_master_label || '甲木',
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'ai', content: data.message }])
      if (data.isComplete && data.draft) setDraft(data.draft)
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '让我们继续，你刚才说的让我很好奇，能多说一点吗？',
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="card"
      style={{ padding: '14px' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>🤝 AI 引导你来记录</span>
        <button onClick={onClose} style={{ fontSize: '16px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
      </div>

      {/* 对话历史 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '82%', fontSize: '12px', padding: '8px 10px',
                borderRadius: '10px', lineHeight: 1.5,
                background: msg.role === 'ai' ? 'var(--bg-subtle)' : 'var(--text-primary)',
                color: msg.role === 'ai' ? 'var(--text-secondary)' : '#fff',
                border: msg.role === 'ai' ? '1px solid var(--border)' : 'none',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>…</span>
            </div>
          </div>
        )}
      </div>

      {/* 草稿预览 */}
      {draft && (
        <div
          style={{
            borderRadius: '10px', padding: '10px', marginBottom: '10px',
            fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6,
            background: 'var(--bg-subtle)', border: '1px solid var(--border)',
          }}
        >
          <p style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px' }}>为你生成的记录草稿：</p>
          {draft}
        </div>
      )}

      {/* 输入区 */}
      {!draft ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input"
            style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
            placeholder="说说你的想法..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
            onClick={sendMessage}
            disabled={isLoading}
          >
            发送
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-primary"
            style={{ flex: 1, fontSize: '12px', padding: '8px' }}
            onClick={() => onUseDraft(draft)}
          >
            用这个草稿
          </button>
          <button
            className="btn-outline"
            style={{ flex: 1, fontSize: '12px', padding: '8px' }}
            onClick={() => setDraft(null)}
          >
            继续聊
          </button>
        </div>
      )}
    </motion.div>
  )
}
