import { useStore } from '../store/useStore';

export function usePostalCode(): string {
  const postalCode = useStore((s) => s.postalCode);
  return postalCode || 'J1H1A1';
}
