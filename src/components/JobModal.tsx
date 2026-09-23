'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  FileText,
  Send,
  FolderOpen,
  Mail,
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
          setDocMsg('ATS Tailored Resume generated successfully!');
          setPreviewHtml(data.resumePreview);
        } else if (type === 'cover') {
          setDocMsg('Job-specific Cover Letter generated!');
          setPreviewHtml(data.coverLetterPreview);
        } else if (type === 'email') {
          setDocMsg('Application email prepared and queued in Outbox!');
        } else {
          setDocMsg('Full Application Package created (Resume + Cover Letter + Outbox)!');
          setPreviewHtml(data.resumePreview);
        }
      } else {
        setDocMsg(data.error || 'Failed to generate document');
      }
    } catch (e: any) {
      setDocMsg(e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={!!job} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 bg-[#0f172a] border-slate-700/80 text-slate-100 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 bg-[#131d33] border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-xs px-2">
                  {job.source}
                </Badge>
                {job.remote_type && (
                  <Badge variant="secondary" className="text-xs">
                    {job.remote_type}
                  </Badge>
                )}
                {job.recruiter_email && (
                  <Badge variant="success" className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    HR Email Verified
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                {job.job_title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 pt-1">
                <span className="flex items-center space-x-1 font-medium text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{job.company_name}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{job.location || 'Remote'}</span>
                </span>
                {job.posted_at && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(job.posted_at).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Match Score Badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-baseline space-x-1">
                <span
                  className={`text-3xl font-extrabold ${
                    score >= 80
                      ? 'text-emerald-400'
                      : score >= 60
                      ? 'text-cyan-400'
                      : 'text-amber-400'
                  }`}
                >
                  {score}%
                </span>
                <span className="text-xs text-slate-400">match</span>
              </div>
              <span className="text-[10px] text-slate-400">ATS Alignment</span>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Action Center: Document Generation */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>On-Demand ATS Generation & Outbox Actions</span>
              </span>
              {docMsg && <span className="text-xs text-emerald-400 font-medium">{docMsg}</span>}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate('resume')}
                className="text-xs border-slate-700 bg-slate-950 hover:bg-slate-800 text-white flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generate ATS Resume</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate('cover')}
                className="text-xs border-slate-700 bg-slate-950 hover:bg-slate-800 text-white flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Generate Cover Letter</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={generating}
                onClick={() => handleGenerate('package')}
                className="text-xs border-cyan-700/50 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 flex items-center space-x-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generate Application Package</span>
              </Button>

              {/* Display Send Email only if Recruiter Email exists */}
              {job.recruiter_email ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={generating}
                  onClick={() => handleGenerate('email')}
                  className="text-xs border-emerald-700/60 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Draft Recruiter Email ({job.recruiter_email})</span>
                </Button>
              ) : (
                <span className="text-xs text-slate-500 self-center italic px-2">
                  No public recruiter email found on posting
                </span>
              )}
            </div>

            {/* Document Preview Frame */}
            {previewHtml && (
              <div className="mt-4 border border-slate-700 rounded-lg overflow-hidden bg-white text-black p-4 max-h-64 overflow-y-auto">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
          </div>

          {/* AI Match Details */}
          {matchReasons.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                ATS Alignment Analysis
              </h3>
              <ul className="space-y-1.5">
                {matchReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Job Description */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Full Job Description
            </h3>
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 whitespace-pre-line leading-relaxed font-sans max-h-80 overflow-y-auto">
              {job.description || 'No detailed description provided by the employer source.'}
            </div>
          </div>
        </div>

        <Separator className="bg-slate-800" />

        {/* Footer Actions */}
        <div className="p-4 bg-[#141e33] flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 whitespace-nowrap">Status:</span>
            <Select
              value={job.application_status || 'NEW'}
              onValueChange={(val) => onStatusChange(job.id, val)}
            >
              <SelectTrigger className="w-44 h-8 bg-slate-800 border-slate-700 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="DISCOVERED">Discovered</SelectItem>
                <SelectItem value="MATCHED">Matched</SelectItem>
                <SelectItem value="DOCUMENTS_READY">Documents Ready</SelectItem>
                <SelectItem value="EMAIL_APPROVAL">Email Approval</SelectItem>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="INTERVIEW">Interviewing</SelectItem>
                <SelectItem value="OFFER">Offer Received</SelectItem>
                <SelectItem value="REJECTED">Archived / Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white"
            >
              Close
            </Button>
            <Button asChild variant="gradient" size="sm" className="font-bold">
              <a
                href={job.application_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5"
              >
                <span>Apply on Company Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
