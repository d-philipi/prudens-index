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
import { strings } from '@/lib/strings';

interface Props {
  companies: CompanyDto[];
  onUploadStarted: (importJobId: string) => void;
}

export function ImportUploadForm({ companies, onUploadStarted }: Props) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '');
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
      <label className="block text-sm font-medium">
        Cliente
        <select
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
        >
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center text-sm ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
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
        <p className="text-slate-600">
          {uploading
            ? 'Enviando…'
            : 'Arraste uma planilha (.xlsx, .xls, .xlsm, .xlsb, .csv, .tsv, .ods…) para esta área'}
        </p>
        {selectedName && !uploading && (
          <p className="mt-2 text-xs text-slate-500">Último arquivo: {selectedName}</p>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !companyId}
          className="mt-4 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Selecionar arquivo
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
