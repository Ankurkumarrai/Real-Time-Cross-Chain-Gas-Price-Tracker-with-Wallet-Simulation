import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGasStore } from '@/store/gasStore';
import { Activity, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface GasPriceWidgetProps {
  chainKey: 'ethereum' | 'polygon' | 'arbitrum';
}

export const GasPriceWidget: React.FC<GasPriceWidgetProps> = ({ chainKey }) => {
  const { chains, connectionStatus } = useGasStore();
  const chain = chains[chainKey];
  const isConnected = connectionStatus[chainKey];

  const getTrendIcon = () => {
    if (chain.history.length < 2) return <Activity className="w-4 h-4" />;
    
    const current = chain.history[chain.history.length - 1];
    const previous = chain.history[chain.history.length - 2];
    
    if (current.totalFee > previous.totalFee) {
      return <TrendingUp className="w-4 h-4 text-red-400" />;
    } else if (current.totalFee < previous.totalFee) {
      return <TrendingDown className="w-4 h-4 text-green-400" />;
    }
    return <Activity className="w-4 h-4" />;
  };

  const getChainGradient = () => {
    switch (chainKey) {
      case 'ethereum':
        return 'bg-ethereum';
      case 'polygon':
        return 'bg-polygon';
      case 'arbitrum':
        return 'bg-arbitrum';
      default:
        return 'bg-primary';
    }
  };

  const getChainColor = () => {
    switch (chainKey) {
      case 'ethereum':
        return 'text-ethereum';
      case 'polygon':
        return 'text-polygon';
      case 'arbitrum':
        return 'text-arbitrum';
      default:
        return 'text-primary';
    }
  };

  const formatGasPrice = (price: number) => {
    return price.toFixed(2);
  };

  const getLastUpdateTime = () => {
    if (!chain.lastUpdate) return 'Never';
    const now = Date.now();
    const diff = now - chain.lastUpdate;
    
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <Card className="glass-card neon-border p-6 relative overflow-hidden">
      {/* Chain indicator */}
      <div className={`absolute top-0 left-0 w-full h-1 ${getChainGradient()}`} />
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-card/50 ${getChainColor()}`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{chain.name}</h3>
            <p className="text-sm text-muted-foreground">Gas Tracker</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            className={isConnected ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
          >
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current gas prices */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Base Fee</p>
            <p className="text-2xl font-mono font-bold">
              {formatGasPrice(chain.baseFee)}
              <span className="text-sm text-muted-foreground ml-1">gwei</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Priority</p>
            <p className="text-2xl font-mono font-bold">
              {formatGasPrice(chain.priorityFee)}
              <span className="text-sm text-muted-foreground ml-1">gwei</span>
            </p>
          </div>
        </div>

        {/* Total gas price with emphasis */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Gas Price</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-mono font-bold ${getChainColor()}`}>
              {formatGasPrice(chain.baseFee + chain.priorityFee)}
            </span>
            <span className="text-sm text-muted-foreground">gwei</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last update: {getLastUpdateTime()}</span>
          <span className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 pulse-slow' : 'bg-red-400'}`} />
            {chain.history.length} points
          </span>
        </div>
      </div>
    </Card>
  );
};