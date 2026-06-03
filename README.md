# 🌟 NovaPay — AI-Powered Privacy-Preserving Autonomous Payment Agent on Stellar

> **Build on Stellar Hackathon — IBW 2026**  
> Cross-border payments reimagined with autonomous AI agents and selective disclosure privacy.

![Stellar](https://img.shields.io/badge/Stellar-Soroban-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/AI-Autonomous_Agent-purple?style=for-the-badge)
![Privacy](https://img.shields.io/badge/Privacy-ZK_Proofs-cyan?style=for-the-badge)

---

## 🎯 Problem

Every year, **$54 billion** is lost to remittance fees globally. Traditional services charge **5-10%** per transfer, take **2-5 days** to settle, and expose users' personal data to multiple intermediaries. Meanwhile, **1.4 billion unbanked** people lack access to these services entirely.

## 💡 Solution

**NovaPay** is an autonomous AI agent that executes privacy-preserving cross-border payments on the Stellar network with:

- **~0.001¢** transaction fees (vs. $7.50+ traditional)
- **~5 second** settlement (vs. 2-5 days)
- **100% privacy** via selective disclosure (vs. full data exposure)
- **AI-optimized** route finding (vs. single corridor)

## 🏆 Hackathon Track: Hack Agentic

NovaPay is custom-built for the **Hack Agentic** track. We've developed a fully autonomous AI agent that handles the complexities of cross-border remittances by autonomously monitoring Stellar DEX liquidity, optimizing multi-hop paths, and executing transactions via Soroban smart contracts.

---

## 🚀 Features

### 🤖 Core Agent Capabilities
- **Market Scanner**: Continuously monitors exchange rates across all Stellar DEX pairs.
- **Route Optimizer**: AI-powered pathfinding for the cheapest multi-hop transfer route.
- **Auto Executor**: Autonomously deploys Soroban escrows and executes transfers when optimal conditions are met.
- **Privacy Guard**: Automatically generates ZK proofs for selective disclosure, keeping user data safe during autonomous execution.

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────┐
│              NovaPay Frontend               │
│          (HTML/CSS/JavaScript SPA)          │
│                                             │
│  ┌────────┐ ┌──────────┐ ┌──────────────┐ │
│  │Dashboard│ │ Transfer │ │  AI Agent    │ │
│  │  View   │ │   View   │ │  Monitor     │ │
│  └────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────────────────────────────────┐  │
│  │      Privacy Shield (ZK Proofs)      │  │
│  └──────────────────────────────────────┘  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│            Stellar Network                  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │       Soroban Smart Contracts        │  │
│  │  • Escrow Contract                   │  │
│  │  • Route Registry                    │  │
│  │  • Privacy Verifier                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────┐ ┌────────┐ ┌──────────────┐ │
│  │ Horizon  │ │  DEX   │ │  Testnet     │ │
│  │  API     │ │ Orders │ │  Faucet      │ │
│  └──────────┘ └────────┘ └──────────────┘ │
└─────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Smart Contracts | Soroban (Rust) |
| Blockchain SDK | `@stellar/stellar-sdk` |
| Wallet | Freighter Wallet Integration |
| AI Engine | Route optimization algorithm |
| Privacy | Selective disclosure / ZK proofs |
| Network | Stellar Testnet |

---

## 📦 Setup & Run

### Prerequisites
- Modern web browser (Chrome, Firefox, Edge)
- [Freighter Wallet](https://www.freighter.app/) browser extension (optional)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/novapay/stellar-hackathon.git
cd stellar-hackathon

# Open in browser (no build step required)
# Option 1: Direct file open
open index.html

# Option 2: Local server
npx serve .
```

### Project Structure
```
stellar-hackathon/
├── index.html          # Main SPA entry point
├── css/
│   └── style.css       # Design system & styles
├── js/
│   └── app.js          # Application logic
├── contracts/
│   └── escrow/         # Soroban smart contracts
├── README.md           # This file
└── PITCH.md            # Pitch deck content
```

---

## 🎤 Pitch Summary

**"Every year, $54 billion is lost to remittance fees. NovaPay eliminates this waste with an autonomous AI agent that finds the cheapest route, executes the transfer, and shields your privacy — all on Stellar, in under 5 seconds."**

### The Numbers
- 💰 $54B lost annually to remittance fees
- 👥 800M+ people transfer money internationally
- 🏦 1.4B unbanked lack access to financial services
- ⚡ NovaPay: ~0% fees, ~5s settlement, 100% privacy

---

## 🗺️ Roadmap

1. **Phase 1** (Hackathon): Working prototype on Testnet
2. **Phase 2**: Mainnet deployment, anchor partnerships (Turkey corridor)
3. **Phase 3**: Mobile app, expanded corridors (MENA region)
4. **Phase 4**: Full autonomous agent with ML-based route prediction

---

## 👥 Team

Built with ❤️ at Istanbul Blockchain Week 2026

---

## 📄 License

MIT License — Open source for the Stellar ecosystem.
