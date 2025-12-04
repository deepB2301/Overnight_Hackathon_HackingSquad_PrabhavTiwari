import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportType = 'summary', dateRange } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch attacks for the user
    let query = supabase
      .from('attacks')
      .select('*')
      .eq('user_id', user.id)
      .order('detected_at', { ascending: false });

    if (dateRange?.start) {
      query = query.gte('detected_at', dateRange.start);
    }
    if (dateRange?.end) {
      query = query.lte('detected_at', dateRange.end);
    }

    const { data: attacks, error: fetchError } = await query;
    
    if (fetchError) {
      throw fetchError;
    }

    // Calculate statistics
    const totalAttacks = attacks?.length || 0;
    const blockedAttacks = attacks?.filter(a => !a.is_success).length || 0;
    const successfulAttacks = totalAttacks - blockedAttacks;
    const criticalAttacks = attacks?.filter(a => a.severity === 'critical').length || 0;
    const highAttacks = attacks?.filter(a => a.severity === 'high').length || 0;

    // Group by attack type
    const byType: Record<string, number> = {};
    const byMitre: Record<string, number> = {};
    const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    const byDetectionMethod: Record<string, number> = {};
    
    attacks?.forEach(attack => {
      byType[attack.attack_type] = (byType[attack.attack_type] || 0) + 1;
      bySeverity[attack.severity || 'low'] = (bySeverity[attack.severity || 'low'] || 0) + 1;
      if (attack.mitre_id) {
        byMitre[attack.mitre_id] = (byMitre[attack.mitre_id] || 0) + 1;
      }
      if (attack.detection_method) {
        byDetectionMethod[attack.detection_method] = (byDetectionMethod[attack.detection_method] || 0) + 1;
      }
    });

    // Extract all unique IOCs
    const allIOCs: { type: string; value: string; count: number }[] = [];
    const iocMap = new Map<string, { type: string; count: number }>();
    
    attacks?.forEach(attack => {
      const iocs = attack.iocs || [];
      iocs.forEach((ioc: { type: string; value: string }) => {
        const key = `${ioc.type}:${ioc.value}`;
        if (iocMap.has(key)) {
          iocMap.get(key)!.count++;
        } else {
          iocMap.set(key, { type: ioc.type, count: 1 });
        }
      });
    });
    
    iocMap.forEach((data, key) => {
      const value = key.split(':').slice(1).join(':');
      allIOCs.push({ type: data.type, value, count: data.count });
    });
    allIOCs.sort((a, b) => b.count - a.count);

    // Generate AI summary if requested
    let aiSummary = '';
    if (reportType === 'executive' && LOVABLE_API_KEY && totalAttacks > 0) {
      const summaryPrompt = `Generate an executive summary for a cybersecurity threat report with these statistics:
- Total attacks detected: ${totalAttacks}
- Blocked attacks: ${blockedAttacks} (${((blockedAttacks / totalAttacks) * 100).toFixed(1)}%)
- Successful attacks: ${successfulAttacks}
- Critical severity: ${criticalAttacks}
- High severity: ${highAttacks}
- Attack types: ${JSON.stringify(byType)}
- MITRE techniques: ${JSON.stringify(byMitre)}

Provide a 2-3 paragraph executive summary highlighting key risks and recommendations.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a cybersecurity analyst writing executive summaries.' },
              { role: 'user', content: summaryPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices?.[0]?.message?.content || '';
        }
      } catch (e) {
        console.error('AI summary generation failed:', e);
      }
    }

    // Build report content
    const reportContent = {
      summary: {
        total_attacks: totalAttacks,
        blocked_attacks: blockedAttacks,
        successful_attacks: successfulAttacks,
        block_rate: totalAttacks > 0 ? ((blockedAttacks / totalAttacks) * 100).toFixed(1) : '0',
      },
      severity_breakdown: bySeverity,
      attack_types: byType,
      mitre_techniques: byMitre,
      detection_methods: byDetectionMethod,
      top_iocs: allIOCs.slice(0, 20),
      ai_summary: aiSummary,
      generated_at: new Date().toISOString(),
    };

    // Store report in database
    const reportTitle = reportType === 'executive' 
      ? `Executive Security Report - ${new Date().toLocaleDateString()}`
      : `Security Summary - ${new Date().toLocaleDateString()}`;

    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: user.id,
        title: reportTitle,
        report_type: reportType,
        date_range_start: dateRange?.start || null,
        date_range_end: dateRange?.end || null,
        content: reportContent,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store report:', insertError);
    }

    return new Response(JSON.stringify({ report: reportContent, id: report?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Report generation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
