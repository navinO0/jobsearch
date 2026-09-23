'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  Clock,
  RotateCcw,
  CheckCircle2,
  FolderOpen,
  FileText,
  Mail,
  Send,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [resumeVersion, setResumeVersion] = useState<any>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchApp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (data.success) {
        setApp(data.application);
        setEvents(data.events || []);
        setResumeVersion(data.resumeVersion);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchApp();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice(`Status advanced to ${newStatus}`);
        await fetchApp();
      }
    } catch (e: any) {
      setNotice(e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading application details...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold">Application Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/applications">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Applications
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
              <Link href="/applications">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {app.job_title} @ {app.company_name}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Application state machine tracker and chronological audit events timeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={app.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 w-44 text-xs font-semibold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DISCOVERED">Discovered</SelectItem>
              <SelectItem value="MATCHED">Matched</SelectItem>
              <SelectItem value="DOCUMENTS_READY">Documents Ready</SelectItem>
              <SelectItem value="EMAIL_DRAFT">Email Draft</SelectItem>
              <SelectItem value="EMAIL_APPROVAL">Email Approval</SelectItem>
              <SelectItem value="EMAIL_SCHEDULED">Email Scheduled</SelectItem>
              <SelectItem value="EMAIL_SENT">Email Sent</SelectItem>
              <SelectItem value="APPLIED">Applied</SelectItem>
              <SelectItem value="FOLLOW_UP_DUE">Follow-up Due</SelectItem>
              <SelectItem value="INTERVIEW">Interview</SelectItem>
              <SelectItem value="OFFER">Offer</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details & Generated Documents */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Target Opening & Matching</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {app.profile_match_score || 0}% ATS Match
                </Badge>
                <Badge variant="outline" className="text-xs font-mono uppercase">
                  Source: {app.source}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  {app.location || 'Remote'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-3">
                {app.description}
              </p>
              {app.application_url && (
                <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                  <a href={app.application_url} target="_blank" rel="noopener noreferrer">
                    Open Job Link
                    <ExternalLink className="h-3 w-3 ml-1.5" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Generated Documents */}
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Generated Application Artifacts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {resumeVersion ? (
                <div className="p-3.5 bg-muted/20 border border-border/40 rounded-lg space-y-1.5">
                  <p className="font-semibold text-xs text-foreground">Tailored Resume Version</p>
                  <p className="text-xs text-muted-foreground italic">{resumeVersion.tailored_summary}</p>
                  {resumeVersion.pdf_url && (
                    <Button asChild variant="link" size="sm" className="p-0 h-auto text-xs">
                      <a href={resumeVersion.pdf_url} target="_blank" rel="noopener noreferrer">
                        Download Tailored PDF <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No tailored resume generated yet.</p>
              )}

              {app.cover_letter_text && (
                <div className="p-3.5 bg-muted/20 border border-border/40 rounded-lg space-y-1.5">
                  <p className="font-semibold text-xs text-foreground">Tailored Cover Letter</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {app.cover_letter_text}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Event Timeline */}
        <div className="space-y-6">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                State Machine Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{ev.event_type}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(ev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {ev.from_status && ev.to_status && (
                        <p className="text-[11px] text-muted-foreground">
                          {ev.from_status} → <b className="text-foreground">{ev.to_status}</b>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
