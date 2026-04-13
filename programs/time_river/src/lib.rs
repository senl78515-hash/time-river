use anchor_lang::prelude::*;

declare_id!("4nbXrm7iiFt582tH1ohjnGKPYYT6QWG4swamwX18yv19");

/// Time River — 链上时光存证程序
///
/// 功能：
/// 1. create_record — 创建加密记忆存证（SHA-256哈希 + Arweave CID）
/// 2. mint_sbt — 铸造灵魂绑定徽章（生命勋章）
/// 3. close_record — 删除记录（仅 owner 可操作）
#[program]
pub mod time_river {
    use super::*;

    /// 创建时光存证记录
    /// - content_hash: SHA-256(ciphertext + iv)，32字节
    /// - arweave_cid: Arweave Transaction ID（base58，43-44字符）
    /// - record_type: 0=text, 1=image, 2=video, 3=audio, 4=file
    /// - encrypted: 是否加密存储
    pub fn create_record(
        ctx: Context<CreateRecord>,
        content_hash: [u8; 32],
        arweave_cid: String,
        record_type: u8,
        encrypted: bool,
    ) -> Result<()> {
        require!(arweave_cid.len() <= 64, TimeRiverError::CidTooLong);
        require!(record_type <= 4, TimeRiverError::InvalidRecordType);

        let record = &mut ctx.accounts.record;
        record.owner = ctx.accounts.owner.key();
        record.content_hash = content_hash;
        record.arweave_cid = arweave_cid;
        record.record_type = record_type;
        record.encrypted = encrypted;
        record.created_at = Clock::get()?.unix_timestamp;
        record.bump = ctx.bumps.record;

        emit!(RecordCreated {
            owner: record.owner,
            content_hash: record.content_hash,
            arweave_cid: record.arweave_cid.clone(),
            created_at: record.created_at,
        });

        msg!("Time River: 记录存证 {} -> {}", record.owner, record.arweave_cid);
        Ok(())
    }

    /// 铸造灵魂绑定徽章 (SBT)
    /// SBT 不可转让，用于生命里程碑认证
    /// badge_type: 如 "streak_30", "first_record", "destiny_report" 等
    pub fn mint_sbt(
        ctx: Context<MintSbt>,
        badge_type: String,
        metadata_uri: String,
    ) -> Result<()> {
        require!(badge_type.len() <= 32, TimeRiverError::BadgeTypeTooLong);
        require!(metadata_uri.len() <= 200, TimeRiverError::MetadataUriTooLong);

        let sbt = &mut ctx.accounts.sbt;
        sbt.owner = ctx.accounts.owner.key();
        sbt.badge_type = badge_type.clone();
        sbt.metadata_uri = metadata_uri;
        sbt.earned_at = Clock::get()?.unix_timestamp;
        sbt.bump = ctx.bumps.sbt;

        emit!(SbtMinted {
            owner: sbt.owner,
            badge_type: badge_type,
            earned_at: sbt.earned_at,
        });

        msg!("Time River: SBT 铸造 {} -> {}", sbt.owner, sbt.badge_type);
        Ok(())
    }

    /// 关闭记录账户（释放租金）
    /// 注意：Arweave 上的内容永久存在，此操作只删除 Solana 账户
    pub fn close_record(_ctx: Context<CloseRecord>) -> Result<()> {
        msg!("Time River: 记录账户已关闭（Arweave 数据永久保留）");
        Ok(())
    }
}

// ── 账户结构 ─────────────────────────────────────────────────

#[account]
#[derive(Default)]
pub struct RecordAccount {
    pub owner: Pubkey,          // 32
    pub content_hash: [u8; 32], // 32  — AES-256-GCM 密文的 SHA-256
    pub arweave_cid: String,    // 4 + 64 = 68
    pub record_type: u8,        // 1
    pub encrypted: bool,        // 1
    pub created_at: i64,        // 8
    pub bump: u8,               // 1
}

impl RecordAccount {
    // 8 (discriminator) + 32 + 32 + 68 + 1 + 1 + 8 + 1 = 151
    pub const LEN: usize = 8 + 32 + 32 + 68 + 1 + 1 + 8 + 1;
}

#[account]
#[derive(Default)]
pub struct SbtAccount {
    pub owner: Pubkey,          // 32
    pub badge_type: String,     // 4 + 32 = 36
    pub metadata_uri: String,   // 4 + 200 = 204
    pub earned_at: i64,         // 8
    pub bump: u8,               // 1
}

impl SbtAccount {
    // 8 + 32 + 36 + 204 + 8 + 1 = 289
    pub const LEN: usize = 8 + 32 + 36 + 204 + 8 + 1;
}

// ── 指令 Context ─────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(content_hash: [u8; 32], arweave_cid: String)]
pub struct CreateRecord<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = RecordAccount::LEN,
        seeds = [b"record", owner.key().as_ref(), &content_hash],
        bump,
    )]
    pub record: Account<'info, RecordAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(badge_type: String)]
pub struct MintSbt<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = SbtAccount::LEN,
        seeds = [b"sbt", owner.key().as_ref(), badge_type.as_bytes()],
        bump,
    )]
    pub sbt: Account<'info, SbtAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseRecord<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        close = owner,
        has_one = owner,
        seeds = [b"record", owner.key().as_ref(), &record.content_hash],
        bump = record.bump,
    )]
    pub record: Account<'info, RecordAccount>,
}

// ── 事件 ─────────────────────────────────────────────────────

#[event]
pub struct RecordCreated {
    pub owner: Pubkey,
    pub content_hash: [u8; 32],
    pub arweave_cid: String,
    pub created_at: i64,
}

#[event]
pub struct SbtMinted {
    pub owner: Pubkey,
    pub badge_type: String,
    pub earned_at: i64,
}

// ── 错误码 ───────────────────────────────────────────────────

#[error_code]
pub enum TimeRiverError {
    #[msg("Arweave CID 超过最大长度 64 字符")]
    CidTooLong,
    #[msg("记录类型无效（0-4）")]
    InvalidRecordType,
    #[msg("徽章类型超过最大长度 32 字符")]
    BadgeTypeTooLong,
    #[msg("Metadata URI 超过最大长度 200 字符")]
    MetadataUriTooLong,
}
