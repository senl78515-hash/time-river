import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return null
  return createClient(url, key)
}

// GET：获取用户记录列表
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get('wallet')
  const type = req.nextUrl.searchParams.get('type')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') ?? '100')
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0')

  if (!wallet) {
    return NextResponse.json({ records: [], total: 0 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ records: [], total: 0, warning: 'Supabase 未配置' })
  }

  try {
    let query = supabase
      .from('records')
      .select('*', { count: 'exact' })
      .eq('owner', wallet)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ records: data || [], total: count ?? 0 })
  } catch (err) {
    console.error('获取记录失败:', err)
    return NextResponse.json({ records: [], total: 0 })
  }
}

// POST：保存新记录 / 提交命书反馈
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 命书反馈
    if (body.type === 'destiny_feedback') {
      return handleDestinyFeedback(body)
    }

    // 普通记录
    return handleSaveRecord(body)
  } catch (err) {
    console.error('POST records 失败:', err)
    return NextResponse.json(
      { error: '请求处理失败', detail: err instanceof Error ? err.message : '未知错误' },
      { status: 500 }
    )
  }
}

async function handleSaveRecord(body: Record<string, unknown>) {
  const {
    wallet,
    arweave_cid,
    solana_tx_hash,
    type,
    title,
    preview,
    encrypted,
    inspiration_id,
    is_nft,
    nft_mint,
  } = body as {
    wallet: string
    arweave_cid: string
    solana_tx_hash?: string
    type?: string
    title?: string
    preview?: string
    encrypted?: boolean
    inspiration_id?: string
    is_nft?: boolean
    nft_mint?: string
  }

  if (!wallet || !arweave_cid) {
    return NextResponse.json({ error: '缺少必要字段 wallet 或 arweave_cid' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    // 未配置 Supabase，返回本地记录（MVP 演示）
    return NextResponse.json({
      record: {
        id: `local_${Date.now()}`,
        owner: wallet,
        arweave_cid,
        solana_tx_hash: solana_tx_hash || '',
        type: type || 'text',
        title: title || null,
        preview: preview || '',
        encrypted: encrypted ?? true,
        is_nft: is_nft ?? false,
        nft_mint: nft_mint || null,
        created_at: new Date().toISOString(),
      },
      success: true,
      warning: 'Supabase 未配置，记录仅本地保存',
    })
  }

  // 确保 profile 存在
  await supabase.from('profiles').upsert(
    { wallet_address: wallet, updated_at: new Date().toISOString() },
    { onConflict: 'wallet_address', ignoreDuplicates: true }
  )

  const { data, error } = await supabase
    .from('records')
    .insert({
      owner: wallet,
      arweave_cid,
      solana_tx_hash: solana_tx_hash || null,
      type: type || 'text',
      title: title || null,
      preview: preview || '',
      encrypted: encrypted ?? true,
      inspiration_id: inspiration_id || null,
      is_nft: is_nft ?? false,
      nft_mint: nft_mint || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase 保存失败:', error)
    return NextResponse.json({ error: '数据库保存失败', detail: error.message }, { status: 500 })
  }

  // 更新记录计数（静默失败）
  try {
    await supabase.rpc('increment_record_count', { wallet_addr: wallet })
  } catch { /* 函数不存在时静默 */ }

  return NextResponse.json({ record: data, success: true })
}

async function handleDestinyFeedback(body: Record<string, unknown>) {
  const { report_id, dimension, feedback } = body as {
    report_id: string
    dimension: string
    feedback: 'accurate' | 'inaccurate'
  }

  if (!report_id || !dimension || !feedback) {
    return NextResponse.json({ error: '缺少反馈参数' }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ success: true, warning: 'Supabase 未配置' })
  }

  const { error } = await supabase.from('destiny_feedback').insert({
    report_id,
    user_wallet: body.wallet as string || 'anonymous',
    dimension_key: dimension,
    feedback,
  })

  if (error) {
    console.warn('反馈保存失败:', error)
  }

  return NextResponse.json({ success: true })
}
