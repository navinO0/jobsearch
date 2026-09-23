'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, Upload, Plus, CheckCircle2, Copy } from 'lucide-react';

export default function ResumesPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateName, setCandidateName] = useState('Naveen');
  const [candidateEmail, setCandidateEmail] = useState('naveen@example.com');
  const [candidatePhone, setCandidatePhone] = useState('+91 9876543210');
  const [skills, setSkills] = useState('Node.js, TypeScript, PostgreSQL, React, Next.js, Docker, Redis');
  const [msg, setMsg] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const res = await fetch('/api/resumes');
      const data = await res.json();
      setResumes(data.resumes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: candidateName,
          email: candidateEmail,
          phone: candidatePhone,
          skills: skills.split(',').map((s) => s.trim()),
          experience: [
            {
              company: 'Tech Scaleup',
              title: 'Senior Full Stack Engineer',
              startDate: '2022',
              endDate: 'Present',
              highlights: [
                'Engineered distributed workflow automation and API integrations handling high throughput.',
                'Designed responsive frontend interfaces using Next.js 16 and modern component libraries.',
              ],
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Master Resume Profile updated and cached in PostgreSQL!');
        fetchResumes();
        setTimeout(() => setMsg(null), 4000);
      }
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Resume Management & Versioning
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Maintain your factual Master Resume as the single source of truth and inspect job-tailored ATS variants.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Master Profile Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Candidate Master Resume Profile (Source of Truth)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Full Name</label>
                  <Input
                    className="mt-1 bg-slate-950 border-slate-800 text-white"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Email Address</label>
                  <Input
                    className="mt-1 bg-slate-950 border-slate-800 text-white"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Phone & Contact Details</label>
                <Input
                  className="mt-1 bg-slate-950 border-slate-800 text-white"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Core Technical Skills (Verified)</label>
                <Input
                  className="mt-1 bg-slate-950 border-slate-800 text-white"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  * ATS Generation Rule: The AI will NEVER fabricate skills or experience outside this factual record.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs">
                  Save Master Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Master Resumes & Versions List */}
        <div className="space-y-6">
          <Card className="bg-slate-900/60 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Stored Resumes</span>
                <Badge variant="outline" className="text-xs border-slate-700">
                  {resumes.length} records
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-xs text-slate-500">Loading stored resumes...</div>
              ) : resumes.length === 0 ? (
                <div className="text-xs text-slate-500">No resumes registered yet. Save the master profile to create one.</div>
              ) : (
                resumes.map((r) => (
                  <div key={r.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{r.file_name}</span>
                      {r.is_master && (
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          MASTER
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ID: {r.id} • Versions generated: {r.version_count || 0}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
