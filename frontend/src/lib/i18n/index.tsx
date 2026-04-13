'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Lang = 'zh' | 'en'

// ── 翻译字典 ──────────────────────────────────────────────────
export const T = {
  zh: {
    // NavBar
    nav_home: '我的主页',
    nav_records: '时光之河',
    nav_destiny: '命书测算',
    nav_market: '经验市场',
    nav_brand: '时光流',
    nav_streak: '天',

    // Marketplace
    mkt_title: '经验市场',
    mkt_subtitle: '每一段真实经历，都值得被珍视 · 以 NFT 形式永久传承',
    mkt_stat_listed: '上架经历',
    mkt_stat_sold: '成交总量',
    mkt_stat_creators: '创作者',
    mkt_tab_all: '全部',
    mkt_tab_mine: '我的上架',
    mkt_search_ph: '搜索标题、描述...',
    mkt_addr_ph: '创作者地址...',
    mkt_sort_newest: '最新上架',
    mkt_sort_oldest: '最早上架',
    mkt_sort_price_asc: '价格从低',
    mkt_sort_price_desc: '价格从高',
    mkt_sort_sold: '最多售出',
    mkt_sort_records: '最多记录',
    mkt_filter_time: '上架时间',
    mkt_time_all: '全部时间',
    mkt_time_week: '近 7 天',
    mkt_time_month: '近 30 天',
    mkt_time_3month: '近 3 个月',
    mkt_records_count: '条记录',
    mkt_sold_count: '次售出',
    mkt_royalty: '版税',
    mkt_buy: '购买',
    mkt_sell_btn: '+ 出售我的经历',
    mkt_empty: '未找到匹配经历',
    mkt_footer: '由 Solana + Metaplex 驱动 · 所有交易链上可查 · 平台收取 2.5% 服务费',
    mkt_no_mine: '你还没有上架任何经历',
    mkt_go_records: '前往时光之河铸造 NFT →',

    // Buy Modal
    buy_title: '确认购买',
    buy_price: '商品价格',
    buy_royalty: '版税',
    buy_fee: '网络费',
    buy_total: '合计',
    buy_need_wallet: '请先连接钱包',
    buy_cancel: '取消',
    buy_confirm: '确认支付',
    buy_processing: 'Solana 链上交易处理中...',
    buy_approve: '请在钱包中确认交易',
    buy_success: '购买成功！',
    buy_success_desc: 'NFT 已转入你的钱包，可在「时光之河」查看',
    buy_done: '完成',

    // Sell Panel
    sell_title: '将你的经历铸造为 NFT',
    sell_desc: '选择你的记录，设置价格，每次转手你将获得版税收益',
    sell_step1: '选择记录',
    sell_step2: '设置价格',
    sell_step3: 'Mint & 上架',
    sell_go: '前往「时光之河」选择要出售的内容',

    // Common
    creator: '创作者',
    price: '价格',
    lang_toggle: 'EN',
  },
  en: {
    nav_home: 'Home',
    nav_records: 'Time River',
    nav_destiny: 'Destiny',
    nav_market: 'Marketplace',
    nav_brand: 'Time River',
    nav_streak: 'd streak',

    mkt_title: 'Experience Market',
    mkt_subtitle: 'Every authentic experience deserves to be valued · Immortalized as NFT',
    mkt_stat_listed: 'Listed',
    mkt_stat_sold: 'Total Sales',
    mkt_stat_creators: 'Creators',
    mkt_tab_all: 'All',
    mkt_tab_mine: 'My Listings',
    mkt_search_ph: 'Search title, description...',
    mkt_addr_ph: 'Creator address...',
    mkt_sort_newest: 'Newest',
    mkt_sort_oldest: 'Oldest',
    mkt_sort_price_asc: 'Price: Low',
    mkt_sort_price_desc: 'Price: High',
    mkt_sort_sold: 'Most Sold',
    mkt_sort_records: 'Most Records',
    mkt_filter_time: 'Listed Time',
    mkt_time_all: 'All Time',
    mkt_time_week: 'Last 7 days',
    mkt_time_month: 'Last 30 days',
    mkt_time_3month: 'Last 3 months',
    mkt_records_count: 'records',
    mkt_sold_count: 'sold',
    mkt_royalty: 'Royalty',
    mkt_buy: 'Buy',
    mkt_sell_btn: '+ List My Experience',
    mkt_empty: 'No results found',
    mkt_footer: 'Powered by Solana + Metaplex · All transactions on-chain · 2.5% platform fee',
    mkt_no_mine: 'You have no active listings',
    mkt_go_records: 'Go to Time River to mint NFT →',

    buy_title: 'Confirm Purchase',
    buy_price: 'Item Price',
    buy_royalty: 'Royalty',
    buy_fee: 'Network Fee',
    buy_total: 'Total',
    buy_need_wallet: 'Please connect wallet first',
    buy_cancel: 'Cancel',
    buy_confirm: 'Confirm & Pay',
    buy_processing: 'Processing on Solana...',
    buy_approve: 'Please approve in your wallet',
    buy_success: 'Purchase Successful!',
    buy_success_desc: 'NFT transferred to your wallet. View it in Time River.',
    buy_done: 'Done',

    sell_title: 'Mint Your Experience as NFT',
    sell_desc: 'Select your records, set a price, and earn royalties on every resale',
    sell_step1: 'Select Records',
    sell_step2: 'Set Price',
    sell_step3: 'Mint & List',
    sell_go: 'Go to Time River to select records',

    creator: 'Creator',
    price: 'Price',
    lang_toggle: '中',
  },
} as const

export type TKey = keyof typeof T['zh']

// ── Context ───────────────────────────────────────────────────
const LangContext = createContext<{
  lang: Lang
  t: (key: TKey) => string
  toggle: () => void
}>({
  lang: 'zh',
  t: (key) => T.zh[key],
  toggle: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    const saved = localStorage.getItem('tr_lang') as Lang | null
    if (saved === 'en' || saved === 'zh') setLang(saved)
  }, [])

  const toggle = () => {
    setLang(prev => {
      const next = prev === 'zh' ? 'en' : 'zh'
      localStorage.setItem('tr_lang', next)
      return next
    })
  }

  const t = (key: TKey): string => T[lang][key]

  return <LangContext.Provider value={{ lang, t, toggle }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
