'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ListFilter,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Play,
  ArrowLeft,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ProfilePreset {
  id: string;
  name: string;
  roles: string[];
  skills: string[];
  mode: string;
  minSalary: string;
  isActive: boolean;
}

export default function SearchProfilesPage() {
  const [profiles, setProfiles] = useState<ProfilePreset[]>([
    {
      id: 'prof_backend',
      name: 'Senior Backend Specialist',
      roles: ['Senior Backend Engineer', 'Node.js Architect', 'Platform Engineer'],
      skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
      mode: 'REMOTE',
      minSalary: '$120,000',
      isActive: true,
    },
    {
      id: 'prof_fullstack',
      name: 'Full Stack Tech Lead',
      roles: ['Senior Full Stack Engineer', 'Lead Engineer', 'Full Stack Architect'],
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'GraphQL'],
      mode: 'HYBRID / REMOTE',
      minSalary: '$115,000',
      isActive: false,
    },
    {
      id: 'prof_ai',
      name: 'AI & Systems Engineer',
      roles: ['AI Engineer', 'LLM Application Architect', 'FastAPI Developer'],
      skills: ['Python', 'LangChain', 'FastAPI', 'Vector DB', 'PyTorch'],
      mode: 'REMOTE',
      minSalary: '$130,000',
      isActive: true,
    },
    {
      id: 'prof_devops',
      name: 'Cloud Infrastructure / SRE',
      roles: ['DevOps Engineer', 'Site Reliability Engineer', 'Cloud Architect'],
      skills: ['Kubernetes', 'Terraform', 'AWS', 'Docker', 'CI/CD'],
      mode: 'REMOTE',
      minSalary: '$125,000',
      isActive: false,
    },
  ]);

  const toggleActive = (id: string) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
              <Link href="/search">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Search Profile Presets</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage reusable candidate targets for automated hourly polling and manual batch triggers.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/search">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Create New Profile
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map((p) => (
          <Card key={p.id} className="shadow-none border-border/80 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    {p.name}
                    {p.isActive && (
                      <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Active
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {p.mode} • Floor: {p.minSalary}
                  </CardDescription>
                </div>
                <Button
                  variant={p.isActive ? 'outline' : 'secondary'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => toggleActive(p.id)}
                >
                  {p.isActive ? 'Disable' : 'Activate'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">Target Roles:</p>
                <div className="flex flex-wrap gap-1">
                  {p.roles.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-[11px]">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1">Must-Have Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {p.skills.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-[11px]">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-3 border-t border-border/40 flex justify-between">
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/search">
                  <SlidersHorizontal className="h-3 w-3 mr-1" />
                  Edit Filters
                </Link>
              </Button>
              <Button asChild size="sm" className="h-7 text-xs">
                <Link href="/search">
                  <Play className="h-3 w-3 mr-1" />
                  Run Search
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
