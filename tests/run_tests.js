const assert = require('assert');
const crypto = require('crypto');

// 1. Normalization & Fingerprinting tests
function normalizeJobTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\b(senior|sr\.?|junior|jr\.?|lead|principal|staff|m\/w\/d|f\/m\/d)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function generateFingerprint(company, title, location, sourceId) {
  const normCompany = (company || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const normTitle = normalizeJobTitle(title);
  const normLoc = (location || 'remote').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const rawString = `${normCompany}|${normTitle}|${normLoc}|${sourceId}`;
  return crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 32);
}

function extractRecruiterEmail(text) {
  if (!text) return { confidence: 0 };
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const matches = text.match(emailRegex) || [];
  for (const email of matches) {
    const lower = email.toLowerCase();
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
    if (
      lower.startsWith('careers@') ||
      lower.startsWith('hiring@') ||
      lower.startsWith('talent@') ||
      lower.startsWith('recruiting@') ||
      lower.startsWith('jobs@')
    ) {
      return { email, confidence: 0.95 };
    }
    return { email, confidence: 0.75 };
  }
  return { confidence: 0 };
}

function evaluateDeterministicFilter(job, rules) {
  const fullText = `${job.job_title} ${job.description}`.toLowerCase();
  for (const kw of rules.excludedKeywords) {
    if (kw && fullText.includes(kw.toLowerCase())) {
      return { passed: false, rejectReason: `Contains excluded keyword: "${kw}"` };
    }
  }
  if (rules.remoteOnly && job.remote_type && job.remote_type !== 'REMOTE') {
    return { passed: false, rejectReason: `Position is ${job.remote_type}, required REMOTE` };
  }
  return { passed: true };
}

function sanitizeFileName(name) {
  return name.replace(/[/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

console.log('Running Production Test Suite...');

// Test 1
assert.strictEqual(normalizeJobTitle('Senior Full Stack Engineer (m/w/d)'), 'full stack engineer');
assert.strictEqual(normalizeJobTitle('Lead Backend Architect / Node.js'), 'backend architect node js');
console.log('✔ Normalization tests passed');

// Test 2
const fp1 = generateFingerprint('Acme Corp', 'Senior Backend Engineer', 'Remote', 'adzuna');
const fp2 = generateFingerprint('Acme Corp', 'Backend Engineer', 'Remote', 'adzuna');
assert.strictEqual(fp1, fp2);
assert.strictEqual(fp1.length, 32);
console.log('✔ Fingerprinting & deduplication tests passed');

// Test 3
const res1 = extractRecruiterEmail('Please send your resume to careers@innovate.tech for review.');
assert.strictEqual(res1.email, 'careers@innovate.tech');
assert.strictEqual(res1.confidence, 0.95);

const res2 = extractRecruiterEmail('Notifications sent by noreply@jobboard.com automatically.');
assert.strictEqual(res2.email, undefined);
console.log('✔ Recruiter email discovery & anti-spam tests passed');

// Test 4
const job = { job_title: 'Java Developer', description: 'Legacy Java 8 banking maintenance' };
const filterCheck = evaluateDeterministicFilter(job, { excludedKeywords: ['Java 8'], remoteOnly: false });
assert.strictEqual(filterCheck.passed, false);
console.log('✔ Deterministic filtering tests passed');

// Test 5
const safeName = sanitizeFileName('Resume/Naveen:Principal*Engineer?.pdf');
assert.strictEqual(safeName, 'Resume_Naveen_Principal_Engineer_.pdf');
console.log('✔ Document sanitization tests passed');

console.log('\nALL 5 TEST SUITES PASSED CLEANLY (100% assertions succeeded)!');
