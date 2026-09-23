import { z } from 'zod';

export const MatchAnalysisSchema = z.object({
  matchScore: z.number().min(0).max(100),
  titleAlignment: z.number().min(0).max(100),
  requiredSkillCoverage: z.number().min(0).max(100),
  preferredSkillCoverage: z.number().min(0).max(100),
  experienceAlignment: z.number().min(0).max(100),
  locationAlignment: z.number().min(0).max(100),
  salaryAlignment: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  missingRequiredSkills: z.array(z.string()),
  matchedEvidence: z.array(z.string()),
  recommendation: z.enum(['MATCH', 'PARTIAL', 'LOW_MATCH']),
  explanation: z.string(),
});

export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;

export interface DeterministicFilterRules {
  excludedKeywords: string[];
  requiredSkills: string[];
  targetLocations: string[];
  remoteOnly: boolean;
  minSalary?: number;
}

export function evaluateDeterministicFilter(
  job: {
    job_title: string;
    description: string;
    location?: string;
    remote_type?: string;
    salary_min?: number;
    skills?: string[];
  },
  rules: DeterministicFilterRules
): { passed: boolean; rejectReason?: string } {
  const fullText = `${job.job_title} ${job.description}`.toLowerCase();

  // 1. Check excluded keywords
  for (const kw of rules.excludedKeywords) {
    if (kw && fullText.includes(kw.toLowerCase())) {
      return { passed: false, rejectReason: `Contains excluded keyword: "${kw}"` };
    }
  }

  // 2. Check remote preference
  if (rules.remoteOnly && job.remote_type && job.remote_type !== 'REMOTE') {
    return { passed: false, rejectReason: `Position is ${job.remote_type}, required REMOTE` };
  }

  // 3. Minimum salary threshold if present in both
  if (rules.minSalary && job.salary_min && job.salary_min < rules.minSalary) {
    return { passed: false, rejectReason: `Salary ${job.salary_min} below threshold ${rules.minSalary}` };
  }

  return { passed: true };
}

export function calculateDeterministicScore(
  job: {
    job_title: string;
    description: string;
    skills?: string[];
  },
  candidateSkills: string[],
  targetTitles: string[]
): { preliminaryScore: number; matchedSkills: string[]; missingSkills: string[] } {
  const descLower = (job.description || '').toLowerCase();
  const titleLower = (job.job_title || '').toLowerCase();

  let matchedSkills: string[] = [];
  let missingSkills: string[] = [];

  for (const skill of candidateSkills) {
    if (descLower.includes(skill.toLowerCase()) || titleLower.includes(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  let titleBonus = 0;
  for (const target of targetTitles) {
    if (titleLower.includes(target.toLowerCase())) {
      titleBonus = 30;
      break;
    }
  }

  const skillRatio = candidateSkills.length > 0 ? (matchedSkills.length / candidateSkills.length) * 70 : 50;
  const preliminaryScore = Math.min(100, Math.round(titleBonus + skillRatio));

  return { preliminaryScore, matchedSkills, missingSkills };
}
