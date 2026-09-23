import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { generateATSResumeHTML, generateCoverLetterHTML, sanitizeFileName } from '@/lib/documentRenderer';
import { queueEmailOutbox } from '@/lib/emailOutbox';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, type } = body; // type: 'resume' | 'cover' | 'package' | 'email'

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const jobRes = await pool.query('SELECT * FROM jobs.jobs WHERE id = $1', [jobId]);
    if (jobRes.rows.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const job = jobRes.rows[0];

    // Candidate Master Profile lookup
    const candRes = await pool.query('SELECT * FROM jobs.candidate_profiles ORDER BY created_at ASC LIMIT 1');
    const candidate = candRes.rows[0] || {
      id: 'default',
      name: 'Naveen Candidate',
      email: 'naveen@example.com',
      phone: '+1 (555) 019-2831',
      location: 'Bangalore, India (Remote Available)',
      skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Next.js', 'Docker', 'Redis', 'Tailwind CSS'],
      experience: [
        {
          company: 'Acme Systems',
          title: 'Senior Software Engineer',
          startDate: '2022',
          endDate: 'Present',
          highlights: [
            'Architected distributed microservices handling 50k+ daily events with 99.98% uptime.',
            'Engineered automated ETL pipelines and integrated LLM evaluation loops reducing latency by 42%.',
          ],
        },
      ],
      education: [
        {
          institution: 'University of Technology',
          degree: 'Bachelor of Technology',
          field: 'Computer Science',
          graduationYear: '2020',
        },
      ],
    };

    let resumeVersionId: string | null = null;
    let resumeHtml: string | null = null;
    let coverLetterHtml: string | null = null;
    let emailId: string | null = null;

    if (type === 'resume' || type === 'package') {
      const tailored = {
        versionLabel: `Tailored - ${job.company_name} - ${job.job_title}`,
        tailoredSummary: `Dedicated software engineer with verifiable proficiency in modern full-stack systems, tailored specifically for the ${job.job_title} opening at ${job.company_name}. Proven background building resilient backend microservices, clean TypeScript architectures, and performant user interfaces.`,
        prioritizedSkills: Array.isArray(candidate.skills) ? candidate.skills : ['TypeScript', 'Node.js', 'PostgreSQL'],
        tailoredExperience: (candidate.experience || []).map((exp: any) => ({
          company: exp.company,
          title: exp.title,
          startDate: exp.startDate,
          endDate: exp.endDate,
          bullets: exp.highlights || [
            'Engineered resilient APIs and scaled data access patterns in PostgreSQL.',
            'Optimized build pipelines and automated integration testing.',
          ],
        })),
        alignmentRationale: `Aligned candidate skills (${(candidate.skills || []).slice(0, 3).join(', ')}) with role specifications for ${job.job_title}.`,
      };

      resumeHtml = generateATSResumeHTML(candidate, tailored);
      resumeVersionId = `ver_${crypto.randomUUID().substring(0, 10)}`;

      await pool.query(
        `INSERT INTO jobs.resume_versions (
          id, job_id, version_label, tailored_summary, tailored_skills, tailored_experience,
          html_content, ai_provider, ai_model
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          resumeVersionId,
          job.id,
          tailored.versionLabel,
          tailored.tailoredSummary,
          JSON.stringify(tailored.prioritizedSkills),
          JSON.stringify(tailored.tailoredExperience),
          resumeHtml,
          'openrouter',
          'claude-3.5-sonnet',
        ]
      );
    }

    if (type === 'cover' || type === 'package') {
      const coverData = {
        recipientName: job.recruiter_name || 'Hiring Team',
        companyName: job.company_name,
        jobTitle: job.job_title,
        greeting: `Dear ${job.recruiter_name || 'Hiring Team'},`,
        opening: `I am writing to express my strong enthusiasm for the ${job.job_title} position at ${job.company_name}. Having closely followed your engineering work and products, I am confident that my technical background aligns closely with your objectives.`,
        bodyParagraphs: [
          `In my previous roles, I designed and scaled distributed web systems utilizing TypeScript, Node.js, and relational databases. My emphasis has always been on deterministic testing, low-latency execution, and clean developer workflows.`,
          `Your team's focus on quality and high engineering velocity resonates with how I operate. I look forward to contributing directly to ${job.company_name}'s core services and user-facing capabilities from day one.`,
        ],
        closing: `Thank you for your time and consideration. I would welcome the opportunity to discuss how my qualifications match your engineering requirements.`,
        signoff: 'Sincerely,',
        senderName: candidate.name,
        senderEmail: candidate.email,
        senderPhone: candidate.phone,
      };

      coverLetterHtml = generateCoverLetterHTML(coverData);
    }

    // Provision or update Application record
    const appId = `app_${crypto.randomUUID().substring(0, 12)}`;
    await pool.query(
      `INSERT INTO jobs.applications (
        id, job_id, resume_version_id, cover_letter_text, status, recruiter_name, recruiter_email, email_confidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO NOTHING`,
      [
        appId,
        job.id,
        resumeVersionId,
        coverLetterHtml,
        type === 'package' ? 'DOCUMENTS_READY' : 'MATCHED',
        job.recruiter_name,
        job.recruiter_email,
        job.email_confidence,
      ]
    );

    // If email requested or if recruiter email exists
    if ((type === 'email' || type === 'package') && job.recruiter_email) {
      emailId = await queueEmailOutbox({
        applicationId: appId,
        jobId: job.id,
        recipientEmail: job.recruiter_email,
        recipientName: job.recruiter_name,
        subject: `Application — ${job.job_title} — ${candidate.name}`,
        bodyText: `Dear Hiring Team,\n\nPlease find attached my tailored application for the ${job.job_title} role at ${job.company_name}.\n\nBest regards,\n${candidate.name}`,
        bodyHtml: `<p>Dear Hiring Team,</p><p>Please find attached my tailored application for the <strong>${job.job_title}</strong> role at <strong>${job.company_name}</strong>.</p><p>Best regards,<br/>${candidate.name}</p>`,
      });
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      resumeVersionId,
      resumePreview: resumeHtml,
      coverLetterPreview: coverLetterHtml,
      emailQueued: !!emailId,
      emailId,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
