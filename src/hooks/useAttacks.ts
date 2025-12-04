import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Attack {
  id: string;
  source_ip: string | null;
  target_url: string;
  method: string;
  attack_type: string;
  confidence: number;
  is_success: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  raw_request: string | null;
  raw_response: string | null;
  metadata: Record<string, any>;
  detected_at: string;
  created_at: string;
}

export interface AttackStats {
  total: number;
  blocked: number;
  successful: number;
  critical: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export function useAttacks() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [stats, setStats] = useState<AttackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAttacks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('attacks')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const typedData = (data || []).map(attack => ({
        ...attack,
        severity: attack.severity as 'low' | 'medium' | 'high' | 'critical',
        metadata: attack.metadata as Record<string, any>,
      }));

      setAttacks(typedData);

      // Calculate stats
      const total = typedData.length;
      const successful = typedData.filter(a => a.is_success).length;
      const blocked = total - successful;
      const critical = typedData.filter(a => a.severity === 'critical').length;
      
      const byType: Record<string, number> = {};
      const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
      
      typedData.forEach(attack => {
        byType[attack.attack_type] = (byType[attack.attack_type] || 0) + 1;
        bySeverity[attack.severity] = (bySeverity[attack.severity] || 0) + 1;
      });

      setStats({ total, blocked, successful, critical, byType, bySeverity });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttacks();
  }, [user]);

  return { attacks, stats, loading, error, refetch: fetchAttacks };
}

export function useAnalyzeThreat() {
  const [analyzing, setAnalyzing] = useState(false);
  const { session } = useAuth();

  const analyze = async (input: string, type: 'url' | 'request' = 'url') => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-threat', {
        body: { input, type },
      });

      if (error) throw error;
      return data;
    } finally {
      setAnalyzing(false);
    }
  };

  return { analyze, analyzing };
}
