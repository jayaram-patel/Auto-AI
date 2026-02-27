import { protectedProcedure, t } from "../trpc";
import z from "zod";

export const statsRoute = protectedProcedure
  .output(
    z.object({
      totalModels: z.number(),
      totalDatasets: z.number(),
      predictions: z.number(),
      avgAccuracy: z.float32(),
    })
  )
  .query(async ({ ctx }) => {
    const userId = ctx.user?.sub;
    const [totalModels, totalDatasets, predictions, avgAccuracy] =
      await Promise.all([
        ctx.db.models.count({ where: { userId } }),
        ctx.db.datasets.count({ where: { userId } }),
        ctx.db.inferences.count({ where: { userId } }),
        ctx.db.models.aggregate({
          where: { userId },
          _avg: {
            accuracy: true,
          },
        }),
      ]);
    return {
      totalModels,
      totalDatasets,
      predictions,
      avgAccuracy: avgAccuracy._avg.accuracy ?? 0,
    };
  });
