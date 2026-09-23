'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Building2,
  MapPin,
  ExternalLink,
  Briefcase,
  Layers,
  RotateCcw,
} from 'lucide-react';
import JobModal from '@/components/JobModal';
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

export default function JobFeedPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    highMatches: 0,
    appliedCount: 0,
    activeSources: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [remoteFilter, setRemoteFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchJobs = async (targetPage = 1, append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: targetPage.toString(),
        limit: '24',
      });
      if (searchQuery) params.append('q', searchQuery);
      if (minScore > 0) params.append('minScore', minScore.toString());
      if (sourceFilter !== 'ALL') params.append('source', sourceFilter);
      if (remoteFilter !== 'ALL') params.append('remoteType', remoteFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();

      if (data.jobs) {
        setJobs((prev) => (append ? [...prev, ...data.jobs] : data.jobs));
        setHasMore(data.pagination?.hasMore || false);
        setPage(targetPage);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load jobs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1, false);
  }, [minScore, sourceFilter, remoteFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1, false);
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
      }
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aggregated openings and ATS match alignment across connected sources.
          </p>
        </div>

        {/* Minimal Stats Row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="border rounded-md px-3 py-1.5 bg-card">
            <span className="text-muted-foreground mr-1.5">Indexed:</span>
            <span className="font-semibold text-foreground">{stats.totalJobs}</span>
          </div>
          <div className="border rounded-md px-3 py-1.5 bg-card">
            <span className="text-muted-foreground mr-1.5">Match &ge; 70%:</span>
            <span className="font-semibold text-emerald-500">{stats.highMatches}</span>
          </div>
          <div className="border rounded-md px-3 py-1.5 bg-card">
            <span className="text-muted-foreground mr-1.5">Applied:</span>
            <span className="font-semibold text-foreground">{stats.appliedCount}</span>
          </div>
          <div className="border rounded-md px-3 py-1.5 bg-card">
            <span className="text-muted-foreground mr-1.5">Sources:</span>
            <span className="font-semibold text-foreground">{stats.activeSources}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[220px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Search role, skills, company..."
            className="pl-8 h-8 text-xs bg-card"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <Select value={remoteFilter} onValueChange={setRemoteFilter}>
          <SelectTrigger className="w-32 h-8 text-xs bg-card">
            <SelectValue placeholder="Work Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Modes</SelectItem>
            <SelectItem value="REMOTE">Remote</SelectItem>
            <SelectItem value="HYBRID">Hybrid</SelectItem>
            <SelectItem value="ONSITE">Onsite</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 h-8 text-xs bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="MATCHED">Matched</SelectItem>
            <SelectItem value="APPLIED">Applied</SelectItem>
            <SelectItem value="INTERVIEW">Interview</SelectItem>
          </SelectContent>
        </Select>

        <Select value={minScore.toString()} onValueChange={(val) => setMinScore(parseInt(val, 10))}>
          <SelectTrigger className="w-32 h-8 text-xs bg-card">
            <SelectValue placeholder="Score" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Score</SelectItem>
            <SelectItem value="60">&ge; 60% Match</SelectItem>
            <SelectItem value="75">&ge; 75% Match</SelectItem>
            <SelectItem value="90">&ge; 90% Match</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSearchQuery('');
            setMinScore(0);
            setSourceFilter('ALL');
            setRemoteFilter('ALL');
            setStatusFilter('ALL');
          }}
          className="h-8 px-2 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Reset
        </Button>
      </div>

      {/* Jobs Grid */}
      {loading && jobs.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground">Loading job openings...</div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center text-xs text-muted-foreground border rounded-lg">
          No jobs found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {jobs.map((job) => {
            const score = job.profile_match_score ?? 0;
            return (
              <Card
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className="cursor-pointer hover:border-foreground/30 transition-colors flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-medium text-xs text-foreground truncate">{job.job_title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span>{job.company_name}</span>
                      </div>
                    </div>
                    {score > 0 && (
                      <Badge
                        variant={score >= 75 ? 'success' : 'secondary'}
                        className="text-[11px] font-mono shrink-0"
                      >
                        {score}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {job.location || 'Remote'}
                    </span>
                    <span>•</span>
                    <span className="border rounded px-1.5 py-0.2 bg-muted/40 text-[10px]">
                      {job.source}
                    </span>
                    {job.remote_type && (
                      <span className="border rounded px-1.5 py-0.2 bg-muted/40 text-[10px]">
                        {job.remote_type}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {job.description ? job.description.replace(/<[^>]*>?/gm, '') : 'No description provided'}
                  </p>
                </CardContent>

                <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Recent'}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {job.application_status || 'NEW'}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => fetchJobs(page + 1, true)}
            className="text-xs"
          >
            {loading ? 'Loading...' : 'Load More Openings'}
          </Button>
        </div>
      )}

      {/* Job Details Modal */}
      <JobModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
