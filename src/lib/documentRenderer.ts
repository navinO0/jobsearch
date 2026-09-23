import { CandidateProfile, TailoredResume, CoverLetter } from './schemas';

export function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

export function generateATSResumeHTML(candidate: CandidateProfile, tailored: TailoredResume): string {
  const skillsList = tailored.prioritizedSkills.join(' • ');

  const experienceHtml = tailored.tailoredExperience
    .map(
      (exp) => `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 13px;">
          <span>${exp.company} — ${exp.title}</span>
          <span>${exp.startDate} – ${exp.endDate || 'Present'}</span>
        </div>
        <ul style="margin: 4px 0 0 18px; padding: 0; font-size: 12px; line-height: 1.45;">
          ${exp.bullets.map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('');

  const educationHtml = candidate.education
    .map(
      (edu) => `
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
        <span><strong>${edu.institution}</strong> — ${edu.degree}${edu.field ? `, ${edu.field}` : ''}</span>
        <span>${edu.graduationYear || ''}</span>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${candidate.name} - Resume</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
      margin: 0;
      padding: 32px;
      line-height: 1.4;
      background: #ffffff;
    }
    .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 16px; }
    .name { font-size: 22px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
    .contact { font-size: 11px; color: #374151; margin-top: 4px; }
    .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #9ca3af; margin: 16px 0 8px 0; padding-bottom: 2px; }
    .summary-text { font-size: 12px; text-align: justify; margin-bottom: 12px; }
    .skills-text { font-size: 12px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${candidate.name}</div>
    <div class="contact">
      ${candidate.email} ${candidate.phone ? `| ${candidate.phone}` : ''} ${candidate.location ? `| ${candidate.location}` : ''}
    </div>
  </div>

  <div class="section-title">Professional Summary</div>
  <div class="summary-text">${tailored.tailoredSummary}</div>

  <div class="section-title">Core Competencies & Technical Skills</div>
  <div class="skills-text">${skillsList}</div>

  <div class="section-title">Professional Experience</div>
  ${experienceHtml}

  <div class="section-title">Education</div>
  ${educationHtml}
</body>
</html>`;
}

export function generateCoverLetterHTML(letter: CoverLetter): string {
  const paragraphs = letter.bodyParagraphs.map((p) => `<p style="margin-bottom: 14px;">${p}</p>`).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cover Letter - ${letter.senderName}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
      margin: 0;
      padding: 40px;
      line-height: 1.6;
      font-size: 13px;
      background: #ffffff;
    }
    .header { margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; }
    .sender-name { font-size: 18px; font-weight: bold; }
    .sender-contact { color: #4b5563; font-size: 12px; }
    .date { margin: 20px 0; color: #4b5563; }
    .recipient { margin-bottom: 24px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="sender-name">${letter.senderName}</div>
    <div class="sender-contact">${letter.senderEmail} ${letter.senderPhone ? `| ${letter.senderPhone}` : ''}</div>
  </div>

  <div class="date">${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

  <div class="recipient">
    <strong>${letter.recipientName}</strong><br>
    ${letter.companyName}<br>
    Re: Application for ${letter.jobTitle}
  </div>

  <p>${letter.greeting}</p>
  <p>${letter.opening}</p>
  ${paragraphs}
  <p>${letter.closing}</p>

  <div style="margin-top: 24px;">
    ${letter.signoff}<br><br>
    <strong>${letter.senderName}</strong>
  </div>
</body>
</html>`;
}
