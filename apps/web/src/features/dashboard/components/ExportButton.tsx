'use client';

import { useAuth } from '@clerk/nextjs';
import { Download, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { downloadActiveSpreadsheet } from '@/lib/apiClient';
import { strings } from '@/lib/strings';

interface Props {
  canExport: boolean;
}

export function ExportButton({ canExport }: Props) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setLoading(false), 10_000);
    return () => clearTimeout(t);
  }, [loading]);

  const handleExport = useCallback(async () => {
    const token = await getToken();
    if (!token || !canExport) return;
    setLoading(true);
    try {
      await downloadActiveSpreadsheet(token);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getToken, canExport]);

  const button = (
    <button
      type="button"
      disabled={!canExport || loading}
      onClick={() => void handleExport()}
      className="inline-flex items-center gap-2 rounded border border-brand bg-brand px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-page disabled:text-text-subtitle"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      {loading ? strings.client.exportDownloading : strings.client.exportSpreadsheet}
    </button>
  );

  if (!canExport) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent>{strings.client.exportDisabledTooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
