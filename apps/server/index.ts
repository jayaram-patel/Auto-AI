import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { createContext, t } from "./src/trpc";
import { statsRoute } from "./src/routes/stats";
import cors from "cors";
import { modelsRoute } from "./src/routes/models";
import { uploadRoute } from "./src/routes/upload";
import { trainRoute } from "src/routes/train";
import { inferenceRoute, inferenceHistoryRoute, getInferenceRoute } from "./src/routes/inference";

const app = express();

const PORT = process.env.PORT || 3000;

const appRouter = t.router({
  stats: statsRoute,
  models: modelsRoute,
  upload: uploadRoute,
  train: trainRoute,
  inference: inferenceRoute,
  inferenceHistory: inferenceHistoryRoute,
  getInference: getInferenceRoute,
});

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use("/trpc-panel", async (_: any, res: { send: (arg0: string) => any; }) => {
  const { renderTrpcPanel } = await import("trpc-ui");
  return res.send(renderTrpcPanel(appRouter, { url: "/trpc" }));
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
export type AppRouter = typeof appRouter;
