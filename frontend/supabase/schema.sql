-- ============================================================
-- Time River — Supabase 数据库表结构
-- 在 Supabase Dashboard > SQL Editor 中执行
-- ============================================================

-- 启用 pgvector 扩展（用于 AI 向量搜索）
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 用户档案 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  wallet_address    TEXT PRIMARY KEY,
  bazi_json         JSONB,                    -- BaziResult
  astro_json        JSONB,                    -- AstroChart
  day_master        TEXT,                     -- 日主天干（如 甲木）
  active_hours      INTEGER[],               -- 活跃时段 0-23
  ai_preference     TEXT DEFAULT 'balanced', -- poetic | analytical | balanced
  streak_days       INTEGER DEFAULT 0,
  total_records     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 记忆记录 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner             TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('text','image','video','audio','file')),
  title             TEXT,
  preview           TEXT,                     -- 加密预览/缩略图
  arweave_cid       TEXT NOT NULL,
  solana_tx_hash    TEXT,
  encrypted         BOOLEAN DEFAULT TRUE,
  inspiration_id    UUID,
  is_nft            BOOLEAN DEFAULT FALSE,
  nft_mint          TEXT,
  bazi_snapshot     JSONB,                    -- 记录时的当日天象快照
  embedding         vector(1536),            -- AI 向量嵌入（用于语义搜索）
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_records_owner ON records(owner);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_type ON records(type);
-- 向量相似度索引（HNSW，需要 pgvector 0.5+）
CREATE INDEX IF NOT EXISTS idx_records_embedding ON records
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── 命书报告 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destiny_reports (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet       TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  input_json        JSONB NOT NULL,          -- DestinyInput
  bazi_json         JSONB NOT NULL,          -- BaziResult
  summary           TEXT NOT NULL,
  dimensions_json   JSONB NOT NULL,          -- DestinyDimension[]
  arweave_cid       TEXT,
  solana_tx_hash    TEXT,
  nft_mint          TEXT,
  version           INTEGER DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destiny_user ON destiny_reports(user_wallet);

-- ── 命书维度反馈 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destiny_feedback (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id         UUID NOT NULL REFERENCES destiny_reports(id) ON DELETE CASCADE,
  user_wallet       TEXT NOT NULL,
  dimension_key     TEXT NOT NULL,
  feedback          TEXT NOT NULL CHECK (feedback IN ('accurate', 'inaccurate')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 灵感提示词 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inspiration_prompts (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content           TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('daily_question','template','bubble','ai_dialogue')),
  template_key      TEXT,
  dimension         TEXT NOT NULL CHECK (dimension IN ('destiny','history','frequency','character','solar_term')),
  day_master_weights JSONB DEFAULT '{}',     -- Record<DayMaster, number>
  tags              TEXT[] DEFAULT '{}',
  active            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── AI 对话历史 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_conversations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_wallet       TEXT NOT NULL REFERENCES profiles(wallet_address) ON DELETE CASCADE,
  type              TEXT NOT NULL CHECK (type IN ('inspiration','destiny_chat','daily')),
  messages_json     JSONB NOT NULL,          -- ConversationMessage[]
  draft             TEXT,                    -- AI 生成的记录草稿
  record_id         UUID REFERENCES records(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON ai_conversations(user_wallet);

-- ── NFT / 经验市场 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS experience_nfts (
  mint              TEXT PRIMARY KEY,
  title             TEXT NOT NULL,
  description       TEXT,
  record_ids        UUID[],
  arweave_cid       TEXT NOT NULL,
  creator           TEXT NOT NULL REFERENCES profiles(wallet_address),
  price_sol         NUMERIC(18, 9),          -- SOL 价格
  royalty_bps       INTEGER DEFAULT 500,    -- 版税基点
  listed            BOOLEAN DEFAULT TRUE,
  sold_count        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nft_creator ON experience_nfts(creator);
CREATE INDEX IF NOT EXISTS idx_nft_listed ON experience_nfts(listed, created_at DESC);

-- ── 生命勋章 (SBT) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS life_badges (
  mint              TEXT PRIMARY KEY,
  badge_type        TEXT NOT NULL,
  owner             TEXT NOT NULL REFERENCES profiles(wallet_address),
  earned_at         TIMESTAMPTZ DEFAULT NOW(),
  metadata_json     JSONB
);

CREATE INDEX IF NOT EXISTS idx_badge_owner ON life_badges(owner);

-- ── RLS 行级安全策略 ─────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE destiny_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE destiny_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的数据（通过 service_role 绕过 RLS 写入）
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (wallet_address = current_setting('app.wallet_address', TRUE));

CREATE POLICY "users_own_records" ON records
  FOR ALL USING (owner = current_setting('app.wallet_address', TRUE));

CREATE POLICY "users_own_destiny" ON destiny_reports
  FOR ALL USING (user_wallet = current_setting('app.wallet_address', TRUE));

-- 市场 NFT 公开可读
CREATE POLICY "nfts_public_read" ON experience_nfts
  FOR SELECT USING (listed = TRUE);

-- ── 预置灵感提示词（50条）────────────────────────────────────
INSERT INTO inspiration_prompts (content, type, dimension, day_master_weights, tags) VALUES
-- 每日问题类
('今天，你感受到了什么让你心动的瞬间？', 'daily_question', 'frequency', '{"甲木":1.2,"乙木":1.1}', '{"情绪","感受"}'),
('此刻，你最想对三年前的自己说什么？', 'daily_question', 'history', '{"壬水":1.3,"癸水":1.2}', '{"回顾","成长"}'),
('今天遇到的挑战，让你发现了自己哪些没察觉的力量？', 'daily_question', 'character', '{"庚金":1.2,"辛金":1.1}', '{"成长","力量"}'),
('用三个词描述今天你所处的状态。', 'daily_question', 'frequency', '{}', '{"状态","感知"}'),
('今天有什么事，让你感到"这就是我想要的生活"？', 'daily_question', 'destiny', '{"丙火":1.2,"丁火":1.1}', '{"愿景","满足"}'),
('如果把今天拍成一张照片，你会拍什么？', 'daily_question', 'frequency', '{"乙木":1.3,"丁火":1.2}', '{"想象","美感"}'),
('今天，你为自己做了什么小小的善意？', 'daily_question', 'character', '{"己土":1.2,"戊土":1.1}', '{"自我关爱","善意"}'),
('有没有一个人，今天让你感到温暖？记录下来。', 'daily_question', 'frequency', '{"丁火":1.3,"己土":1.2}', '{"关系","温暖"}'),
('今天什么时候你感到时间过得最快？那时你在做什么？', 'daily_question', 'destiny', '{"甲木":1.1}', '{"心流","热情"}'),
('如果今天是你生命最后一天，你会觉得遗憾什么？', 'daily_question', 'history', '{"壬水":1.2,"癸水":1.3}', '{"人生","优先级"}'),

-- 模板类
('【感恩三事】今天让我感激的三件事：\n1. \n2. \n3. \n这些事让我感受到：', 'template', 'frequency', '{}', '{"感恩","积极"}'),
('【情绪气象站】今天的天气：晴/阴/多云/雨\n情绪温度：°C\n一件小事改变了今天的走向：\n此刻我最想说：', 'template', 'frequency', '{"壬水":1.2}', '{"情绪","觉察"}'),
('【高光时刻】今天最让我骄傲的一件事：\n当时的感受：\n我希望未来的自己记得：', 'template', 'character', '{}', '{"成就","自信"}'),
('【未来书信】亲爱的三年后的我：\n现在的我正在经历：\n我相信你现在已经：\n我想叮嘱你：', 'template', 'destiny', '{"癸水":1.2,"壬水":1.1}', '{"未来","目标"}'),
('【命运洞见】今日八字天时提示我：\n这与我今天的感受呼应的地方是：\n我想记录的一个"天人感应"时刻：', 'template', 'destiny', '{}', '{"命理","洞见"}'),

-- 气泡提示（简短）
('记下这一刻的温度', 'bubble', 'frequency', '{}', '{"当下"}'),
('今天最小的惊喜', 'bubble', 'frequency', '{}', '{"惊喜"}'),
('一句话总结今天', 'bubble', 'frequency', '{}', '{"总结"}'),
('此刻你的手旁有什么？', 'bubble', 'frequency', '{}', '{"当下","感知"}'),
('最近在听什么歌？心情如何？', 'bubble', 'frequency', '{}', '{"音乐","情绪"}'),

-- 节气类
('春分将至，你的心里什么种子正在破土？', 'daily_question', 'solar_term', '{"甲木":1.5,"乙木":1.3}', '{"节气","生长","春分"}'),
('冬至一阳生，此刻你感受到什么在悄悄复苏？', 'daily_question', 'solar_term', '{"壬水":1.4,"癸水":1.3}', '{"节气","冬至","新生"}'),

-- 深度问题
('你最近一次哭是什么时候？为什么哭？', 'daily_question', 'character', '{"癸水":1.4,"丁火":1.2}', '{"情绪","深度"}'),
('有什么事你已经做了很久，但从未告诉任何人？', 'daily_question', 'character', '{}', '{"秘密","坚持"}'),
('你现在最恐惧的事是什么？', 'daily_question', 'character', '{}', '{"恐惧","诚实"}'),
('你爱自己吗？今天有什么证明？', 'daily_question', 'character', '{"己土":1.3,"丁火":1.2}', '{"自爱","诚实"}'),
('如果明天你能改变一件事，你会改变什么？', 'daily_question', 'destiny', '{}', '{"改变","勇气"}'),
('什么是你永远不会后悔的事？', 'daily_question', 'history', '{}', '{"价值观","坚定"}'),
('今天，谁最需要你的一句鼓励？你说了吗？', 'daily_question', 'character', '{"戊土":1.2,"己土":1.1}', '{"关系","行动"}');

-- ── 函数：更新 updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 函数：语义搜索记录 ───────────────────────────────────────
CREATE OR REPLACE FUNCTION search_records_semantic(
  query_embedding vector(1536),
  wallet_addr TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  preview TEXT,
  arweave_cid TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.id, r.type, r.title, r.preview, r.arweave_cid, r.created_at,
    1 - (r.embedding <=> query_embedding) as similarity
  FROM records r
  WHERE
    r.owner = wallet_addr
    AND r.embedding IS NOT NULL
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ── 辅助函数：递增记录计数 ────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_record_count(wallet_addr TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET total_records = total_records + 1,
      updated_at = NOW()
  WHERE wallet_address = wallet_addr;
END;
$$;

-- ── 辅助函数：更新连续记录天数 ──────────────────────────────
CREATE OR REPLACE FUNCTION update_streak(wallet_addr TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_record_date DATE;
  today DATE := CURRENT_DATE;
  current_streak INTEGER;
BEGIN
  -- 获取最后一条记录的日期和当前连续天数
  SELECT
    DATE(MAX(created_at)),
    p.streak_days
  INTO last_record_date, current_streak
  FROM records r
  JOIN profiles p ON p.wallet_address = r.owner
  WHERE r.owner = wallet_addr
  GROUP BY p.streak_days;

  -- 计算新连续天数
  IF last_record_date IS NULL THEN
    current_streak := 1;
  ELSIF last_record_date = today - 1 THEN
    current_streak := current_streak + 1;
  ELSIF last_record_date = today THEN
    -- 今天已经记录，不变
    RETURN current_streak;
  ELSE
    current_streak := 1;  -- 断更，重新计算
  END IF;

  UPDATE profiles
  SET streak_days = current_streak, updated_at = NOW()
  WHERE wallet_address = wallet_addr;

  RETURN current_streak;
END;
$$;
