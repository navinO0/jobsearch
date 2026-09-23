'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  ArrowLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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

export default function SearchRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/runs');
      const data = await res.json();
      if (data.success) {
        setRuns(data.runs || []);
      }
    } catch (e) {
      console.error('Failed to load search runs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleExportCsv = () => {
    if (runs.length === 0) return;
    const headers = ['run_id', 'status', 'started_at', 'completed_at', 'jobs_fetched', 'jobs_matched', 'telegram_sent'];
    const rows = runs.map((r) => [
      r.run_id,
      r.status,
      r.started_at,
      r.completed_at || '',
      r.jobs_fetched || 0,
      r.jobs_matched || 0,
      r.telegram_sent || 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `search_runs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
              <Link href="/search">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Search Run Ledger</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Audit history of batch ingestions, deduplicated volumes, and error counts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={runs.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchRuns} disabled={loading}>
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-none border-border/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40 text-xs">
              <TableRow>
                <TableHead>Run ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead className="text-right">Fetched</TableHead>
                <TableHead className="text-right">Normalized</TableHead>
                <TableHead className="text-right">Matched</TableHead>
                <TableHead className="text-right">Telegram</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    <RotateCcw className="h-5 w-5 animate-spin mx-auto mb-2 opacity-50" />
                    Loading search runs...
                  </TableCell>
                </TableRow>
              ) : runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No search runs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.run_id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{run.run_id}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          run.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : run.status === 'RUNNING'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        }`}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(run.started_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {run.completed_at ? new Date(run.completed_at).toLocaleTimeString() : 'In Progress'}
                    </TableCell>
                    <TableCell className="text-right font-mono">{run.jobs_fetched || 0}</TableCell>
                    <TableCell className="text-right font-mono">{run.jobs_normalized || 0}</TableCell>
                    <TableCell className="text-right font-mono font-semibold text-emerald-600">
                      {run.jobs_matched || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono">{run.telegram_sent || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link href="/jobs">
                          View Jobs
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
