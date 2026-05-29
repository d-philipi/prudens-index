'use client';

import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
}

export function CustomSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  className = '',
  required = false,
}: Props) {
  const selectId = id ?? (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={cn('block w-full text-sm', className)}>
      {label ? (
        <span className="mb-1 block text-[13px] font-medium text-brand">{label}</span>
      ) : null}
      <Select.Root
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <Select.Trigger
          id={selectId}
          className={cn(
            'flex h-10 w-full min-w-0 items-center justify-between rounded-lg border border-[#e2e2de] bg-surface-card px-3 text-[13px] text-brand outline-none',
            'focus-visible:ring-2 focus-visible:ring-brand/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-text-subtitle',
          )}
          aria-invalid={error ? true : undefined}
        >
          <Select.Value placeholder={placeholder}>
            {selected?.label ?? placeholder}
          </Select.Value>
          <Select.Icon className="text-text-subtitle">
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content
            className="z-50 w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[#e2e2de] bg-surface-card shadow-none"
            position="popper"
            sideOffset={4}
            align="start"
          >
            <Select.Viewport className="w-full p-1">
              {options.map((opt) => (
                <Select.Item
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className={cn(
                    'w-full cursor-pointer rounded px-3 py-2 text-[13px] text-brand outline-none',
                    'data-[highlighted]:bg-surface-page data-[state=checked]:font-medium',
                  )}
                >
                  <Select.ItemText>{opt.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : null}
    </div>
  );
}
