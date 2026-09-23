'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2 } from 'lucide-react';

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
                'Engineered distributed workflow automation and API integrations.',
                'Designed responsive frontend interfaces with Next.js and Tailwind CSS.',
              ],
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg('Master Resume Profile updated');
        fetchResumes();
        setTimeout(() => setMsg(null), 3000);
      }
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Resume Profiles & Versions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Factual candidate master resume used as the single source of truth for all ATS tailoring.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-md bg-muted border border-border text-foreground text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Master Profile Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2 border-b">
              <CardTitle className="text-sm font-medium">Master Candidate Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">Full Name</label>
                  <Input
                    className="h-8 text-xs bg-background"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">Email Address</label>
                  <Input
                    className="h-8 text-xs bg-background"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Phone Number</label>
                <Input
                  className="h-8 text-xs bg-background"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Verified Core Skills</label>
                <Input
                  className="h-8 text-xs bg-background"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground pt-0.5">
                  The AI generator will never invent skills or employers outside this factual record.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={handleSaveProfile} size="sm" className="h-8 text-xs">
                  Save Master Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Resumes List */}
        <div>
          <Card>
            <CardHeader className="p-4 pb-2 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Stored Resumes</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {resumes.length}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              {loading ? (
                <div className="text-muted-foreground">Loading...</div>
              ) : resumes.length === 0 ? (
                <div className="text-muted-foreground">No stored master resumes yet.</div>
              ) : (
                resumes.map((r) => (
                  <div key={r.id} className="border rounded-md p-2.5 bg-muted/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{r.file_name}</span>
                      {r.is_master && (
                        <Badge variant="secondary" className="text-[10px]">
                          MASTER
                        </Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      ID: {r.id} • Versions: {r.version_count || 0}
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
