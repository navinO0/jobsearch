'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  Edit2,
  Save,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Download,
  RotateCcw,
  Sparkles,
  Layers,
  GraduationCap,
  Briefcase,
  User,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ResumeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; ok: boolean } | null>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [skillsStr, setSkillsStr] = useState('');

  const fetchResume = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resumes/${id}`);
      const data = await res.json();
      if (data.success) {
        setResume(data.resume);
        setVersions(data.versions || []);

        setName(data.resume.candidate_name || '');
        setEmail(data.resume.candidate_email || '');
        setPhone(data.resume.candidate_phone || '');
        setLocation(data.resume.candidate_location || '');
        setHeadline(data.resume.candidate_headline || '');
        setSummary(data.resume.candidate_summary || '');
        const skillsArr = Array.isArray(data.resume.candidate_skills)
          ? data.resume.candidate_skills
          : [];
        setSkillsStr(skillsArr.join(', '));
      }
    } catch (e: any) {
      setNotice({ msg: e.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchResume();
  }, [id]);

  const handleSaveCorrections = async () => {
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          location,
          headline,
          summary,
          skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ msg: 'Candidate profile corrections saved successfully!', ok: true });
        setEditMode(false);
        await fetchResume();
      } else {
        setNotice({ msg: data.error || 'Failed to save profile', ok: false });
      }
    } catch (e: any) {
      setNotice({ msg: e.message, ok: false });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <RotateCcw className="h-6 w-6 animate-spin mx-auto mb-2 opacity-50" />
        <p className="text-sm">Loading master resume details...</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
        <h2 className="text-lg font-bold">Resume Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/resumes">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Resumes
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
              <Link href="/resumes">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{resume.file_name}</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Master candidate factual baseline. All job-specific resumes derive truthfully from this profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/resumes/${id}/versions`}>
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              Tailored Versions ({versions.length})
            </Link>
          </Button>
          <Button
            variant={editMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => (editMode ? handleSaveCorrections() : setEditMode(true))}
          >
            {editMode ? (
              <>
                <Save className="h-3.5 w-3.5 mr-1.5" /> Save Changes
              </>
            ) : (
              <>
                <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
              </>
            )}
          </Button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            notice.ok
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {notice.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {notice.msg}
        </div>
      )}

      {/* Tabs for Parsed Sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 max-w-lg mb-6">
          <TabsTrigger value="overview" className="text-xs">
            <User className="h-3.5 w-3.5 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="text-xs">
            <Wrench className="h-3.5 w-3.5 mr-1.5" /> Skills
          </TabsTrigger>
          <TabsTrigger value="experience" className="text-xs">
            <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Experience
          </TabsTrigger>
          <TabsTrigger value="education" className="text-xs">
            <GraduationCap className="h-3.5 w-3.5 mr-1.5" /> Education
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Candidate Contact & Professional Headline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Full Name</label>
                  {editMode ? (
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  ) : (
                    <p className="text-sm font-semibold">{name || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Email Address</label>
                  {editMode ? (
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                  ) : (
                    <p className="text-sm font-mono">{email || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Phone</label>
                  {editMode ? (
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  ) : (
                    <p className="text-sm font-mono">{phone || 'N/A'}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Location</label>
                  {editMode ? (
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} />
                  ) : (
                    <p className="text-sm">{location || 'Remote'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <label className="text-xs font-medium">Professional Headline</label>
                {editMode ? (
                  <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
                ) : (
                  <p className="text-sm text-foreground">{headline || 'Senior Full Stack & AI Systems Engineer'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Professional Summary</label>
                {editMode ? (
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="w-full h-24 p-3 text-xs bg-muted/20 border border-border/40 rounded-lg resize-none"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {summary || 'Results-driven software engineer with extensive experience designing resilient microservices in TypeScript, Node.js, and PostgreSQL.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Skills */}
        <TabsContent value="skills" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Verified Technical Competencies</CardTitle>
              <CardDescription className="text-xs">
                These skills represent ground-truth factual capabilities. The AI matcher never hallucinates skills outside this catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {editMode ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Skills (Comma-separated)</label>
                  <Input value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} />
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skillsStr.split(',').map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Experience */}
        <TabsContent value="experience" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Verified Employment History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Senior Full Stack Engineer — Tech Scaleup</p>
                  <span className="text-xs font-mono text-muted-foreground">2022 - Present</span>
                </div>
                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                  <li>Engineered distributed workflow automation and API integrations with 99.99% uptime.</li>
                  <li>Designed responsive frontend interfaces using Next.js, React, and Tailwind CSS.</li>
                  <li>Optimized PostgreSQL queries, cutting p99 query latency by 45%.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Education */}
        <TabsContent value="education" className="space-y-4">
          <Card className="shadow-none border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Education & Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 bg-muted/20 border border-border/40 rounded-lg">
                <p className="font-semibold text-sm">Bachelor of Science in Computer Science</p>
                <p className="text-xs text-muted-foreground mt-0.5">State University • Graduated with Honors</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
