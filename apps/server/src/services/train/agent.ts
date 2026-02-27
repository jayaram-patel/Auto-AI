import { FileSystemService } from "./filesystem";
import { UvService } from "./uv";
import { LLMService } from "./llm";
import { tryCatch } from "../../utils/try-catch";
import type { IConfig, TModelSettings } from "../../types/config";

export class AgentService {
  private fileSystemService: FileSystemService;
  private uvService: UvService;
  private llmService?: LLMService;
  private config: IConfig;
  private jobId: string;

  constructor(datasetLocation: string, jobId : string) {
    this.jobId = jobId;
    this.fileSystemService = new FileSystemService(datasetLocation, jobId);
    this.uvService = new UvService(this.fileSystemService.getWorkingDir());
    this.config = {
      workingDir: this.fileSystemService.getWorkingDir(),
    };
  }

  async run(): Promise<TModelSettings & { modelPath: string }> {
    const { error: copyError } = await tryCatch(
      async () => await this.fileSystemService.copyDataset()
    );
    if (copyError) {
      console.error("Error copying dataset", copyError);
      process.exit(1);
    }

    const { error: instantiateError } = await tryCatch(
      async () => await this.uvService.instantiate()
    );
    if (instantiateError) {
      console.error("Error instantiating uv", instantiateError);
      process.exit(1);
    }

    this.llmService = new LLMService(this.uvService, this.fileSystemService);

    const result = await this.llmService.start(
      this.fileSystemService.readFirstNLinesOfDatabase()
    );

    return {
      ...(this.llmService.getModelSettings() as TModelSettings),
      modelPath: this.fileSystemService.getWorkingDir() + "/trained_model.joblib",
    };
  }

  async cleanup() {
    await this.fileSystemService.cleanup();
  }
}
