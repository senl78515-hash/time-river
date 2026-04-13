# Time River 黑客松快速配置指南

## 1. 配置环境变量

编辑 `frontend/.env.local`，填入以下必填项：

```bash
# 必填：Anthropic API Key（命书生成、AI对话、每日微语）
ANTHROPIC_API_KEY=sk-ant-xxx

# 可选：Supabase（记录持久化，未填则仅本地演示）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx
```

## 2. 初始化 Supabase 数据库

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目
3. 进入 **SQL Editor**
4. 复制 `frontend/supabase/schema.sql` 全部内容粘贴执行

## 3. Solana 钱包配置

服务端钱包地址：`Er5uFd5D41q1RzNpUq8JRMGKJM4JBzWkXncwhjfdCAAD`

领取 devnet SOL（用于支付交易费）：
- 网页水龙头：https://faucet.solana.com/?wallet=Er5uFd5D41q1RzNpUq8JRMGKJM4JBzWkXncwhjfdCAAD
- CLI：`wsl -d Ubuntu solana airdrop 2 --url devnet`

## 4. 部署 Anchor 程序（可选，有 mock 降级）

```bash
# 在 WSL2 Ubuntu 执行
cd /mnt/d/develop/timeRiver

# 等待编译完成（首次约10分钟）
# 检查：ls target/deploy/time_river.so

# 部署到 devnet
export PATH="$HOME/.cargo/bin:/root/.local/share/solana/install/active_release/bin:$PATH"
anchor deploy --provider.cluster devnet

# 部署成功后复制 IDL 到前端 public 目录
cp target/idl/time_river.json frontend/public/idl/time_river.json
```

## 5. 启动开发服务器

```bash
cd frontend
pnpm dev --port 3001
```

访问 http://localhost:3001

## 6. Demo 流程

1. **主页** → 连接 Phantom 钱包（需安装 Phantom 浏览器插件）
2. **天时脉搏** → 右侧浮窗自动显示今日十神和星象
3. **命书测算** → 点击导航「命书测算」→ 填写生辰八字 → 生成七维度命书
4. **记录时光** → 点击「+」→ 写下一段文字 → 加密上传 Arweave → Solana 存证
5. **能量报告** → 左下角「⚡ 能量报告」→ 选择日/周/月/年 → 下载长图
6. **经验市场** → 导航「经验市场」→ 浏览 NFT → 模拟购买流程

## 注意事项

- 未配置 Anthropic API Key 时，AI 功能返回占位文字
- 未配置 Supabase 时，记录仅保存在内存（刷新丢失）
- 未部署 Anchor 程序时，Solana 存证降级为 SPL Memo（功能不受影响）
- 未充值 devnet SOL 时，存证降级为 mock txHash（功能不受影响）
