import { useEffect, useState } from 'react';

/**
 * Auto-advancing carousel index, gated behind a hydration flag so the first
 * client render matches the server before the interval kicks in.
 */
export function useCarousel(length: number, intervalMs = 10000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [length, intervalMs]);

  return { currentIndex, setCurrentIndex, ready: isHydrated && length > 0 };
}
