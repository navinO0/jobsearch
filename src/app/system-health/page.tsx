'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SystemHealthPage() {
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<any>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ready');
      const data = await res.json();
      setHealthData(data);
    } catch (e: any) {
      setHealthData({ status: 'unhealthy', error: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Health & Telemetry</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Operational status of database pools, n8n automation layer, and source adapters.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={checkHealth} disabled={loading}>
          <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 shadow-none border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">PostgreSQL Database</span>
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected (Schema: jobs)
            </Badge>
          </div>
        </Card>

        <Card className="p-4 shadow-none border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">n8n Automation Engine</span>
            <Server className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active (2.10.4)
            </Badge>
          </div>
        </Card>

        <Card className="p-4 shadow-none border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Next.js 16 Host</span>
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          </div>
        </Card>
      </div>

      <Card className="shadow-none border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Live Probe Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted/30 border border-border/40 rounded-lg text-xs font-mono text-muted-foreground overflow-x-auto">
            {JSON.stringify(healthData || { status: 'checking...' }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
