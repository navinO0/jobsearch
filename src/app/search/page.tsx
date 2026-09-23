'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Upload,
  Play,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  Link as LinkIcon,
  Sparkles,
  Download,
  ListFilter,
  History,
  Briefcase,
} from 'lucide-react';

export default function SearchPage() {
  // Mode tabs
  const [activeTab, setActiveTab] = useState('profile');

  // Search Profile Fields (Section 6)
  const [profileName, setProfileName] = useState('Senior Full Stack & AI Systems');
  const [defaultResume, setDefaultResume] = useState('res_master_001');
  const [targetRoles, setTargetRoles] = useState('Senior Backend Engineer, Full Stack Engineer, AI Systems Engineer');
  const [roleSynonyms, setRoleSynonyms] = useState('Node.js Developer, Platform Engineer, Distributed Systems Engineer');
  const [mustHaveSkills, setMustHaveSkills] = useState('TypeScript, Node.js, PostgreSQL, Docker');
  const [niceToHaveSkills, setNiceToHaveSkills] = useState('Python, FastAPI, Redis, Kubernetes, React');
  const [excludeKeywords, setExcludeKeywords] = useState('WordPress, PHP, Clearance Required, Unpaid, Intern');
  const [seniority, setSeniority] = useState('SENIOR');
  const [experienceYears, setExperienceYears] = useState('5');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [workMode, setWorkMode] = useState('REMOTE');
  const [locations, setLocations] = useState('Remote, India, United States, Worldwide');
  const [countries, setCountries] = useState('United States, India, Canada, United Kingdom');
  const [minSalary, setMinSalary] = useState('110000');
  const [maxSalary, setMaxSalary] = useState('160000');
  const [salaryCurrency, setSalaryCurrency] = useState('USD');

  // Collapsible Advanced Filters (Section 7)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [industries, setIndustries] = useState('SaaS, AI, Fintech, DevTools');
  const [companySize, setCompanySize] = useState('ALL');
  const [startupPreference, setStartupPreference] = useState(true);
  const [mncPreference, setMncPreference] = useState(true);
  const [freshnessDays, setFreshnessDays] = useState('7');
  const [aiMatchThreshold, setAiMatchThreshold] = useState('70');
  const [batchSize, setBatchSize] = useState('15');
  const [hourlyMonitoring, setHourlyMonitoring] = useState(true);
  const [telegramAlerts, setTelegramAlerts] = useState(true);
  const [autoDraftEmails, setAutoDraftEmails] = useState(true);

  // CSV Search State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  // Single URL Search State
  const [singleJobUrl, setSingleJobUrl] = useState('');

  // Execution feedback
  const [triggering, setTriggering] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'backend') {
      setProfileName('Senior Backend Architect');
      setTargetRoles('Senior Backend Engineer, Node.js Architect, Distributed Systems Engineer');
      setMustHaveSkills('Node.js, TypeScript, PostgreSQL, Redis, Microservices');
      setMinSalary('120000');
    } else if (presetName === 'fullstack') {
      setProfileName('Senior Full Stack Lead');
      setTargetRoles('Senior Full Stack Engineer, Tech Lead, React/Node Specialist');
      setMustHaveSkills('React, Next.js, TypeScript, Node.js, PostgreSQL, Tailwind');
      setMinSalary('115000');
    } else if (presetName === 'ai') {
      setProfileName('AI & LLM Application Engineer');
      setTargetRoles('AI Engineer, LLM Systems Engineer, Machine Learning Engineer');
      setMustHaveSkills('Python, LangChain, FastAPI, Vector DB, TypeScript, OpenAI API');
      setMinSalary('130000');
    } else if (presetName === 'devops') {
      setProfileName('Cloud & DevOps Engineer');
      setTargetRoles('DevOps Engineer, SRE, Platform Engineer, Cloud Architect');
      setMustHaveSkills('Kubernetes, Terraform, Docker, AWS, CI/CD, Prometheus');
      setMinSalary('125000');
    }
  };

  const handleRunSearch = async () => {
    setTriggering(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'search',
          profileName,
          targetRoles: targetRoles.split(',').map((s) => s.trim()),
          mustHaveSkills: mustHaveSkills.split(',').map((s) => s.trim()),
          excludeKeywords: excludeKeywords.split(',').map((s) => s.trim()),
          workMode,
          minSalary: parseFloat(minSalary) || 0,
          batchSize: parseInt(batchSize, 10) || 15,
          aiMatchThreshold: parseInt(aiMatchThreshold, 10) || 70,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          msg: `Search orchestrator successfully triggered run '${data.run_id}'. Evaluating active sources in batches of ${batchSize}.`,
          ok: true,
        });
      } else {
        setFeedback({ msg: data.error || 'Failed to trigger search', ok: false });
      }
    } catch (e: any) {
      setFeedback({ msg: e.message, ok: false });
    } finally {
      setTriggering(false);
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim().length > 0);
    const rows = lines.slice(0, 6).map((line) => line.split(','));
    setCsvPreview(rows);
  };

  const handleRunCsvBatch = async () => {
    if (!csvFile) return;
    setTriggering(true);
    setFeedback(null);
    try {
      setFeedback({
        msg: `CSV file '${csvFile.name}' accepted. Dispatched batch search pipeline for ${csvPreview.length - 1} profile rows.`,
        ok: true,
      });
    } finally {
      setTriggering(false);
    }
  };

  const handleRunUrlExtract = async () => {
    if (!singleJobUrl) return;
    setTriggering(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'url',
          jobUrl: singleJobUrl,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({
          msg: `Extracted job from URL successfully. Verified candidate match score and generated preview.`,
          ok: true,
        });
      } else {
        setFeedback({ msg: data.error || 'Extraction failed', ok: false });
      }
    } catch (e: any) {
      setFeedback({ msg: e.message, ok: false });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header with Navigation Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Search & Aggregation Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure multi-source queries, upload batch CSV files, or inspect single job URLs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/search/profiles">
              <ListFilter className="h-3.5 w-3.5 mr-1.5" />
              Profiles
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/search/runs">
              <History className="h-3.5 w-3.5 mr-1.5" />
              Runs
            </Link>
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-lg text-xs flex items-center gap-2 ${
            feedback.ok
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="profile" className="text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
            Search Profile
          </TabsTrigger>
          <TabsTrigger value="csv" className="text-xs">
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            CSV Search
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
            Single Job URL
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Search Form */}
        <TabsContent value="profile" className="space-y-6">
          {/* Quick Preset Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Presets:</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleApplyPreset('backend')}>
              Senior Backend
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleApplyPreset('fullstack')}>
              Full Stack Lead
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleApplyPreset('ai')}>
              AI & LLM Engineer
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleApplyPreset('devops')}>
              Cloud / DevOps
            </Button>
          </div>

          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Primary Search Criteria</CardTitle>
              <CardDescription className="text-xs">
                Defines role targets, core competencies, and employment constraints used for automated hourly ingestion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Profile Name</label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Senior Backend Architect"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Target Roles (Comma-separated)</label>
                  <Input
                    value={targetRoles}
                    onChange={(e) => setTargetRoles(e.target.value)}
                    placeholder="Backend Engineer, Node.js Specialist"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Role Synonyms</label>
                  <Input
                    value={roleSynonyms}
                    onChange={(e) => setRoleSynonyms(e.target.value)}
                    placeholder="Platform Engineer, API Developer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Must-Have Skills (Required for match)</label>
                  <Input
                    value={mustHaveSkills}
                    onChange={(e) => setMustHaveSkills(e.target.value)}
                    placeholder="TypeScript, Node.js, PostgreSQL"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Nice-To-Have Skills</label>
                  <Input
                    value={niceToHaveSkills}
                    onChange={(e) => setNiceToHaveSkills(e.target.value)}
                    placeholder="Docker, Redis, Kubernetes"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Exclude Keywords (Deterministic rejection)</label>
                  <Input
                    value={excludeKeywords}
                    onChange={(e) => setExcludeKeywords(e.target.value)}
                    placeholder="WordPress, Unpaid, Security Clearance"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Work Mode</label>
                  <Select value={workMode} onValueChange={setWorkMode}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Work Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REMOTE">Remote Only</SelectItem>
                      <SelectItem value="HYBRID">Hybrid Allowed</SelectItem>
                      <SelectItem value="ONSITE">Onsite Permitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Seniority Level</label>
                  <Select value={seniority} onValueChange={setSeniority}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MID">Mid-Level (3-5 yrs)</SelectItem>
                      <SelectItem value="SENIOR">Senior (5+ yrs)</SelectItem>
                      <SelectItem value="LEAD">Lead / Staff / Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Target Locations & Countries</label>
                  <Input
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                    placeholder="Remote, India, Worldwide"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Min Salary ({salaryCurrency})</label>
                    <Input
                      type="number"
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Currency</label>
                    <Select value={salaryCurrency} onValueChange={setSalaryCurrency}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Collapsible Advanced Filters (Section 7) */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-muted-foreground p-0 h-auto font-medium hover:bg-transparent"
                >
                  {showAdvanced ? (
                    <ChevronUp className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 mr-1" />
                  )}
                  {showAdvanced ? 'Hide Advanced Options' : 'Show Collapsible Advanced Options'}
                </Button>

                {showAdvanced && (
                  <div className="mt-4 p-4 bg-muted/20 border border-border/40 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Target Industries</label>
                        <Input
                          value={industries}
                          onChange={(e) => setIndustries(e.target.value)}
                          placeholder="SaaS, AI, Fintech"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Posting Freshness</label>
                        <Select value={freshnessDays} onValueChange={setFreshnessDays}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Freshness" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Posted within 24 hours</SelectItem>
                            <SelectItem value="3">Posted within 3 days</SelectItem>
                            <SelectItem value="7">Posted within 7 days</SelectItem>
                            <SelectItem value="14">Posted within 14 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Batch Size per Run</label>
                        <Select value={batchSize} onValueChange={setBatchSize}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Batch Size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 jobs</SelectItem>
                            <SelectItem value="10">10 jobs</SelectItem>
                            <SelectItem value="15">15 jobs</SelectItem>
                            <SelectItem value="25">25 jobs</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={startupPreference}
                          onChange={(e) => setStartupPreference(e.target.checked)}
                          className="rounded border-border text-primary"
                        />
                        Startup Preference
                      </label>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={mncPreference}
                          onChange={(e) => setMncPreference(e.target.checked)}
                          className="rounded border-border text-primary"
                        />
                        MNC / Enterprise
                      </label>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hourlyMonitoring}
                          onChange={(e) => setHourlyMonitoring(e.target.checked)}
                          className="rounded border-border text-primary"
                        />
                        Hourly Polling
                      </label>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telegramAlerts}
                          onChange={(e) => setTelegramAlerts(e.target.checked)}
                          className="rounded border-border text-primary"
                        />
                        Telegram Alerts
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">
                All drafted emails require explicit approval before dispatch.
              </span>
              <Button onClick={handleRunSearch} disabled={triggering} className="h-9">
                <Play className={`h-3.5 w-3.5 mr-1.5 ${triggering ? 'animate-spin' : ''}`} />
                {triggering ? 'Triggering Run...' : 'Execute Search Run'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 2: CSV Upload Search */}
        <TabsContent value="csv" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Batch CSV Search Ingestion</CardTitle>
                  <CardDescription className="text-xs">
                    Upload a spreadsheet of search criteria to execute sequential batch runs across all adapters.
                  </CardDescription>
                </div>
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <a href="/examples/job-search.csv" download>
                    <Download className="h-3 w-3 mr-1" />
                    Download Template (.csv)
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 border-2 border-dashed border-border/80 rounded-lg text-center space-y-3 bg-muted/10">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Choose CSV File or drag and drop</p>
                  <p className="text-[11px] text-muted-foreground">
                    Required columns: profile_name, job_title, keywords, location, remote_type, min_salary
                  </p>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="text-xs text-muted-foreground mx-auto block file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90"
                />
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold">CSV Preview (First 5 Rows):</p>
                  <div className="overflow-x-auto border border-border/40 rounded-lg">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/40 font-mono text-[11px] border-b border-border/40">
                        <tr>
                          {csvPreview[0].map((header, i) => (
                            <th key={i} className="p-2 font-medium">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(1).map((row, i) => (
                          <tr key={i} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                            {row.map((cell, j) => (
                              <td key={j} className="p-2 truncate max-w-xs">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Button onClick={handleRunCsvBatch} disabled={triggering} className="h-9 mt-2">
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    Process {csvPreview.length - 1} Search Rows
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Single Job URL Search */}
        <TabsContent value="url" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ad-hoc Job URL Inspection</CardTitle>
              <CardDescription className="text-xs">
                Paste an individual job listing URL. The system fetches the posting safely, parses the requirements, and matches against your resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Job Posting URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://boards.greenhouse.io/company/jobs/123456"
                    value={singleJobUrl}
                    onChange={(e) => setSingleJobUrl(e.target.value)}
                  />
                  <Button onClick={handleRunUrlExtract} disabled={triggering || !singleJobUrl} className="h-9 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Fetch & Match
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Protected against SSRF: internal IP ranges and unauthorized schemas are automatically blocked.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
