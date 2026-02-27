import { Exec } from "./exec";
import { Logger } from "../../utils/logger";
export class UvService {
  private _workingDir: string;
  private _exec: Exec;
  constructor(workingDir: string) {
    this._workingDir = workingDir;
    this._exec = new Exec(workingDir);
  }

  async instantiate() {
    await this._exec.execAsync("uv init");
    await this._exec.execAsync("uv venv");
  }

  async installReqs(requirements: string[]) {
    const response = await this._exec.execAsync(
      `uv add ${requirements.join(" ")}`
    );
    Logger.info("Installed requirements", response);
    return response;
  }
  async runPythonFile() {
    const response = await this._exec.execAsync(`uv run main.py`);
    Logger.info("Ran Python file", response);
    return response;
  }
}
