import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface GasPoint {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
  totalFee: number;
}

export interface ChainData {
  name: string;
  symbol: string;
  baseFee: number;
  priorityFee: number;
  gasPrice: number;
  history: GasPoint[];
  rpcUrl: string;
  explorer: string;
  color: string;
  lastUpdate: number;
  isConnected: boolean;
}

export interface SimulationData {
  transactionValue: number;
  gasLimit: number;
  results: {
    [chainName: string]: {
      gasCostETH: number;
      gasCostUSD: number;
      totalCostUSD: number;
    };
  };
}

export interface GasState {
  // Mode management
  mode: 'live' | 'simulation';
  
  // Chain data
  chains: {
    ethereum: ChainData;
    polygon: ChainData;
    arbitrum: ChainData;
  };
  
  // USD pricing
  ethUsdPrice: number;
  maticUsdPrice: number;
  lastPriceUpdate: number;
  
  // Simulation
  simulation: SimulationData;
  
  // Chart data
  chartTimeframe: '15m' | '1h' | '4h' | '1d';
  selectedChain: 'ethereum' | 'polygon' | 'arbitrum';
  
  // WebSocket status
  connectionStatus: {
    ethereum: boolean;
    polygon: boolean;
    arbitrum: boolean;
    uniswap: boolean;
  };
  
  // Actions
  setMode: (mode: 'live' | 'simulation') => void;
  updateChainData: (chain: keyof GasState['chains'], data: Partial<ChainData>) => void;
  addGasPoint: (chain: keyof GasState['chains'], point: GasPoint) => void;
  updateUsdPrices: (ethPrice: number, maticPrice?: number) => void;
  updateSimulation: (data: Partial<SimulationData>) => void;
  setChartTimeframe: (timeframe: GasState['chartTimeframe']) => void;
  setSelectedChain: (chain: GasState['selectedChain']) => void;
  updateConnectionStatus: (service: keyof GasState['connectionStatus'], status: boolean) => void;
  calculateSimulationCosts: () => void;
}

const initialChainData: ChainData = {
  name: '',
  symbol: '',
  baseFee: 0,
  priorityFee: 0,
  gasPrice: 0,
  history: [],
  rpcUrl: '',
  explorer: '',
  color: '',
  lastUpdate: 0,
  isConnected: false,
};

export const useGasStore = create<GasState>()(
  subscribeWithSelector((set, get) => ({
    mode: 'live',
    
    chains: {
      ethereum: {
        ...initialChainData,
        name: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: 'wss://eth-mainnet.ws.alchemyapi.io/v2/demo',
        explorer: 'https://etherscan.io',
        color: 'ethereum',
      },
      polygon: {
        ...initialChainData,
        name: 'Polygon',
        symbol: 'MATIC',
        rpcUrl: 'wss://polygon-mainnet.ws.alchemyapi.io/v2/demo',
        explorer: 'https://polygonscan.com',
        color: 'polygon',
      },
      arbitrum: {
        ...initialChainData,
        name: 'Arbitrum',
        symbol: 'ETH',
        rpcUrl: 'wss://arb-mainnet.ws.alchemyapi.io/v2/demo',
        explorer: 'https://arbiscan.io',
        color: 'arbitrum',
      },
    },
    
    ethUsdPrice: 0,
    maticUsdPrice: 0,
    lastPriceUpdate: 0,
    
    simulation: {
      transactionValue: 0.1,
      gasLimit: 21000,
      results: {},
    },
    
    chartTimeframe: '15m',
    selectedChain: 'ethereum',
    
    connectionStatus: {
      ethereum: false,
      polygon: false,
      arbitrum: false,
      uniswap: false,
    },
    
    setMode: (mode) => set({ mode }),
    
    updateChainData: (chain, data) =>
      set((state) => ({
        chains: {
          ...state.chains,
          [chain]: {
            ...state.chains[chain],
            ...data,
            lastUpdate: Date.now(),
          },
        },
      })),
    
    addGasPoint: (chain, point) =>
      set((state) => {
        const history = [...state.chains[chain].history, point];
        // Keep only last 1000 points (roughly 4 hours at 15s intervals)
        const trimmedHistory = history.slice(-1000);
        
        return {
          chains: {
            ...state.chains,
            [chain]: {
              ...state.chains[chain],
              history: trimmedHistory,
            },
          },
        };
      }),
    
    updateUsdPrices: (ethPrice, maticPrice) =>
      set({
        ethUsdPrice: ethPrice,
        maticUsdPrice: maticPrice || get().maticUsdPrice,
        lastPriceUpdate: Date.now(),
      }),
    
    updateSimulation: (data) =>
      set((state) => ({
        simulation: {
          ...state.simulation,
          ...data,
        },
      })),
    
    setChartTimeframe: (timeframe) => set({ chartTimeframe: timeframe }),
    
    setSelectedChain: (chain) => set({ selectedChain: chain }),
    
    updateConnectionStatus: (service, status) =>
      set((state) => ({
        connectionStatus: {
          ...state.connectionStatus,
          [service]: status,
        },
      })),
    
    calculateSimulationCosts: () => {
      const { chains, simulation, ethUsdPrice, maticUsdPrice } = get();
      const results: SimulationData['results'] = {};
      
      Object.entries(chains).forEach(([chainName, chainData]) => {
        const gasCostWei = (chainData.baseFee + chainData.priorityFee) * simulation.gasLimit;
        const gasCostETH = gasCostWei / 1e18;
        
        let usdPrice = ethUsdPrice;
        if (chainName === 'polygon') {
          usdPrice = maticUsdPrice;
        }
        
        const gasCostUSD = gasCostETH * usdPrice;
        const transactionValueUSD = simulation.transactionValue * usdPrice;
        const totalCostUSD = gasCostUSD + transactionValueUSD;
        
        results[chainName] = {
          gasCostETH,
          gasCostUSD,
          totalCostUSD,
        };
      });
      
      set((state) => ({
        simulation: {
          ...state.simulation,
          results,
        },
      }));
    },
  }))
);
