# NovaPay — Pitch Deck

## Hack Agentic Track — Build on Stellar Hackathon (IBW 2026)

---

## Slide 1: The Hook (15 sec)

> **"Every year, $54 billion is lost to remittance fees. What if an autonomous agent could navigate the financial system and reclaim that money?"**

---

## Slide 2: The Problem (30 sec)

### The Inefficiency of Manual Cross-Border Transfers

| Issue | Impact |
|:---|:---|
| 💸 **High Fees** | 5-10% commission per transfer (avg. $7.50 per $100) |
| 🐌 **Slow Settlement** | 2-5 business days via SWIFT |
| 🔓 **Zero Privacy** | Full personal data exposed to 3+ intermediaries |
| 🚫 **Complexity** | Finding the best rate requires manual comparison |

**Turkey Context**: Turkey receives over $1.1B in inbound remittances annually, making it the perfect testing ground for an automated solution.

---

## Slide 3: The Solution (30 sec)

### NovaPay: The Autonomous Financial Agent

NovaPay is an **intelligent, self-operating agent** on the Stellar network that handles everything:
1. 🔍 **Market Scanner:** Monitors liquidity across all DEX pairs and anchor bridges.
2. 🤖 **Route Optimizer:** Calculates the cheapest multi-hop path dynamically.
3. ⚡ **Auto Executor:** Deploys Soroban escrow contracts and executes autonomously.
4. 🛡️ **Privacy Guard:** Uses Zero-Knowledge proofs for selective disclosure compliance.

**A dedicated agent for the Hack Agentic track.**

---

## Slide 4: Live Agent Demo (60 sec)

### Demo Flow:
1. **Agent Initialization** → See the agent connect to Horizon Testnet.
2. **Market Scanning**: Watch real-time logs as the agent scans USDC/XLM/TRY pairs.
3. **Route Optimization**: The agent analyzes and compares SWIFT vs. Stellar multi-hop.
4. **Autonomous Execution**: 
    - Agent generates ZK proof.
    - Agent deploys Soroban Escrow.
    - Agent executes settlement.
5. **Dashboard Analytics**: Review the agent's performance and fee savings.

---

## Slide 5: Agent Architecture (20 sec)

```
Frontend UI  ←→  NovaPay Agent (Core Engine)
                       |
     +-----------------+-----------------+
     |                 |                 |
Market Scanner   Route Optimizer   Auto Executor
     |                 |                 |
 Horizon SDK     Pathfinding Alg   Soroban SDK
     |                 |                 |
     +-----------------+-----------------+
                       |
                Stellar Network
```

### Tech Stack:
- **Agent Intelligence**: Custom pathfinding and market monitoring (JS).
- **Smart Contracts**: Soroban (Rust) — Autonomous Escrow execution.
- **Privacy Layer**: Simulated ZK proofs for compliance checks.
- **Network**: Stellar Testnet (Horizon + Soroban RPC).

---

## Slide 6: Why We Win Hack Agentic (15 sec)

| Criteria | How NovaPay Delivers |
|:---|:---|
| **Autonomy** | The agent executes the entire lifecycle without human intervention. |
| **Complexity** | It navigates multi-hop currency conversions (e.g., USD → XLM → USDC → TRY). |
| **Real-World Utility** | Directly solves the $54B remittance fee problem using Stellar's DEX. |
| **Completeness** | A fully working agent with a sleek visualization UI. |

---

## Slide 7: Roadmap (10 sec)

| Phase | Timeline | Milestone |
|:---|:---|:---|
| **Phase 1** | Hackathon (Now) | Working agent prototype on Testnet |
| **Phase 2** | Q3 2026 | Integration with real-world ML for price prediction |
| **Phase 3** | Q4 2026 | Mainnet deployment, Turkey anchor partnership |
| **Phase 4** | 2027 | Multi-agent collaboration for institutional liquidity |

---

## Team

Built at Istanbul Blockchain Week 2026 🇹🇷

---

*"NovaPay: The intelligent agent that makes money move itself."*
