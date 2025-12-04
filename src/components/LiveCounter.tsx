import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface LiveCounterProps {
  initialValue: number;
  incrementRange?: [number, number];
  className?: string;
}

export function LiveCounter({ initialValue, incrementRange = [1, 5], className }: LiveCounterProps) {
  const [count, setCount] = useState(initialValue);

  useEffect(() => {
    const interval = setInterval(() => {
      const increment = Math.floor(
        Math.random() * (incrementRange[1] - incrementRange[0] + 1) + incrementRange[0]
      );
      setCount(prev => prev + increment);
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [incrementRange]);

  const formattedCount = count.toLocaleString();

  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formattedCount}
    </span>
  );
}
