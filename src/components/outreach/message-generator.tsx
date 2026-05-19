'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Save, Copy, Check, AlertTriangle } from 'lucide-react';
import { PLATFORM_LIMITS, getCharacterStatus } from '@/lib/ai/platform-limits';
import type { GeneratedMessage } from '@/lib/ai/message-generator';

interface MessageGeneratorProps {
  leadId: string;
  leadName: string;
  onGenerate: (params: {
    leadId: string;
    platform: string;
    tone: string;
    language: string;
    length: string;
  }) => Promise<GeneratedMessage>;
  onSave: (params: {
    leadId: string;
    platform: string;
    body: string;
    subject?: string;
    campaignId?: string | null;
    aiGenerated: boolean;
  }) => Promise<void>;
  onSaveTemplate?: (params: {
    name: string;
    platform: string;
    tone: string;
    language: string;
    body: string;
  }) => Promise<void>;
  campaignId?: string;
}

const PLATFORMS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'instagram', label: 'Instagram DM', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '👤' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'sms', label: 'SMS', icon: '' },
  { value: 'linkedin', label: 'LinkedIn', icon: '' },
];

const TONES = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'bold', label: 'Bold' },
  { value: 'consultative', label: 'Consultative' },
];

const LENGTHS = [
  { value: 'short', label: 'Short (50-100 words)' },
  { value: 'medium', label: 'Medium (100-200 words)' },
  { value: 'long', label: 'Long (200-350 words)' },
];

export function MessageGenerator({
  leadId,
  leadName,
  onGenerate,
  onSave,
  onSaveTemplate,
  campaignId,
}: MessageGeneratorProps) {
  const [platform, setPlatform] = useState('whatsapp');
  const [tone, setTone] = useState('professional');
  const [language, setLanguage] = useState('English');
  const [length, setLength] = useState('medium');
  const [generated, setGenerated] = useState<GeneratedMessage | null>(null);
  const [editableBody, setEditableBody] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await onGenerate({ leadId, platform, tone, language, length });
      setGenerated(result);
      setEditableBody(result.message);
      setEditableSubject(result.subject || '');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editableBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        leadId,
        platform,
        body: editableBody,
        subject: editableSubject || undefined,
        campaignId: campaignId || null,
        aiGenerated: !!generated,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !onSaveTemplate) return;
    setIsSavingTemplate(true);
    try {
      await onSaveTemplate({
        name: templateName,
        platform,
        tone,
        language,
        body: editableBody,
      });
      setShowTemplateForm(false);
      setTemplateName('');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const charLimit = PLATFORM_LIMITS[platform];
  const charStatus = charLimit ? getCharacterStatus(platform, editableBody.length) : { ok: true, warning: false, overLimit: false };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Platform</Label>
          <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Tone</Label>
          <Select value={tone} onChange={(e) => setTone(e.target.value)}>
            {TONES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Language</Label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="English"
          />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Length</Label>
          <Select value={length} onChange={(e) => setLength(e.target.value)}>
            {LENGTHS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </Select>
        </div>
      </div>

      <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
        <Sparkles className="mr-2 h-4 w-4" />
        {isGenerating ? 'Generating...' : `Generate AI Message for ${leadName}`}
      </Button>

      {generated && (
        <div className="space-y-3">
          {platform === 'email' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Subject</Label>
              <input
                type="text"
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Message</Label>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${charStatus.overLimit ? 'text-destructive' : charStatus.warning ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                  {editableBody.length} / {charLimit?.max || '∞'} chars
                </span>
                {charStatus.overLimit && (
                  <Badge variant="destructive" className="text-[10px]">Over limit</Badge>
                )}
                {charStatus.warning && !charStatus.overLimit && (
                  <Badge variant="outline" className="text-[10px] text-yellow-500 border-yellow-500">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Near limit
                  </Badge>
                )}
              </div>
            </div>
            <Textarea
              value={editableBody}
              onChange={(e) => setEditableBody(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleGenerate} disabled={isGenerating} variant="outline" size="sm">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Regenerate
            </Button>

            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>

            {onSaveTemplate && (
              <Button onClick={() => setShowTemplateForm(!showTemplateForm)} variant="outline" size="sm">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save as Template
              </Button>
            )}

            <Button onClick={handleSave} disabled={isSaving || charStatus.overLimit} size="sm">
              <Check className="mr-1.5 h-3.5 w-3.5" />
              {isSaving ? 'Saving...' : 'Approve & Save'}
            </Button>
          </div>

          {showTemplateForm && onSaveTemplate && (
            <div className="flex gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name..."
                className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button onClick={handleSaveTemplate} disabled={!templateName.trim() || isSavingTemplate} size="sm">
                {isSavingTemplate ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
