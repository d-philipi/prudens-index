'use client';

import type { ImportValidationError } from '@prudens/shared/types';
import { strings } from '@/lib/strings';

interface Props {
  warnings: ImportValidationError[];
}

export function MissingColumnsNotice({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 rounded border border-amber-200 bg-amber-50 p-3">
      <h4 className="text-sm font-semibold text-amber-900">{strings.errors.missingColumnsTitle}</h4>
      <p className="text-xs text-amber-800">{strings.errors.missingColumnsHint}</p>
      <ul className="list-inside list-disc text-xs text-amber-900">
        {warnings.map((w, idx) => (
          <li key={`${w.column_name}-${idx}`}>{w.column_name}</li>
        ))}
      </ul>
    </div>
  );
}
