import React from 'react';
import PrivateRoute from '@/routes/PrivateRoute';

interface Props { children: React.ReactNode; }

// VITE_FPLUS_DEMO=true bypasses Evo CRM auth for local development.
// In production (or when the backend is running) this variable is unset
// and PrivateRoute enforces authentication normally.
const DEMO_MODE = import.meta.env.VITE_FPLUS_DEMO === 'true';

export function FplusRoute({ children }: Props) {
  if (DEMO_MODE) return <>{children}</>;
  return <PrivateRoute>{children}</PrivateRoute>;
}
