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
    const { input, type = 'url' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const systemPrompt = `You are a cybersecurity expert analyzing HTTP traffic for potential attacks. Analyze the provided input and respond with a JSON object containing:
{
  "is_malicious": boolean,
  "attack_type": string (one of: "SQL Injection", "XSS", "Path Traversal", "Command Injection", "LDAP Injection", "XML Injection", "SSRF", "CSRF", "RCE", "None"),
  "confidence": number (0-100),
  "severity": string (one of: "low", "medium", "high", "critical"),
  "is_success": boolean (whether the attack would likely succeed),
  "explanation": string (brief technical explanation),
  "indicators": string[] (specific patterns that triggered detection),
  "recommendations": string[] (mitigation steps)
}

Be thorough and detect:
- SQL injection patterns (', ", --, UNION, SELECT, etc.)
- XSS patterns (<script>, javascript:, onerror=, etc.)
- Path traversal (../, etc/passwd, etc.)
- Command injection (;, |, $(), backticks, etc.)
- Server-side request forgery (internal IPs, localhost, etc.)
- And other common web attack patterns

Respond ONLY with valid JSON, no additional text.`;

    console.log(`Analyzing ${type}: ${input.substring(0, 100)}...`);

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
          { role: 'user', content: `Analyze this ${type} for potential attacks:\n\n${input}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response from AI
    let analysis;
    try {
      // Clean up the response (remove markdown code blocks if present)
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Invalid AI response format');
    }

    // If user is authenticated and attack detected, save to database
    if (userId && analysis.is_malicious) {
      const { error: insertError } = await supabase.from('attacks').insert({
        user_id: userId,
        target_url: input,
        attack_type: analysis.attack_type,
        confidence: analysis.confidence,
        is_success: analysis.is_success,
        severity: analysis.severity,
        raw_request: input,
        metadata: {
          indicators: analysis.indicators,
          recommendations: analysis.recommendations,
          explanation: analysis.explanation,
        },
      });

      if (insertError) {
        console.error('Failed to save attack:', insertError);
      }
    }

    return new Response(JSON.stringify({
      ...analysis,
      analyzed_at: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-threat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
