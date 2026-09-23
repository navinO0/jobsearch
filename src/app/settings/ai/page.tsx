'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Cpu, ArrowLeft, Save, CheckCircle2, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AiSettingsPage() {
  const [provider, setProvider] = useState('openrouter');
  const [matchModel, setMatchModel] = useState('deepseek/deepseek-v4-flash-0731:free');
  const [resumeModel, setResumeModel] = useState('anthropic/claude-3.5-sonnet');
  const [coverModel, setCoverModel] = useState('anthropic/claude-3.5-sonnet');
  const [researchModel, setResearchModel] = useState('meta-llama/llama-3.1-8b-instruct:free');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai: { provider, matchModel, resumeModel, coverModel, researchModel } }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2 pb-2 border-b border-border/40">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-7">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">AI Provider & Model Settings</h1>
          <p className="text-xs text-muted-foreground">
            Configure LLM routing for matching, truthful ATS document generation, and company research.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>AI configuration saved successfully!</span>
        </div>
      )}

      <Card className="shadow-none border-border/80">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Default AI Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter (Multi-Model Gateway)</SelectItem>
                <SelectItem value="openai">OpenAI (Direct API)</SelectItem>
                <SelectItem value="gemini">Google Gemini (Direct API)</SelectItem>
                <SelectItem value="ollama">Ollama (Local Self-Hosted)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Resume & Profile Match Model</label>
            <Input value={matchModel} onChange={(e) => setMatchModel(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">High-speed, low-cost model for classification.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">ATS Tailored Resume Generation Model</label>
            <Input value={resumeModel} onChange={(e) => setResumeModel(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">High-precision model enforcing strict truthfulness.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Custom Cover Letter Model</label>
            <Input value={coverModel} onChange={(e) => setCoverModel(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Company Research & News Model</label>
            <Input value={researchModel} onChange={(e) => setResearchModel(e.target.value)} />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-3 border-t border-border/40">
          <Button onClick={handleSave} className="h-9">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Configuration
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
