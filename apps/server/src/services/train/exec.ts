import { exec, type ExecOptions } from "child_process";

export class Exec {
  private _workingDir: string;
  constructor(workingDir: string) {
    this._workingDir = workingDir;
  }
  async execAsync(
    command: string,
    options: ExecOptions = {
      cwd: this._workingDir,
    }
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = exec(
        command,
        {
          ...options,
          cwd: this._workingDir,
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Command failed: ${error.message}`));
            return;
          }
          resolve(stdout.toString() + stderr.toString());
        }
      );
    });
  }
}
