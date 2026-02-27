import os from "os";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { Logger } from "../../utils/logger";
import config from "../../config";

export class FileSystemService {
  private _workingDir: string;
  private _datasetPath: string;
  constructor(datasetPath: string, jobId: string) {
    const base = os.tmpdir();
    const prefix = "auto_ai_";
    this._workingDir = path.join(base, prefix + jobId);
    fs.mkdirSync(this._workingDir, { recursive: true });
    this._datasetPath = datasetPath;
  }
  getWorkingDir() {
    return this._workingDir;
  }

  async copyDataset() {
    const datasetPath = path.join(this._workingDir, "dataset.csv");
    await fsPromises.copyFile(this._datasetPath, datasetPath);
  }

  async writePythonFile(code: string) {
    const pythonFilePath = path.join(this._workingDir, "main.py");
    await fsPromises.writeFile(pythonFilePath, code);
  }

  async cleanup() {
    Logger.warn("Cleaning up working directory", this._workingDir);
    await fsPromises.rm(this._workingDir, { recursive: true });
  }
  readFirstNLinesOfDatabase(){
    const datasetPath = path.join(this._workingDir, "dataset.csv");
    const file = fs.readFileSync(datasetPath, "utf8");
    const lines = file.split("\n");
    return lines.slice(0, config.FIRST_N).join("\n");
  }
}
