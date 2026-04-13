// ============================================================
// Time River — 全局类型定义
// ============================================================

// ---------- 记录相关 ----------
export type RecordType = 'text' | 'image' | 'video' | 'audio' | 'file'

export interface MemoryRecord {
  id: string
  owner: string              // 钱包地址
  type: RecordType
  title?: string
  preview: string            // 加密后的预览文字/缩略图 URL
  arweave_cid: string        // Arweave 永久存储 CID
  solana_tx_hash: string     // Solana 存证交易 hash
  created_at: string         // ISO 时间戳
  encrypted: boolean         // 是否已加密
  inspiration_id?: string    // 来源灵感 ID（如有）
  is_nft: boolean
  nft_mint?: string
  // 解密后填充
  decrypted_content?: string
}

// ---------- 用户档案 ----------
export interface UserProfile {
  wallet_address: string
  bazi_json?: BaziResult     // 八字排盘结果
  astro_json?: AstroChart    // 星盘数据
  day_master?: DayMaster     // 日主天干
  active_hours?: number[]    // 活跃时段 (0-23)
  ai_preference?: 'poetic' | 'analytical' | 'balanced'
  created_at: string
  streak_days: number        // 连续记录天数
  total_records: number
}

// ---------- 八字相关 ----------
export type HeavenlyStem =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸'

export type EarthlyBranch =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥'

export type TenGod =
  | '比肩' | '劫财' | '食神' | '伤官'
  | '正财' | '偏财' | '正官' | '七杀'
  | '正印' | '偏印'

export type DayMaster =
  | '甲木' | '乙木' | '丙火' | '丁火' | '戊土'
  | '己土' | '庚金' | '辛金' | '壬水' | '癸水'

export type FiveElement = '木' | '火' | '土' | '金' | '水'

export interface Pillar {
  stem: HeavenlyStem
  branch: EarthlyBranch
  stem_ten_god?: TenGod
  branch_ten_god?: TenGod
  hidden_stems?: HeavenlyStem[]
}

export interface BaziResult {
  year_pillar: Pillar
  month_pillar: Pillar
  day_pillar: Pillar
  hour_pillar: Pillar
  day_master: HeavenlyStem
  day_master_element: FiveElement
  day_master_label: DayMaster
  five_elements_score: Record<FiveElement, number>
  favorable_elements: FiveElement[]
  unfavorable_elements: FiveElement[]
  day_ten_god: TenGod         // 今日流日十神
  day_ten_god_description: string
  major_cycles: MajorCycle[]  // 大运
  current_year_stem: HeavenlyStem
  current_year_branch: EarthlyBranch
  current_year_ten_god: TenGod
}

export interface MajorCycle {
  start_age: number
  stem: HeavenlyStem
  branch: EarthlyBranch
  ten_god: TenGod
}

// ---------- 占星相关 ----------
export interface Planet {
  name: string
  sign: string
  degree: number
  retrograde: boolean
  house?: number
}

export interface Aspect {
  planet1: string
  planet2: string
  type: 'conjunction' | 'trine' | 'square' | 'opposition' | 'sextile'
  orb: number
  applying: boolean
}

export interface AstroChart {
  sun_sign: string
  moon_sign: string
  rising_sign: string
  planets: Planet[]
  aspects: Aspect[]
  mercury_retrograde: boolean
  notable_transits: string[]   // 当前重要过运描述列表
}

// ---------- 命书测算 ----------
export interface DestinyInput {
  name?: string
  gender: 'male' | 'female'
  birth_date: string           // YYYY-MM-DD
  birth_time: string           // HH:MM
  birth_province: string
  birth_city: string
  birth_district?: string
  is_lunar?: boolean
}

export interface DestinyDimension {
  key: string
  label: string
  classic_quote: string        // 铁板神数/命理口诀
  content: string              // AI 生成内容
  feedback?: 'accurate' | 'inaccurate'
}

export interface DestinyReport {
  id: string
  user_wallet: string
  input: DestinyInput
  bazi: BaziResult
  summary: string              // 命书总纲
  dimensions: DestinyDimension[]
  arweave_cid?: string
  solana_tx_hash?: string
  nft_mint?: string
  created_at: string
  version: number
}

// ---------- 灵感引擎 ----------
export interface InspirationPrompt {
  id: string
  content: string              // 提示文字
  type: 'daily_question' | 'template' | 'bubble' | 'ai_dialogue'
  template_key?: 'gratitude' | 'emotion_weather' | 'highlight' | 'future_letter' | 'destiny_insight'
  dimension: 'destiny' | 'history' | 'frequency' | 'character' | 'solar_term'
  day_master_weights: Record<string, number>   // 日主适配权重
  tags: string[]
}

export interface DailyInspiration {
  main: InspirationPrompt
  alternatives: InspirationPrompt[]
  daily_question: string
  style_hint: string           // 基于日主的记录风格提示
}

// ---------- Destiny Pulse ----------
export interface DestinyPulse {
  day_ten_god: TenGod
  day_ten_god_desc: string
  day_element: FiveElement
  mercury_retrograde: boolean
  notable_transits: string[]
  ai_daily_message: string     // AI 每日温情微语
  date: string
}

// ---------- NFT / SBT ----------
export interface ExperienceNFT {
  mint: string
  title: string
  description: string
  record_ids: string[]
  arweave_cid: string
  creator: string
  price?: number               // SOL 单位
  royalty_bps: number          // 版税基点 e.g. 500 = 5%
  created_at: string
}

export interface LifeBadge {
  mint: string
  badge_type: BadgeType
  owner: string
  earned_at: string
  metadata_uri: string
}

export type BadgeType =
  | 'first_record'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100'
  | 'first_nft_sale'
  | 'destiny_completed'
  | 'inspiration_hunter'

// ---------- 能量报告 ----------
export type ReportPeriod = 'day' | 'week' | 'month' | 'year'

export interface EnergyReport {
  id: string
  period: ReportPeriod
  start_date: string
  end_date: string
  five_element_curve: Array<{ date: string; scores: Record<FiveElement, number> }>
  astro_resonance: Array<{ date: string; intensity: number; event: string }>
  ai_keywords: string[]
  ai_summary: string
  record_count: number
  arweave_cid?: string
  nft_mint?: string
}
