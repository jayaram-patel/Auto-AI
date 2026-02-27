import { protectedProcedure } from "../trpc";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { TRPCError } from "@trpc/server";
import { ModelService } from "src/services/model";
import fs from "fs";

const execAsync = promisify(exec);

async function executePythonInference(
  modelPath: string,
  inputData: Record<string, any>
): Promise<any> {
  const pythonScript = path.join(process.cwd(), "models", "inference.py");

  if (!fs.existsSync(modelPath)) {
    throw new Error(`Model file not found at path: ${modelPath}`);
  }

  if (!fs.existsSync(pythonScript)) {
    throw new Error(`Inference script not found at path: ${pythonScript}`);
  }

  try {
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpInputFile = path.join(
      tmpDir,
      `input_${Date.now()}_${Math.random().toString(36).substring(7)}.json`
    );
    fs.writeFileSync(tmpInputFile, JSON.stringify(inputData));

    try {
      const command = `uv run --with joblib --with pandas --with numpy --with scikit-learn python "${pythonScript}" "${modelPath}" "${tmpInputFile}"`;

      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 10 * 1024 * 1024,
      });

      fs.unlinkSync(tmpInputFile);

      if (stderr && !stdout) {
        throw new Error(`Python script error: ${stderr}`);
      }

      try {
        const result = JSON.parse(stdout);
        return result;
      } catch (error) {
        throw new Error(
          `Failed to parse Python output: ${error}. Output: ${stdout}`
        );
      }
    } catch (error: any) {
      if (fs.existsSync(tmpInputFile)) {
        fs.unlinkSync(tmpInputFile);
      }
      throw error;
    }
  } catch (error: any) {
    throw new Error(
      `Failed to execute Python inference: ${error.message || error}`
    );
  }
}

/**
 * Inference route - make a prediction with a trained model
 */
export const inferenceRoute = protectedProcedure
  .input(
    z.object({
      modelId: z.string(),
      input: z.record(z.string(), z.any()),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const { modelId, input: inputData } = input;
    const userId = ctx.user.sub;

    const model = await ctx.db.models.findFirst({
      where: {
        id: modelId,
        userId: userId,
      },
    });

    if (!model) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Model not found or you don't have access to it",
      });
    }

    if (model.state !== "READY") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Model is not ready for inference. Current state: ${model.state}`,
      });
    }

    try {
      const modelPath = ModelService.getInstance().getModelPath(modelId);

      ctx.logger.info("Starting inference", {
        modelId,
        modelPath,
        inputData,
      });

      const result = await executePythonInference(modelPath, inputData);

      ctx.logger.info("Inference completed successfully", result);

      const inferenceRecord = await ctx.db.inferences.create({
        data: {
          modelId: modelId,
          userId: userId,
          input: inputData as any,
          output: result as any,
        },
      });

      return {
        id: inferenceRecord.id,
        modelId: inferenceRecord.modelId,
        input: inferenceRecord.input,
        output: inferenceRecord.output,
        createdAt: inferenceRecord.createdAt,
      };
    } catch (error: any) {
      ctx.logger.error("Inference failed", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to run inference",
      });
    }
  });

/**
 * Get inference history for the current user
 */
export const inferenceHistoryRoute = protectedProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
      modelId: z.string().optional(),
    })
  )
  .query(async ({ ctx, input }) => {
    const { limit, offset, modelId } = input;
    const userId = ctx.user.sub;

    const whereClause: any = {
      userId: userId,
    };

    if (modelId) {
      whereClause.modelId = modelId;
    }

    const [inferences, total] = await Promise.all([
      ctx.db.inferences.findMany({
        where: whereClause,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
      }),
      ctx.db.inferences.count({
        where: whereClause,
      }),
    ]);

    return {
      inferences: inferences.map(
        (inf: {
          id: any;
          modelId: any;
          input: any;
          output: any;
          createdAt: any;
        }) => ({
          id: inf.id,
          modelId: inf.modelId,
          input: inf.input,
          output: inf.output,
          createdAt: inf.createdAt,
        })
      ),
      total,
      limit,
      offset,
    };
  });

/**
 * Get a specific inference by ID
 */
export const getInferenceRoute = protectedProcedure
  .input(z.string())
  .query(async ({ ctx, input }) => {
    const inferenceId = input;
    const userId = ctx.user.sub;

    const inference = await ctx.db.inferences.findFirst({
      where: {
        id: inferenceId,
        userId: userId,
      },
    });

    if (!inference) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Inference record not found",
      });
    }

    return {
      id: inference.id,
      modelId: inference.modelId,
      input: inference.input,
      output: inference.output,
      createdAt: inference.createdAt,
    };
  });
