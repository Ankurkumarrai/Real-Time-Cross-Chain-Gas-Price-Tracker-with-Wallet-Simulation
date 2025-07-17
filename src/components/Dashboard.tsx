import React from 'react';
import { useWeb3 } from '@/hooks/useWeb3';
import { useGasStore } from '@/store/gasStore';
import { GasPriceWidget } from '@/components/GasPriceWidget';
import { SimulationPanel } from '@/components/SimulationPanel';
import { GasChart } from '@/components/GasChart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Activity, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  DollarSign, 
  TrendingUp,
  Zap,
  Globe
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { reconnectAll } = useWeb3();
  const { connectionStatus, ethUsdPrice, lastPriceUpdate, mode } = useGasStore();

  const getConnectionCount = () => {
    return Object.values(connectionStatus).filter(Boolean).length;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getLastUpdateTime = () => {
    if (!lastPriceUpdate) return 'Never';
    const now = Date.now();
    const diff = now - lastPriceUpdate;
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary text-primary-foreground">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    GasTracker Pro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Real-time cross-chain gas price monitoring
                  </p>
                </div>
              </div>
              
              <Badge 
                variant={mode === 'live' ? 'default' : 'secondary'}
                className={mode === 'live' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}
              >
                {mode === 'live' ? 'Live Mode' : 'Simulation Mode'}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* ETH/USD Price */}
              <Card className="px-4 py-2 bg-card/50 border-border/30">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-mono font-bold">
                      ETH/USD: {formatPrice(ethUsdPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated {getLastUpdateTime()}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  {getConnectionCount() > 0 ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-sm font-mono">
                    {getConnectionCount()}/4 Connected
                  </span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reconnectAll}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gas Price Widgets */}
          <GasPriceWidget chainKey="ethereum" />
          <GasPriceWidget chainKey="polygon" />
          <GasPriceWidget chainKey="arbitrum" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Chart - spans 2 columns on xl screens */}
          <div className="xl:col-span-2">
            <GasChart />
          </div>

          {/* Simulation Panel */}
          <div className="xl:col-span-1">
            <SimulationPanel />
          </div>
        </div>

        {/* Connection Status Details */}
        <div className="mt-8">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">Network Status</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(connectionStatus).map(([service, connected]) => (
                <div 
                  key={service}
                  className={`p-3 rounded-lg border ${
                    connected 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        connected ? 'bg-green-400 pulse-slow' : 'bg-red-400'
                      }`} 
                    />
                    <span className="text-sm font-medium capitalize">{service}</span>
                  </div>
                  <p className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
                    {connected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 backdrop-blur-xl mt-16">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Built with React, Ethers.js, Zustand, and Lightweight Charts
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Real-time data from public RPCs</span>
              <span>•</span>
              <span>Uniswap V3 ETH/USD pricing</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};