'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Trophy,
  Filter,
  Play,
  Menu,
  X,
  Maximize2,
  FileText,
  DollarSign
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Remarks modal state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [remarkText, setRemarkText] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [savingRemarks, setSavingRemarks] = useState(false);

  // Full description expanded modal
  const [fullDescJob, setFullDescJob] = useState<Job | null>(null);

  // Pipeline triggering state
  const [triggering, setTriggering] = useState(false);
  const [triggerFeedback, setTriggerFeedback] = useState<string | null>(null);

  // Optimistic updating ID
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTab !== 'ALL') params.set('status', activeTab);
      if (remoteType !== 'ALL') params.set('remote_type', remoteType);
      if (minScore > 0) params.set('min_score', minScore.toString());
      params.set('limit', '60');

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

  // Handle immediate status update in DB
  const handleUpdateStatus = async (jobId: number, newStatus: string) => {
    setUpdatingId(jobId);
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

  // Save remarks to DB
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

  // Trigger search pipeline with candidate's resume criteria
  const handleRunSearchNow = async () => {
    setTriggering(true);
    setTriggerFeedback(null);
    try {
      const res = await fetch('/api/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'search',
          profileName: 'Node.js Developer (2 Yrs Exp)',
          targetRoles: ['Node.js Developer', 'Backend Developer', 'Backend Engineer'],
          mustHaveSkills: ['Node.js', 'Express', 'PostgreSQL', 'TypeScript'],
          workMode: 'REMOTE',
          minSalary: 600000,
          batchSize: 15,
          aiMatchThreshold: 70,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTriggerFeedback('Pipeline initiated! Polling all job sources in background...');
        setTimeout(() => {
          fetchJobs();
          setTriggerFeedback(null);
        }, 4000);
      } else {
        setTriggerFeedback('Failed to start pipeline: ' + (data.error || 'Network error'));
      }
    } catch (e: any) {
      setTriggerFeedback('Error: ' + e.message);
    } finally {
      setTriggering(false);
    }
  };

  // Strict deduplication
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

  const navItems = [
    { id: 'ALL', label: 'All Jobs', icon: Briefcase, count: stats.totalJobs },
    { id: 'WISHLIST', label: 'Wishlist', icon: Star, count: stats.wishlistCount, color: 'text-amber-400' },
    { id: 'SAVED', label: 'Mark for Later', icon: Bookmark, count: stats.savedCount, color: 'text-blue-400' },
    { id: 'APPLIED', label: 'Applied', icon: CheckCircle2, count: stats.appliedCount, color: 'text-emerald-400' },
    { id: 'INTERVIEW_ATTENDED', label: 'Interviewed', icon: Clock, count: stats.interviewCount, color: 'text-purple-400' },
    { id: 'OFFERED', label: 'Received Offer', icon: Trophy, color: 'text-yellow-400' },
    { id: 'REJECTED', label: 'Not Interested', icon: XCircle, color: 'text-slate-500' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-5rem)]">
      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="border-slate-700 bg-slate-950 text-slate-200"
          >
            {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="ml-1 text-xs">Categories</span>
          </Button>
          <span className="text-xs font-semibold text-slate-200">
            {navItems.find((n) => n.id === activeTab)?.label || 'All Jobs'}
          </span>
        </div>
        <Button
          size="sm"
          onClick={handleRunSearchNow}
          disabled={triggering}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 gap-1"
        >
          <Play className="h-3 w-3" />
          <span>{triggering ? 'Running...' : 'Run Search'}</span>
        </Button>
      </div>

      {/* LEFT NAVBAR (Desktop Sticky Sidebar & Mobile Drawer) */}
      <aside
        className={`${
          mobileNavOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 shrink-0 space-y-4`}
      >
        {/* Candidate Profile Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
              JS
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">My Job Profile</h3>
              <p className="text-[11px] text-slate-400">Node.js Developer (2y Exp)</p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Targeting Backend, REST APIs, TypeScript & PostgreSQL roles.
          </p>

          <Button
            size="sm"
            onClick={handleRunSearchNow}
            disabled={triggering}
            className="w-full mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 gap-1.5 font-medium shadow"
          >
            <Play className={`h-3 w-3 ${triggering ? 'animate-spin' : ''}`} />
            <span>{triggering ? 'Scanning Boards...' : 'Scan Jobs Now'}</span>
          </Button>

          {triggerFeedback && (
            <p className="text-[10px] text-emerald-400 mt-2 text-center animate-fade-in">
              {triggerFeedback}
            </p>
          )}
        </div>

        {/* Categories / Navigation Tabs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2.5 py-1">
            Application Status
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileNavOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${item.color || ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Global Filters in Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-sm text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Feed Settings
          </p>

          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">Work Mode</label>
            <Select value={remoteType} onValueChange={setRemoteType}>
              <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200">
                <SelectValue placeholder="All Modes" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="ALL">All Modes</SelectItem>
                <SelectItem value="REMOTE">Remote Only</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="ONSITE">Onsite</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400 text-[11px]">Minimum Match Score</label>
            <Select
              value={minScore.toString()}
              onValueChange={(val) => setMinScore(parseInt(val, 10))}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-950 border-slate-800 text-slate-200">
                <SelectValue placeholder="Any Match" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                <SelectItem value="0">All Match Scores</SelectItem>
                <SelectItem value="60">60%+ Match</SelectItem>
                <SelectItem value="75">75%+ High Match</SelectItem>
                <SelectItem value="85">85%+ Top Match</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2 text-slate-300 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideDuplicates}
                onChange={(e) => setHideDuplicates(e.target.checked)}
                className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0"
              />
              <span>Hide Duplicate Records</span>
            </label>
            <p className="text-[10px] text-slate-500 mt-1">
              Collapses cross-posted jobs into one.
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA: 3-PER-ROW GRID */}
      <section className="flex-1 space-y-4 min-w-0">
        {/* Search Bar & Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by role, company, or technology..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchJobs()}
              className="pl-9 bg-slate-950 border-slate-800 text-xs sm:text-sm h-9"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-xs text-slate-400">
              <strong className="text-slate-200">{displayJobs.length}</strong> jobs found
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={fetchJobs}
              className="h-9 px-3 border-slate-800 hover:bg-slate-800 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* 3-PER-ROW CARDS GRID */}
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading your matched postings...</p>
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-xl p-8">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-200">No jobs in this category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Select another status from the left navbar or click &quot;Scan Jobs Now&quot; to fetch fresh openings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayJobs.map((job) => {
              const score = job.profile_match_score || 0;
              const isHigh = score >= 75;
              const isUpdating = updatingId === job.id;

              return (
                <Card
                  key={job.id}
                  className="bg-slate-900 border-slate-800/80 hover:border-slate-700 transition-all rounded-xl overflow-hidden flex flex-col justify-between shadow-sm"
                >
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                    {/* Top Row: Company & Match Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {job.company_name}
                        </span>
                        <h2 className="text-sm font-bold text-white leading-tight truncate mt-0.5">
                          {job.job_title}
                        </h2>
                      </div>
                      <div
                        className={`shrink-0 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold border ${
                          isHigh
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                            : score >= 55
                            ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{score}%</span>
                      </div>
                    </div>

                    {/* Metadata Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {job.location || 'Remote'}
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-slate-950 border border-slate-800 text-[10px] py-0 px-1.5 text-slate-300 font-normal"
                      >
                        {job.remote_type || 'REMOTE'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-slate-800 text-[10px] py-0 px-1.5 text-slate-500 font-normal"
                      >
                        {job.source}
                      </Badge>
                    </div>

                    {/* Match Reason Callout */}
                    {job.match_reason && (
                      <div className="text-[11px] bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-slate-300 leading-snug">
                        <strong className="text-indigo-300">Why matched: </strong>
                        {job.match_reason}
                      </div>
                    )}

                    {/* FULL RAW JOB DESCRIPTION (Not truncated, un-modified) */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300 flex items-center gap-1">
                          <FileText className="h-3 w-3 text-slate-500" />
                          Raw Job Description
                        </span>
                        <button
                          onClick={() => setFullDescJob(job)}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 hover:underline"
                        >
                          <Maximize2 className="h-2.5 w-2.5" />
                          Expand
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px] text-slate-300 font-sans bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg leading-relaxed select-text scrollbar-thin">
                        {job.description || 'No raw description text provided by source.'}
                      </div>
                    </div>

                    {/* User Remarks Callout if present */}
                    {job.remarks && (
                      <div className="text-[11px] bg-amber-950/20 border border-amber-800/40 rounded-lg p-2 text-amber-200">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                          <span className="truncate">
                            <strong className="text-amber-300">Notes: </strong>
                            {job.remarks}
                          </span>
                        </div>
                        {job.interview_date && (
                          <p className="text-[10px] text-amber-300 mt-1 pl-4">
                            📅 Interview: {new Date(job.interview_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Bottom Action Controls */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2 mt-auto">
                      <div className="flex items-center gap-2">
                        <Select
                          value={job.application_status || 'NEW'}
                          onValueChange={(val) => handleUpdateStatus(job.id, val)}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-8 text-[11px] bg-slate-950 border-slate-800 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 text-xs">
                            <SelectItem value="NEW">Unviewed / New</SelectItem>
                            <SelectItem value="WISHLIST">⭐ Wishlist</SelectItem>
                            <SelectItem value="SAVED">📌 Mark for Later</SelectItem>
                            <SelectItem value="APPLIED">🚀 Applied</SelectItem>
                            <SelectItem value="INTERVIEW_ATTENDED">🎙️ Attended Interview</SelectItem>
                            <SelectItem value="OFFERED">🏆 Received Offer</SelectItem>
                            <SelectItem value="REJECTED">❌ Not Interested</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openRemarksModal(job)}
                          className="h-8 px-2 text-[11px] text-slate-300 hover:bg-slate-800 shrink-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-slate-400 mr-1" />
                          {job.remarks ? 'Notes' : '+Note'}
                        </Button>
                      </div>

                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors shadow text-center"
                      >
                        <span>Apply on {job.source || 'Portal'}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* FULL DESCRIPTION MODAL */}
      {fullDescJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-2xl max-h-[85vh] flex flex-col space-y-3 shadow-2xl text-slate-100">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{fullDescJob.job_title}</h3>
                <p className="text-xs text-indigo-400 font-medium">
                  {fullDescJob.company_name} • {fullDescJob.location || 'Remote'}
                </p>
              </div>
              <button
                onClick={() => setFullDescJob(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs leading-relaxed whitespace-pre-wrap select-text font-sans text-slate-200">
              {fullDescJob.description}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Source: <strong>{fullDescJob.source}</strong>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFullDescJob(null)}
                  className="text-xs text-slate-400"
                >
                  Close
                </Button>
                <a
                  href={fullDescJob.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                >
                  <span>Apply Now</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REMARKS & INTERVIEW MODAL */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-md space-y-4 shadow-xl text-slate-100">
            <div>
              <h3 className="text-sm font-bold text-white">Remarks & Interview Notes</h3>
              <p className="text-xs text-slate-400">
                {editingJob.job_title} at {editingJob.company_name}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Personal Remarks / Review Notes
                </label>
                <textarea
                  rows={4}
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="e.g. Attended round 1 with hiring manager; DSA question on graphs; waiting for round 2 schedule..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
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
                  className="bg-slate-950 border-slate-800 text-xs h-9 text-slate-100"
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
