'use client';

import type { ItemStatus } from '@prudens/shared/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { STATUS_CONFIG } from '@/lib/status-config';
import { cn } from '@/lib/utils';

interface Props {
  status: ItemStatus;
  actionInsight?: string | null;
}

export function StatusBadge({ status, actionInsight }: Props) {
  const config = STATUS_CONFIG[status];
  const insight = actionInsight?.trim() ?? '';

  const badgeClassName = cn(
    'inline-flex max-w-full flex-col rounded-full border border-border-default px-2 py-0.5 text-left',
    config.pulseAnimation && 'animate-pulse',
    insight.length > 0 && 'cursor-help',
  );

  const badgeStyle = { color: config.color, backgroundColor: `${config.color}18` };

  const labelBlock = (
    <>
      <span className="text-[11px] font-medium leading-tight">{config.label}</span>
      <span className="text-[10px] leading-tight text-text-subtitle">{config.actionLabel}</span>
    </>
  );

  if (!insight) {
    return (
      <span className={badgeClassName} style={badgeStyle}>
        {labelBlock}
      </span>
    );
  }

  return (
    <Tooltip delayDuration={400}>
      <TooltipTrigger asChild>
        <span className={badgeClassName} style={badgeStyle}>
          {labelBlock}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="z-[100] max-w-[320px] text-[13px] leading-snug"
      >
        {insight}
      </TooltipContent>
    </Tooltip>
  );
}
