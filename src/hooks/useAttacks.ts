import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SearchFilters } from '@/components/AttackSearch';

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
  // Enhanced fields
  detection_method?: string;
  mitre_tactic?: string;
  mitre_technique?: string;
  mitre_id?: string;
  iocs?: { type: string; value: string }[];
  signatures_matched?: { attackType: string; patterns: string[] }[];
  anomaly_score?: number;
  payload?: string;
}

export interface AttackStats {
  total: number;
  blocked: number;
  successful: number;
  critical: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  byMitre: Record<string, number>;
  byDetectionMethod: Record<string, number>;
}

export function useAttacks() {
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [filteredAttacks, setFilteredAttacks] = useState<Attack[]>([]);
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
        .limit(100);

      if (fetchError) throw fetchError;

      const typedData = (data || []).map(attack => ({
        ...attack,
        severity: attack.severity as 'low' | 'medium' | 'high' | 'critical',
        metadata: attack.metadata as Record<string, any>,
        iocs: attack.iocs as { type: string; value: string }[] || [],
        signatures_matched: attack.signatures_matched as { attackType: string; patterns: string[] }[] || [],
      }));

      setAttacks(typedData);
      setFilteredAttacks(typedData);
      calculateStats(typedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (attackData: Attack[]) => {
    const total = attackData.length;
    const successful = attackData.filter(a => a.is_success).length;
    const blocked = total - successful;
    const critical = attackData.filter(a => a.severity === 'critical').length;
    
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byMitre: Record<string, number> = {};
    const byDetectionMethod: Record<string, number> = {};
    
    attackData.forEach(attack => {
      byType[attack.attack_type] = (byType[attack.attack_type] || 0) + 1;
      bySeverity[attack.severity] = (bySeverity[attack.severity] || 0) + 1;
      
      if (attack.mitre_id) {
        byMitre[attack.mitre_id] = (byMitre[attack.mitre_id] || 0) + 1;
      }
      
      if (attack.detection_method) {
        byDetectionMethod[attack.detection_method] = (byDetectionMethod[attack.detection_method] || 0) + 1;
      }
    });

    setStats({ total, blocked, successful, critical, byType, bySeverity, byMitre, byDetectionMethod });
  };

  const applyFilters = useCallback((filters: SearchFilters) => {
    let filtered = [...attacks];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(a => 
        a.target_url.toLowerCase().includes(query) ||
        a.source_ip?.toLowerCase().includes(query) ||
        a.attack_type.toLowerCase().includes(query) ||
        a.payload?.toLowerCase().includes(query)
      );
    }

    // Attack type filter
    if (filters.attackType !== 'all') {
      filtered = filtered.filter(a => a.attack_type === filters.attackType);
    }

    // Severity filter
    if (filters.severity !== 'all') {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }

    // Success status filter
    if (filters.isSuccess !== 'all') {
      const isSuccess = filters.isSuccess === 'successful';
      filtered = filtered.filter(a => a.is_success === isSuccess);
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      
      switch (filters.timeRange) {
        case '1h':
          cutoff = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoff = new Date(0);
      }
      
      filtered = filtered.filter(a => new Date(a.detected_at) >= cutoff);
    }

    setFilteredAttacks(filtered);
    calculateStats(filtered);
  }, [attacks]);

  useEffect(() => {
    fetchAttacks();
  }, [user]);

  return { 
    attacks: filteredAttacks, 
    allAttacks: attacks,
    stats, 
    loading, 
    error, 
    refetch: fetchAttacks,
    applyFilters,
  };
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
