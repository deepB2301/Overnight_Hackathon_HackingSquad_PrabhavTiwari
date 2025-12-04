import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileId, content, filename } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update file status to processing
    await supabase.from('uploaded_files').update({ status: 'processing' }).eq('id', fileId);

    console.log(`Processing file: ${filename}`);

    const systemPrompt = `You are a cybersecurity expert analyzing log files and network captures for potential attacks. Analyze the provided content and identify all potential attacks.

For each attack found, return a JSON array with objects containing:
{
  "attacks": [
    {
      "attack_type": string,
      "source_ip": string or null,
      "target_url": string,
      "confidence": number (0-100),
      "severity": "low" | "medium" | "high" | "critical",
      "is_success": boolean,
      "raw_request": string (the specific line/request),
      "explanation": string
    }
  ],
  "summary": {
    "total_attacks": number,
    "attack_types": { [type: string]: number },
    "severity_breakdown": { low: number, medium: number, high: number, critical: number }
  }
}

Analyze thoroughly for SQL injection, XSS, path traversal, command injection, brute force attempts, scanning activity, and other attack patterns.

Respond ONLY with valid JSON.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this ${filename.endsWith('.pcap') ? 'network capture' : 'log file'} content for attacks:\n\n${content.substring(0, 50000)}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      await supabase.from('uploaded_files').update({ 
        status: 'failed',
        analysis_results: { error: 'AI analysis failed' }
      }).eq('id', fileId);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const contentResponse = data.choices?.[0]?.message?.content;
    
    if (!contentResponse) {
      throw new Error('No response from AI');
    }

    let analysis;
    try {
      const cleanContent = contentResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', contentResponse);
      analysis = { attacks: [], summary: { total_attacks: 0, attack_types: {}, severity_breakdown: {} } };
    }

    // Save detected attacks to database
    if (analysis.attacks && analysis.attacks.length > 0) {
      const attacksToInsert = analysis.attacks.map((attack: any) => ({
        user_id: user.id,
        source_ip: attack.source_ip,
        target_url: attack.target_url || attack.raw_request?.substring(0, 200) || filename,
        attack_type: attack.attack_type,
        confidence: attack.confidence,
        is_success: attack.is_success,
        severity: attack.severity,
        raw_request: attack.raw_request,
        metadata: { explanation: attack.explanation, source_file: filename },
      }));

      const { error: insertError } = await supabase.from('attacks').insert(attacksToInsert);
      if (insertError) {
        console.error('Failed to save attacks:', insertError);
      }
    }

    // Update file status to completed
    await supabase.from('uploaded_files').update({
      status: 'completed',
      attacks_found: analysis.attacks?.length || 0,
      analysis_results: analysis.summary,
      processed_at: new Date().toISOString(),
    }).eq('id', fileId);

    return new Response(JSON.stringify({
      success: true,
      attacks_found: analysis.attacks?.length || 0,
      summary: analysis.summary,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-file:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
