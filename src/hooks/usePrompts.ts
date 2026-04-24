import { useState, useEffect } from 'react';
import type { PromptsData } from '../types';

export function usePrompts() {
  const [data, setData] = useState<PromptsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/prompts.json')
      .then(r => r.json())
      .then((d: PromptsData) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  return { data, loading };
}
