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

    # Enhance Telegram Message Formatting with inline action buttons
    if n['name'] == 'Format Telegram Message':
        js = n['parameters']['jsCode']
        button_code = """
const inline_keyboard = [];
const row1 = [];
row1.push({ text: "✨ Tailor Resume", callback_data: `job:${job.id || job.fingerprint}:tailor` });
if (job.recruiter_email) {
  row1.push({ text: "📧 Draft Email", callback_data: `job:${job.id || job.fingerprint}:draft_email` });
}
inline_keyboard.push(row1);

const row2 = [];
if (appUrl) {
  row2.push({ text: "🌐 View & Apply", url: appUrl });
}
row2.push({ text: "❌ Dismiss", callback_data: `job:${job.id || job.fingerprint}:dismiss` });
inline_keyboard.push(row2);

const replyMarkup = JSON.stringify({ inline_keyboard });
"""
        n['parameters']['jsCode'] = js.replace('return [{', button_code + '\nreturn [{').replace('job_id: job.id', 'job_id: job.id,\n    replyMarkup: replyMarkup')

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

# Connect legacy webhook to Initialize Run & Profile
wf['connections']['Webhook Trigger (Legacy /job-pipeline-trigger)'] = {
    'main': [[{'node': 'Initialize Run & Profile', 'type': 'main', 'index': 0}]]
}
# Rename connection from Schedule Trigger
if 'Schedule Trigger (Every 6h)' in wf['connections']:
    wf['connections']['Schedule Trigger (Hourly)'] = wf['connections'].pop('Schedule Trigger (Every 6h)')
if 'Webhook Trigger' in wf['connections']:
    wf['connections']['Webhook Trigger (POST /webhook/job-search)'] = wf['connections'].pop('Webhook Trigger')

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
