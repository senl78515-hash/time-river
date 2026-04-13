import { NextRequest, NextResponse } from 'next/server'
import { conductInspirationDialogue } from '@/lib/ai/claude'
import type { TenGod, DayMaster } from '@/types'

// AI 对话式记录引导接口
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, dayTenGod, dayMaster }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
      dayTenGod: TenGod
      dayMaster: DayMaster
    } = body

    const result = await conductInspirationDialogue(messages, dayTenGod, dayMaster)

    return NextResponse.json(result)
  } catch (err) {
    console.error('灵感引导失败:', err)
    return NextResponse.json(
      { message: '今天有什么让你印象深刻的瞬间吗？', isComplete: false },
      { status: 200 }  // 降级返回，不影响用户体验
    )
  }
}
