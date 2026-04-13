import { NextRequest, NextResponse } from 'next/server'
import { buildDestinyContext } from '@/lib/ai/claude'
import { calcCurrentAstroChart } from '@/lib/astro/engine'
import Anthropic from '@anthropic-ai/sdk'
import type { BaziResult } from '@/types'

const PERIOD_LABELS = {
  day: '日',
  week: '周',
  month: '月',
  year: '年',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bazi, period = 'day' }: { bazi: BaziResult; period: 'day' | 'week' | 'month' | 'year' } = body

    if (!bazi) {
      return NextResponse.json({ error: '缺少八字数据' }, { status: 400 })
    }

    const astro = calcCurrentAstroChart()
    const context = buildDestinyContext(bazi, astro)
    const periodLabel = PERIOD_LABELS[period]

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `
你是融合八字命理与现代心理学的东方智者。请根据命理信息，生成本${periodLabel}能量报告。

${context}

请以 JSON 格式输出以下结构：
{
  "period": "${period}",
  "title": "本${periodLabel}能量报告标题（10字内）",
  "overall_energy": 0-100的整数（综合能量值）,
  "overall_desc": "综合能量描述（20字内）",
  "dimensions": [
    {
      "key": "fortune",
      "label": "财运",
      "score": 0-100,
      "desc": "一句话描述（15字内）",
      "color": "#hex颜色代码"
    },
    { "key": "career", "label": "事业", "score": ..., "desc": ..., "color": "..." },
    { "key": "relationship", "label": "感情", "score": ..., "desc": ..., "color": "..." },
    { "key": "health", "label": "健康", "score": ..., "desc": ..., "color": "..." },
    { "key": "creativity", "label": "灵感", "score": ..., "desc": ..., "color": "..." }
  ],
  "auspicious_hours": "今${periodLabel}吉时（如：上午9-11点）",
  "auspicious_direction": "吉利方位（如：东南方）",
  "lucky_color": "幸运颜色（如：靛蓝色）",
  "avoid": "本${periodLabel}宜忌事项（20字内）",
  "affirmation": "一句本${periodLabel}的能量宣言（20字内，鼓励性）",
  "ai_message": "AI 温情微语（50字内，暖心日签风格）"
}

请直接输出 JSON，无需其他说明。确保颜色代码与五行元素呼应（木=绿，火=红橙，土=黄，金=白灰，水=蓝）。
`.trim()

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('AI 返回格式错误')

    const report = JSON.parse(jsonMatch[0])
    return NextResponse.json({ report, generated_at: new Date().toISOString() })
  } catch (err) {
    console.error('能量报告生成失败:', err)
    return NextResponse.json(
      { error: '生成失败', detail: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}
