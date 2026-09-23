import { z } from 'zod';

export const CandidateProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      location: z.string().optional(),
      startDate: z.string(),
      endDate: z.string().optional(),
      current: z.boolean().default(false),
      highlights: z.array(z.string()),
      technologies: z.array(z.string()).optional(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string().optional(),
      graduationYear: z.string().optional(),
    })
  ),
  certifications: z.array(z.string()).optional(),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      url: z.string().optional(),
    })
  ).optional(),
  links: z.record(z.string(), z.string()).optional(),
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export const TailoredResumeSchema = z.object({
  versionLabel: z.string(),
  tailoredSummary: z.string(),
  prioritizedSkills: z.array(z.string()),
  tailoredExperience: z.array(
    z.object({
      company: z.string(),
      title: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      bullets: z.array(z.string()),
    })
  ),
  relevantProjects: z.array(
    z.object({
      name: z.string(),
      bullets: z.array(z.string()),
      technologies: z.array(z.string()),
    })
  ).optional(),
  alignmentRationale: z.string(),
});

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

export const CoverLetterSchema = z.object({
  recipientName: z.string().default('Hiring Team'),
  companyName: z.string(),
  jobTitle: z.string(),
  greeting: z.string(),
  opening: z.string(),
  bodyParagraphs: z.array(z.string()).min(2).max(4),
  closing: z.string(),
  signoff: z.string().default('Sincerely,'),
  senderName: z.string(),
  senderEmail: z.string(),
  senderPhone: z.string().optional(),
});

export type CoverLetter = z.infer<typeof CoverLetterSchema>;
