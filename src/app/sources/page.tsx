'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export default function SourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sources')
      .then((r) => r.json())
      .then((data) => setSources(data.sources || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Source Registry</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          26 official adapters spanning ATS endpoints, aggregators, remote feeds, and manual ingestion modes.
        </p>
      </div>

      <Card>
        <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Configured Connectors</CardTitle>
          <Badge variant="outline" className="text-[10px] font-mono">
            {sources.length} sources
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-xs text-muted-foreground p-6 text-center">Loading sources...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground border-b">
                  <tr>
                    <th className="p-3 font-medium">Source</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Integration</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Refresh</th>
                    <th className="p-3 font-medium">Jobs Ingested</th>
                    <th className="p-3 font-medium">Compliance Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sources.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground">{s.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {s.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-[11px]">{s.integrationMethod}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          {s.enabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Active</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-muted-foreground">Disabled</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{s.refreshPolicy}</td>
                      <td className="p-3 font-mono text-muted-foreground">{s.jobsFoundTotal || 0}</td>
                      <td className="p-3 text-muted-foreground text-[11px] max-w-xs truncate">
                        {s.complianceNote || 'Direct API/feed active.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
