import * as React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useToastStore } from '@/stores/toastStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Smartphone, Users, Wifi } from 'lucide-react';

interface AudienceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AudienceSyncModal({ isOpen, onClose }: AudienceSyncModalProps) {
  const { currentPresentationId } = usePresentationStore();
  const { addToast } = useToastStore();

  const syncUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/remote?deck=${currentPresentationId}`
    : `https://gesturedeck.app/remote?deck=${currentPresentationId}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl);
      addToast({
        title: 'Sync Link Copied',
        description: 'Audience and remote phone URL copied to clipboard.',
        type: 'success',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            <DialogTitle>Audience & Mobile Remote Sync</DialogTitle>
          </div>
          <DialogDescription>
            Scan with your phone to use as a handheld remote or mirror slides to the audience.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          {/* Simulated High-Res QR Code */}
          <div className="p-4 bg-white rounded-2xl shadow-md border border-zinc-200">
            <svg
              className="w-44 h-44"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Corner position markers */}
              <rect x="10" y="10" width="24" height="24" rx="4" fill="#09090b" />
              <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
              <rect x="18" y="18" width="8" height="8" rx="1" fill="#09090b" />

              <rect x="66" y="10" width="24" height="24" rx="4" fill="#09090b" />
              <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
              <rect x="74" y="18" width="8" height="8" rx="1" fill="#09090b" />

              <rect x="10" y="66" width="24" height="24" rx="4" fill="#09090b" />
              <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
              <rect x="18" y="74" width="8" height="8" rx="1" fill="#09090b" />

              {/* Data pattern squares */}
              <rect x="38" y="12" width="6" height="6" rx="1" fill="#0284c7" />
              <rect x="48" y="18" width="8" height="6" rx="1" fill="#09090b" />
              <rect x="38" y="26" width="6" height="8" rx="1" fill="#09090b" />
              <rect x="48" y="32" width="8" height="6" rx="1" fill="#0284c7" />
              <rect x="14" y="44" width="6" height="8" rx="1" fill="#09090b" />
              <rect x="24" y="44" width="8" height="6" rx="1" fill="#0284c7" />
              <rect x="38" y="44" width="18" height="18" rx="3" fill="#0284c7" />
              <rect x="62" y="44" width="8" height="6" rx="1" fill="#09090b" />
              <rect x="74" y="44" width="8" height="6" rx="1" fill="#09090b" />
              <rect x="86" y="44" width="6" height="8" rx="1" fill="#0284c7" />
              <rect x="44" y="70" width="6" height="8" rx="1" fill="#09090b" />
              <rect x="56" y="66" width="8" height="6" rx="1" fill="#0284c7" />
              <rect x="70" y="74" width="8" height="8" rx="1" fill="#09090b" />
              <rect x="82" y="70" width="8" height="6" rx="1" fill="#09090b" />
            </svg>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              WebSocket Room Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              1 connected
            </span>
          </div>

          {/* Sync URL bar */}
          <div className="flex w-full items-center gap-2 rounded-lg border border-border bg-muted/30 p-2 text-xs">
            <input
              type="text"
              readOnly
              value={syncUrl}
              className="flex-1 bg-transparent text-muted-foreground outline-none font-mono text-[11px] truncate"
            />
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="h-7 px-2 gap-1 text-xs">
              <Copy className="h-3 w-3" />
              Copy
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
