'use client';

import type { ImportValidationError } from '@prudens/shared/types';
import { strings } from '@/lib/strings';

interface Props {
  errors: ImportValidationError[];
}

export function ValidationErrorList({ errors }: Props) {
  if (errors.length === 0) {
    return <p className="text-xs text-slate-500">{strings.errors.noValidationErrors}</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-sm font-semibold text-red-700">{strings.errors.validationErrorsTitle}</h4>
      <ul className="space-y-2">
        {errors.map((err, idx) => (
          <li
            key={`${err.row_number}-${err.column_name}-${idx}`}
            className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-800"
          >
            <p>
              <strong>Linha {err.row_number}</strong> - <strong>{err.column_name}</strong>
            </p>
            <p>{err.error_message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
