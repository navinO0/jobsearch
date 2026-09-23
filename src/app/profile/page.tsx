'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Sparkles,
  MapPin,
  Briefcase,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Profile Form States
  const [profileName, setProfileName] = useState('Software Engineer / Backend / Full-Stack');
  const [targetTitles, setTargetTitles] = useState<string[]>([
    'Software Engineer',
    'Backend Engineer',
    'Full Stack Engineer',
    'DevOps Engineer',
  ]);
  const [newTitle, setNewTitle] = useState('');

  const [requiredSkills, setRequiredSkills] = useState<string[]>([
    'Node.js',
    'TypeScript',
    'PostgreSQL',
    'Docker',
  ]);
  const [newReqSkill, setNewReqSkill] = useState('');

  const [preferredSkills, setPreferredSkills] = useState<string[]>([
    'Redis',
    'React',
    'Next.js',
    'AWS',
    'Kubernetes',
    'Python',
  ]);
  const [newPrefSkill, setNewPrefSkill] = useState('');

  const [experienceYears, setExperienceYears] = useState(3);
  const [education, setEducation] = useState('Bachelor of Engineering / Computer Science');
  const [noticePeriod, setNoticePeriod] = useState('Immediate to 30 days');

  const [locations, setLocations] = useState<string[]>(['India', 'Bangalore', 'Hyderabad', 'Remote']);
  const [newLocation, setNewLocation] = useState('');

  const [remotePref, setRemotePref] = useState(true);
  const [hybridPref, setHybridPref] = useState(true);
  const [onsitePref, setOnsitePref] = useState(false);

  const [minMatchScore, setMinMatchScore] = useState(55);
  const [telegramChatId, setTelegramChatId] = useState('617149298');

  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([
    'intern',
    'internship',
    'unpaid',
    'sales',
    'customer support',
  ]);
  const [newExclude, setNewExclude] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.success && data.profile) {
          const p = data.profile;
          setProfileName(p.profile_name || '');
          setTargetTitles(Array.isArray(p.target_titles) ? p.target_titles : []);
          setRequiredSkills(Array.isArray(p.required_skills) ? p.required_skills : []);
          setPreferredSkills(Array.isArray(p.preferred_skills) ? p.preferred_skills : []);
          setExperienceYears(p.experience_years ?? 3);
          setEducation(p.education || '');
          setNoticePeriod(p.notice_period || '');
          setLocations(Array.isArray(p.locations) ? p.locations : []);
          setRemotePref(Boolean(p.remote_preference));
          setHybridPref(Boolean(p.hybrid_preference));
          setOnsitePref(Boolean(p.onsite_preference));
          setMinMatchScore(p.min_match_score ?? 55);
          setTelegramChatId(p.telegram_chat_id || '');
          setExcludeKeywords(Array.isArray(p.exclude_keywords) ? p.exclude_keywords : []);
        }
      } catch (e) {
        console.error('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const payload = {
        profile_name: profileName,
        target_titles: targetTitles,
        required_skills: requiredSkills,
        preferred_skills: preferredSkills,
        experience_years: experienceYears,
        education,
        notice_period: noticePeriod,
        locations,
        remote_preference: remotePref,
        hybrid_preference: hybridPref,
        onsite_preference: onsitePref,
        min_match_score: minMatchScore,
        telegram_chat_id: telegramChatId,
        exclude_keywords: excludeKeywords,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          msg: 'Candidate preferences saved and updated in PostgreSQL database!',
          type: 'success',
        });
      } else {
        setStatusMsg({ msg: data.error || 'Failed to update preferences', type: 'error' });
      }
    } catch (e: any) {
      setStatusMsg({ msg: e.message, type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const addTag = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
    const trimmed = item.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setItem('');
    }
  };

  const removeTag = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.filter((x) => x !== item));
  };

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading seeker profile from Postgres...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2.5">
            <User className="w-6 h-6 text-cyan-400" />
            <span>Job Seeker Profile & Preferences</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure your target roles, skills, and alert parameters. The n8n matching engine reads these preferences directly.
          </p>
        </div>

        <Button
          type="submit"
          disabled={saving}
          variant="gradient"
          className="font-bold flex items-center space-x-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
        </Button>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center space-x-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/60 border-red-500/30 text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{statusMsg.msg}</span>
        </div>
      )}

      {/* Basic Profile & Alert Settings */}
      <Card className="bg-[#0f172a] border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>General Information & Telegram Bot</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Profile Title / Persona</label>
              <Input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5 flex items-center justify-between">
                <span>Telegram Chat ID</span>
                <span className="text-[10px] text-emerald-400">Connected to Bot</span>
              </label>
              <Input
                type="text"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Titles */}
      <Card className="bg-[#0f172a] border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Target Job Titles</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {targetTitles.map((t) => (
              <Badge
                key={t}
                variant="cyan"
                className="flex items-center space-x-1.5 py-1 px-3 text-xs"
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => removeTag(targetTitles, setTargetTitles, t)}
                  className="hover:text-white cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex items-center space-x-2 max-w-md">
            <Input
              type="text"
              placeholder="Add title (e.g. AI Engineer, Platform Lead)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(targetTitles, setTargetTitles, newTitle, setNewTitle);
                }
              }}
              className="bg-slate-900 border-slate-700 h-9 text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addTag(targetTitles, setTargetTitles, newTitle, setNewTitle)}
              className="border border-slate-700 bg-slate-800 hover:bg-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Matrix */}
      <Card className="bg-[#0f172a] border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Skills Matrix (Used for AI Matching)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Required Skills */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-slate-300">
              Required / Core Technical Skills (Must-Have)
            </label>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((s) => (
                <Badge
                  key={s}
                  variant="success"
                  className="flex items-center space-x-1.5 py-1 px-3 text-xs"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(requiredSkills, setRequiredSkills, s)}
                    className="hover:text-white cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-2 max-w-md">
              <Input
                type="text"
                placeholder="Add required skill (e.g. Node.js, Docker)..."
                value={newReqSkill}
                onChange={(e) => setNewReqSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(requiredSkills, setRequiredSkills, newReqSkill, setNewReqSkill);
                  }
                }}
                className="bg-slate-900 border-slate-700 h-9 text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addTag(requiredSkills, setRequiredSkills, newReqSkill, setNewReqSkill)}
                className="border border-slate-700 bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <label className="block text-xs font-semibold text-slate-300">
              Preferred / Nice-to-Have Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {preferredSkills.map((s) => (
                <Badge
                  key={s}
                  variant="indigo"
                  className="flex items-center space-x-1.5 py-1 px-3 text-xs"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(preferredSkills, setPreferredSkills, s)}
                    className="hover:text-white cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-2 max-w-md">
              <Input
                type="text"
                placeholder="Add preferred skill (e.g. Redis, AWS)..."
                value={newPrefSkill}
                onChange={(e) => setNewPrefSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(preferredSkills, setPreferredSkills, newPrefSkill, setNewPrefSkill);
                  }
                }}
                className="bg-slate-900 border-slate-700 h-9 text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addTag(preferredSkills, setPreferredSkills, newPrefSkill, setNewPrefSkill)}
                className="border border-slate-700 bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Locations & Work Mode */}
      <Card className="bg-[#0f172a] border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Location & Work Style Preferences</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Work Styles Checkboxes */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <label className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center space-x-3 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={remotePref}
                onChange={(e) => setRemotePref(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
              <div>
                <div className="font-bold text-white">Remote</div>
                <div className="text-[11px] text-slate-400">Work from anywhere</div>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center space-x-3 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={hybridPref}
                onChange={(e) => setHybridPref(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
              <div>
                <div className="font-bold text-white">Hybrid</div>
                <div className="text-[11px] text-slate-400">1-3 days in office</div>
              </div>
            </label>

            <label className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 flex items-center space-x-3 cursor-pointer hover:border-slate-600 transition-colors">
              <input
                type="checkbox"
                checked={onsitePref}
                onChange={(e) => setOnsitePref(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
              />
              <div>
                <div className="font-bold text-white">On-site</div>
                <div className="text-[11px] text-slate-400">Full in-office</div>
              </div>
            </label>
          </div>

          {/* Target Cities/Locations */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-300">Target Cities / Regions</label>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <Badge
                  key={loc}
                  variant="subtle"
                  className="flex items-center space-x-1.5 py-1 px-3 text-xs"
                >
                  <span>{loc}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(locations, setLocations, loc)}
                    className="hover:text-white cursor-pointer ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
            </div>

            <div className="flex items-center space-x-2 max-w-md">
              <Input
                type="text"
                placeholder="Add location (e.g. Pune, Delhi NCR)..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(locations, setLocations, newLocation, setNewLocation);
                  }
                }}
                className="bg-slate-900 border-slate-700 h-9 text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => addTag(locations, setLocations, newLocation, setNewLocation)}
                className="border border-slate-700 bg-slate-800 hover:bg-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience, Education & Match Threshold */}
      <Card className="bg-[#0f172a] border-slate-800">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Experience & AI Filtering Threshold</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Years of Experience</label>
              <Input
                type="number"
                min="0"
                max="20"
                value={experienceYears}
                onChange={(e) => setExperienceYears(parseInt(e.target.value, 10) || 0)}
                className="bg-slate-900 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Notice Period</label>
              <Input
                type="text"
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Education Degree</label>
              <Input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-300">Minimum AI Match Score Filter:</span>
              <Badge variant="success" className="font-bold">
                {minMatchScore}%
              </Badge>
            </div>
            <Slider
              min={40}
              max={90}
              step={5}
              value={[minMatchScore]}
              onValueChange={(val) => setMinMatchScore(val[0])}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Jobs with AI evaluation scores above {minMatchScore}% are marked as qualifying matches and dispatched to Telegram.
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
