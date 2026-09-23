'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KanbanSquare, ChevronRight, CheckCircle, Clock, ExternalLink } from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'DISCOVERED', title: 'Discovered', color: 'border-slate-700' },
  { id: 'MATCHED', title: 'Matched', color: 'border-cyan-800' },
  { id: 'DOCUMENTS_READY', title: 'Docs Ready', color: 'border-blue-800' },
  { id: 'EMAIL_APPROVAL', title: 'Email Queue', color: 'border-amber-800' },
  { id: 'APPLIED', title: 'Applied', color: 'border-emerald-800' },
  { id: 'INTERVIEW', title: 'Interview', color: 'border-purple-800' },
  { id: 'OFFER', title: 'Offer', color: 'border-emerald-500' },
  { id: 'REJECTED', title: 'Rejected', color: 'border-red-800' },
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
    <div className="max-w-[1600px] mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Application Tracking (18-Stage Kanban)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Track job lifecycle from discovery to interview/offer with automated state transitions and audit logging.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading application pipeline...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((col) => {
            const columnApps = applications.filter((a) => a.status === col.id);
            return (
              <div key={col.id} className="min-w-[180px] bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex flex-col space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{col.title}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700">
                    {columnApps.length}
                  </Badge>
                </div>

                <div className="space-y-3 flex-1">
                  {columnApps.map((app) => (
                    <Card key={app.id} className="bg-slate-950 border-slate-800 p-3 hover:border-slate-700 transition">
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">{app.job_title}</div>
                      <div className="text-[11px] text-cyan-400 mt-0.5">{app.company_name}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>{app.source}</span>
                        {app.profile_match_score && (
                          <span className="text-emerald-400 font-bold">{app.profile_match_score}%</span>
                        )}
                      </div>

                      {app.recruiter_email && (
                        <div className="text-[10px] text-amber-300 mt-1 truncate">
                          ✉ {app.recruiter_email}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 mt-2">
                        {app.application_url && (
                          <a
                            href={app.application_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-0.5"
                          >
                            <span>Link</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveStatus(app.id, app.status)}
                          className="h-6 text-[10px] px-1.5 text-cyan-400 hover:text-cyan-300 flex items-center"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {columnApps.length === 0 && (
                    <div className="text-[11px] text-slate-600 text-center py-6">Empty</div>
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
