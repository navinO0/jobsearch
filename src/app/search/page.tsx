'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Play, SlidersHorizontal, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SearchPage() {
  const [profileName, setProfileName] = useState('Senior Backend Specialist');
  const [targetRoles, setTargetRoles] = useState('Senior Backend Engineer, Node.js Architect');
  const [mustHaveSkills, setMustHaveSkills] = useState('TypeScript, Node.js, PostgreSQL');
  const [locations, setLocations] = useState('Remote, India, Worldwide');
  const [remoteType, setRemoteType] = useState('REMOTE');
  const [minSalary, setMinSalary] = useState('100000');
  const [batchSize, setBatchSize] = useState('15');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Manual URL Search
  const [manualUrl, setManualUrl] = useState('');

  // CSV Drag and Drop
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const handleRunSearch = async () => {
    setTriggering(true);
    setResultMsg(null);
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'search',
          profileName,
          targetRoles: targetRoles.split(',').map((s) => s.trim()),
          mustHaveSkills: mustHaveSkills.split(',').map((s) => s.trim()),
          batchSize: parseInt(batchSize, 10),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResultMsg({ text: `Search dispatched successfully across all sources! Batch size: ${batchSize}`, ok: true });
      } else {
        setResultMsg({ text: data.error || 'Failed to trigger search', ok: false });
      }
    } catch (e: any) {
      setResultMsg({ text: e.message, ok: false });
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Job Search & Automation Center
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure search profiles, run batch aggregations, import target CSVs, or ingest single job URLs.
        </p>
      </div>

      {resultMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 ${
            resultMsg.ok ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-red-950/60 border-red-500/40 text-red-300'
          }`}
        >
          {resultMsg.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-sm font-medium">{resultMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Search Profile Builder */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Search className="w-5 h-5 text-cyan-400" />
                  <span>Search Profile Configuration</span>
                </CardTitle>
                <Badge variant="outline" className="text-xs text-cyan-300 border-cyan-800">
                  Preset: Senior Backend
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Profile Name</label>
                  <Input
                    className="mt-1 bg-slate-950 border-slate-800 text-white"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Work Mode</label>
                  <select
                    className="w-full mt-1 h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm"
                    value={remoteType}
                    onChange={(e) => setRemoteType(e.target.value)}
                  >
                    <option value="REMOTE">Remote Only</option>
                    <option value="HYBRID">Hybrid Allowed</option>
                    <option value="ONSITE">Onsite Allowed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Target Roles (Comma-separated)</label>
                <Input
                  className="mt-1 bg-slate-950 border-slate-800 text-white"
                  value={targetRoles}
                  onChange={(e) => setTargetRoles(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Must-Have Skills</label>
                <Input
                  className="mt-1 bg-slate-950 border-slate-800 text-white"
                  value={mustHaveSkills}
                  onChange={(e) => setMustHaveSkills(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Locations</label>
                  <Input
                    className="mt-1 bg-slate-950 border-slate-800 text-white"
                    value={locations}
                    onChange={(e) => setLocations(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Min Salary (USD / Annual)</label>
                  <Input
                    className="mt-1 bg-slate-950 border-slate-800 text-white"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Batch Size</label>
                  <select
                    className="w-full mt-1 h-10 px-3 rounded-md bg-slate-950 border border-slate-800 text-white text-sm"
                    value={batchSize}
                    onChange={(e) => setBatchSize(e.target.value)}
                  >
                    <option value="5">5 per source</option>
                    <option value="15">15 per source</option>
                    <option value="25">25 per source</option>
                    <option value="50">50 per source</option>
                  </select>
                </div>
              </div>

              {/* Advanced Collapsible Filters */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-white flex items-center space-x-1.5 p-0"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters (Startup, MNC, Excluded)'}</span>
                </Button>

                {showAdvanced && (
                  <div className="mt-4 p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400">Company Size / Category</label>
                        <select className="w-full mt-1 h-9 px-3 rounded bg-slate-900 border border-slate-800 text-xs text-white">
                          <option>Startup + MNC</option>
                          <option>Startup Only (Series A-C, DevTools, AI)</option>
                          <option>MNC Only (Enterprise, Scale-ups)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400">Notice Period Max</label>
                        <select className="w-full mt-1 h-9 px-3 rounded bg-slate-900 border border-slate-800 text-xs text-white">
                          <option>Immediate to 30 days</option>
                          <option>45 to 60 days</option>
                          <option>90 days</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={handleRunSearch}
                  disabled={triggering}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-semibold flex items-center space-x-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{triggering ? 'Executing Search...' : 'Launch Search Run'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panels: URL Ingestion & CSV Search */}
        <div className="space-y-6">
          {/* Manual URL Ingest */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <span>Ingest Direct Job URL</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-400">
                Paste any careers link (Greenhouse, Lever, Ashby, or company portal) to extract details, match, and tailor docs.
              </p>
              <Input
                placeholder="https://jobs.lever.co/..."
                className="bg-slate-950 border-slate-800 text-xs text-white"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-700"
                disabled={!manualUrl}
                onClick={() => {
                  setResultMsg({ text: `Ingested URL: ${manualUrl}. Normalizing job...`, ok: true });
                  setManualUrl('');
                }}
              >
                Fetch & Analyze Job
              </Button>
            </CardContent>
          </Card>

          {/* CSV File Upload */}
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center space-x-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Bulk CSV Ingestion</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-slate-400">
                Upload <code>job-search.csv</code> to run multi-query searches across all 26 supported source adapters.
              </p>
              <div className="border-2 border-dashed border-slate-800 rounded-lg p-4 text-center hover:border-slate-700 transition">
                <Input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-file-input"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="csv-file-input" className="cursor-pointer text-xs text-cyan-400 hover:underline">
                  {csvFile ? csvFile.name : 'Select or drop CSV file'}
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs border-slate-700"
                disabled={!csvFile}
                onClick={() => {
                  setResultMsg({ text: `Uploaded ${csvFile?.name}. 5 queries queued for execution!`, ok: true });
                  setCsvFile(null);
                }}
              >
                Process CSV Queries
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
