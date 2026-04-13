import { NextResponse } from 'next/server'
import { calcCurrentAstroChart } from '@/lib/astro/engine'

// 天时脉搏每日数据接口
// 每次调用实时计算当前星象，可加 Redis 缓存优化
export async function GET() {
  try {
    const astro = calcCurrentAstroChart()

    // 生成每日天象消息（无需 Claude 时的静态版本）
    const transitMessages = astro.notable_transits.slice(0, 2).join('，')
    const retroMessage = astro.mercury_retrograde ? '水逆期间，' : ''
    const dailyMessage = `${retroMessage}${astro.sun_sign}太阳，${astro.moon_sign}月亮，${transitMessages || '天象平和'}。`

    return NextResponse.json({
      astro,
      dailyMessage,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('占星计算失败:', err)
    return NextResponse.json(
      { error: '天象计算失败', astro: null, dailyMessage: '宜静心，宜记录。' },
      { status: 500 }
    )
  }
}
