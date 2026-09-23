import crypto from 'crypto';

export interface NormalizedJob {
  externalId?: string;
  sourceId: string;
  sourceName: string;
  title: string;
  normalizedTitle: string;
  companyName: string;
  companyDomain?: string;
  companyLogo?: string;
  location: string;
  country?: string;
  city?: string;
  remoteType: 'REMOTE' | 'HYBRID' | 'ONSITE';
  employmentType: 'Full-time' | 'Contract' | 'Part-time' | 'Internship';
  seniority?: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: 'hour' | 'month' | 'year';
  description: string;
  descriptionText: string;
  skills: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  yearsRequired?: number;
  visaSponsorship?: boolean;
  relocationSupport?: boolean;
  postedAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  applicationUrl: string;
  sourceUrl?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  hiringManagerName?: string;
  hiringManagerEmail?: string;
  emailConfidence?: number;
  sourceMetadata?: Record<string, any>;
  contentHash: string;
  fingerprint: string;
  canonicalUrl: string;
}

export function normalizeJobTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|m\/w\/d|f\/m\/d)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateFingerprint(company: string, title: string, location: string, sourceId: string): string {
  const normCompany = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normTitle = normalizeJobTitle(title);
  const normLoc = (location || 'remote').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  const rawString = `${normCompany}|${normTitle}|${normLoc}|${sourceId}`;
  return crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 32);
}

export function generateContentHash(description: string): string {
  const clean = (description || '').replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(clean).digest('hex');
}

export function extractRecruiterEmail(text: string): { email?: string; confidence: number } {
  if (!text) return { confidence: 0 };
  
  // Find valid email patterns
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex) || [];
  
  for (const email of matches) {
    const lower = email.toLowerCase();
    // Exclude generic platform support emails
    if (
      lower.includes('support@') ||
      lower.includes('privacy@') ||
      lower.includes('noreply@') ||
      lower.includes('no-reply@') ||
      lower.includes('donotreply@') ||
      lower.includes('mailer-daemon@') ||
      lower.includes('help@') ||
      lower.includes('jobs-noreply@')
    ) {
      continue;
    }
    
    // High confidence HR indicators
    if (
      lower.startsWith('careers@') ||
      lower.startsWith('hiring@') ||
      lower.startsWith('talent@') ||
      lower.startsWith('recruiting@') ||
      lower.startsWith('jobs@')
    ) {
      return { email, confidence: 0.95 };
    }
    
    // Other direct contact mentioned in job description
    return { email, confidence: 0.75 };
  }
  
  return { confidence: 0 };
}
