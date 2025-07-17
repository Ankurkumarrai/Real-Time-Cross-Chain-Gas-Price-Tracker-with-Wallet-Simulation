import { ethers } from 'ethers';
import { useGasStore } from '../store/gasStore';

// Uniswap V3 ETH/USDC Pool contract address
const UNISWAP_V3_ETH_USDC_POOL = '0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640';

// Chain configurations with public endpoints
const CHAIN_CONFIGS = {
  ethereum: {
    rpcUrl: 'wss://ethereum.publicnode.com',
    chainId: 1,
    name: 'Ethereum',
  },
  polygon: {
    rpcUrl: 'wss://polygon-bor.publicnode.com',
    chainId: 137,
    name: 'Polygon',
  },
  arbitrum: {
    rpcUrl: 'wss://arbitrum-one.publicnode.com',
    chainId: 42161,
    name: 'Arbitrum',
  },
};

export class Web3Service {
  private providers: { [key: string]: ethers.WebSocketProvider } = {};
  private uniswapProvider: ethers.WebSocketProvider | null = null;
  private gasUpdateIntervals: { [key: string]: NodeJS.Timeout } = {};
  private reconnectTimeouts: { [key: string]: NodeJS.Timeout } = {};

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // Initialize WebSocket providers for each chain
    Object.entries(CHAIN_CONFIGS).forEach(([chain, config]) => {
      this.connectChain(chain as keyof typeof CHAIN_CONFIGS, config);
    });

    // Initialize Uniswap V3 provider for ETH/USD pricing
    this.connectUniswap();
  }

  private connectChain(chain: keyof typeof CHAIN_CONFIGS, config: typeof CHAIN_CONFIGS.ethereum) {
    try {
      const provider = new ethers.WebSocketProvider(config.rpcUrl);
      this.providers[chain] = provider;

      provider.on('error', (error) => {
        console.error(`${config.name} WebSocket error:`, error);
        useGasStore.getState().updateConnectionStatus(chain, false);
        this.scheduleReconnect(chain, config);
      });

      provider.on('close', () => {
        console.log(`${config.name} WebSocket disconnected`);
        useGasStore.getState().updateConnectionStatus(chain, false);
        this.scheduleReconnect(chain, config);
      });

      // Start gas price monitoring
      this.startGasMonitoring(chain, provider);
      useGasStore.getState().updateConnectionStatus(chain, true);

    } catch (error) {
      console.error(`Failed to connect to ${config.name}:`, error);
      this.scheduleReconnect(chain, config);
    }
  }

  private connectUniswap() {
    try {
      this.uniswapProvider = new ethers.WebSocketProvider(CHAIN_CONFIGS.ethereum.rpcUrl);
      
      this.uniswapProvider.on('error', (error) => {
        console.error('Uniswap WebSocket error:', error);
        useGasStore.getState().updateConnectionStatus('uniswap', false);
        this.scheduleUniswapReconnect();
      });

      this.uniswapProvider.on('close', () => {
        console.log('Uniswap WebSocket disconnected');
        useGasStore.getState().updateConnectionStatus('uniswap', false);
        this.scheduleUniswapReconnect();
      });

      this.startPriceMonitoring();
      useGasStore.getState().updateConnectionStatus('uniswap', true);

    } catch (error) {
      console.error('Failed to connect to Uniswap:', error);
      this.scheduleUniswapReconnect();
    }
  }

  private scheduleReconnect(chain: keyof typeof CHAIN_CONFIGS, config: typeof CHAIN_CONFIGS.ethereum) {
    if (this.reconnectTimeouts[chain]) {
      clearTimeout(this.reconnectTimeouts[chain]);
    }

    this.reconnectTimeouts[chain] = setTimeout(() => {
      console.log(`Attempting to reconnect to ${config.name}...`);
      this.connectChain(chain, config);
    }, 5000);
  }

  private scheduleUniswapReconnect() {
    setTimeout(() => {
      console.log('Attempting to reconnect to Uniswap...');
      this.connectUniswap();
    }, 5000);
  }

  private async startGasMonitoring(chain: string, provider: ethers.WebSocketProvider) {
    const updateGasPrice = async () => {
      try {
        const feeData = await provider.getFeeData();
        
        if (feeData.gasPrice && feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
          const baseFee = Number(feeData.maxFeePerGas - feeData.maxPriorityFeePerGas);
          const priorityFee = Number(feeData.maxPriorityFeePerGas);
          const gasPrice = Number(feeData.gasPrice);

          // Convert from wei to gwei
          const baseFeeGwei = baseFee / 1e9;
          const priorityFeeGwei = priorityFee / 1e9;
          const gasPriceGwei = gasPrice / 1e9;

          useGasStore.getState().updateChainData(chain as any, {
            baseFee: baseFeeGwei,
            priorityFee: priorityFeeGwei,
            gasPrice: gasPriceGwei,
            isConnected: true,
          });

          // Add to history
          useGasStore.getState().addGasPoint(chain as any, {
            timestamp: Date.now(),
            baseFee: baseFeeGwei,
            priorityFee: priorityFeeGwei,
            totalFee: baseFeeGwei + priorityFeeGwei,
          });

          // Recalculate simulation costs if in simulation mode
          if (useGasStore.getState().mode === 'simulation') {
            useGasStore.getState().calculateSimulationCosts();
          }
        }
      } catch (error) {
        console.error(`Failed to fetch gas data for ${chain}:`, error);
      }
    };

    // Initial fetch
    await updateGasPrice();

    // Set up periodic updates every 6 seconds
    this.gasUpdateIntervals[chain] = setInterval(updateGasPrice, 6000);
  }

  private async startPriceMonitoring() {
    if (!this.uniswapProvider) return;

    // Uniswap V3 Pool ABI for Swap events
    const poolAbi = [
      'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
    ];

    const poolContract = new ethers.Contract(
      UNISWAP_V3_ETH_USDC_POOL,
      poolAbi,
      this.uniswapProvider
    );

    // Listen for Swap events to get real-time price updates
    poolContract.on('Swap', (sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick) => {
      try {
        // Calculate ETH/USD price from sqrtPriceX96
        // price = (sqrtPriceX96**2 * 10**12) / (2**192)
        const price = (Number(sqrtPriceX96) ** 2 * 1e12) / (2 ** 192);
        
        // Update store with new price
        useGasStore.getState().updateUsdPrices(price);
        
        // Recalculate simulation costs if in simulation mode
        if (useGasStore.getState().mode === 'simulation') {
          useGasStore.getState().calculateSimulationCosts();
        }
      } catch (error) {
        console.error('Failed to calculate ETH/USD price:', error);
      }
    });

    // Also fetch initial price
    this.fetchInitialPrice();
  }

  private async fetchInitialPrice() {
    try {
      if (!this.uniswapProvider) return;

      // Fetch latest price from Uniswap V3 pool
      const poolAbi = [
        'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
      ];

      const poolContract = new ethers.Contract(
        UNISWAP_V3_ETH_USDC_POOL,
        poolAbi,
        this.uniswapProvider
      );

      const slot0 = await poolContract.slot0();
      const sqrtPriceX96 = slot0.sqrtPriceX96;
      
      // Calculate ETH/USD price
      const price = (Number(sqrtPriceX96) ** 2 * 1e12) / (2 ** 192);
      
      useGasStore.getState().updateUsdPrices(price);
    } catch (error) {
      console.error('Failed to fetch initial ETH/USD price:', error);
      // Fallback to a reasonable default
      useGasStore.getState().updateUsdPrices(3000);
    }
  }

  public disconnect() {
    // Clean up all connections and intervals
    Object.values(this.providers).forEach(provider => {
      provider.destroy();
    });

    if (this.uniswapProvider) {
      this.uniswapProvider.destroy();
    }

    Object.values(this.gasUpdateIntervals).forEach(interval => {
      clearInterval(interval);
    });

    Object.values(this.reconnectTimeouts).forEach(timeout => {
      clearTimeout(timeout);
    });
  }

  public reconnectAll() {
    this.disconnect();
    setTimeout(() => {
      this.initializeProviders();
    }, 1000);
  }
}

// Export singleton instance
export const web3Service = new Web3Service();