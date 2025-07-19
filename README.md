# Real-Time Cross-Chain Gas Price Tracker with Wallet Simulation

A live dashboard that fetches and visualizes **real-time gas prices** from Ethereum, Polygon, and Arbitrum using native WebSocket RPCs. Simulates transaction costs and visualizes gas fee volatility using candlestick charts.

---

##  Features

- Real-time gas tracking via native WebSocket RPCs (Ethereum, Polygon, Arbitrum)
- Live and Simulation mode toggle
- Transaction simulation with USD cost estimation using on-chain ETH/USDC price
-  Candlestick chart for 15-minute interval gas volatility (per chain)
- Uses lightweight state management with **Zustand**
- Chart rendering via **`lightweight-charts`**
-  ETH/USD price computed directly from Uniswap V3 `Swap` events (no SDKs)

--
##  Tech Stack

- **Frontend**: Next.js (App Router) + TailwindCSS
- **State Management**: Zustand
- **Web3 Interaction**: Ethers.js (`WebSocketProvider`, `getLogs`)
- **Charting**: Lightweight-Charts
- **Chains**: Ethereum, Polygon, Arbitrum

---

##  System Architecture

```mermaid
graph LR
  A[User] --> B[Next.js Frontend]
  B --> C[Zustand State Store]
  C --> D{Mode}
  D -->|Live| E[WebSocket Providers]
  D -->|Simulate| F[Transaction Calculator]
  E --> G[Ethereum RPC]
  E --> H[Polygon RPC]
  E --> I[Arbitrum RPC]
  F --> J[Uniswap V3 ETH/USDC Pool]
  J --> K[Parse Swap Events]
  K --> L[Calculate ETH/USD]
  L --> M[Gas Cost USD]
  G --> N[Base/Priority Fees]
  H --> N
  I --> N
  N --> O[Candlestick Chart]
  O --> P[Lightweight Charts]
  M --> P

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS



To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
