/**
 * Time River — Claude AI 接口封装
 * 负责命理 Context 注入、命书生成、记录灵感生成、对话修正
 */

import Anthropic from '@anthropic-ai/sdk'
import type { BaziResult, AstroChart, DestinyDimension, DayMaster, TenGod } from '@/types'

// 仅在服务端使用（API Route 中调用）
let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return client
}

// ── 构建命理 Context ──────────────────────────────────────────
export function buildDestinyContext(
  bazi: BaziResult,
  astro: AstroChart,
  additionalContext?: string
): string {
  return `
【用户命理背景】
八字四柱：${bazi.year_pillar.stem}${bazi.year_pillar.branch} ${bazi.month_pillar.stem}${bazi.month_pillar.branch} ${bazi.day_pillar.stem}${bazi.day_pillar.branch} ${bazi.hour_pillar.stem}${bazi.hour_pillar.branch}
日主：${bazi.day_master_label}（${bazi.day_master}）
今日流日十神：${bazi.day_ten_god}（${bazi.day_ten_god_description}）
五行得分：木${bazi.five_elements_score['木']} 火${bazi.five_elements_score['火']} 土${bazi.five_elements_score['土']} 金${bazi.five_elements_score['金']} 水${bazi.five_elements_score['水']}
喜用神：${bazi.favorable_elements.join('、')}
忌神：${bazi.unfavorable_elements.join('、')}
流年：${bazi.current_year_stem}${bazi.current_year_branch}年（${bazi.current_year_ten_god}）

【当前天象】
太阳：${astro.sun_sign} | 月亮：${astro.moon_sign}
水星逆行：${astro.mercury_retrograde ? '是（谨慎沟通）' : '否'}
重要过运：${astro.notable_transits.slice(0, 3).join('、')}

${additionalContext ? `【补充信息】\n${additionalContext}` : ''}
`.trim()
}

// ── 命书生成 ──────────────────────────────────────────────────
export interface DestinyReportGenerationInput {
  bazi: BaziResult
  astro: AstroChart
  name?: string
  gender: 'male' | 'female'
}

const DESTINY_DIMENSIONS = [
  { key: 'personality', label: '性格命格' },
  { key: 'career', label: '事业功名' },
  { key: 'marriage', label: '婚姻姻缘' },
  { key: 'wealth', label: '财富运势' },
  { key: 'children', label: '子女缘分' },
  { key: 'health', label: '健康寿元' },
  { key: 'family', label: '六亲关系' },
]

const CLASSIC_QUOTES: Record<string, string> = {
  personality: '「日主立极，五行配合，性情由此而定」',
  career: '「官星透干，仕途光明；财星有根，商海弄潮」',
  marriage: '「财官双美，姻缘顺遂；冲合化合，情路多变」',
  wealth: '「财逢生旺，取之不尽；财被克泄，须防破耗」',
  children: '「食伤旺盛，子女多缘；食伤受制，骨肉情薄」',
  health: '「五行均衡，体质平和；一行独旺，须防偏颇」',
  family: '「印星护持，母缘深厚；官杀混杂，父缘多折」',
}

export async function generateDestinyReport(
  input: DestinyReportGenerationInput
): Promise<{ summary: string; dimensions: DestinyDimension[] }> {
  const context = buildDestinyContext(input.bazi, input.astro)
  const genderStr = input.gender === 'male' ? '男命' : '女命'
  const nameStr = input.name ? `命主${input.name}，${genderStr}` : genderStr

  // 命书总纲
  const summaryPrompt = `
你是一位精通八字命理、文笔优雅的东方智者。请根据以下命理信息，为用户生成命书总纲。

${context}

要求：
1. 用古典优雅、意境深远的语言，约100字
2. 概括命主的性情气质、人生格局与大趋势
3. 语气温暖而有洞见，如古籍注解般精炼
4. 必须提到日主特质（${input.bazi.day_master_label}）
5. 用第三人称，如"此命..."或"命主..."开头

请直接输出总纲文字，无需其他说明。
`.trim()

  const summaryResponse = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{ role: 'user', content: summaryPrompt }],
  })

  const summary = summaryResponse.content[0].type === 'text'
    ? summaryResponse.content[0].text
    : ''

  // 并发生成七个维度（分批避免超时）
  const dimensionResults: DestinyDimension[] = []

  // 批次1：前3个维度
  const batch1 = await generateDimensionsBatch(
    DESTINY_DIMENSIONS.slice(0, 3),
    context,
    nameStr,
    input.bazi
  )
  dimensionResults.push(...batch1)

  // 批次2：后4个维度
  const batch2 = await generateDimensionsBatch(
    DESTINY_DIMENSIONS.slice(3),
    context,
    nameStr,
    input.bazi
  )
  dimensionResults.push(...batch2)

  return { summary, dimensions: dimensionResults }
}

async function generateDimensionsBatch(
  dimensions: typeof DESTINY_DIMENSIONS,
  context: string,
  nameStr: string,
  bazi: BaziResult
): Promise<DestinyDimension[]> {
  const prompt = `
你是精通八字命理的东方智者，请根据命理信息，用JSON格式为${nameStr}生成命书各维度解析。

${context}

请生成以下维度的解析，每个维度约80-120字，古典优雅，融入具体命理依据：
${dimensions.map(d => d.key + ':' + d.label).join(', ')}

返回格式（严格JSON）：
{
  ${dimensions.map(d => `"${d.key}": "维度解析文字"`).join(',\n  ')}
}

注意：直接返回JSON，无需 markdown 代码块包裹。
`.trim()

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'

  let parsed: Record<string, string> = {}
  try {
    parsed = JSON.parse(text)
  } catch {
    // 尝试提取 JSON
    const match = text.match(/\{[\s\S]+\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch {}
    }
  }

  return dimensions.map(d => ({
    key: d.key,
    label: d.label,
    classic_quote: CLASSIC_QUOTES[d.key] || '',
    content: parsed[d.key] || `正在解析${d.label}...`,
    feedback: undefined,
  }))
}

// ── 每日 AI 微语 ──────────────────────────────────────────────
export async function generateDailyMessage(
  dayTenGod: TenGod,
  notableTransits: string[],
  dayMaster: DayMaster
): Promise<string> {
  const prompt = `
你是Time River的AI导师，用温暖简短的语言（20-35字）生成今日微语。

今日：${dayTenGod}当道，${notableTransits[0] || '天象平和'}
命主日主：${dayMaster}

要求：
- 结合十神特质给出一句温情提示
- 自然流畅，不生硬
- 如："今日${dayTenGod}当令，..."
- 只输出这一句话，无引号无标点外的其他内容
`.trim()

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : `今日${dayTenGod}当令，宜顺势而为，静待花开。`
}

// ── 记录灵感生成 ──────────────────────────────────────────────
export async function generateInspirationPrompt(
  dayTenGod: TenGod,
  dayMaster: DayMaster,
  recentThemes?: string[]
): Promise<string> {
  const themesContext = recentThemes?.length
    ? `用户近期记录主题：${recentThemes.slice(0, 3).join('、')}`
    : ''

  const prompt = `
你是Time River的记录引导师，请生成一条个性化的今日记录提示（问题形式）。

今日十神：${dayTenGod}
用户日主：${dayMaster}
${themesContext}

要求：
- 结合今日十神特质设计问题
- 开放式、能引发思考
- 20-35字，温柔而有深度
- 如："今天有没有一个瞬间让你感到..."
- 只输出问题本身
`.trim()

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 80,
    messages: [{ role: 'user', content: prompt }],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text.trim()
    : '今天哪个瞬间让你觉得「活着真好」？'
}

// ── AI 对话（含命理 Context）────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function chatWithDestinyContext(
  messages: ChatMessage[],
  bazi: BaziResult | null,
  astro: AstroChart | null,
  memoryContext?: string
): Promise<string> {
  const destinySection = bazi && astro
    ? buildDestinyContext(bazi, astro, memoryContext)
    : memoryContext || '（命理信息暂未加载，以日常智慧回答）'

  const systemPrompt = `
你是 Time River 的全知 AI 导师，融合东西方命理智慧。

${destinySection}

角色定位：
- 你是用户最懂命理、又最懂ta的知心好友
- 回答融合八字、占星、与用户个人历史记忆
- 语言温暖、有洞见、不卖弄玄学
- 在命理建议后，总给出1-2个可操作的具体行动建议
- 免责：命理分析仅供心理参考，不作为重大决策唯一依据

请用中文回答，约150-300字。
`.trim()

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 600,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  return response.content[0].type === 'text'
    ? response.content[0].text
    : '正在为你解析天机，请稍候...'
}

// ── AI 对话式记录引导 ─────────────────────────────────────────
export async function conductInspirationDialogue(
  conversationHistory: ChatMessage[],
  dayTenGod: TenGod,
  dayMaster: DayMaster
): Promise<{ message: string; isComplete: boolean; draft?: string }> {
  const systemPrompt = `
你是Time River的温柔记录引导师，专门帮助用户挖掘值得记录的素材。

今日十神：${dayTenGod}，用户日主：${dayMaster}

你的任务：
1. 如果是第一轮对话：问一个简单开放的问题挖掘素材
2. 如果用户已回答1-2次：追问一个更深入的问题
3. 如果用户已回答3次以上：生成一段记录草稿，并设置 isComplete=true

响应格式（严格JSON）：
{
  "message": "你的回应/问题",
  "isComplete": false,
  "draft": null  // 或在完成时提供草稿文字
}

风格：温柔、好奇、鼓励，不超过60字/回合。直接返回JSON。
`.trim()

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: systemPrompt,
    messages: conversationHistory.map(m => ({
      role: m.role,
      content: m.content,
    })),
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(text)
    return {
      message: parsed.message || '今天遇到了什么有趣的事吗？',
      isComplete: parsed.isComplete || false,
      draft: parsed.draft || undefined,
    }
  } catch {
    return {
      message: '今天有什么让你印象深刻的瞬间吗？',
      isComplete: false,
    }
  }
}
