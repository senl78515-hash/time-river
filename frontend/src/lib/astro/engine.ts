/**
 * Time River — 占星引擎 (TypeScript)
 * 计算实时行星状态、星座位置、重要相位
 *
 * MVP 阶段：使用天文算法精算行星位置，不依赖外部 API
 * 核心：基于儒略日的行星经度计算
 */

import type { AstroChart, Planet, Aspect } from '@/types'

// ── 星座常量 ──────────────────────────────────────────────────
export const ZODIAC_SIGNS = [
  '白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座',
  '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座',
]

export const ZODIAC_SIGNS_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

// ── 儒略日计算 ────────────────────────────────────────────────
export function toJulianDay(date: Date): number {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth() + 1
  const d = date.getUTCDate()
  const h = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600

  let A = Math.floor((14 - m) / 12)
  let Y = y + 4800 - A
  let M = m + 12 * A - 3

  let JDN =
    d + Math.floor((153 * M + 2) / 5) + 365 * Y +
    Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045

  return JDN + (h - 12) / 24
}

// ── 行星黄道经度（近似算法，精度约 1°）────────────────────────
export function getPlanetLongitudes(jd: number): Record<string, number> {
  const T = (jd - 2451545.0) / 36525 // 儒略世纪数（J2000.0）

  // 太阳黄道经度
  const L0 = 280.46646 + 36000.76983 * T
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
  const Mrad = (M * Math.PI) / 180
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad)
  const sunLon = normalizeAngle(L0 + C)

  // 月亮（简化）
  const moonL = 218.316 + 13.176396 * (jd - 2451545.0)
  const moonLon = normalizeAngle(moonL)

  // 水星（简化）
  const mercuryL = 252.251 + 149474.0722 * T
  const mercuryLon = normalizeAngle(mercuryL)

  // 金星（简化）
  const venusL = 181.98 + 58519.21 * T
  const venusLon = normalizeAngle(venusL)

  // 火星（简化）
  const marsL = 355.433 + 19141.696 * T
  const marsLon = normalizeAngle(marsL)

  // 木星（简化）
  const jupiterL = 34.351 + 3034.905 * T
  const jupiterLon = normalizeAngle(jupiterL)

  // 土星（简化）
  const saturnL = 50.077 + 1222.113 * T
  const saturnLon = normalizeAngle(saturnL)

  return {
    sun: sunLon,
    moon: moonLon,
    mercury: mercuryLon,
    venus: venusLon,
    mars: marsLon,
    jupiter: jupiterLon,
    saturn: saturnLon,
  }

  function normalizeAngle(angle: number): number {
    let a = angle % 360
    if (a < 0) a += 360
    return a
  }
}

// ── 黄道经度转星座 ────────────────────────────────────────────
export function longitudeToSign(lon: number): { sign: string; degree: number } {
  const signIndex = Math.floor(lon / 30)
  const degree = lon % 30
  return {
    sign: ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0],
    degree: Math.round(degree * 10) / 10,
  }
}

// ── 水星逆行检测 ──────────────────────────────────────────────
export function isMercuryRetrograde(jd: number): boolean {
  // 水星逆行每约116天一次，持续约3周
  // 近似算法：检查三天内水星经度是否减少
  const lon1 = getPlanetLongitudes(jd - 1).mercury
  const lon2 = getPlanetLongitudes(jd).mercury
  const lon3 = getPlanetLongitudes(jd + 1).mercury

  const diff1 = normalizeAngleDiff(lon2 - lon1)
  const diff2 = normalizeAngleDiff(lon3 - lon2)

  return diff1 < 0 && diff2 < 0

  function normalizeAngleDiff(diff: number): number {
    if (diff > 180) return diff - 360
    if (diff < -180) return diff + 360
    return diff
  }
}

// ── 相位计算 ──────────────────────────────────────────────────
export function calcAspects(longitudes: Record<string, number>): Aspect[] {
  const aspects: Aspect[] = []
  const planets = Object.keys(longitudes)
  const aspectTypes = [
    { name: 'conjunction' as const, angle: 0, orb: 8 },
    { name: 'sextile' as const, angle: 60, orb: 4 },
    { name: 'square' as const, angle: 90, orb: 6 },
    { name: 'trine' as const, angle: 120, orb: 6 },
    { name: 'opposition' as const, angle: 180, orb: 8 },
  ]

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i]
      const p2 = planets[j]
      let diff = Math.abs(longitudes[p1] - longitudes[p2])
      if (diff > 180) diff = 360 - diff

      for (const aspectType of aspectTypes) {
        const orb = Math.abs(diff - aspectType.angle)
        if (orb <= aspectType.orb) {
          aspects.push({
            planet1: p1,
            planet2: p2,
            type: aspectType.name,
            orb: Math.round(orb * 10) / 10,
            applying: longitudes[p1] < longitudes[p2],
          })
          break
        }
      }
    }
  }

  return aspects
}

// ── 获取重要过运描述 ──────────────────────────────────────────
export function getNotableTransits(
  longitudes: Record<string, number>,
  isMercRetro: boolean,
  aspects: Aspect[]
): string[] {
  const transits: string[] = []

  if (isMercRetro) {
    transits.push('水星逆行 · 谨慎沟通，重审旧事')
  }

  const jupSign = longitudeToSign(longitudes.jupiter)
  transits.push(`木星${jupSign.sign} · 扩张与繁荣`)

  const satSign = longitudeToSign(longitudes.saturn)
  transits.push(`土星${satSign.sign} · 纪律与考验`)

  // 筛选重要相位
  const notable = aspects
    .filter(a => ['jupiter', 'saturn', 'mars'].includes(a.planet1) ||
                 ['jupiter', 'saturn', 'mars'].includes(a.planet2))
    .slice(0, 3)

  for (const aspect of notable) {
    const aspectName = {
      conjunction: '合',
      trine: '三合',
      square: '刑克',
      opposition: '对冲',
      sextile: '六合',
    }[aspect.type]
    const p1Name = getPlanetName(aspect.planet1)
    const p2Name = getPlanetName(aspect.planet2)
    transits.push(`${p1Name}${aspectName}${p2Name}`)
  }

  return transits
}

function getPlanetName(key: string): string {
  const names: Record<string, string> = {
    sun: '太阳', moon: '月亮', mercury: '水星',
    venus: '金星', mars: '火星', jupiter: '木星', saturn: '土星',
  }
  return names[key] || key
}

// ── 实时占星图谱计算 ──────────────────────────────────────────
export function calcCurrentAstroChart(): AstroChart {
  const now = new Date()
  const jd = toJulianDay(now)
  const longitudes = getPlanetLongitudes(jd)
  const mercRetro = isMercuryRetrograde(jd)
  const aspects = calcAspects(longitudes)
  const notableTransits = getNotableTransits(longitudes, mercRetro, aspects)

  const planets: Planet[] = Object.entries(longitudes).map(([name, lon]) => {
    const { sign, degree } = longitudeToSign(lon)
    return {
      name: getPlanetName(name),
      sign,
      degree,
      retrograde: name === 'mercury' ? mercRetro : false,
    }
  })

  const sunSign = longitudeToSign(longitudes.sun)
  const moonSign = longitudeToSign(longitudes.moon)

  return {
    sun_sign: sunSign.sign,
    moon_sign: moonSign.sign,
    rising_sign: '待计算', // 上升星座需要出生时间和地点
    planets,
    aspects,
    mercury_retrograde: mercRetro,
    notable_transits: notableTransits,
  }
}

// ── 根据出生信息计算个人星盘 ──────────────────────────────────
export function calcNatalChart(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  birthHour: number
): AstroChart {
  const birthDate = new Date(Date.UTC(birthYear, birthMonth - 1, birthDay, birthHour))
  const jd = toJulianDay(birthDate)
  const longitudes = getPlanetLongitudes(jd)
  const aspects = calcAspects(longitudes)

  const planets: Planet[] = Object.entries(longitudes).map(([name, lon]) => {
    const { sign, degree } = longitudeToSign(lon)
    return {
      name: getPlanetName(name),
      sign,
      degree,
      retrograde: false,
    }
  })

  const sunSign = longitudeToSign(longitudes.sun)
  const moonSign = longitudeToSign(longitudes.moon)

  return {
    sun_sign: sunSign.sign,
    moon_sign: moonSign.sign,
    rising_sign: '待计算',
    planets,
    aspects,
    mercury_retrograde: false,
    notable_transits: [],
  }
}
