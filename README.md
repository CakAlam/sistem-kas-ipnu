# 🏦 DApp Ledger: Hybrid Web3 Multi-Signature Treasury

An enterprise-grade, decentralized treasury management system implementing a strict 2-of-3 Multi-Signature Smart Contract. This project bridges Web2 infrastructure (Python Flask, SQLite) with Web3 mechanics (Ethereum, Solidity) to create a transparent, tamper-proof, and accountable financial ledger for organizational management. 

Developed as an undergraduate thesis research project on Web3 Smart Contract Cryptography at Universitas Hasyim Asy'ari (UNHASY) Tebuireng, Jombang.

## 🚀 Key Features

* **Consensus-Based Execution:** Implements a 2-of-3 multi-signature threshold logic. Fund withdrawals require cryptographic authorization from at least two distinct board members, with mandatory primary approval from the Chairman.
* **Emergency Key Override:** A decentralized wallet recovery mechanism allowing board members to vote and replace a compromised or lost private key without endangering treasury funds.
* **Hybrid Architecture:** Securely delegates heavy document storage and real-time WhatsApp notifications to an off-chain Python backend, while maintaining core financial logic immutably on-chain.
* **Glassmorphism UI:** Modern, fully responsive frontend built with React, featuring an interactive 3D blockchain visualizer background and seamless UX.
* **Automated Ledger Export:** Generates downloadable Excel (`.xlsx`) ledger reports directly from real-time blockchain event logs.

## 🛠️ Tech Stack

**Web3 / Blockchain**
* Solidity (Smart Contracts)
* Ethers.js v6 (Web3 Interoperability)
* Foundry / Anvil (Testing, Compilation, & Local Node)
* MetaMask (Provider Authorization)

**Frontend (Client-Side)**
* React.js (Vite)
* Custom CSS (Glassmorphism & 3D Animations)
* XLSX (Report Generation)

**Backend (Off-Chain Services)**
* Python Flask (API & Notification Service)
* SQLite (Local Web2 State & Access Gates)
* **Fonnte API** (WhatsApp Notification Gateway)

## 📂 Project Structure

```text
sistem-kas-ipnu/
├── backend/                   # Python Flask API & Web2 Infrastructure
│   ├── uploads/               # Stored physical proposals/receipts
│   ├── venv/                  # Python virtual environment
│   ├── .env                   # Environment variables (Ignored in Git)
│   ├── kas_ipnu.db            # SQLite database storage (Ignored in Git)
│   ├── KasOrganisasi.json     # ABI fallback for backend
│   └── main.py                # Main Flask application entry point
├── blockchain/                # Foundry Smart Contract Environment
│   ├── script/                # Deployment scripts 
│   ├── src/                   # Main Solidity Contracts
│   ├── test/                  # Foundry unit tests
│   ├── foundry.toml           # Foundry configuration
│   └── remappings.txt         # Dependency remappings
└── frontend/                  # React.js User Interface
    ├── public/                # Static public assets
    ├── src/
    │   ├── assets/            # UI assets (images, icons)
    │   ├── contracts/         # Compiled ABI files 
    │   ├── App.jsx            # Main React component & Web3 logic
    │   └── main.jsx           # React DOM renderer
    ├── index.html             # Vite entry HTML
    ├── package.json           # Frontend dependencies
    └── vite.config.js         # Vite bundler configuration