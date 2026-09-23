'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Building2,
  MapPin,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Check,
  Eye,
  RotateCcw,
} from 'lucide-react';
import JobModal from '@/components/JobModal';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  telegram_sent: boolean;
  application_status: string;
  last_seen_at: string;
}

interface Stats {
  totalJobs: number;
  highMatches: number;
  appliedCount: number;
  activeSources: number;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    highMatches: 0,
    appliedCount: 0,
    activeSources: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState('0');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [remoteFilter, setRemoteFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (parseInt(minScore, 10) > 0) params.set('min_score', minScore);
      if (sourceFilter && sourceFilter !== 'ALL') params.set('source', sourceFilter);
      if (remoteFilter && remoteFilter !== 'ALL') params.set('remote_type', remoteFilter);
      if (statusFilter && statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.data);
        if (data.stats) setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to load jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [minScore, sourceFilter, remoteFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, application_status: newStatus } : j))
        );
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob((prev) => (prev ? { ...prev, application_status: newStatus } : null));
        }
        // Refresh stats
        const statsRes = await fetch('/api/jobs?limit=1');
        const statsData = await statsRes.json();
        if (statsData.stats) setStats(statsData.stats);
      }
    } catch (e) {
      console.error('Failed to update application status', e);
    }
  };

  const sourcesList = [
    { label: 'All Sources', value: 'ALL' },
    { label: 'Workable (India)', value: 'workable' },
    { label: 'LinkedIn India', value: 'linkedin_india' },
    { label: 'Instahyre', value: 'instahyre' },
    { label: 'Greenhouse (GitLab)', value: 'greenhouse_gitlab' },
    { label: 'Ashby (Ramp)', value: 'ashby_ramp' },
    { label: 'Lever (Palantir)', value: 'lever_palantir' },
    { label: 'SmartRecruiters', value: 'smartrecruiters' },
    { label: 'RemoteOK', value: 'remoteok' },
    { label: 'Jobicy', value: 'jobicy' },
    { label: 'Arbeitnow', value: 'arbeitnow' },
  ];

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0f172a] border-slate-800">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalJobs}</div>
              <div className="text-xs text-slate-400 font-medium">Total Jobs Indexed</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">{stats.highMatches}</div>
              <div className="text-xs text-slate-400 font-medium">High AI Matches (≥75%)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-indigo-300">{stats.appliedCount}</div>
              <div className="text-xs text-slate-400 font-medium">Applications Submitted</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0f172a] border-slate-800">
          <CardContent className="p-4 flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-300">10 Sources</div>
              <div className="text-xs text-slate-400 font-medium">Class 1, 2, 3 Active</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-5 bg-[#0f172a] border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by role, company name, skills, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700/80 focus-visible:ring-cyan-500"
            />
          </div>
          <Button
            type="submit"
            variant="secondary"
            className="border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white flex items-center space-x-2 font-semibold"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Score Threshold */}
          <div className="w-44">
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-xs">
                <SelectValue placeholder="Match Score" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="0">All Match Scores</SelectItem>
                <SelectItem value="55">≥ 55% Minimum Match</SelectItem>
                <SelectItem value="75">≥ 75% High Match</SelectItem>
                <SelectItem value="85">≥ 85% Top Fit Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Platform Source */}
          <div className="w-48">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {sourcesList.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Remote vs On-site */}
          <div className="w-40">
            <Select value={remoteFilter} onValueChange={setRemoteFilter}>
              <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-xs">
                <SelectValue placeholder="Work Style" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="ALL">All Work Styles</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="on-site">On-site</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Application Status */}
          <div className="w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 bg-slate-900 border-slate-700 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="ALL">All Application States</SelectItem>
                <SelectItem value="NEW">Unapplied / New</SelectItem>
                <SelectItem value="APPLIED">Applied</SelectItem>
                <SelectItem value="INTERVIEW">Interviewing</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setMinScore('0');
              setSourceFilter('ALL');
              setRemoteFilter('ALL');
              setStatusFilter('ALL');
            }}
            className="ml-auto text-slate-400 hover:text-slate-200 text-xs flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </Button>
        </div>
      </Card>

      {/* Jobs Feed */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-medium">Querying PostgreSQL database...</span>
        </div>
      ) : jobs.length === 0 ? (
        <Card className="p-12 text-center bg-[#0f172a] border-slate-800 space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No job listings found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try lowering your match score filter or clicking &apos;Run Pipeline&apos; to trigger a live ingestion run across all 10 sources.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const score = job.profile_match_score ?? 0;
            const reasons: string[] = Array.isArray(job.match_details?.reasons)
              ? job.match_details.reasons
              : job.match_reason
              ? [job.match_reason]
              : [];
            const matchedSkills: string[] = Array.isArray(job.match_details?.matched_skills)
              ? job.match_details.matched_skills
              : [];

            return (
              <Card
                key={job.id}
                className="bg-[#0f172a] border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <Badge variant="subtle" className="uppercase text-[10px] tracking-wider font-bold">
                        {job.source}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-800 bg-slate-800/60 font-medium">
                        {job.remote_type || 'Remote'}
                      </Badge>
                      {job.application_status === 'APPLIED' && (
                        <Badge variant="indigo" className="text-[10px] font-bold">
                          Applied
                        </Badge>
                      )}
                    </div>

                    {score > 0 && (
                      <Badge
                        variant={score >= 80 ? 'success' : score >= 60 ? 'cyan' : 'subtle'}
                        className="text-xs font-bold shrink-0"
                      >
                        ⚡ {score}% Match
                      </Badge>
                    )}
                  </div>

                  {/* Title & Company */}
                  <div>
                    <h3
                      onClick={() => setSelectedJob(job)}
                      className="text-base font-bold text-white hover:text-cyan-400 cursor-pointer transition-colors"
                    >
                      {job.job_title}
                    </h3>

                    <div className="flex items-center space-x-3 mt-1.5 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-200 font-semibold">{job.company_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>{job.location || 'Remote'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Evaluation Snippet */}
                  {reasons.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                      <div className="flex items-center space-x-1 text-emerald-400 font-medium text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        <span>AI Match Analysis</span>
                      </div>
                      <p className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed">
                        {reasons[0]}
                      </p>
                    </div>
                  )}

                  {/* Matched Skills Chips */}
                  {matchedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {matchedSkills.slice(0, 4).map((skill, idx) => (
                        <Badge
                          key={idx}
                          variant="success"
                          className="text-[10px] py-0 px-2 font-medium"
                        >
                          ✓ {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>

                {/* Card Actions */}
                <CardFooter className="p-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedJob(job)}
                    className="flex items-center space-x-1 text-slate-400 hover:text-white text-xs px-2 h-8"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Description</span>
                  </Button>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        handleStatusChange(
                          job.id,
                          job.application_status === 'APPLIED' ? 'NEW' : 'APPLIED'
                        )
                      }
                      className={`h-8 w-8 border ${
                        job.application_status === 'APPLIED'
                          ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title={
                        job.application_status === 'APPLIED'
                          ? 'Marked as Applied'
                          : 'Mark as Applied'
                      }
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      asChild
                      variant="gradient"
                      size="sm"
                      className="font-bold h-8 text-xs px-3"
                    >
                      <a
                        href={job.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1"
                      >
                        <span>Apply Now</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full Detail Modal */}
      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
