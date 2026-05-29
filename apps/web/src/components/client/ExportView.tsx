'use client';

import { useAuth } from '@clerk/nextjs';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ClientExportVersionsDto, ExportVersionDto } from '@prudens/shared/types';
import {
  downloadActiveSpreadsheet,
  downloadDashboardPdf,
  downloadExportFile,
} from '@/lib/apiClient';
import { strings } from '@/lib/strings';

interface Props {
  initialVersions: ClientExportVersionsDto;
}

function formatCompletedAt(iso: string | null): string {
  if (!iso) return strings.common.notAvailable;
  return new Date(iso).toLocaleString('pt-BR');
}

function VersionRow({
  version,
  onDownload,
  downloading,
}: {
  version: ExportVersionDto;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brand">{version.filename}</p>
        <p className="text-xs text-text-subtitle">
          {strings.client.exportCompletedAt}: {formatCompletedAt(version.completedAt)}
        </p>
      </div>
      <button
        type="button"
        disabled={downloading}
        onClick={onDownload}
        className="inline-flex shrink-0 items-center gap-2 rounded border border-brand bg-surface-page px-3 py-1.5 text-xs font-medium text-brand disabled:cursor-not-allowed disabled:opacity-60"
      >
        {downloading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="h-3.5 w-3.5" aria-hidden />
        )}
        {downloading ? strings.client.exportDownloading : strings.client.downloadSpreadsheet}
      </button>
    </li>
  );
}

export function ExportView({ initialVersions }: Props) {
  const { getToken } = useAuth();
  const [versions] = useState(initialVersions);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownload = useCallback(
    async (jobId?: string) => {
      const token = await getToken();
      if (!token) return;
      setDownloadingId(jobId ?? 'active');
      try {
        if (jobId) {
          await downloadExportFile(token, jobId);
        } else {
          await downloadActiveSpreadsheet(token);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setDownloadingId(null);
      }
    },
    [getToken],
  );

  const handlePdf = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setPdfLoading(true);
    try {
      await downloadDashboardPdf(token);
    } catch (err) {
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  }, [getToken]);

  const hasAny = Boolean(versions.active) || versions.history.length > 0;

  if (!hasAny) {
    return (
      <p className="rounded-lg border border-border-default bg-surface-card p-8 text-center text-sm text-text-subtitle">
        {strings.client.noExportVersions}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-border-default bg-surface-card p-4">
        <h2 className="text-sm font-semibold text-brand">{strings.client.exportPdfTitle}</h2>
        <p className="mt-1 text-xs text-text-subtitle">{strings.client.exportPdfDescription}</p>
        <button
          type="button"
          disabled={!versions.active || pdfLoading}
          onClick={() => void handlePdf()}
          className="mt-4 inline-flex items-center gap-2 rounded border border-brand bg-brand px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-page disabled:text-text-subtitle"
        >
          {pdfLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <FileText className="h-4 w-4" aria-hidden />
          )}
          {pdfLoading ? strings.client.exportPdfGenerating : strings.client.exportPdfButton}
        </button>
      </section>

      {versions.active ? (
        <section className="rounded-lg border border-border-default bg-surface-card p-4">
          <h2 className="text-sm font-semibold text-brand">{strings.client.exportActiveTitle}</h2>
          <ul className="mt-2">
            <VersionRow
              version={versions.active}
              downloading={downloadingId === 'active'}
              onDownload={() => void handleDownload()}
            />
          </ul>
        </section>
      ) : null}

      <section className="rounded-lg border border-border-default bg-surface-card p-4">
        <h2 className="text-sm font-semibold text-brand">{strings.client.exportHistoryTitle}</h2>
        {versions.history.length === 0 ? (
          <p className="mt-2 text-xs text-text-subtitle">{strings.client.noExportHistory}</p>
        ) : (
          <ul className="mt-2">
            {versions.history.map((v) => (
              <VersionRow
                key={v.jobId}
                version={v}
                downloading={downloadingId === v.jobId}
                onDownload={() => void handleDownload(v.jobId)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
