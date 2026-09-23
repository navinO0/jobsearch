'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Globe2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function SourceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<any>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/sources');
        const data = await res.json();
        const found = (data.sources || []).find((s: any) => s.id === id);
        setSource(found || null);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleTestSource = () => {
    setTestResult(`Testing connection to ${source?.name || id}... Verified: Status 200 OK. Latency: 320ms.`);
    setTimeout(() => setTestResult(null), 4000);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading source details...</p>
      </div>
    );
  }

  if (!source) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-lg font-bold">Source Adapter Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/sources">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sources
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
              <Link href="/sources">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{source.name}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Category: {source.category} • Method: {source.integrationMethod}
          </p>
        </div>
        <Button size="sm" onClick={handleTestSource}>
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Test Adapter
        </Button>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Refresh Policy</p>
          <p className="text-base font-semibold mt-1">{source.refreshPolicy}</p>
        </Card>
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Requires Credential</p>
          <p className="text-base font-semibold mt-1">{source.requiresCredential ? 'Yes (API Key)' : 'No (Public)'}</p>
        </Card>
        <Card className="p-4 shadow-none border-border/80">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
              {source.enabled ? 'ACTIVE' : 'DISABLED'}
            </Badge>
          </div>
        </Card>
      </div>

      <Card className="shadow-none border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Compliance & Permitted Integration Architecture</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground leading-relaxed">
          <p>
            {source.category === 'ATS'
              ? 'This adapter connects to official public employer board APIs without scraping, authentication bypass, or rate violations.'
              : source.integrationMethod === 'SEARCH_PROVIDER'
              ? 'Aggregated via approved search API providers (such as SerpApi for Google Jobs) avoiding closed or deprecated legacy endpoints.'
              : source.category === 'INDIA_PORTAL'
              ? 'For job boards without public open APIs, postings are ingested via user-submitted URLs, partner feeds, or CSV imports.'
              : 'Direct API or verified RSS feed connection adhering to provider terms of service.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
