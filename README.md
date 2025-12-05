🔍 HTTP Attack Analyzer 🚨 Problem Statement Modern organizations face increasing cyber threats exploiting HTTP protocol vulnerabilities through maliciously crafted URLs. Attackers use techniques like SQL injection, XSS, command injection, directory traversal, SSRF, and credential-stuffing to compromise systems. Security teams struggle to manually inspect massive traffic logs to distinguish attempted attacks from successful breaches.

HTTP Attack Analyzer automatically detects, classifies, and differentiates between attempted and successful HTTP-based attacks, reducing alert fatigue while providing actionable intelligence.

✨ Key Features 🔥 Multi-Layer Detection Signature-based: Regex patterns for known attacks (OWASP Top 10)

Behavioral: Anomaly detection using statistical baselines

Success Indicators: Response analysis to distinguish attempts vs breaches.

ML-powered: Classification of novel attack patterns

📊 Comprehensive Analysis PCAP file ingestion with session reconstruction

Real-time traffic analysis via port mirroring

Historical log processing (Apache, Nginx, WAF logs)

Attack chain visualization and timeline reconstruction

🎯 Actionable Intelligence Confidence Scoring: 0-1 scale for attack success likelihood

MITRE ATT&CK Mapping: TTP identification and mapping

Prioritized Alerts: Focus on high-confidence successful attacks

IOC Extraction: Automated indicator extraction for SIEM integration

⚡ Operational Efficiency Search & Filter: Natural language and SQL-like querying

Automated Reporting: Executive summaries and technical deep dives

SOAR Integration: Playbook triggers for common attack patterns

Scalable Architecture: Microservices-based, container-ready design
Tech Stack :

Frontend

Framework: React 18 + TypeScript
Build Tool: Vite
Styling: Tailwind CSS + shadcn/ui components
State Management: TanStack React Query
Routing: React Router DOM
Visualizations: Recharts (charts), react-globe.gl (3D globe)
Animations: Custom CSS + Matrix rain effect
Backend (Lovable Cloud / Supabase):

Database: PostgreSQL (tables: attacks, profiles, reports, uploaded_files)
Authentication: Supabase Auth (email/password)
File Storage: Supabase Storage (uploads bucket)
Serverless Functions: Deno Edge Functions
AI/ML Layer:

Model: Google Gemini 2.5 Flash (via Lovable AI Gateway)
Use Cases: Threat analysis, attack classification, report generation

Workflow:

User uploads file/URL → Edge Function (process-file or analyze-threat)
    → Lovable AI Gateway → Gemini 2.5 Flash analyzes content
    → Extracts: attack type, MITRE ATT&CK mapping, IOCs, confidence score
    → Results stored in PostgreSQL (attacks table)
    → Frontend fetches via Supabase SDK
    → Displayed on Dashboard (globe, charts, cards)
