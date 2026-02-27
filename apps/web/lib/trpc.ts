import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "auto-ai-server";
import { httpBatchLink } from "@trpc/client";
import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export const trpc = createTRPCReact<AppRouter>();

let accessToken: string | null = null;

supabase.auth.getSession().then(({ data }) => {
  accessToken = data.session?.access_token ?? null;
});

supabase.auth.onAuthStateChange((event, session) => {
  accessToken = session?.access_token || null;
});

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minutes
      },
    },
  });
}

export function makeTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.NEXT_PUBLIC_API_URL}/trpc`,
        headers: () => {
          return {
            Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
          };
        },
      }),
    ],
  });
}
