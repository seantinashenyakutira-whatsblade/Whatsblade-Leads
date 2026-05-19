'use client';

import { TRPCProvider as TRPCProviderBase } from '@/lib/trpc/trpc-provider';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return <TRPCProviderBase>{children}</TRPCProviderBase>;
}
