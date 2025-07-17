import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGasStore } from '@/store/gasStore';
import { BarChart3, TrendingUp, Clock, Maximize2 } from 'lucide-react';

export const GasChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  
  const { 
    chains, 
    selectedChain, 
    chartTimeframe, 
    setSelectedChain, 
    setChartTimeframe 
  } = useGasStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? window.innerHeight - 100 : 400,
      layout: {
        background: { color: 'transparent' },
        textColor: '#E5E7EB',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        textColor: '#E5E7EB',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const series = chart.addCandlestickSeries({
      upColor: '#10B981',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#10B981',
      wickDownColor: '#EF4444',
      wickUpColor: '#10B981',
    });

    seriesRef.current = series;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 100 : 400,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!seriesRef.current) return;

    const chainData = chains[selectedChain];
    const candlestickData = generateCandlestickData(chainData.history, chartTimeframe);
    
    seriesRef.current.setData(candlestickData);
  }, [chains, selectedChain, chartTimeframe]);

  const generateCandlestickData = (history: any[], timeframe: string): CandlestickData[] => {
    if (history.length === 0) return [];

    // Convert timeframe to milliseconds
    const intervals = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    const intervalMs = intervals[timeframe as keyof typeof intervals];
    const candlesticks: CandlestickData[] = [];

    // Group data points by time intervals
    const groups: { [key: number]: any[] } = {};
    
    history.forEach(point => {
      const intervalStart = Math.floor(point.timestamp / intervalMs) * intervalMs;
      if (!groups[intervalStart]) {
        groups[intervalStart] = [];
      }
      groups[intervalStart].push(point);
    });

    // Convert groups to candlestick data
    Object.entries(groups).forEach(([timeStr, points]) => {
      if (points.length === 0) return;

      const time = parseInt(timeStr) / 1000 as Time; // Convert to seconds for lightweight-charts
      const totalFees = points.map(p => p.totalFee);
      
      const open = totalFees[0];
      const close = totalFees[totalFees.length - 1];
      const high = Math.max(...totalFees);
      const low = Math.min(...totalFees);

      candlesticks.push({
        time,
        open,
        high,
        low,
        close,
      });
    });

    return candlesticks.sort((a, b) => (a.time as number) - (b.time as number));
  };

  const getChainColor = (chain: string) => {
    switch (chain) {
      case 'ethereum': return 'text-ethereum border-ethereum/30 bg-ethereum/10';
      case 'polygon': return 'text-polygon border-polygon/30 bg-polygon/10';
      case 'arbitrum': return 'text-arbitrum border-arbitrum/30 bg-arbitrum/10';
      default: return 'text-primary border-primary/30 bg-primary/10';
    }
  };

  const getCurrentPrice = () => {
    const chainData = chains[selectedChain];
    return (chainData.baseFee + chainData.priorityFee).toFixed(2);
  };

  const getPriceChange = () => {
    const chainData = chains[selectedChain];
    if (chainData.history.length < 2) return { change: 0, percentage: 0 };

    const current = chainData.history[chainData.history.length - 1];
    const previous = chainData.history[chainData.history.length - 2];
    
    const change = current.totalFee - previous.totalFee;
    const percentage = (change / previous.totalFee) * 100;
    
    return { change, percentage };
  };

  const { change, percentage } = getPriceChange();

  return (
    <Card className={`glass-card ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Gas Price Chart</h3>
              <p className="text-sm text-muted-foreground">Real-time price movements</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2"
          >
            <Maximize2 className="w-4 h-4" />
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </Button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Object.keys(chains).map((chain) => (
              <Button
                key={chain}
                variant={selectedChain === chain ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChain(chain as any)}
                className={selectedChain === chain ? getChainColor(chain) : ''}
              >
                {chains[chain as keyof typeof chains].name}
              </Button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            {['15m', '1h', '4h', '1d'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={chartTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartTimeframe(timeframe as any)}
              >
                {timeframe}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Current price info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-mono font-bold">{getCurrentPrice()} gwei</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-4 h-4 ${change >= 0 ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
              <span className={`text-sm font-mono ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)} ({percentage >= 0 ? '+' : ''}{percentage.toFixed(2)}%)
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline">
              {chains[selectedChain].history.length} data points
            </Badge>
          </div>
        </div>

        {/* Chart */}
        <div 
          ref={chartContainerRef} 
          className="w-full bg-muted/20 rounded-lg border border-border/50"
          style={{ height: isFullscreen ? window.innerHeight - 200 : 400 }}
        />
      </div>
    </Card>
  );
};