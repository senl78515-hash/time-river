#!/bin/bash
export HOME=/root
export PATH="/root/.cargo/bin:/root/.local/share/solana/install/active_release/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
source /root/.cargo/env 2>/dev/null || true
cd /mnt/d/develop/timeRiver
echo "=== Solana: $(solana --version) ==="
echo "=== Anchor: $(anchor --version) ==="
echo "=== Rust: $(rustc --version) ==="
anchor build 2>&1
echo "EXIT_CODE=$?"
