import { AgentService } from "src/services/train/agent";
import { UploadService } from "src/services/upload";
import { protectedProcedure } from "src/trpc";
import z from "zod";
import crypto from "crypto";
import { ModelState } from "@prisma/client";
import { ModelService } from "src/services/model";

export const trainRoute = protectedProcedure
    .input(z.string()) 
    .mutation(async ({ ctx, input }) => {
        const jobId = crypto.randomBytes(12).toString("hex");
        const datasetPath = UploadService.getInstance().buildDatasetLocation(input);
        const agentService = new AgentService(datasetPath, jobId);

        setImmediate(async () => {
            ctx.logger.info("Started training on dataset path", datasetPath);
            const result = await agentService.run();
            ctx.logger.info("Training result", result);
            await ModelService.getInstance().moveModel(result.modelPath, jobId);
            ctx.logger.debug("Model moved successfully!");
            await ctx.db.models.update({
                data: {
                    accuracy: result.accuracy,
                    description: result.description,
                    name: result.name,
                    inputs: result.inputs,
                    state: ModelState.READY,
                    modelType: result.model_type,
                    thoughts: result.thoughts,
                },
                where: {
                    id: jobId,
                }
            });
            ctx.logger.info("Model updated successfully!");
            await agentService.cleanup();
            ctx.logger.info("Agent service cleaned up!");
        });

        await ctx.db.models.create({
            data: {
                id: jobId,
                userId: ctx.user.sub,
                state: ModelState.TRAINING,
            }
        })

        return {
            jobId,
        };
    });