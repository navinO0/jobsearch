'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  FileText,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ResumeVersionsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/resumes/${id}`);
        const data = await res.json();
        if (data.success) {
          setResume(data.resume);
          setVersions(data.versions || []);
        }
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading versions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
              <Link href={`/resumes/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Master Resume
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Tailored Resume Versions</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            History of job-specific tailored resumes generated from master: <span className="font-semibold text-foreground">{resume?.file_name}</span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {versions.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Layers className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
            <h3 className="font-semibold text-base">No tailored versions created yet</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Open an opening in the Job Openings catalog and click &ldquo;Generate Tailored Resume&rdquo; to create your first customized document.
            </p>
          </Card>
        ) : (
          versions.map((ver) => (
            <Card key={ver.id} className="shadow-none border-border/80">
              <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {ver.job_title ? `${ver.job_title} @ ${ver.company_name}` : ver.version_label}
                    </p>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {ver.ai_provider || 'OPENROUTER'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    {ver.tailored_summary}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Created: {new Date(ver.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ver.job_id && (
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <Link href={`/jobs/${ver.job_id}`}>
                        View Job Opening
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                  {ver.pdf_url && (
                    <Button asChild size="sm" className="h-8 text-xs">
                      <a href={ver.pdf_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        Preview PDF
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
