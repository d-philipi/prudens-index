'use client';

import { useCallback, useRef, useState, type ChangeEvent } from 'react';
import { useDropzone, type FileError } from 'react-dropzone';
import { useAuth } from '@clerk/nextjs';
import { apiFetch } from '@/lib/apiClient';
import {
  contentTypeForSpreadsheet,
  isSpreadsheetFile,
  SPREADSHEET_FILE_ACCEPT,
} from '@/lib/spreadsheetUpload';
import type { CompanyDto } from '@prudens/shared/types';
import { SelectField } from '@/components/shared/SelectField';
import { strings } from '@/lib/strings';

interface Props {
  companies: CompanyDto[];
  companyId: string;
  onCompanyChange: (companyId: string) => void;
  onUploadStarted: (importJobId: string) => void;
}

export function ImportUploadForm({
  companies,
  companyId,
  onCompanyChange,
  onUploadStarted,
}: Props) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!companyId) return;
      if (!isSpreadsheetFile(file)) {
        setError(strings.errors.invalidSpreadsheet);
        return;
      }

      setSelectedName(file.name);
      setError(null);
      setUploading(true);
      try {
        const token = await getToken();
        if (!token) throw new Error('Usuário não autenticado');

        const created = await apiFetch<{
          importJobId: string;
          uploadUrl: string;
          uploadHeaders: Record<string, string>;
        }>('/api/admin/imports', {
          method: 'POST',
          token,
          body: JSON.stringify({
            companyId,
            filename: file.name,
            contentType: contentTypeForSpreadsheet(file),
            sizeBytes: file.size,
          }),
        });

        let putRes: Response;
        try {
          putRes = await fetch(created.uploadUrl, {
            method: 'PUT',
            headers: created.uploadHeaders,
            body: file,
          });
        } catch {
          throw new Error(
            'Falha ao enviar o arquivo para o R2. Confira R2_ENDPOINT (URL S3 …r2.cloudflarestorage.com, não *.r2.dev) e CORS do bucket (PUT desde http://localhost:3000).',
          );
        }
        if (!putRes.ok) {
          throw new Error(`Armazenamento recusou o upload (HTTP ${putRes.status}).`);
        }

        await apiFetch(`/api/admin/imports/${created.importJobId}/complete-upload`, {
          method: 'POST',
          token,
          body: JSON.stringify({}),
        });

        onUploadStarted(created.importJobId);
      } catch (e) {
        setError(e instanceof Error ? e.message : strings.errors.uploadFailed);
      } finally {
        setUploading(false);
      }
    },
    [companyId, getToken, onUploadStarted],
  );

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (file) await uploadFile(file);
    },
    [uploadFile],
  );

  const fileValidator = useCallback((file: File): FileError | null => {
    if (!isSpreadsheetFile(file)) {
      return {
        code: 'file-invalid-type',
        message: strings.errors.spreadsheetOnly,
      };
    }
    return null;
  }, []);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
    noClick: true,
    noKeyboard: true,
    validator: fileValidator,
  });

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void uploadFile(file);
  };

  return (
    <div className="space-y-4">
      <SelectField
        label="Cliente"
        value={companyId}
        onChange={onCompanyChange}
        options={companies.map((c) => ({ value: c.id, label: c.name }))}
      />

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center text-sm ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-border-default'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SPREADSHEET_FILE_ACCEPT}
          className="sr-only"
          disabled={uploading || !companyId}
          onChange={onFileInputChange}
        />
        <p className="text-text-subtitle">
          {uploading
            ? 'Enviando…'
            : 'Arraste uma planilha (.xlsx, .xls, .xlsm, .xlsb, .csv, .tsv, .ods…) para esta área'}
        </p>
        {selectedName && !uploading && (
          <p className="mt-2 text-xs text-text-subtitle">Último arquivo: {selectedName}</p>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !companyId}
          className="mt-4 rounded bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selecionar arquivo
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
