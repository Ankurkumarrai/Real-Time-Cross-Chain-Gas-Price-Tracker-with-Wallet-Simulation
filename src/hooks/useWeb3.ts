import { useEffect } from 'react';
import { web3Service } from '../services/web3Service';
import { demoDataService } from '../services/demoDataService';

export const useWeb3 = () => {
  useEffect(() => {
    // For demo purposes, use simulated data instead of real WebSocket connections
    // In production, you would uncomment the web3Service and comment out demoDataService
    console.log('Initializing demo data service...');
    
    // Real Web3 service (commented out for demo)
    // web3Service.initializeProviders();
    
    return () => {
      // Cleanup on unmount
      demoDataService.stop();
      // web3Service.disconnect();
    };
  }, []);

  const reconnectAll = () => {
    // For demo, restart the demo service
    demoDataService.stop();
    setTimeout(() => {
      window.location.reload(); // Simple restart for demo
    }, 1000);
    
    // For real Web3:
    // web3Service.reconnectAll();
  };

  return {
    reconnectAll,
  };
};