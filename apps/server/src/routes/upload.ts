import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { UploadService } from "../services/upload";

export const uploadRoute = protectedProcedure
  .input(
    z.object({
      base64: z.string(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { base64 } = input;
    const { user } = ctx;
    const { fileId, filePath } = await UploadService.getInstance().upload(
      base64
    );
    await ctx.db.datasets.create({
      data: {
        id: fileId,
        userId: user.sub,
        path: filePath,
      },
    });
    return {
      success: true,
      id: fileId,
    };
  });
