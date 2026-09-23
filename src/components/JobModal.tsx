'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Send,
  FolderOpen,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

interface Job {
  id: number;
  fingerprint: string;
  source: string;
  company_name: string;
  company_domain: string | null;
  job_title: string;
  description: string;
  location: string;
  remote_type: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  posted_at: string;
  application_url: string;
  profile_match_score: number | null;
  match_reason: string | null;
  match_details: any;
  telegram_sent: boolean;
  application_status: string;
  last_seen_at: string;
  recruiter_name?: string;
  recruiter_email?: string;
  email_confidence?: number;
}

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
  onStatusChange: (jobId: number, status: string) => void;
}

export default function JobModal({ job, onClose, onStatusChange }: JobModalProps) {
  if (!job) return null;

  const [generating, setGenerating] = useState(false);
  const [docMsg, setDocMsg] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const score = job.profile_match_score ?? 0;
  const matchReasons: string[] = Array.isArray(job.match_details?.reasons)
    ? job.match_details.reasons
    : job.match_reason
    ? [job.match_reason]
    : [];

  const handleGenerate = async (type: 'resume' | 'cover' | 'package' | 'email') => {
    setGenerating(true);
    setDocMsg(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, type }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === 'resume') {
          setDocMsg('ATS Tailored Resume generated');
          setPreviewHtml(data.resumePreview);
        } else if (type === 'cover') {
          setDocMsg('Cover Letter generated');
          setPreviewHtml(data.coverLetterPreview);
        } else if (type === 'email') {
          setDocMsg('Application email queued in Outbox');
        } else {
          setDocMsg('Application Package created');
          setPreviewHtml(data.resumePreview);
        }
      } else {
        setDocMsg(data.error || 'Failed to generate');
      }
    } catch (e: any) {
      setDocMsg(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 border bg-card text-card-foreground shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-5 border-b bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] font-normal">
                  {job.source}
                </Badge>
                {job.remote_type && (
                  <Badge variant="secondary" className="text-[10px] font-normal">
                    {job.remote_type}
                  </Badge>
                )}
                {job.recruiter_email && (
                  <Badge variant="success" className="text-[10px] font-normal">
                    Verified Recruiter Email
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                {job.job_title}
              </DialogTitle>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{job.company_name}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{job.location || 'Remote'}</span>
                </span>
              </div>
            </div>

            {/* Match Score */}
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-foreground">
                {score}%
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                ATS Match
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Action Toolbar */}
          <div className="border rounded-md p-3 bg-muted/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-foreground">Generation & Application Actions</span>
              {docMsg && <span className="text-emerald-500 font-normal">{docMsg}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate('resume')}
                className="h-7 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Tailor Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate('cover')}
                className="h-7 text-xs"
              >
                <FileText className="w-3 h-3 mr-1" />
                Cover Letter
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate('package')}
                className="h-7 text-xs"
              >
                <FolderOpen className="w-3 h-3 mr-1" />
                Package
              </Button>

              {job.recruiter_email && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={generating}
                  onClick={() => handleGenerate('email')}
                  className="h-7 text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Queue Recruiter Email
                </Button>
              )}
            </div>

            {previewHtml && (
              <div className="mt-3 border rounded p-3 bg-background max-h-48 overflow-y-auto font-sans leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </div>

          {/* AI Match Reasons */}
          {matchReasons.length > 0 && (
            <div className="border rounded-md p-3 space-y-1.5 bg-muted/10">
              <div className="font-medium text-foreground">Alignment Summary</div>
              <ul className="space-y-1 text-muted-foreground">
                {matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full JD */}
          <div className="space-y-1.5">
            <div className="font-medium text-foreground">Job Description</div>
            <div className="border rounded-md p-3 bg-muted/10 text-muted-foreground whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
              {job.description ? job.description.replace(/<[^>]*>?/gm, '') : 'No description available'}
            </div>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="p-3 bg-muted/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Status:</span>
            <Select
              value={job.application_status || 'NEW'}
              onValueChange={(val) => onStatusChange(job.id, val)}
            >
              <SelectTrigger className="w-36 h-7 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DISCOVERED">Discovered</SelectItem>
                <SelectItem value="MATCHED">Matched</SelectItem>
                <SelectItem value="DOCUMENTS_READY">Docs Ready</SelectItem>
                <SelectItem value="EMAIL_APPROVAL">Email Approval</SelectItem>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="INTERVIEW">Interview</SelectItem>
                <SelectItem value="OFFER">Offer</SelectItem>
                <SelectItem value="REJECTED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
              Close
            </Button>
            <Button asChild size="sm" className="h-7 text-xs">
              <a
                href={job.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                <span>Apply Direct</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
