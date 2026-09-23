'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ExternalLink } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'DISCOVERED', title: 'Discovered' },
  { id: 'MATCHED', title: 'Matched' },
  { id: 'DOCUMENTS_READY', title: 'Docs Ready' },
  { id: 'EMAIL_APPROVAL', title: 'Email Queue' },
  { id: 'APPLIED', title: 'Applied' },
  { id: 'INTERVIEW', title: 'Interview' },
  { id: 'OFFER', title: 'Offer' },
  { id: 'REJECTED', title: 'Archived' },
];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleMoveStatus = async (appId: string, currentStatus: string) => {
    const currentIndex = KANBAN_COLUMNS.findIndex((c) => c.id === currentStatus);
    const nextCol = KANBAN_COLUMNS[currentIndex + 1];
    if (!nextCol) return;

    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: appId, newStatus: nextCol.id, trigger: 'UI' }),
    });
    fetchApps();
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Applications Kanban</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Progress and state machine tracking across application lifecycle stages.
        </p>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground py-8 text-center">Loading applications...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnApps = applications.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="min-w-[170px] border rounded-lg p-2.5 bg-card flex flex-col space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b text-xs">
                  <span className="font-medium text-foreground">{col.title}</span>
                  <span className="text-[11px] text-muted-foreground font-mono">{columnApps.length}</span>
                </div>

                <div className="space-y-2 flex-1">
                  {columnApps.map((app) => (
                    <Card key={app.id} className="p-2.5 space-y-1.5 bg-muted/20 hover:border-foreground/30 transition-colors">
                      <div className="text-xs font-medium text-foreground line-clamp-1">{app.job_title}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{app.company_name}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                        <span>{app.source}</span>
                        {app.profile_match_score && (
                          <span className="font-mono text-foreground font-semibold">{app.profile_match_score}%</span>
                        )}
                      </div>

                      <div className="pt-1.5 flex items-center justify-between border-t text-[10px]">
                        {app.application_url && (
                          <a
                            href={app.application_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStatus(app.id, app.status)}
                          className="h-5 text-[10px] px-1 text-muted-foreground hover:text-foreground"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {columnApps.length === 0 && (
                    <div className="text-[11px] text-muted-foreground/60 text-center py-6">Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
