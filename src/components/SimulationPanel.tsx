import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useGasStore } from '@/store/gasStore';
import { Calculator, Play, Pause, DollarSign, Fuel } from 'lucide-react';

export const SimulationPanel: React.FC = () => {
  const { 
    mode, 
    simulation, 
    chains, 
    ethUsdPrice,
    setMode, 
    updateSimulation, 
    calculateSimulationCosts 
  } = useGasStore();
  
  const [transactionValue, setTransactionValue] = useState(simulation.transactionValue.toString());
  const [gasLimit, setGasLimit] = useState(simulation.gasLimit.toString());

  useEffect(() => {
    // Auto-calculate when values change
    const timeout = setTimeout(() => {
      calculateSimulationCosts();
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [transactionValue, gasLimit, calculateSimulationCosts]);

  const handleTransactionValueChange = (value: string) => {
    setTransactionValue(value);
    const numValue = parseFloat(value) || 0;
    updateSimulation({ transactionValue: numValue });
  };

  const handleGasLimitChange = (value: string) => {
    setGasLimit(value);
    const numValue = parseInt(value) || 21000;
    updateSimulation({ gasLimit: numValue });
  };

  const toggleMode = () => {
    setMode(mode === 'live' ? 'simulation' : 'live');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };

  const formatETH = (amount: number) => {
    return amount.toFixed(6);
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'ethereum': return 'text-ethereum border-ethereum/30 bg-ethereum/10';
      case 'polygon': return 'text-polygon border-polygon/30 bg-polygon/10';
      case 'arbitrum': return 'text-arbitrum border-arbitrum/30 bg-arbitrum/10';
      default: return 'text-primary border-primary/30 bg-primary/10';
    }
  };

  const getCheapestChain = () => {
    if (!simulation.results || Object.keys(simulation.results).length === 0) return null;
    
    return Object.entries(simulation.results).reduce((cheapest, [chain, data]) => {
      if (!cheapest || data.totalCostUSD < cheapest.cost) {
        return { chain, cost: data.totalCostUSD };
      }
      return cheapest;
    }, null as { chain: string; cost: number } | null);
  };

  const cheapestChain = getCheapestChain();

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Transaction Simulator</h3>
            <p className="text-sm text-muted-foreground">Compare costs across chains</p>
          </div>
        </div>
        
        <Button
          onClick={toggleMode}
          variant={mode === 'simulation' ? 'default' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
        >
          {mode === 'simulation' ? (
            <>
              <Pause className="w-4 h-4" />
              Simulation
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Live Mode
            </>
          )}
        </Button>
      </div>

      {mode === 'simulation' && (
        <>
          {/* Input Controls */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="transactionValue">Transaction Value (ETH)</Label>
              <Input
                id="transactionValue"
                type="number"
                step="0.001"
                value={transactionValue}
                onChange={(e) => handleTransactionValueChange(e.target.value)}
                placeholder="0.1"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gasLimit">Gas Limit</Label>
              <Input
                id="gasLimit"
                type="number"
                step="1000"
                value={gasLimit}
                onChange={(e) => handleGasLimitChange(e.target.value)}
                placeholder="21000"
                className="font-mono"
              />
            </div>
          </div>

          {/* ETH/USD Price Display */}
          <div className="mb-6 p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Current ETH/USD Price</span>
            </div>
            <span className="text-lg font-mono font-bold text-primary">
              {formatCurrency(ethUsdPrice)}
            </span>
          </div>

          {/* Results */}
          {simulation.results && Object.keys(simulation.results).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Fuel className="w-4 h-4" />
                <span className="font-medium">Cost Comparison</span>
                {cheapestChain && (
                  <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/10">
                    {chains[cheapestChain.chain as keyof typeof chains]?.name} is cheapest
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                {Object.entries(simulation.results).map(([chainName, result]) => {
                  const chainData = chains[chainName as keyof typeof chains];
                  const isCheapest = cheapestChain?.chain === chainName;
                  
                  return (
                    <div
                      key={chainName}
                      className={`p-4 rounded-lg border ${getChainColor(chainName)} ${
                        isCheapest ? 'ring-2 ring-green-400/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{chainData?.name}</span>
                        {isCheapest && (
                          <Badge variant="outline" className="text-green-400 border-green-400/30">
                            Cheapest
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Gas Cost</p>
                          <p className="font-mono">{formatETH(result.gasCostETH)} ETH</p>
                          <p className="font-mono text-xs">{formatCurrency(result.gasCostUSD)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transaction</p>
                          <p className="font-mono">{transactionValue} ETH</p>
                          <p className="font-mono text-xs">
                            {formatCurrency(parseFloat(transactionValue) * ethUsdPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Total Cost</p>
                          <p className="font-mono font-bold">{formatCurrency(result.totalCostUSD)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'live' && (
        <div className="text-center py-8">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
            <h4 className="font-medium mb-2">Live Mode Active</h4>
            <p className="text-sm text-muted-foreground">
              Real-time gas prices are being tracked. Switch to Simulation mode to compare transaction costs.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};