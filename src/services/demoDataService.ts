import { useGasStore } from '../store/gasStore';

export class DemoDataService {
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.startDemo();
  }

  private startDemo() {
    // Simulate connection status
    const store = useGasStore.getState();
    store.updateConnectionStatus('ethereum', true);
    store.updateConnectionStatus('polygon', true);
    store.updateConnectionStatus('arbitrum', true);
    store.updateConnectionStatus('uniswap', true);

    // Set initial ETH/USD price
    store.updateUsdPrices(3200);

    // Generate initial gas data for all chains
    this.generateInitialData();

    // Start periodic updates
    this.startPeriodicUpdates();
  }

  private generateInitialData() {
    const store = useGasStore.getState();
    const now = Date.now();

    // Generate 100 historical points for each chain (about 25 minutes of data)
    for (let i = 99; i >= 0; i--) {
      const timestamp = now - (i * 15000); // 15 seconds apart

      // Ethereum - higher gas prices
      const ethBaseFee = 20 + Math.random() * 40;
      const ethPriorityFee = 1 + Math.random() * 3;
      store.addGasPoint('ethereum', {
        timestamp,
        baseFee: ethBaseFee,
        priorityFee: ethPriorityFee,
        totalFee: ethBaseFee + ethPriorityFee,
      });

      // Polygon - lower gas prices
      const polyBaseFee = 30 + Math.random() * 60;
      const polyPriorityFee = 30 + Math.random() * 20;
      store.addGasPoint('polygon', {
        timestamp,
        baseFee: polyBaseFee,
        priorityFee: polyPriorityFee,
        totalFee: polyBaseFee + polyPriorityFee,
      });

      // Arbitrum - moderate gas prices
      const arbBaseFee = 0.1 + Math.random() * 0.5;
      const arbPriorityFee = 0.01 + Math.random() * 0.1;
      store.addGasPoint('arbitrum', {
        timestamp,
        baseFee: arbBaseFee,
        priorityFee: arbPriorityFee,
        totalFee: arbBaseFee + arbPriorityFee,
      });
    }

    // Update current chain data
    const ethHistory = store.chains.ethereum.history;
    const polyHistory = store.chains.polygon.history;
    const arbHistory = store.chains.arbitrum.history;

    if (ethHistory.length > 0) {
      const latest = ethHistory[ethHistory.length - 1];
      store.updateChainData('ethereum', {
        baseFee: latest.baseFee,
        priorityFee: latest.priorityFee,
        gasPrice: latest.totalFee,
        isConnected: true,
      });
    }

    if (polyHistory.length > 0) {
      const latest = polyHistory[polyHistory.length - 1];
      store.updateChainData('polygon', {
        baseFee: latest.baseFee,
        priorityFee: latest.priorityFee,
        gasPrice: latest.totalFee,
        isConnected: true,
      });
    }

    if (arbHistory.length > 0) {
      const latest = arbHistory[arbHistory.length - 1];
      store.updateChainData('arbitrum', {
        baseFee: latest.baseFee,
        priorityFee: latest.priorityFee,
        gasPrice: latest.totalFee,
        isConnected: true,
      });
    }
  }

  private startPeriodicUpdates() {
    // Update gas prices every 6 seconds
    const gasInterval = setInterval(() => {
      this.updateGasPrices();
    }, 6000);

    // Update ETH/USD price every 10 seconds
    const priceInterval = setInterval(() => {
      this.updateEthPrice();
    }, 10000);

    this.intervals.push(gasInterval, priceInterval);
  }

  private updateGasPrices() {
    const store = useGasStore.getState();
    const timestamp = Date.now();

    // Ethereum - simulate volatility
    const ethCurrent = store.chains.ethereum;
    const ethBaseFee = Math.max(5, ethCurrent.baseFee + (Math.random() - 0.5) * 5);
    const ethPriorityFee = Math.max(0.1, ethCurrent.priorityFee + (Math.random() - 0.5) * 0.5);

    store.updateChainData('ethereum', {
      baseFee: ethBaseFee,
      priorityFee: ethPriorityFee,
      gasPrice: ethBaseFee + ethPriorityFee,
    });

    store.addGasPoint('ethereum', {
      timestamp,
      baseFee: ethBaseFee,
      priorityFee: ethPriorityFee,
      totalFee: ethBaseFee + ethPriorityFee,
    });

    // Polygon
    const polyCurrent = store.chains.polygon;
    const polyBaseFee = Math.max(10, polyCurrent.baseFee + (Math.random() - 0.5) * 10);
    const polyPriorityFee = Math.max(10, polyCurrent.priorityFee + (Math.random() - 0.5) * 5);

    store.updateChainData('polygon', {
      baseFee: polyBaseFee,
      priorityFee: polyPriorityFee,
      gasPrice: polyBaseFee + polyPriorityFee,
    });

    store.addGasPoint('polygon', {
      timestamp,
      baseFee: polyBaseFee,
      priorityFee: polyPriorityFee,
      totalFee: polyBaseFee + polyPriorityFee,
    });

    // Arbitrum
    const arbCurrent = store.chains.arbitrum;
    const arbBaseFee = Math.max(0.05, arbCurrent.baseFee + (Math.random() - 0.5) * 0.1);
    const arbPriorityFee = Math.max(0.01, arbCurrent.priorityFee + (Math.random() - 0.5) * 0.02);

    store.updateChainData('arbitrum', {
      baseFee: arbBaseFee,
      priorityFee: arbPriorityFee,
      gasPrice: arbBaseFee + arbPriorityFee,
    });

    store.addGasPoint('arbitrum', {
      timestamp,
      baseFee: arbBaseFee,
      priorityFee: arbPriorityFee,
      totalFee: arbBaseFee + arbPriorityFee,
    });

    // Recalculate simulation if active
    if (store.mode === 'simulation') {
      store.calculateSimulationCosts();
    }
  }

  private updateEthPrice() {
    const store = useGasStore.getState();
    const currentPrice = store.ethUsdPrice;
    
    // Simulate ETH price movement (±2% max change)
    const change = (Math.random() - 0.5) * 0.04; // ±2%
    const newPrice = currentPrice * (1 + change);
    
    store.updateUsdPrices(Math.max(1000, newPrice)); // Keep price above $1000
  }

  public stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
  }
}

// Export singleton for demo mode
export const demoDataService = new DemoDataService();