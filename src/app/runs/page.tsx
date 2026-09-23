'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Layers, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Run {
  run_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  sources_attempted: number;
  sources_succeeded: number;
  sources_failed: number;
  jobs_fetched: number;
  jobs_normalized: number;
  jobs_matched: number;
  telegram_sent: number;
  errors: any[];
}

interface Source {
  source_name: string;
  source_type: string;
  base_url: string;
  is_active: boolean;
  last_run_at: string | null;
  last_status: string | null;
}

export default function RunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/runs');
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs || []);
        setSources(data.sources || []);
      }
    } catch (e) {
      console.error('Failed to load runs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Pipeline Execution Health & Diagnostics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of aggregator runs and active source adapters across Class 1, 2, and 3 platforms.
          </p>
        </div>

        <Button
          onClick={fetchRuns}
          variant="secondary"
          size="sm"
          className="flex items-center space-x-2 border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Sources Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Active Ingestion Sources (10 Platforms)</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
          {sources.map((s) => (
            <Card
              key={s.source_name}
              className="bg-[#0f172a] border-slate-800 shadow-sm"
            >
              <CardContent className="p-3.5 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 truncate">{s.source_name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 uppercase font-semibold">
                    {s.source_type}
                  </div>
                </div>

                <div className="text-[10px] text-emerald-400 font-medium flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Live Adapter</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Runs History Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-400" />
          <span>Execution History (PostgreSQL job_runs)</span>
        </h2>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : (
          <Card className="border-slate-800 bg-[#0f172a] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#141e33] border-slate-800">
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Run ID</TableHead>
                  <TableHead className="text-slate-400">Started</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Sources</TableHead>
                  <TableHead className="text-slate-400">Raw Jobs</TableHead>
                  <TableHead className="text-slate-400">Matches</TableHead>
                  <TableHead className="text-slate-400">Telegram</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                      No execution runs recorded yet. Click &apos;Run Pipeline&apos; to trigger the first run.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((r) => (
                    <TableRow key={r.run_id} className="hover:bg-slate-900/40 border-slate-800/60">
                      <TableCell className="font-mono text-[11px] text-slate-300 font-medium">
                        {r.run_id}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">
                        {new Date(r.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === 'completed'
                              ? 'success'
                              : r.status === 'running'
                              ? 'cyan'
                              : 'destructive'
                          }
                          className="uppercase text-[10px] font-bold"
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.sources_attempted || 10}</TableCell>
                      <TableCell className="font-semibold text-white">{r.jobs_fetched || 0}</TableCell>
                      <TableCell className="font-bold text-emerald-400">{r.jobs_matched || 0}</TableCell>
                      <TableCell className="font-semibold text-cyan-300">{r.telegram_sent || 0}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
