'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderOpen, ArrowLeft, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function GoogleSettingsPage() {
  const [rootFolder, setRootFolder] = useState('Job Search Assistant');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
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
          <h1 className="text-xl font-bold tracking-tight">Google Workspace Integration</h1>
          <p className="text-xs text-muted-foreground">
            Configure Drive storage organization, Sheets export, and Calendar follow-up sync.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Google Workspace settings saved!</span>
        </div>
      )}

      <Card className="shadow-none border-border/80">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Google Drive Root Application Folder</label>
            <Input value={rootFolder} onChange={(e) => setRootFolder(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">
              All openings are organized under <code>{rootFolder}/01_Job_Opening/YYYY/MM/DD/Company/Role/</code>.
            </p>
          </div>

          <div className="p-4 bg-muted/20 border border-border/40 rounded-lg text-xs space-y-2">
            <p className="font-semibold text-foreground">Drive Folder ID Caching:</p>
            <p className="text-muted-foreground leading-relaxed">
              Folder IDs are stored persistently in <code>jobs.drive_folders</code>, preventing redundant recursive Drive search API calls during batch runs.
            </p>
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
