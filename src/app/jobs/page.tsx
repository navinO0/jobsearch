'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Building2,
  MapPin,
  ExternalLink,
  Briefcase,
  Layers,
  RotateCcw,
  Mail,
  FileText,
  ChevronRight,
  Sparkles,
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
  last_seen_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<string>('0');
  const [remoteType, setRemoteType] = useState<string>('ALL');
  const [source, setSource] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (minScore !== '0') params.set('min_score', minScore);
      if (remoteType !== 'ALL') params.set('remote_type', remoteType);
      if (source !== 'ALL') params.set('source', source);
      if (status !== 'ALL') params.set('status', status);
      params.set('page', page.toString());
      params.set('limit', limit.toString());

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, minScore, remoteType, source, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleReset = () => {
    setSearch('');
    setMinScore('0');
    setRemoteType('ALL');
    setSource('ALL');
    setStatus('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Job Openings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aggregated openings deduplicated across ATS boards and verified sources.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            {total} Openings Available
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
            <RotateCcw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="shadow-none border-border/80 bg-card/60 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search job title, company, skills, or location..."
                className="pl-9 bg-background/80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" className="px-4">
              Search
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
          </form>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border/40">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Work Mode
              </label>
              <Select value={remoteType} onValueChange={(val) => { setRemoteType(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background/80">
                  <SelectValue placeholder="Work Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Modes</SelectItem>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                ATS Match Threshold
              </label>
              <Select value={minScore} onValueChange={(val) => { setMinScore(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background/80">
                  <SelectValue placeholder="Min Score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">All Scores (0%+)</SelectItem>
                  <SelectItem value="50">50%+ Alignment</SelectItem>
                  <SelectItem value="70">70%+ Strong Match</SelectItem>
                  <SelectItem value="85">85%+ Elite Match</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Source
              </label>
              <Select value={source} onValueChange={(val) => { setSource(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background/80">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Sources</SelectItem>
                  <SelectItem value="greenhouse">Greenhouse</SelectItem>
                  <SelectItem value="lever">Lever</SelectItem>
                  <SelectItem value="ashby">Ashby</SelectItem>
                  <SelectItem value="smartrecruiters">SmartRecruiters</SelectItem>
                  <SelectItem value="jobicy">Jobicy</SelectItem>
                  <SelectItem value="arbeitnow">Arbeitnow</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Application Status
              </label>
              <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                <SelectTrigger className="h-8 text-xs bg-background/80">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DISCOVERED">Discovered</SelectItem>
                  <SelectItem value="MATCHED">Matched</SelectItem>
                  <SelectItem value="SAVED">Saved</SelectItem>
                  <SelectItem value="DOCUMENTS_READY">Documents Ready</SelectItem>
                  <SelectItem value="EMAIL_DRAFT">Email Draft</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">
            <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
            <p className="text-sm">Loading job openings...</p>
          </div>
        ) : jobs.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
            <h3 className="font-semibold text-base">No matching openings found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Try adjusting your search criteria or trigger a new search run to discover recent postings.
            </p>
          </Card>
        ) : (
          jobs.map((job) => {
            const score = job.profile_match_score || 0;
            const hasEmail = Boolean(job.recruiter_email);

            return (
              <Card
                key={job.id}
                className="hover:border-primary/50 transition-colors shadow-none border-border/80"
              >
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-semibold text-base hover:text-primary transition-colors truncate"
                      >
                        {job.job_title}
                      </Link>
                      <Badge
                        variant="secondary"
                        className={`text-xs px-2 py-0.5 ${
                          score >= 80
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : score >= 60
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        {score}% Match
                      </Badge>
                      <Badge variant="outline" className="text-[11px] uppercase tracking-wider font-mono">
                        {job.source}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {job.remote_type || 'REMOTE'}
                      </Badge>
                      {hasEmail ? (
                        <Badge variant="secondary" className="text-[11px] bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <Mail className="h-3 w-3 mr-1" />
                          HR Email Found
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          No public HR email
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center font-medium text-foreground/90">
                        <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {job.company_name}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                        {job.location || 'Remote'}
                      </span>
                      {job.salary_min ? (
                        <span>
                          ${(job.salary_min / 1000).toFixed(0)}k
                          {job.salary_max ? ` - $${(job.salary_max / 1000).toFixed(0)}k` : '+'}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm" className="h-8">
                      <Link href={`/jobs/${job.id}`}>
                        View Details
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                    {job.application_url && (
                      <Button asChild size="sm" className="h-8">
                        <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                          Apply
                          <ExternalLink className="h-3.5 w-3.5 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} openings
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-xs font-mono px-2">Page {page}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
