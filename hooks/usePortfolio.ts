import { useState, useEffect } from 'react';
import { PortfolioData } from '../types/portfolio';

export function usePortfolio(address: string | undefined) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setPortfolio(null);
      return;
    }

    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/portfolio/${address}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch portfolio');
        }

        setPortfolio(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, [address]);

  return { portfolio, isLoading, error };
}
