"use client";

import { ReactNode, useState } from "react";
import { makeQueryClient, makeTrpcClient, trpc } from "@/lib/trpc";
import { QueryClientProvider } from "@tanstack/react-query";

export function TrpcProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const [trpcClient] = useState(() => makeTrpcClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
