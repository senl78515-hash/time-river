import { NextRequest, NextResponse } from 'next/server'
import { generateDestinyReport } from '@/lib/ai/claude'
import { calcCurrentAstroChart } from '@/lib/astro/engine'
import type { BaziResult, DestinyInput, DestinyReport } from '@/types'
import { randomUUID } from 'crypto'

// 命书 AI 生成接口
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { input, bazi, astro: providedAstro }: {
      input: DestinyInput
      bazi: BaziResult
      astro?: ReturnType<typeof calcCurrentAstroChart>
    } = body

    if (!bazi) {
      return NextResponse.json(
        { error: '缺少八字数据' },
        { status: 400 }
      )
    }

    // 如果没有提供星盘，计算当前天象
    const astro = providedAstro ?? calcCurrentAstroChart()

    const { summary, dimensions } = await generateDestinyReport({
      bazi,
      astro,
      name: input?.name,
      gender: input?.gender ?? 'male',
    })

    // 构建完整 DestinyReport
    const report: DestinyReport = {
      id: randomUUID(),
      user_wallet: '',        // 由客户端填充（连接钱包后）
      input: input ?? {
        gender: 'male',
        birth_date: '',
        birth_time: '',
        birth_province: '',
        birth_city: '',
      },
      bazi,
      summary,
      dimensions,
      created_at: new Date().toISOString(),
      version: 1,
    }

    return NextResponse.json(report)
  } catch (err) {
    console.error('命书生成失败:', err)
    return NextResponse.json(
      { error: '命书生成失败', detail: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}
