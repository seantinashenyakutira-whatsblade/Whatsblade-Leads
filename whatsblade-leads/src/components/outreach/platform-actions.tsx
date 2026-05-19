'use client';

import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

interface PlatformActionsProps {
  platform: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  socialMedia: Record<string, string>;
  message: string;
  subject?: string;
}

export function PlatformActions({
  platform,
  phone,
  email,
  website,
  socialMedia,
  message,
  subject,
}: PlatformActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getWhatsAppLink = () => {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getInstagramLink = () => {
    const instagramUrl = socialMedia.instagram || socialMedia.facebook || website;
    return instagramUrl || '#';
  };

  const getFacebookLink = () => {
    const facebookUrl = socialMedia.facebook || website;
    if (facebookUrl) return facebookUrl;
    return '#';
  };

  const getEmailLink = () => {
    if (!email) return '#';
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    params.set('body', message);
    return `mailto:${email}?${params.toString()}`;
  };

  const getSmsLink = () => {
    if (!phone) return '#';
    return `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const getLinkedInLink = () => {
    return socialMedia.linkedin || website || '#';
  };

  const actions: Array<{ label: string; icon: React.ReactNode; href: string; copyFirst?: boolean }> = [];

  switch (platform) {
    case 'whatsapp':
      actions.push({ label: 'Open WhatsApp', icon: <ExternalLink className="h-3.5 w-3.5" />, href: getWhatsAppLink() });
      break;
    case 'instagram':
      actions.push({ label: 'Copy Message', icon: copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />, href: '#', copyFirst: true });
      actions.push({ label: 'Open Instagram', icon: <ExternalLink className="h-3.5 w-3.5" />, href: getInstagramLink() });
      break;
    case 'facebook':
      actions.push({ label: 'Copy Message', icon: copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />, href: '#', copyFirst: true });
      actions.push({ label: 'Open Facebook', icon: <ExternalLink className="h-3.5 w-3.5" />, href: getFacebookLink() });
      break;
    case 'email':
      actions.push({ label: 'Open Email', icon: <ExternalLink className="h-3.5 w-3.5" />, href: getEmailLink() });
      break;
    case 'sms':
      actions.push({ label: 'Open SMS', icon: <ExternalLink className="h-3.5 w-3.5" />, href: getSmsLink() });
      break;
    case 'linkedin':
      actions.push({ label: 'Copy Message', icon: copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />, href: '#', copyFirst: true });
      actions.push({ label: 'Open LinkedIn', icon: <ExternalLink className="h-3.5 w-3.5" />, href: getLinkedInLink() });
      break;
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, i) => (
        <Button
          key={i}
          variant="outline"
          size="sm"
          onClick={async (e) => {
            if (action.copyFirst) {
              e.preventDefault();
              await handleCopy();
            }
          }}
          asChild={!action.copyFirst}
        >
          {action.copyFirst ? (
            <span className="flex items-center gap-1.5 cursor-pointer">
              {action.icon}
              {action.label}
            </span>
          ) : (
            <a href={action.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
              {action.icon}
              {action.label}
            </a>
          )}
        </Button>
      ))}
    </div>
  );
}
