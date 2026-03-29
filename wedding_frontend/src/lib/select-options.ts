export interface SelectOption {
  value: string;
  label: string;
}

export const mergeSelectedOption = (
  options: SelectOption[],
  selectedValue?: string | null,
  selectedLabel?: string | null,
) => {
  const normalizedValue = selectedValue?.trim();

  if (!normalizedValue) {
    return options;
  }

  if (options.some((option) => option.value === normalizedValue)) {
    return options;
  }

  return [
    ...options,
    {
      value: normalizedValue,
      label: selectedLabel?.trim() || normalizedValue,
    },
  ];
};
