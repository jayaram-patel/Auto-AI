import { initTRPC, TRPCError } from "@trpc/server";
import { verifyJwt } from "./utils/jwt";
import * as trpcExpress from "@trpc/server/adapters/express";
import type { ISupabseUser } from "./types/user";
import { DatabaseService } from "./services/database";
import { Logger } from "./utils/logger";

export const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => {
  return {
    req,
    db: DatabaseService.getInstance().getPrismaInstance(),
    user: null as unknown as ISupabseUser | null,
    logger: Logger,
  };
};

export type Context = ReturnType<typeof createContext>;

export const t = initTRPC.context<Context>().create();
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async (opts) => {
  const req = opts.ctx.req;

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No token provided" });
  }
  const decoded = verifyJwt(token);
  if (!decoded) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid token",
    });
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: decoded,
    },
  });
});
