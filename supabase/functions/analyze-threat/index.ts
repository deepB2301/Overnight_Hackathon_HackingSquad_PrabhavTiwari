import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// OWASP Top 10 Signature Patterns
const ATTACK_SIGNATURES: Record<string, RegExp[]> = {
  sql_injection: [
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database)\b)/i,
    /('|\")(\s*)(or|and)(\s*)('|\")?\s*(\d+|'[^']*')\s*(=|<|>|like)/i,
    /(--|\#|\/\*)/,
    /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
    /'\s*(or|and)\s+'[^']*'\s*=\s*'[^']*/i,
  ],
  xss: [
    /<script[^>]*>[\s\S]*?<\/script>/i,
    /javascript\s*:/i,
    /on(load|error|click|mouseover|submit|focus|blur)\s*=/i,
    /<img[^>]+onerror\s*=/i,
    /<svg[^>]*onload\s*=/i,
    /(<|%3C)[^\n]+(>|%3E)/i,
  ],
  path_traversal: [
    /\.\.\//,
    /\.\.\\/, 
    /%2e%2e%2f/i,
    /%252e%252e%252f/i,
    /\.\.%c0%af/i,
    /etc\/passwd/i,
    /windows\/system32/i,
  ],
  command_injection: [
    /[;&|`$]|\$\(/,
    /\b(cat|ls|dir|whoami|id|pwd|wget|curl|nc|netcat|bash|sh|cmd|powershell)\b/i,
    /\|\s*(cat|ls|dir|whoami|id)/i,
  ],
  xxe: [
    /<!ENTITY/i,
    /SYSTEM\s+["'][^"']*["']/i,
    /<!DOCTYPE[^>]*\[/i,
  ],
  ssrf: [
    /\b(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)\b/i,
    /\b(169\.254\.\d+\.\d+)\b/,
    /\b(10\.\d+\.\d+\.\d+)\b/,
    /\b(172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+)\b/,
    /\b(192\.168\.\d+\.\d+)\b/,
    /file:\/\//i,
    /gopher:\/\//i,
  ],
  lfi: [
    /php:\/\/filter/i,
    /php:\/\/input/i,
    /data:text\/html/i,
    /expect:\/\//i,
  ],
  rce: [
    /\$\{.*\}/,
    /\$\(.*\)/,
    /`[^`]+`/,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
  ],
};

// MITRE ATT&CK Mapping
const MITRE_MAPPING: Record<string, { tactic: string; technique: string; id: string }> = {
  sql_injection: { tactic: 'Initial Access', technique: 'Exploit Public-Facing Application', id: 'T1190' },
  xss: { tactic: 'Initial Access', technique: 'Drive-by Compromise', id: 'T1189' },
  path_traversal: { tactic: 'Collection', technique: 'Data from Local System', id: 'T1005' },
  command_injection: { tactic: 'Execution', technique: 'Command and Scripting Interpreter', id: 'T1059' },
  xxe: { tactic: 'Initial Access', technique: 'Exploit Public-Facing Application', id: 'T1190' },
  ssrf: { tactic: 'Initial Access', technique: 'Exploit Public-Facing Application', id: 'T1190' },
  lfi: { tactic: 'Collection', technique: 'Data from Local System', id: 'T1005' },
  rce: { tactic: 'Execution', technique: 'Command and Scripting Interpreter', id: 'T1059' },
  brute_force: { tactic: 'Credential Access', technique: 'Brute Force', id: 'T1110' },
  dos: { tactic: 'Impact', technique: 'Endpoint Denial of Service', id: 'T1499' },
};

// Extract IOCs from input
function extractIOCs(input: string): { type: string; value: string }[] {
  const iocs: { type: string; value: string }[] = [];
  
  // IP addresses
  const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
  const ips = input.match(ipRegex) || [];
  ips.forEach(ip => iocs.push({ type: 'ip', value: ip }));
  
  // URLs
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const urls = input.match(urlRegex) || [];
  urls.forEach(url => iocs.push({ type: 'url', value: url }));
  
  // Domains
  const domainRegex = /\b[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+\b/g;
  const domains = input.match(domainRegex) || [];
  const ipSet = new Set(ips);
  domains.forEach(domain => {
    if (!ipSet.has(domain)) {
      iocs.push({ type: 'domain', value: domain });
    }
  });
  
  // File hashes
  const md5Regex = /\b[a-fA-F0-9]{32}\b/g;
  const sha1Regex = /\b[a-fA-F0-9]{40}\b/g;
  const sha256Regex = /\b[a-fA-F0-9]{64}\b/g;
  
  (input.match(md5Regex) || []).forEach(h => iocs.push({ type: 'md5', value: h }));
  (input.match(sha1Regex) || []).forEach(h => iocs.push({ type: 'sha1', value: h }));
  (input.match(sha256Regex) || []).forEach(h => iocs.push({ type: 'sha256', value: h }));
  
  // Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  (input.match(emailRegex) || []).forEach(e => iocs.push({ type: 'email', value: e }));
  
  return iocs;
}

// Signature-based detection
function signatureDetection(input: string): { attackType: string; patterns: string[] }[] {
  const matches: { attackType: string; patterns: string[] }[] = [];
  
  for (const [attackType, patterns] of Object.entries(ATTACK_SIGNATURES)) {
    const matchedPatterns: string[] = [];
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        matchedPatterns.push(pattern.toString());
      }
    }
    if (matchedPatterns.length > 0) {
      matches.push({ attackType, patterns: matchedPatterns });
    }
  }
  
  return matches;
}

// Calculate anomaly score
function calculateAnomalyScore(input: string, signatureMatches: { attackType: string; patterns: string[] }[]): number {
  let score = 0;
  
  score += signatureMatches.length * 0.2;
  
  const unusualChars = (input.match(/[<>'"`;$|&{}[\]\\]/g) || []).length;
  score += Math.min(unusualChars * 0.05, 0.3);
  
  if (input.length > 500) score += 0.1;
  if (input.length > 1000) score += 0.1;
  
  if (/%[0-9a-fA-F]{2}/.test(input)) score += 0.1;
  if (/\\x[0-9a-fA-F]{2}/.test(input)) score += 0.1;
  if (/\\u[0-9a-fA-F]{4}/.test(input)) score += 0.1;
  
  return Math.min(score, 1);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, type = 'url' } = await req.json();
    
    if (!input) {
      return new Response(JSON.stringify({ error: 'Input is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Step 1: Signature-based detection
    const signatureMatches = signatureDetection(input);
    console.log('Signature matches:', signatureMatches);

    // Step 2: Extract IOCs
    const iocs = extractIOCs(input);
    console.log('Extracted IOCs:', iocs);

    // Step 3: Calculate anomaly score
    const anomalyScore = calculateAnomalyScore(input, signatureMatches);
    console.log('Anomaly score:', anomalyScore);

    // Step 4: AI-powered analysis
    const systemPrompt = `You are an expert cybersecurity threat analyst. Analyze the provided input for potential security threats.

Pre-analysis results (signature-based detection):
- Matched signatures: ${JSON.stringify(signatureMatches)}
- Anomaly score: ${anomalyScore}
- Extracted IOCs: ${JSON.stringify(iocs)}

Return your analysis in this exact JSON format:
{
  "is_malicious": boolean,
  "attack_type": "sql_injection" | "xss" | "path_traversal" | "command_injection" | "xxe" | "ssrf" | "lfi" | "rce" | "brute_force" | "dos" | "reconnaissance" | "data_exfiltration" | "unknown",
  "confidence": number (0-1),
  "severity": "low" | "medium" | "high" | "critical",
  "is_success": boolean,
  "explanation": "detailed explanation",
  "indicators": ["list of specific indicators found"],
  "recommendations": ["list of mitigation steps"]
}`;

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
          { role: 'user', content: `Analyze this ${type} for potential security threats:\n\n${input}` }
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

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse JSON from AI response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response');
    }

    // Get MITRE mapping
    const mitre = MITRE_MAPPING[analysis.attack_type] || {
      tactic: 'Unknown',
      technique: 'Unknown',
      id: 'N/A'
    };

    // Build complete result
    const result = {
      url: type === 'url' ? input : null,
      is_malicious: analysis.is_malicious || signatureMatches.length > 0 || anomalyScore > 0.5,
      attack_type: analysis.attack_type || (signatureMatches[0]?.attackType) || 'unknown',
      confidence: Math.max(analysis.confidence || 0, anomalyScore),
      severity: analysis.severity,
      is_success: analysis.is_success,
      explanation: analysis.explanation,
      indicators: analysis.indicators,
      recommendations: analysis.recommendations,
      analyzed_at: new Date().toISOString(),
      // Multi-layer detection results
      detection_method: signatureMatches.length > 0 ? 'signature+ai' : 'ai',
      signatures_matched: signatureMatches,
      anomaly_score: anomalyScore,
      iocs: iocs,
      // MITRE ATT&CK mapping
      mitre_tactic: mitre.tactic,
      mitre_technique: mitre.technique,
      mitre_id: mitre.id,
    };

    // Store in database if user is authenticated and threat detected
    if (userId && result.is_malicious) {
      const { error: insertError } = await supabase.from('attacks').insert({
        user_id: userId,
        target_url: input.substring(0, 2000),
        attack_type: result.attack_type,
        severity: result.severity,
        confidence: result.confidence,
        is_success: result.is_success,
        method: type === 'url' ? 'GET' : 'POST',
        metadata: {
          explanation: result.explanation,
          indicators: result.indicators,
          recommendations: result.recommendations,
        },
        detection_method: result.detection_method,
        mitre_tactic: result.mitre_tactic,
        mitre_technique: result.mitre_technique,
        mitre_id: result.mitre_id,
        iocs: result.iocs,
        signatures_matched: result.signatures_matched,
        anomaly_score: result.anomaly_score,
        payload: input.substring(0, 5000),
      });

      if (insertError) {
        console.error('Failed to store attack:', insertError);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-threat:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
