'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe2, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Job Source Matrix & Circuit Breakers
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          26 official source adapters across ATS platforms, aggregators, remote boards, and Indian portals.
        </p>
      </div>

      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Configured Job Sources</span>
            <Badge variant="outline" className="text-xs border-slate-700">
              {sources.length} sources
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-xs text-slate-500 py-4">Loading source matrix...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Source Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Refresh Policy</th>
                    <th className="p-3">Jobs Ingested</th>
                    <th className="p-3">Compliance & Access Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sources.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-200">{s.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-[10px]">
                          {s.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400">{s.integrationMethod}</td>
                      <td className="p-3">
                        <span className="flex items-center space-x-1">
                          {s.enabled ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">Enabled</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-amber-400 font-medium">Disabled</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">{s.refreshPolicy}</td>
                      <td className="p-3 font-semibold text-slate-300">{s.jobsFoundTotal || 0}</td>
                      <td className="p-3 text-slate-500 text-[11px] max-w-sm">
                        {s.complianceNote || 'Direct API/feed integration active.'}
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
