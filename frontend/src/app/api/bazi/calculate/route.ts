import { NextRequest, NextResponse } from 'next/server'
import { calculateBazi } from '@/lib/bazi/engine'
import type { DestinyInput } from '@/types'

// 城市经度数据库（主要城市）
const CITY_LONGITUDES: Record<string, number> = {
  北京: 116.4, 上海: 121.5, 广州: 113.3, 深圳: 114.1, 成都: 104.1,
  武汉: 114.3, 西安: 108.9, 南京: 118.8, 杭州: 120.2, 重庆: 106.5,
  天津: 117.2, 沈阳: 123.4, 哈尔滨: 126.7, 长春: 125.3,
  郑州: 113.6, 南昌: 115.9, 福州: 119.3, 厦门: 118.1,
  昆明: 102.7, 贵阳: 106.7, 南宁: 108.4, 海口: 110.3, 兰州: 103.8,
  西宁: 101.8, 银川: 106.2, 乌鲁木齐: 87.6, 拉萨: 91.1, 呼和浩特: 111.8,
  长沙: 113.0, 太原: 112.5, 石家庄: 114.5, 济南: 117.0, 合肥: 117.3,
}

export async function POST(req: NextRequest) {
  try {
    const body: DestinyInput = await req.json()

    const { birth_date, birth_time, birth_province, birth_city, gender, is_lunar } = body

    // 解析日期时间
    const [year, month, day] = birth_date.split('-').map(Number)
    const [hour, minute] = birth_time.split(':').map(Number)

    // 查找城市经度
    const longitude = CITY_LONGITUDES[birth_city] || CITY_LONGITUDES[birth_province.replace('省', '').replace('市', '')] || 120

    // 调用八字引擎
    const baziResult = calculateBazi({
      year,
      month,
      day,
      hour,
      minute,
      gender,
      longitude,
    })

    return NextResponse.json({ bazi: baziResult })
  } catch (err) {
    console.error('八字计算失败:', err)
    return NextResponse.json(
      { error: '八字计算失败', detail: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}
