import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export class ModelService {
    private static instance: ModelService;
    private modelDir = path.join(process.cwd(), "models");

    constructor() {
        if (!fs.existsSync(this.modelDir)) {
            fs.mkdirSync(this.modelDir, { recursive: true });
        }
    }

    public static getInstance(): ModelService {
        if (!ModelService.instance) {
            ModelService.instance = new ModelService();
        }
        return ModelService.instance;
    }

    public getModelPath(modelId: string): string {
        return path.join(this.modelDir, `${modelId}.joblib`);
    }

    public getModelDir(): string {
        return this.modelDir;
    }

    async moveModel(modelPath : string, jobId : string) {
        const destinationPath = path.join(this.modelDir, jobId) + ".joblib";
        
        try {
            return await fsPromises.rename(modelPath, destinationPath);
        } catch (error: any) {
            // WIndows bypass
            if (error.code === 'EXDEV') {
                await fsPromises.copyFile(modelPath, destinationPath);
                await fsPromises.unlink(modelPath);
                return destinationPath;
            }
            throw error;
        }
    }

}