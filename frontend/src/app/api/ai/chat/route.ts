import { NextRequest, NextResponse } from 'next/server'
import { chatWithDestinyContext } from '@/lib/ai/claude'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import type { BaziResult, AstroChart } from '@/types'

// AI 对话接口（含命理 Context + RAG 记忆检索）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, bazi, astro, wallet, memoryContext: providedContext }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      bazi?: BaziResult
      astro?: AstroChart
      wallet?: string
      memoryContext?: string
    } = body

    if (!messages?.length) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    // RAG：如果有钱包地址且配置了 Supabase，检索相关记忆
    let memoryContext = providedContext || ''
    if (wallet && !providedContext) {
      memoryContext = await retrieveRelevantMemories(
        messages[messages.length - 1].content,
        wallet
      )
    }

    const reply = await chatWithDestinyContext(
      messages,
      bazi ?? null,
      astro ?? null,
      memoryContext
    )

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('AI 对话失败:', err)
    return NextResponse.json(
      { error: 'AI 响应失败', detail: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

// ── RAG 记忆检索 ──────────────────────────────────────────────
async function retrieveRelevantMemories(
  query: string,
  wallet: string
): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) return ''

  try {
    // 1. 用 Claude 生成查询向量（text-embedding-3-small 式 API 暂用 voyage-02）
    //    目前使用简化方案：通过关键词匹配 preview 字段
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 简化 RAG：按关键词搜索最近相关记录（不需要 embedding 向量）
    const keywords = query
      .replace(/[，。？！、]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1)
      .slice(0, 5)

    if (keywords.length === 0) return ''

    // 搜索包含关键词的非加密记录预览
    const { data } = await supabase
      .from('records')
      .select('preview, type, created_at')
      .eq('owner', wallet)
      .eq('encrypted', false)
      .or(keywords.map(k => `preview.ilike.%${k}%`).join(','))
      .order('created_at', { ascending: false })
      .limit(5)

    if (!data?.length) return ''

    const memories = data.map(r => {
      const date = new Date(r.created_at).toLocaleDateString('zh-CN')
      return `[${date}] ${r.preview?.slice(0, 100)}`
    }).join('\n')

    return `【相关记忆片段】\n${memories}`
  } catch {
    return ''
  }
}
