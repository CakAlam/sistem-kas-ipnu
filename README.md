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
* Python Flask / FastAPI (API & Notification Service)
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


## ⚙️ Installation & Setup
1. Prerequisites
Ensure you have the following installed:

Node.js & npm

Python 3.8+

Foundry (Forge, Anvil, Cast)

MetaMask browser extension

2. Blockchain Setup (Foundry)
Navigate to the blockchain directory:

Bash
cd blockchain
Start the local Anvil node (keep this terminal running):

Bash
anvil
In a new terminal, deploy the Smart Contract:

Bash
forge script script/DeployKas.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
Copy the deployed contract address and update the CONTRACT_ADDRESS variable in frontend/src/App.jsx.

Copy the generated ABI from blockchain/out/KasOrganisasi.sol/KasOrganisasi.json to frontend/src/contracts/ and backend/.

3. Backend Setup (Python Flask & Environment Variables)
Navigate to the backend directory:

Bash
cd backend
Activate your virtual environment and install dependencies:

Bash
pip install fastapi uvicorn web3 requests python-multipart python-dotenv
Environment Configuration (.env):
Create a new file named .env inside the backend/ directory and configure the following variables:

Cuplikan kode
# Local Ethereum Node RPC URL (Anvil default)
WEB3_PROVIDER_URI=http://127.0.0.1:8545

# The Smart Contract address generated from Step 2
CONTRACT_ADDRESS=0xYourDeployedContractAddressHere

# Fonnte API Token for WhatsApp Notifications
# Get your token at: https://md.fonnte.com/
FONNTE_TOKEN=your_fonnte_api_token_here
Start the Flask server (the SQLite database will be initialized automatically):

Bash
uvicorn main:app --reload
4. Frontend Setup (React)
Navigate to the frontend directory:

Bash
cd frontend
Install dependencies:

Bash
npm install
Start the Vite development server:

Bash
npm run dev
5. Mock Login Credentials (For Testing)
To test the Web2 gating mechanism, use the following mocked credentials:

Chairman: ketua / ipnu123

Vice Chairman: wakil / ipnu123

Treasurer: bendahara / ipnu123

⚠️ Development Notes & Known Limitations (Production Considerations)
This repository is strictly configured for a Local Development Environment (Anvil/Foundry). To facilitate easy testing and demonstration for academic grading, the smart contract currently implements several developmental trade-offs:

Hardcoded Test Accounts: The authorized multi-sig wallet addresses (Chairman, Vice, Treasurer) are currently falling back to Foundry Anvil's default deterministic test accounts in the deployment script.

Production Fix: For Mainnet/Testnet deployment, the script uses vm.envOr() to dynamically accept real organization wallet addresses via environment variables, preventing unauthorized access by bots scanning for exposed testnet private keys.

Mocked Web2 Authentication: Frontend login credentials (e.g., ipnu123) are currently hardcoded on the client-side for rapid demonstration of the Web3 gating mechanism.

Production Fix: Implement a backend authentication route in Flask using JSON Web Tokens (JWT) and Bcrypt password hashing to secure the Web2 dashboard. (Note: A compromised Web2 dashboard still cannot authorize Web3 fund transfers without the cryptographically verified MetaMask signature).

Centralized Off-Chain Storage: Physical document proofs (proposals/receipts) are currently stored in the local SQLite/Python uploads/ directory.

Production Fix: Future iterations should migrate off-chain document storage to a decentralized file system like IPFS (Pinata/Web3.Storage), saving only the IPFS CID hashes on the blockchain to eliminate a single point of failure.

Note: Never deploy the current exact Solidity state to a live network (Ethereum Mainnet, Sepolia, Arbitrum) with real funds.