export const transcriptValidator = ({ value }: { value: string }): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return 'Please describe what you want to eat';
  if (trimmed.length < 3) return 'Please be a bit more specific';
  return undefined;
};
