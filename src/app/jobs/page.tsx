'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Building2,
  MapPin,
  ExternalLink,
  Briefcase,
  Star,
  Bookmark,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Calendar,
  XCircle,
  Filter,
  RefreshCw,
  Trophy,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Job {
  id: number;
  fingerprint: string;
  source: string;
  company_name: string;
  company_domain: string | null;
  job_title: string;
  description: string;
  location: string;
  remote_type: string;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  posted_at: string;
  application_url: string;
  profile_match_score: number | null;
  match_reason: string | null;
  match_details: any;
  recruiter_email: string | null;
  telegram_sent: boolean;
  application_status: string;
  remarks: string | null;
  applied_at: string | null;
  interview_date: string | null;
  last_seen_at: string;
}

interface Stats {
  totalJobs: number;
  highMatches: number;
  wishlistCount: number;
  savedCount: number;
  appliedCount: number;
  interviewCount: number;
  activeSources: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    highMatches: 0,
    wishlistCount: 0,
    savedCount: 0,
    appliedCount: 0,
    interviewCount: 0,
    activeSources: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [remoteType, setRemoteType] = useState('ALL');
  const [minScore, setMinScore] = useState(0);
  const [hideDuplicates, setHideDuplicates] = useState(true);

  // Remarks modal state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);

  // Quick updating tracking
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTab !== 'ALL') params.set('status', activeTab);
      if (remoteType !== 'ALL') params.set('remote_type', remoteType);
      if (minScore > 0) params.set('min_score', minScore.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [activeTab, remoteType, minScore]);

  // Handle immediate status update
  const handleUpdateStatus = async (jobId: number, newStatus: string) => {
    setUpdatingId(jobId);
    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, application_status: newStatus } : j))
    );

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh stats
        fetchJobs();
      }
    } catch (e) {
      console.error('Failed to update status:', e);
    } finally {
      setUpdatingId(null);
    }
  };

  // Open remarks modal
  const openRemarksModal = (job: Job) => {
    setEditingJob(job);
    setRemarkText(job.remarks || '');
    setInterviewDate(job.interview_date ? job.interview_date.substring(0, 10) : '');
  };

  // Save remarks
  const handleSaveRemarks = async () => {
    if (!editingJob) return;
    setSavingRemarks(true);
    try {
      const res = await fetch(`/api/jobs/${editingJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remarks: remarkText,
          interview_date: interviewDate ? new Date(interviewDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === editingJob.id
              ? { ...j, remarks: remarkText, interview_date: interviewDate || null }
              : j
          )
        );
        setEditingJob(null);
      }
    } catch (e) {
      console.error('Failed to save remarks:', e);
    } finally {
      setSavingRemarks(false);
    }
  };

  // Client-side strict deduplication
  const displayJobs = useMemo(() => {
    if (!hideDuplicates) return jobs;

    const seen = new Set<string>();
    const deduplicated: Job[] = [];

    for (const job of jobs) {
      const key = `${job.company_name.toLowerCase().trim()}:${job.job_title.toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(job);
      }
    }
    return deduplicated;
  }, [jobs, hideDuplicates]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 sm:pb-12">
      {/* Top Mobile Header & Metric Summary */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-indigo-400" />
              Personal Job Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Matched for Node.js Developer • 2 Yrs Exp
            </p>
          </div>

          {/* Quick Metrics Bar (Scrollable on small phones) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <div className="bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 shrink-0">
              <span className="text-slate-400">Total:</span>{' '}
              <strong className="text-white">{stats.totalJobs}</strong>
            </div>
            <div className="bg-amber-950/40 border border-amber-800/50 px-2.5 py-1.5 rounded-lg shrink-0 text-amber-300">
              <span>⭐ Wishlist:</span> <strong>{stats.wishlistCount}</strong>
            </div>
            <div className="bg-blue-950/40 border border-blue-800/50 px-2.5 py-1.5 rounded-lg shrink-0 text-blue-300">
              <span>📌 Saved:</span> <strong>{stats.savedCount}</strong>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1.5 rounded-lg shrink-0 text-emerald-300">
              <span>🚀 Applied:</span> <strong>{stats.appliedCount}</strong>
            </div>
            <div className="bg-purple-950/40 border border-purple-800/50 px-2.5 py-1.5 rounded-lg shrink-0 text-purple-300">
              <span>🎙️ Interview:</span> <strong>{stats.interviewCount}</strong>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        {/* Responsive Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
          {[
            { id: 'ALL', label: 'All Openings', icon: Briefcase },
            { id: 'WISHLIST', label: 'Wishlist', icon: Star, color: 'text-amber-400' },
            { id: 'SAVED', label: 'Mark for Later', icon: Bookmark, color: 'text-blue-400' },
            { id: 'APPLIED', label: 'Applied', icon: CheckCircle2, color: 'text-emerald-400' },
            { id: 'INTERVIEW_ATTENDED', label: 'Interviewed', icon: Clock, color: 'text-purple-400' },
            { id: 'OFFERED', label: 'Offered', icon: Trophy, color: 'text-yellow-400' },
            { id: 'REJECTED', label: 'Not Interested', icon: XCircle, color: 'text-slate-400' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${tab.color || ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter & Search Bar (Mobile-friendly vertical stack) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="sm:col-span-5 relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search title, company, skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
              className="pl-9 bg-slate-950 border-slate-800 text-sm h-9"
            />
          </div>

          <div className="grid grid-cols-2 sm:col-span-5 gap-2">
            <Select value={remoteType} onValueChange={setRemoteType}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs sm:text-sm h-9">
                <SelectValue placeholder="Work Mode" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="ALL">All Modes</SelectItem>
                <SelectItem value="REMOTE">Remote Only</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="ONSITE">Onsite</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={minScore.toString()}
              onValueChange={(val) => setMinScore(parseInt(val, 10))}
            >
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs sm:text-sm h-9">
                <SelectValue placeholder="Match Score" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="0">Any Match %</SelectItem>
                <SelectItem value="60">60%+ Match</SelectItem>
                <SelectItem value="75">75%+ High Match</SelectItem>
                <SelectItem value="85">85%+ Top Match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideDuplicates}
                onChange={(e) => setHideDuplicates(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              No Duplicates
            </label>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchJobs}
              className="h-9 border-slate-800 hover:bg-slate-800 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Showing <strong className="text-slate-200">{displayJobs.length}</strong> postings
            {hideDuplicates && jobs.length > displayJobs.length && (
              <span className="text-slate-500">
                {' '}
                ({jobs.length - displayJobs.length} duplicate cross-posts hidden)
              </span>
            )}
          </span>
          <span className="text-indigo-400">Target: Node.js / Backend (2y exp)</span>
        </div>

        {/* Job Cards Feed (Mobile Responsive) */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400">Loading your matched jobs...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-xl p-6">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No jobs found in this tab</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your filter, or switch to the &quot;All Openings&quot; tab to review newly discovered roles.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayJobs.map((job) => {
              const score = job.profile_match_score || 0;
              const isHigh = score >= 75;
              const isUpdating = updatingId === job.id;

              return (
                <Card
                  key={job.id}
                  className="bg-slate-900 border-slate-800/80 hover:border-slate-700 transition-all rounded-xl overflow-hidden shadow-sm"
                >
                  <CardContent className="p-4 sm:p-5 space-y-3">
                    {/* Header: Title + Company + Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <h2 className="text-base sm:text-lg font-semibold text-white leading-tight truncate">
                          {job.job_title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1 font-medium text-slate-300">
                            <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            {job.company_name}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                            {job.location || 'Remote'}
                          </span>
                          <span>•</span>
                          <Badge
                            variant="secondary"
                            className="bg-slate-800 text-slate-300 text-[10px] py-0 px-1.5"
                          >
                            {job.remote_type || 'REMOTE'}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-slate-700 text-slate-400 text-[10px] py-0 px-1.5"
                          >
                            {job.source}
                          </Badge>
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div
                        className={`shrink-0 flex flex-col items-center justify-center rounded-lg px-2.5 py-1 text-center font-bold border ${
                          isHigh
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                            : score >= 55
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span className="text-base sm:text-lg leading-none">{score}%</span>
                        <span className="text-[9px] uppercase tracking-wider font-medium opacity-80">
                          Match
                        </span>
                      </div>
                    </div>

                    {/* Matched Highlights / Reasons */}
                    {job.match_reason && (
                      <div className="text-xs bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 text-slate-300 leading-relaxed flex items-start gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{job.match_reason}</span>
                      </div>
                    )}

                    {/* User Remarks Callout if present */}
                    {job.remarks && (
                      <div className="text-xs bg-amber-950/20 border border-amber-800/40 rounded-lg p-2.5 text-amber-200/90 flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-300">My Remarks: </strong>
                            {job.remarks}
                          </div>
                        </div>
                        {job.interview_date && (
                          <span className="text-[10px] bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/50 shrink-0 text-amber-300">
                            Interview: {new Date(job.interview_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Bar (Mobile Responsive Stack/Grid) */}
                    <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      {/* Status Selector Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 shrink-0">Status:</span>
                        <Select
                          value={job.application_status || 'NEW'}
                          onValueChange={(val) => handleUpdateStatus(job.id, val)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-700/80 min-w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                            <SelectItem value="NEW">Unviewed / New</SelectItem>
                            <SelectItem value="WISHLIST">⭐ Wishlist</SelectItem>
                            <SelectItem value="SAVED">📌 Mark for Later</SelectItem>
                            <SelectItem value="APPLIED">🚀 Applied</SelectItem>
                            <SelectItem value="INTERVIEW_ATTENDED">🎙️ Attended Interview</SelectItem>
                            <SelectItem value="OFFERED">🏆 Received Offer</SelectItem>
                            <SelectItem value="REJECTED">❌ Not Interested</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Edit Remarks Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openRemarksModal(job)}
                          className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                          <span>{job.remarks ? 'Edit Remarks' : 'Add Remarks'}</span>
                        </Button>
                      </div>

                      {/* External Apply Button */}
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow"
                      >
                        <span>Apply on {job.source || 'Portal'}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal: Add / Review Remarks and Interview Date */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4 shadow-xl text-slate-100">
            <div>
              <h3 className="text-base font-semibold text-white">
                Remarks for {editingJob.job_title}
              </h3>
              <p className="text-xs text-slate-400">{editingJob.company_name}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  My Remarks / Interview Notes
                </label>
                <textarea
                  rows={4}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Spoke to recruiter on LinkedIn; Round 1 DSA cleared; Waiting on system design feedback..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Interview Date (Optional)
                </label>
                <Input
                  type="date"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs sm:text-sm h-9 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingJob(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRemarks}
                disabled={savingRemarks}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-4"
              >
                {savingRemarks ? 'Saving...' : 'Save Remarks'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
