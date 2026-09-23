import json
import copy

with open('/home/naveen/n8n-workflows/jobSearchPipeline01.json') as f:
    base = json.load(f)

wf = copy.deepcopy(base)
wf['id'] = 'job-search-unified-v2'
wf['name'] = 'Job Search Unified Pipeline (Raw v2)'

# Update Schedule Trigger to 1 hour
for n in wf['nodes']:
    if n['type'] == 'n8n-nodes-base.scheduleTrigger':
        n['name'] = 'Schedule Trigger (Hourly)'
        n['parameters'] = {'rule': {'interval': [{'field': 'hours', 'hoursInterval': 1}]}}
        
    # Enable continueOnFail for all HTTP source nodes
    if n['name'].startswith('HTTP - '):
        n['continueOnFail'] = True

    # Enhance Webhook Trigger to path job-search (POST)
    if n['name'] == 'Webhook Trigger':
        n['name'] = 'Webhook Trigger (POST /webhook/job-search)'
        n['parameters'] = {
            'httpMethod': 'POST',
            'path': 'job-search',
            'responseMode': 'onReceived',
            'responseData': '={{ JSON.stringify({ status: "ACCEPTED", run_id: "run_" + Date.now(), message: "Job search pipeline triggered successfully." }) }}'
        }

    # Enhance Manual Trigger with pinned test payload (Node.js with 2 years experience)
    if n['name'] == 'Manual Trigger (Test)':
        n['name'] = 'Manual Trigger (Test - Node.js 2y Exp)'

    # Enhance Initialize Run & Profile to default to Node.js 2 years experience
    if n['name'] == 'Initialize Run & Profile':
        n['parameters']['jsCode'] = """
const inputData = $input.first()?.json || {};

const runId = 'run_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

const config = {
  MAX_RESULTS_PER_SOURCE: 15,
  MAX_REQUESTS_PER_RUN: 10,
  REQUEST_TIMEOUT: 15000,
  RETRY_COUNT: 2,
  RETRY_DELAY: 2000,
  CONCURRENCY_LIMIT: 3,
  MIN_MATCH_SCORE: inputData.min_score || 55,
  TELEGRAM_RATE_LIMIT_MS: 1500
};

// Target profile: Node.js Developer with 2 years experience
const profile = {
  id: inputData.profile_id || 'node_2y_profile',
  profile_name: inputData.profile_name || 'Node.js Developer (2 Years Experience)',
  target_titles: inputData.titles || [
    'node.js developer', 'backend developer', 'node developer',
    'backend engineer', 'javascript backend engineer', 'junior to mid node.js developer',
    'full stack developer (node.js)'
  ],
  target_keywords: [
    'node.js', 'nodejs', 'express', 'backend', 'javascript', 'typescript', 'postgresql', 'rest api'
  ],
  include_keywords: [
    'node.js', 'javascript', 'typescript', 'express', 'postgresql', 'rest', 'api', 'docker', 'redis'
  ],
  exclude_keywords: inputData.exclude_keywords || [
    'intern', 'internship', 'unpaid', 'principal', 'director', 'vp', 'staff engineer', 'lead 8+ years'
  ],
  required_skills: ['Node.js', 'Express', 'JavaScript', 'TypeScript', 'PostgreSQL'],
  preferred_skills: ['Docker', 'Redis', 'Next.js', 'REST APIs', 'Git', 'MongoDB'],
  experience_years: inputData.experience_years || 2,
  education: 'Bachelor in Computer Science or equivalent',
  locations: inputData.locations || ['Remote', 'India', 'Bangalore', 'Bengaluru', 'Hyderabad'],
  remote_preference: true,
  hybrid_preference: true,
  onsite_preference: false,
  employment_types: ['Full-time', 'Contract'],
  notice_period: 'Immediate to 30 days',
  salary_min: inputData.min_salary || 500000,
  salary_max: inputData.max_salary || 1400000,
  technology_stack: ['Node.js', 'Express.js', 'TypeScript', 'JavaScript', 'PostgreSQL', 'REST APIs'],
  min_match_score: 55,
  telegram_chat_id: inputData.telegram_chat_id || '617149298'
};

return [{
  json: {
    run_id: runId,
    started_at: new Date().toISOString(),
    config: config,
    profile: profile,
    manual_test_payload: inputData
  }
}];
"""

    # Update Send Telegram Notification to include reply_markup
    if n['name'] == 'Send Telegram Notification':
        n['parameters']['additionalFields']['reply_markup'] = '={{ $json.replyMarkup }}'

    # Add recruiter_email extraction in Aggregate & Deduplicate Raw Jobs
    if n['name'] == 'Aggregate & Deduplicate Raw Jobs':
        js = n['parameters']['jsCode']
        email_extract = """
  // Extract recruiter email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/g;
  const emailMatches = String(job.description || '').match(emailRegex) || [];
  const foundEmail = emailMatches.find(e => !e.includes('noreply') && !e.includes('donotreply') && !e.includes('example.com') && !e.includes('sentry.io') && !e.includes('schema.org'));
  normalizedJob.recruiter_email = foundEmail || null;
"""
        n['parameters']['jsCode'] = js.replace('normalizedJobs.push(normalizedJob);', email_extract + '\n  normalizedJobs.push(normalizedJob);')

# Also add an alias Webhook for legacy job-pipeline-trigger
legacy_webhook = {
    'parameters': {
        'httpMethod': 'GET',
        'path': 'job-pipeline-trigger',
        'responseMode': 'onReceived'
    },
    'id': 'node-legacy-webhook',
    'name': 'Webhook Trigger (Legacy /job-pipeline-trigger)',
    'type': 'n8n-nodes-base.webhook',
    'typeVersion': 2,
    'position': [-1100, 100],
    'webhookId': 'legacy-job-trigger'
}
wf['nodes'].append(legacy_webhook)
wf['connections']['Webhook Trigger (Legacy /job-pipeline-trigger)'] = {
    'main': [[{'node': 'Initialize Run & Profile', 'type': 'main', 'index': 0}]]
}

# Set pinData for Manual Trigger so test data is immediately available when opened
wf['pinData'] = {
    'Manual Trigger (Test - Node.js 2y Exp)': [
        {
            'profile_name': 'Node.js Developer (2 Years Experience)',
            'role': 'Node.js Developer',
            'experience_years': 2,
            'titles': ['Node.js Developer', 'Backend Developer', 'Backend Engineer'],
            'skills': ['Node.js', 'Express', 'TypeScript', 'JavaScript', 'PostgreSQL', 'REST APIs'],
            'locations': ['Remote', 'Bengaluru', 'Hyderabad'],
            'remote_preference': 'REMOTE',
            'min_salary': 600000,
            'currency': 'INR',
            'test_job_sample': {
                'title': 'Node.js Developer (2+ Years)',
                'company': 'Tech Solutions Pvt Ltd',
                'location': 'Remote / India',
                'experience_required': '2 years',
                'skills': ['Node.js', 'Express', 'PostgreSQL', 'TypeScript'],
                'description': 'We are hiring a Node.js Developer with 2 years experience building robust RESTful microservices and APIs using Express, Node.js, and PostgreSQL. Apply to careers@techsolutions.io',
                'recruiter_email': 'careers@techsolutions.io'
            }
        }
    ]
}

# Update connections if Manual Trigger renamed
if 'Manual Trigger (Test)' in wf['connections']:
    wf['connections']['Manual Trigger (Test - Node.js 2y Exp)'] = wf['connections'].pop('Manual Trigger (Test)')

print(f'Raw Unified Workflow Nodes: {len(wf["nodes"])}')
print(f'Connections: {len(wf["connections"])}')

out_paths = [
    '/home/naveen/job-portal/n8n/v2/jobSearchPipeline_Raw_v2.json',
    '/home/naveen/n8n-workflows/job-search/v2/jobSearchPipeline_Raw_v2.json',
    '/home/naveen/n8n-workflows/jobSearchPipeline_Raw_v2.json'
]
for p in out_paths:
    with open(p, 'w') as out:
        json.dump(wf, out, indent=2)
    print(f'Successfully wrote raw workflow to {p}')
