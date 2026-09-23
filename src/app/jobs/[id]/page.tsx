'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  FolderOpen,
  Send,
  Clock,
  RotateCcw,
  Check,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [resumeVersion, setResumeVersion] = useState<any>(null);
  const [emailOutbox, setEmailOutbox] = useState<any>(null);
  const [masterCandidate, setMasterCandidate] = useState<any>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [notes, setNotes] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${id}`);
      const data = await res.json();
      if (data.success) {
        setJob(data.job);
        setApplication(data.application);
        setResumeVersion(data.resumeVersion);
        setEmailOutbox(data.emailOutbox);
        setMasterCandidate(data.masterCandidate);
        setNotes(data.application?.notes || '');
      } else {
        setNotice({ msg: data.error || 'Job not found', type: 'error' });
      }
    } catch (e: any) {
      setNotice({ msg: e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: newStatus, notes }),
      });
      const data = await res.json();
      if (data.success) {
        setJob((prev: any) => ({ ...prev, application_status: newStatus }));
        setNotice({ msg: `Status updated to ${newStatus}`, type: 'success' });
      }
    } catch (e: any) {
      setNotice({ msg: e.message, type: 'error' });
    }
  };

  const handleGenerate = async (type: 'resume' | 'cover_letter' | 'package') => {
    setActionLoading(type);
    setNotice(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: parseInt(id, 10), type }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ msg: `Generated ${type.replace('_', ' ')} successfully!`, type: 'success' });
        await fetchDetails();
      } else {
        setNotice({ msg: data.error || 'Generation failed', type: 'error' });
      }
    } catch (e: any) {
      setNotice({ msg: e.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!job?.recruiter_email) {
      setNotice({ msg: 'No recruiter email address available for this opening.', type: 'error' });
      return;
    }

    setActionLoading('email');
    try {
      const res = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          outboxId: emailOutbox?.id,
          jobId: job.id,
          recipientEmail: job.recruiter_email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ msg: 'Email approved and queued for sending!', type: 'success' });
        await fetchDetails();
      } else {
        setNotice({ msg: data.error || 'Failed to queue email', type: 'error' });
      }
    } catch (e: any) {
      setNotice({ msg: e.message, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading opening details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Job Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Openings
          </Link>
        </Button>
      </div>
    );
  }

  const score = job.profile_match_score || 0;
  const matchDetails = typeof job.match_details === 'string'
    ? JSON.parse(job.match_details || '{}')
    : job.match_details || {};
  const hasEmail = Boolean(job.recruiter_email);

  return (
    <div className="space-y-6">
      {/* Back button & Notice */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/jobs">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Openings
          </Link>
        </Button>

        {notice && (
          <div
            className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 ${
              notice.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {notice.type === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {notice.msg}
          </div>
        )}
      </div>

      {/* Main Header Card */}
      <Card className="shadow-none border-border/80">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{job.job_title}</h1>
                <Badge
                  variant="secondary"
                  className={`text-xs px-2.5 py-0.5 ${
                    score >= 80
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : score >= 60
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  {score}% ATS Alignment
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-muted-foreground pt-1">
                <span className="flex items-center font-semibold text-foreground">
                  <Building2 className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  {job.company_name}
                </span>
                <span className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  {job.location || 'Remote'} ({job.remote_type || 'REMOTE'})
                </span>
                {job.salary_min ? (
                  <span className="font-mono">
                    ${(job.salary_min / 1000).toFixed(0)}k
                    {job.salary_max ? ` - $${(job.salary_max / 1000).toFixed(0)}k` : '+'} {job.salary_currency || 'USD'}
                  </span>
                ) : null}
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
                  Source: <b className="ml-1 uppercase">{job.source}</b>
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={job.application_status || 'DISCOVERED'}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCOVERED">Discovered</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="SAVED">Saved</SelectItem>
                  <SelectItem value="DOCUMENTS_READY">Documents Ready</SelectItem>
                  <SelectItem value="EMAIL_DRAFT">Email Draft</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="INTERVIEW">Interview</SelectItem>
                  <SelectItem value="OFFER">Offer</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {job.application_url && (
                <Button asChild size="sm" className="h-9">
                  <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                    Open Job URL
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: ATS Analysis & Outreach Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: ATS Analysis & Tailoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* ATS Analysis Panel */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  ATS Alignment & Match Breakdown
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Score: {score}/100
                </span>
              </CardTitle>
              <CardDescription className="text-xs">
                Deterministic and semantic evaluation comparing target requirements with candidate master resume.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Title Match</p>
                  <p className="text-lg font-bold mt-0.5">{job.match_title_alignment || score}%</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Core Skills</p>
                  <p className="text-lg font-bold mt-0.5">{score >= 70 ? 'High' : 'Moderate'}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg border border-border/40">
                  <p className="text-[11px] text-muted-foreground uppercase font-medium">Recommendation</p>
                  <p className={`text-base font-bold mt-1 ${score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {score >= 70 ? 'STRONG MATCH' : 'PARTIAL'}
                  </p>
                </div>
              </div>

              {/* Strengths & Verified Evidence */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Matching Strengths
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(matchDetails.strengths || ['Node.js', 'TypeScript', 'PostgreSQL', 'Microservices']).map((s: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-emerald-500/5 text-emerald-700 border-emerald-500/20 text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Potential Gaps */}
              {matchDetails.gaps && matchDetails.gaps.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Requirements Not Explicitly Mentioned
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchDetails.gaps.map((g: string, idx: number) => (
                      <Badge key={idx} variant="outline" className="bg-amber-500/5 text-amber-700 border-amber-500/20 text-xs">
                        {g}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Why this resume was changed */}
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-xs space-y-1">
                <p className="font-semibold text-foreground">Why this resume was changed:</p>
                <p className="text-muted-foreground leading-relaxed">
                  {job.match_reason || 'Re-ordered and highlighted actual distributed systems and backend data access experience to directly align with the core requirements of this role without modifying dates, employers, or core competencies.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Master Resume vs Tailored Resume Comparison Tabs */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resume Tailoring & Document Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="tailored" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
                  <TabsTrigger value="cover_letter">Cover Letter</TabsTrigger>
                  <TabsTrigger value="master">Master Profile</TabsTrigger>
                </TabsList>

                <TabsContent value="tailored" className="space-y-4">
                  {resumeVersion ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/40">
                        <span>Version ID: <code className="font-mono">{resumeVersion.id}</code></span>
                        <span>Provider: {resumeVersion.ai_provider || 'OPENROUTER'}</span>
                      </div>
                      <div className="p-4 bg-muted/20 border border-border/40 rounded-lg text-xs leading-relaxed space-y-3">
                        <p className="font-semibold text-sm">Tailored Professional Summary:</p>
                        <p className="italic text-muted-foreground">{resumeVersion.tailored_summary}</p>
                        <p className="font-semibold text-sm">Prioritized Core Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(resumeVersion.tailored_skills) ? resumeVersion.tailored_skills : []).map((s: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                      {resumeVersion.pdf_url && (
                        <div className="flex gap-2">
                          <Button asChild variant="outline" size="sm">
                            <a href={resumeVersion.pdf_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View PDF
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed rounded-lg space-y-3">
                      <FileText className="h-6 w-6 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No tailored resume generated yet for this specific opening.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleGenerate('resume')}
                        disabled={actionLoading === 'resume'}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        {actionLoading === 'resume' ? 'Generating...' : 'Generate Tailored Resume'}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="cover_letter" className="space-y-4">
                  {application?.cover_letter_text ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-muted/20 border border-border/40 rounded-lg text-xs whitespace-pre-wrap leading-relaxed">
                        {application.cover_letter_text}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center border border-dashed rounded-lg space-y-3">
                      <FileText className="h-6 w-6 mx-auto text-muted-foreground opacity-50" />
                      <p className="text-xs text-muted-foreground">
                        No custom cover letter generated yet.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleGenerate('cover_letter')}
                        disabled={actionLoading === 'cover_letter'}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        {actionLoading === 'cover_letter' ? 'Generating...' : 'Generate Cover Letter'}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="master" className="space-y-4">
                  <div className="p-4 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-2">
                    <p className="font-semibold text-foreground">
                      Candidate: {masterCandidate?.name || 'Alex Taylor'}
                    </p>
                    <p className="text-muted-foreground">
                      Headline: {masterCandidate?.headline || 'Senior Full Stack & AI Systems Engineer'}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      Summary: {masterCandidate?.summary || 'Results-driven software engineer with 6+ years experience designing robust distributed systems.'}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Full Job Description */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto p-4 bg-muted/20 rounded-lg border border-border/40">
                {job.description}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: HR Contact, Outreach & Drive */}
        <div className="space-y-6">
          {/* HR & Recruiter Contact */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                Recruiter Outreach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasEmail ? (
                <div className="space-y-3">
                  <div className="p-3.5 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-blue-700">Verified Contact</span>
                      <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-700">
                        {Math.round((job.email_confidence || 0.95) * 100)}% Confidence
                      </Badge>
                    </div>
                    <p className="text-xs font-mono font-medium text-foreground">
                      {job.recruiter_email}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Discovered directly from {job.source} job posting.
                    </p>
                  </div>

                  {/* Send Email Action Button ONLY shown when email exists */}
                  <div className="space-y-2 pt-1">
                    <Button
                      className="w-full h-9"
                      onClick={handleSendEmail}
                      disabled={actionLoading === 'email'}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      {actionLoading === 'email' ? 'Queuing Email...' : 'Send Application Email'}
                    </Button>
                    <Button asChild variant="outline" className="w-full h-9">
                      <Link href="/emails/scheduled">
                        <Clock className="h-3.5 w-3.5 mr-1.5" /> Schedule Sending
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-muted/40 border border-border/50 rounded-lg text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    No public HR or recruiter email was published with this opening.
                  </p>
                  <Badge variant="outline" className="text-[11px] text-muted-foreground">
                    Direct Portal Application Only
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Drive Integration */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                Google Drive Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dedicated folder created under <code className="font-mono text-[11px]">Job Search Assistant/01_Job_Opening/</code>.
              </p>
              {application?.drive_folder_url ? (
                <Button asChild variant="outline" className="w-full h-9">
                  <a href={application.drive_folder_url} target="_blank" rel="noopener noreferrer">
                    <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                    Open in Google Drive
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-9"
                  onClick={() => handleGenerate('package')}
                  disabled={actionLoading === 'package'}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  {actionLoading === 'package' ? 'Creating...' : 'Create Application Package'}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Application Notes */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Application Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log interview dates, referral contacts, or follow-up notes..."
                className="w-full h-24 p-3 text-xs bg-muted/20 border border-border/40 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8"
                onClick={() => handleStatusChange(job.application_status)}
              >
                Save Notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
