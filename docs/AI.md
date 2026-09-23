# AI Architecture, Prompt Safety & Model Configuration

## 1. Provider Abstraction

The platform supports pluggable AI backends configured through environment variables:

```env
AI_PROVIDER=openrouter # openrouter | openai | gemini | ollama
AI_MATCH_MODEL=deepseek/deepseek-v4-flash-0731:free
AI_RESUME_MODEL=anthropic/claude-3.5-sonnet
AI_COVER_LETTER_MODEL=anthropic/claude-3.5-sonnet
AI_RESEARCH_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

- **Separation of Concerns**: Inexpensive models (e.g. Llama 3 8B, DeepSeek Flash) handle high-volume classification and keyword extraction. Reasoning-capable models (e.g. Claude 3.5 Sonnet, GPT-4o) are reserved for job-tailored resume generation and cover letter drafting.
- **Failover Strategy**: If the primary AI provider encounters rate limits (HTTP 429) or timeouts, the orchestrator gracefully switches to secondary configured fallbacks before recording a failure event in `jobs.error_events`.

---

## 2. Strict Ground-Truth Safety Directives

All generative prompts enforce non-negotiable truthfulness rules:

```text
GROUND TRUTH PRINCIPLE:
The candidate's master resume is the absolute factual source of truth.
Under no circumstances may you:
1. Invent or extrapolate employer names, employment dates, or job titles.
2. Fabricate technical skills or proficiency not explicitly listed in the master resume.
3. Invent quantitative metrics or fake performance indicators (e.g. "increased revenue by 40%").
4. Claim unsupported certifications or academic degrees.

PERMITTED ADAPTATIONS:
1. Re-order sections, projects, or bullet points to emphasize requirements present in the target job.
2. Clarify and refine wording truthfully to match industry terminology used in the job description.
3. Highlight genuine matching technologies and architectural patterns.
```

---

## 3. Two-Tier Matching Engine

To conserve AI tokens and guarantee deterministic rejection of unqualified jobs, the matching pipeline operates in two distinct stages:

### Stage 1: Deterministic Pre-Filtering (Zero AI Cost)
- **Hard Exclusions**: Reject postings containing user-configured exclusion keywords (e.g., clearance required, unpaid).
- **Location & Work Mode**: Disqualify jobs that do not match the candidate's remote/hybrid preferences or country criteria.
- **Experience Floor**: Disqualify postings requiring more experience than the candidate possesses.
- **Missing Must-Have Skills**: Calculate deterministic overlap. If fewer than 50% of required skills match, the posting is marked `LOW_MATCH` and skips Stage 2.

### Stage 2: Structured AI Alignment
For jobs passing Stage 1, the AI evaluates alignment and generates structured JSON:

```json
{
  "matchScore": 88,
  "titleAlignment": 90,
  "requiredSkillCoverage": 85,
  "preferredSkillCoverage": 75,
  "experienceAlignment": 95,
  "strengths": [
    "5+ years of verified Node.js and TypeScript microservices experience",
    "Extensive PostgreSQL performance tuning and query optimization",
    "Production Docker containerization and Kubernetes orchestration"
  ],
  "gaps": [
    "No explicit Apache Kafka experience mentioned (Redis used instead)"
  ],
  "missingRequiredSkills": [],
  "recommendation": "MATCH",
  "explanation": "Strong architectural match with core technical stack. Verified distributed systems background aligns directly with team requirements."
}
```

---

## 4. Zod Schema Validation

All AI responses are validated at runtime against strict Zod schemas before being accepted into the database:

```typescript
import { z } from 'zod';

export const AiMatchResponseSchema = z.object({
  matchScore: z.number().min(0).max(100),
  titleAlignment: z.number().min(0).max(100),
  requiredSkillCoverage: z.number().min(0).max(100),
  preferredSkillCoverage: z.number().min(0).max(100),
  experienceAlignment: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  missingRequiredSkills: z.array(z.string()),
  recommendation: z.enum(['MATCH', 'PARTIAL', 'LOW_MATCH']),
  explanation: z.string().max(2000),
});
```

If parsing fails, the system executes one auto-repair retry before flagging the generation event in the DLQ.
