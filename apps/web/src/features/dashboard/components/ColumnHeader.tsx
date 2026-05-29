'use client';

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  label: string;
  tooltip: string;
  active: boolean;
  direction: 'asc' | 'desc';
  onSort: () => void;
}

export function ColumnHeader({ label, tooltip, active, direction, onSort }: Props) {
  return (
    <th className="h-auto min-h-10 px-2 py-2 align-bottom text-[10px] font-medium uppercase leading-tight text-text-subtitle md:text-xs">
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="cursor-pointer whitespace-normal text-left hover:text-brand"
          onClick={onSort}
        >
          {label}
          {active ? (direction === 'asc' ? ' ↑' : ' ↓') : null}
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="mt-0.5 shrink-0 cursor-pointer text-gray-400 hover:text-brand"
              aria-label={`Informações sobre ${label}`}
            >
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
    </th>
  );
}
