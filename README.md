# 🌊 Time River · 时光流

> **记录即修行，觉察即改命**

全球首个融合东西方命理、基于 Solana 与 Arweave 的 AI 驱动去中心化生命资产协议。

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF?logo=solana)](https://solana.com)
[![Arweave](https://img.shields.io/badge/Arweave-Irys-222222?logo=arweave)](https://irys.xyz)
[![Claude AI](https://img.shields.io/badge/Claude-3.5_Sonnet-orange?logo=anthropic)](https://anthropic.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## ✨ 项目简介

Time River 是一个将**东西方命理智慧**与 **Web3 数据主权**深度融合的生命记录协议。

用户将文字、影像、情绪觉察等生命痕迹**加密铸造**为一条不可篡改的"时间之河"。内置的双命理 AI 引擎（**八字十神 × 占星流年**）对用户过往记忆进行跨时空复盘分析，将凝结了成长顿悟的"经验气泡"一键 Mint 为可交易 NFT 或链上声誉凭证。

针对"不知道记什么"的普遍痛点，平台内置 **AI 记录灵感引擎**，根据用户命盘、当日运势和历史风格，推送个性化记录引导。

---

## 🎯 核心差异化

市场唯一同时融合五个维度的协议：

| 维度 | 能力 |
|------|------|
| 🔯 **双命理引擎** | 八字十神 + 占星流年相位，东西方融合 |
| 🔐 **端对端加密** | AES-256-GCM，密钥由私钥派生，平台零接触明文 |
| ♾️ **永久存储** | Arweave via Irys，200 年不消失，无续费 |
| ⛓ **链上资产化** | SBT 生命勋章 + cNFT 经验资产（Metaplex Bubblegum） |
| 🤖 **AI 跨时空复盘** | RAG + pgvector + Claude 3.5 Sonnet，注入命理 Context |

---

## 🖼 产品截图

### 首页 · 彩色词云 + 动态光晕背景
词云按语义分 6 种颜色（命运/时间/觉察/情感/成长/河流），5 个动态光晕 blob 缓慢漂浮，营造沉浸氛围。

### 时光之河 · 沉浸式记录长河
宽幅 SVG 河流（13 层叠加：580px 漫散光 + 涟漪纹理 + 多条流动高光动画），双侧雾气渐变，置身河边既视感。

### 命书测算 · AI 七维度命理报告
输入生辰后自动排盘八字，AI 从性格、财运、事业、感情、健康、流年、天赋七个维度生成深度报告。

### 天时脉搏 · 今日命理浮窗
固定右侧浮窗，实时显示今日十神、五行气场进度条、水星逆行等天象动态。

---

## 🏗 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  Next.js 16 + Framer Motion + Tailwind v4                   │
│  Solana Wallet Adapter (Wallet Standard)                     │
└──────────────┬──────────────────────────────────────────────┘
               │ API Routes
┌──────────────▼──────────────────────────────────────────────┐
│                      Backend Services                        │
│  八字引擎 (TypeScript / 6tail lunar)                         │
│  占星引擎 (swisseph-wasm)                                    │
│  Claude 3.5 Sonnet (命书生成 / AI 对话 / 灵感引导)           │
│  Supabase + pgvector (记录存储 / RAG 向量检索)               │
└──────────────┬──────────────────────────────────────────────┘
               │ Web3 层
┌──────────────▼──────────────────────────────────────────────┐
│  Solana (Anchor)      │  Arweave (Irys devnet)              │
│  · SPL Memo 存证      │  · AES-256-GCM 加密上传             │
│  · SBT 生命勋章       │  · 永久内容寻址存储                  │
│  · cNFT 经验资产      │  · 公开 Gateway 访问                 │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 项目结构

```
time-river/
├── frontend/                    # Next.js 前端应用
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # 首页（词云 + 光晕背景）
│   │   │   ├── home/            # 主页（天时脉搏 + 快捷操作）
│   │   │   ├── records/         # 时光之河（沉浸式记录流）
│   │   │   ├── destiny/         # 命书测算（排盘 + AI 报告）
│   │   │   ├── marketplace/     # 经验市场（NFT 交易）
│   │   │   ├── onboarding/      # 新用户引导
│   │   │   └── api/             # 服务端 API Routes
│   │   │       ├── bazi/        # 八字排盘
│   │   │       ├── ai/          # Claude AI（命书/对话/灵感）
│   │   │       ├── storage/     # Arweave 加密上传
│   │   │       ├── records/     # Supabase 记录 CRUD
│   │   │       └── solana/      # 链上存证
│   │   ├── components/
│   │   │   ├── pulse/           # DestinyPulse 天时浮窗
│   │   │   ├── inspiration/     # InspirationZone 灵感引导
│   │   │   ├── destiny/         # 命书组件（八字图/大运/报告）
│   │   │   └── river/           # 记录弹窗 + Modal
│   │   └── lib/
│   │       ├── bazi/            # 八字排盘引擎
│   │       ├── astro/           # 占星计算引擎
│   │       ├── crypto/          # AES-256-GCM 加解密
│   │       ├── ai/              # Claude SDK 封装
│   │       └── storage/         # Irys 上传封装
│   └── supabase/schema.sql      # 数据库表结构
└── programs/time_river/         # Anchor (Rust) 链上程序
    └── src/lib.rs               # 记录存证 + SBT 逻辑
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- pnpm ≥ 8

### 安装

```bash
git clone https://github.com/senl78515-hash/time-river.git
cd time-river/frontend
pnpm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Supabase（可选，未配置时自动降级为本地模式）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Arweave / Irys（可选，未配置时使用 mock CID）
IRYS_NODE_URL=https://devnet.irys.xyz
IRYS_WALLET_PRIVATE_KEY=...
```

### 启动开发服务器

```bash
pnpm dev
# 或
npx next dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 🎮 Demo 演示流程

1. **首页** → 点击"连接钱包"（需安装 Phantom / Solflare）或点击"无需钱包，先浏览"
2. **Onboarding** → 填写姓名等基本信息
3. **命书测算** → 输入生辰八字，点击"开始排盘"，等待 AI 生成七维命书
4. **时光之河** → 查看沉浸式记录流，点击"记录此刻"写下今天的感悟
5. **主页** → 查看天时脉搏浮窗（今日十神 + 五行气场）
6. **经验市场** → 浏览可交易的生命资产 NFT

> 💡 **未配置 Anthropic API Key**：命书生成会返回提示，其余功能正常运行  
> 💡 **未配置 Supabase**：记录数据自动降级为本地 mock，不影响演示  
> 💡 **未配置 Irys Key**：上传使用 mock CID，加密流程完整可演示

---

## 🔒 隐私与安全设计

```
用户内容
    │
    ▼
AES-256-GCM 加密（密钥 = HKDF(私钥签名, salt)）
    │
    ▼
Irys → Arweave 永久存储（只有用户持有私钥才能解密）
    │
    ▼
内容哈希 + Arweave CID → Solana SPL Memo 存证（不可篡改）
    │
    ▼
平台永远无法读取明文 ✅
```

---

## 🗺 路线图

| 阶段 | 功能 | 状态 |
|------|------|------|
| Phase 0 | 钱包连接、八字排盘、AI 命书、时光之河 UI、加密上传 | ✅ MVP |
| Phase 1 | SBT 生命勋章铸造、RAG 记忆检索、大运流年分析 | 🔜 |
| Phase 2 | cNFT 经验资产、经验市场、社交层 | 📋 |
| Phase 3 | 占星引擎深度集成、可验证 AI 推理 | 📋 |

---

## 🏆 参赛信息

本项目为 **Solana x AI Vibe Coding Hackathon 2026**（深圳，2026-04-18）参赛作品。

---

## 📄 License

MIT © 2026 Time River

---

<div align="center">
  <strong>🌊 Time River · 时光流</strong><br/>
  记录即修行，觉察即改命<br/>
  Built on Solana × Arweave × Claude AI
</div>
