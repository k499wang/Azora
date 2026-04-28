import { useAuthStore } from '../stores/authStore';

type BootingGate = { status: 'booting' };
type SignedOutGate = { status: 'signed_out' };
type ReadyGate = { status: 'ready' };

export type AppGate = BootingGate | SignedOutGate | ReadyGate;

export function useAppGate(): AppGate {
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  if (authStatus === 'booting') {
    return { status: 'booting' };
  }

  if (authStatus === 'signed_out' || user == null) {
    return { status: 'signed_out' };
  }

  return { status: 'ready' };
}
