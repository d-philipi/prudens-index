'use client';

import { CustomSelect, type CustomSelectOption } from './CustomSelect';

export type SelectOption = CustomSelectOption;

interface Props {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
}

/** @deprecated Prefer CustomSelect directly. Wrapper sem `<select>` nativo. */
export function SelectField(props: Props) {
  return <CustomSelect {...props} />;
}
