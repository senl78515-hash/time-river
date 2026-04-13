/**
 * Time River — 八字命理引擎 (TypeScript)
 * 基于干支历法精密计算四柱、十神、五行、大运、流日
 *
 * 核心算法参考：传统命理学与 6tail/lunar 算法体系
 */

import { Lunar } from 'lunar-javascript'
import type {
  BaziResult, Pillar, TenGod, FiveElement,
  HeavenlyStem, EarthlyBranch, MajorCycle, DayMaster,
} from '@/types'

// ── 天干常量 ──────────────────────────────────────────────────
export const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
export const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

// 天干五行归属
export const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土',
  己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
}

// 天干阴阳（阳=true）
export const STEM_YIN_YANG: Record<HeavenlyStem, boolean> = {
  甲: true, 乙: false, 丙: true, 丁: false, 戊: true,
  己: false, 庚: true, 辛: false, 壬: true, 癸: false,
}

// 地支五行归属
export const BRANCH_ELEMENT: Record<EarthlyBranch, FiveElement> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
}

// 地支藏干（主气为第一个）
export const BRANCH_HIDDEN_STEMS: Record<EarthlyBranch, HeavenlyStem[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

// 日主标签映射
export const DAY_MASTER_LABEL: Record<HeavenlyStem, DayMaster> = {
  甲: '甲木', 乙: '乙木', 丙: '丙火', 丁: '丁火', 戊: '戊土',
  己: '己土', 庚: '庚金', 辛: '辛金', 壬: '壬水', 癸: '癸水',
}

// ── 十神计算 ──────────────────────────────────────────────────
/**
 * 根据日主天干计算另一天干的十神
 * @param dayMaster 日主天干
 * @param target 目标天干
 */
export function calcTenGod(dayMaster: HeavenlyStem, target: HeavenlyStem): TenGod {
  const dmElement = STEM_ELEMENT[dayMaster]
  const dmYang = STEM_YIN_YANG[dayMaster]
  const tgtElement = STEM_ELEMENT[target]
  const tgtYang = STEM_YIN_YANG[target]
  const sameYin = dmYang === tgtYang

  // 同我（比肩/劫财）
  if (tgtElement === dmElement) return sameYin ? '比肩' : '劫财'

  // 我生（食神/伤官）
  const generated = generates(dmElement)
  if (tgtElement === generated) return sameYin ? '食神' : '伤官'

  // 我克（正财/偏财）
  const dominated = dominates(dmElement)
  if (tgtElement === dominated) return sameYin ? '偏财' : '正财'

  // 克我（正官/七杀）
  const dominator = getDominator(dmElement)
  if (tgtElement === dominator) return sameYin ? '七杀' : '正官'

  // 生我（正印/偏印）
  const generator = getGenerator(dmElement)
  if (tgtElement === generator) return sameYin ? '偏印' : '正印'

  return '比肩' // fallback
}

// 五行相生：我生
function generates(e: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
  }
  return map[e]
}

// 五行相克：我克
function dominates(e: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
  }
  return map[e]
}

// 五行相克：克我
function getDominator(e: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    木: '金', 金: '火', 火: '水', 水: '土', 土: '木',
  }
  return map[e]
}

// 五行相生：生我
function getGenerator(e: FiveElement): FiveElement {
  const map: Record<FiveElement, FiveElement> = {
    木: '水', 水: '金', 金: '土', 土: '火', 火: '木',
  }
  return map[e]
}

// ── 地支十神（取主气） ────────────────────────────────────────
export function calcBranchTenGod(dayMaster: HeavenlyStem, branch: EarthlyBranch): TenGod {
  const mainStem = BRANCH_HIDDEN_STEMS[branch][0]
  return calcTenGod(dayMaster, mainStem)
}

// ── 五行旺衰计算 ──────────────────────────────────────────────
/**
 * 计算八字四柱中五行能量分值（简化算法）
 * 每个天干/地支主气贡献对应五行分值
 */
export function calcFiveElementsScore(
  pillars: Pillar[]
): Record<FiveElement, number> {
  const scores: Record<FiveElement, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }

  for (const pillar of pillars) {
    // 天干贡献 10 分
    scores[STEM_ELEMENT[pillar.stem]] += 10
    // 地支主气贡献 8 分，余气各 3 分
    const hiddenStems = BRANCH_HIDDEN_STEMS[pillar.branch]
    hiddenStems.forEach((stem, i) => {
      scores[STEM_ELEMENT[stem]] += i === 0 ? 8 : 3
    })
  }

  return scores
}

// ── 喜用神判断（简化版）──────────────────────────────────────
export function calcFavorableElements(
  dayMaster: HeavenlyStem,
  scores: Record<FiveElement, number>
): { favorable: FiveElement[]; unfavorable: FiveElement[] } {
  const dmElement = STEM_ELEMENT[dayMaster]
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const dmScore = scores[dmElement]

  // 日主强弱判断（简化：日主五行占比超过 28% 为强）
  const dmRatio = dmScore / totalScore
  const isStrong = dmRatio > 0.28

  if (isStrong) {
    // 日主强：用克我、泄我之神（耗日主）
    const unfavorable = [dmElement, generates(dmElement)] as FiveElement[]
    const favorable = ([dominates(dmElement), getDominator(dmElement), generates(generates(dmElement))] as FiveElement[])
      .filter(e => !unfavorable.includes(e))
    return { favorable, unfavorable }
  } else {
    // 日主弱：用生我、扶我之神
    const favorable = [dmElement, getGenerator(dmElement)] as FiveElement[]
    const unfavorable = [getDominator(dmElement), dominates(dmElement)] as FiveElement[]
    return { favorable, unfavorable }
  }
}

// ── 大运计算 ──────────────────────────────────────────────────
export function calcMajorCycles(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  gender: 'male' | 'female',
  monthStem: HeavenlyStem,
  monthBranch: EarthlyBranch,
  dayMaster: HeavenlyStem
): MajorCycle[] {
  const cycles: MajorCycle[] = []

  // 确定顺逆（阳男阴女顺行，阴男阳女逆行）
  const yearStemIndex = (birthYear - 4) % 10
  const yearStemYang = yearStemIndex % 2 === 0
  const monthStemIdx = STEMS.indexOf(monthStem)
  const monthBranchIdx = BRANCHES.indexOf(monthBranch)

  const forward =
    (yearStemYang && gender === 'male') ||
    (!yearStemYang && gender === 'female')

  // 从月柱开始推算 8 个大运
  for (let i = 1; i <= 8; i++) {
    const stemIdx = ((monthStemIdx + (forward ? i : -i)) % 10 + 10) % 10
    const branchIdx = ((monthBranchIdx + (forward ? i : -i)) % 12 + 12) % 12
    const stem = STEMS[stemIdx]
    const branch = BRANCHES[branchIdx]
    cycles.push({
      start_age: i * 10,
      stem,
      branch,
      ten_god: calcTenGod(dayMaster, stem),
    })
  }

  return cycles
}

// ── 核心入口：完整排盘 ────────────────────────────────────────
export interface BaziInput {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  gender: 'male' | 'female'
  longitude?: number  // 出生地经度，用于真太阳时校正
}

export function calculateBazi(input: BaziInput): BaziResult {
  const { year, month, day, hour, minute, gender, longitude } = input

  // 真太阳时校正（如果有经度）
  let adjustedHour = hour
  let adjustedMinute = minute
  if (longitude !== undefined) {
    // 标准时区为东八区（120°），每4分钟1度
    const diffMinutes = (longitude - 120) * 4
    const totalMinutes = hour * 60 + minute + Math.round(diffMinutes)
    adjustedHour = Math.floor(((totalMinutes % (24 * 60)) + 24 * 60) / 60) % 24
    adjustedMinute = ((totalMinutes % 60) + 60) % 60
  }

  // 使用 lunar-javascript 计算四柱
  const solar = Lunar.fromYmd(year, month, day)
  // lunar-javascript 提供八字四柱
  const baziObj = solar.getEightChar()

  const yearStem = baziObj.getYearGan() as HeavenlyStem
  const yearBranch = baziObj.getYearZhi() as EarthlyBranch
  const monthStem = baziObj.getMonthGan() as HeavenlyStem
  const monthBranch = baziObj.getMonthZhi() as EarthlyBranch
  const dayStem = baziObj.getDayGan() as HeavenlyStem
  const dayBranch = baziObj.getDayZhi() as EarthlyBranch

  // 时柱：根据校正后的小时计算
  const hourStemIdx = (STEMS.indexOf(dayStem) % 5) * 2 + Math.floor(adjustedHour / 2)
  const hourStem = STEMS[hourStemIdx % 10]
  const hourBranchIdx = Math.floor((adjustedHour + 1) / 2) % 12
  const hourBranch = BRANCHES[hourBranchIdx]

  const dayMaster = dayStem

  const pillars: Pillar[] = [
    {
      stem: yearStem,
      branch: yearBranch,
      stem_ten_god: calcTenGod(dayMaster, yearStem),
      branch_ten_god: calcBranchTenGod(dayMaster, yearBranch),
      hidden_stems: BRANCH_HIDDEN_STEMS[yearBranch],
    },
    {
      stem: monthStem,
      branch: monthBranch,
      stem_ten_god: calcTenGod(dayMaster, monthStem),
      branch_ten_god: calcBranchTenGod(dayMaster, monthBranch),
      hidden_stems: BRANCH_HIDDEN_STEMS[monthBranch],
    },
    {
      stem: dayMaster,
      branch: dayBranch,
      branch_ten_god: calcBranchTenGod(dayMaster, dayBranch),
      hidden_stems: BRANCH_HIDDEN_STEMS[dayBranch],
    },
    {
      stem: hourStem,
      branch: hourBranch,
      stem_ten_god: calcTenGod(dayMaster, hourStem),
      branch_ten_god: calcBranchTenGod(dayMaster, hourBranch),
      hidden_stems: BRANCH_HIDDEN_STEMS[hourBranch],
    },
  ]

  const fiveElementsScore = calcFiveElementsScore(pillars)
  const { favorable, unfavorable } = calcFavorableElements(dayMaster, fiveElementsScore)
  const majorCycles = calcMajorCycles(year, month, day, gender, monthStem, monthBranch, dayMaster)

  // 今日流日十神
  const today = new Date()
  const todaySolar = Lunar.fromYmd(today.getFullYear(), today.getMonth() + 1, today.getDate())
  const todayBazi = todaySolar.getEightChar()
  const todayDayStem = todayBazi.getDayGan() as HeavenlyStem
  const dayTenGod = calcTenGod(dayMaster, todayDayStem)

  // 今年流年干支
  const currentYearSolar = Lunar.fromYmd(today.getFullYear(), 1, 1)
  const currentYearBazi = currentYearSolar.getEightChar()

  return {
    year_pillar: pillars[0],
    month_pillar: pillars[1],
    day_pillar: pillars[2],
    hour_pillar: pillars[3],
    day_master: dayMaster,
    day_master_element: STEM_ELEMENT[dayMaster],
    day_master_label: DAY_MASTER_LABEL[dayMaster],
    five_elements_score: fiveElementsScore,
    favorable_elements: favorable,
    unfavorable_elements: unfavorable,
    day_ten_god: dayTenGod,
    day_ten_god_description: getTenGodDescription(dayTenGod),
    major_cycles: majorCycles,
    current_year_stem: currentYearBazi.getYearGan() as HeavenlyStem,
    current_year_branch: currentYearBazi.getYearZhi() as EarthlyBranch,
    current_year_ten_god: calcTenGod(dayMaster, currentYearBazi.getYearGan() as HeavenlyStem),
  }
}

// ── 十神含义描述 ──────────────────────────────────────────────
export function getTenGodDescription(tenGod: TenGod): string {
  const descriptions: Record<TenGod, string> = {
    比肩: '同气比肩，宜独立自主、拓展人脉',
    劫财: '劫财透出，宜谨慎合作，防财物损耗',
    食神: '食神当令，宜享受生活、发挥才艺',
    伤官: '伤官司令，创意涌现，宜艺术创作与突破',
    正财: '正财透干，踏实勤奋必有收获',
    偏财: '偏财流日，机会在侧，宜灵活行事',
    正官: '正官当道，规范自持，宜承担责任',
    七杀: '七杀透干，挑战当前，以智慧应对压力',
    正印: '正印护持，贵人相助，宜学习进修',
    偏印: '偏印当值，直觉敏锐，宜内省与创新',
  }
  return descriptions[tenGod]
}

// ── 日主记录风格指南 ──────────────────────────────────────────
export function getDayMasterRecordingStyle(dayMaster: DayMaster): {
  title: string
  description: string
  tips: string[]
  keywords: string[]
} {
  const styles: Record<DayMaster, ReturnType<typeof getDayMasterRecordingStyle>> = {
    甲木: {
      title: '甲木（参天大树）',
      description: '你如参天大树，胸怀宏图，适合记录宏观思考与人生方向。',
      tips: ['每周写一篇"成长复盘"', '记录对他人产生影响的时刻', '追踪长期目标进展'],
      keywords: ['方向', '成长', '影响力', '突破'],
    },
    乙木: {
      title: '乙木（藤蔓花草）',
      description: '你如藤蔓花草，感知细腻，适合记录情绪美学与温暖瞬间。',
      tips: ['多用图片配短句', '记录让你心软的一个瞬间', '捕捉美的细节'],
      keywords: ['细腻', '美感', '温暖', '关系'],
    },
    丙火: {
      title: '丙火（太阳之光）',
      description: '你如太阳普照，热情四射，适合用视频或语音记录创意瞬间。',
      tips: ['多用视频记录', '捕捉感染他人的时刻', '记录创意灵感'],
      keywords: ['热情', '创意', '感染力', '光芒'],
    },
    丁火: {
      title: '丁火（烛火之光）',
      description: '你如烛火温柔，内敛深沉，适合在安静夜晚进行文字独白。',
      tips: ['夜晚记录更有深度', '写给内心的信', '记录给予他人的帮助'],
      keywords: ['内省', '温柔', '深度', '洞察'],
    },
    戊土: {
      title: '戊土（厚重城墙）',
      description: '你如厚重山岳，稳实可靠，适合记录责任与稳定积累。',
      tips: ['每周记录"我成为了他人依靠"的时刻', '追踪承诺兑现情况', '记录长期坚持'],
      keywords: ['责任', '稳定', '可靠', '积累'],
    },
    己土: {
      title: '己土（田园之土）',
      description: '你如沃土田园，滋养万物，适合记录日常琐碎与生活小确幸。',
      tips: ['每天用一句话记录"今天我照顾了谁"', '记录小确幸', '感恩日常'],
      keywords: ['日常', '滋养', '小确幸', '包容'],
    },
    庚金: {
      title: '庚金（刀剑之金）',
      description: '你如钢铁刀剑，果断锐利，适合记录突破与挑战。',
      tips: ['记录"今天我推翻了什么旧习惯"', '追踪决策结果', '记录突破边界'],
      keywords: ['果断', '突破', '挑战', '决策'],
    },
    辛金: {
      title: '辛金（珠玉之金）',
      description: '你如珠玉晶莹，精致敏感，适合记录审美发现与精致细节。',
      tips: ['用照片记录"今日最美一刻"', '记录审美感受', '追踪自我雕琢历程'],
      keywords: ['精致', '审美', '细节', '品质'],
    },
    壬水: {
      title: '壬水（江河之水）',
      description: '你如江河奔涌，自由流动，适合用语音便签随时捕捉念头。',
      tips: ['用语音随时捕捉灵感', '记录冒险与探索经历', '追踪思想流动'],
      keywords: ['自由', '探索', '灵感', '流动'],
    },
    癸水: {
      title: '癸水（雨露之水）',
      description: '你如清晨雨露，直觉敏锐，适合在清晨记录梦境与潜意识。',
      tips: ['早晨记录梦境碎片', '追踪直觉与预感', '记录潜意识洞察'],
      keywords: ['直觉', '梦境', '潜意识', '敏锐'],
    },
  }
  return styles[dayMaster]
}
