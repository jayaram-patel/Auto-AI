import path from "path";
import fs from "fs";
import crypto from "crypto";

export class UploadService {
  private _uploadsDir = path.join(process.cwd(), "uploads");
  private static instance: UploadService;

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService();
    }
    return UploadService.instance;
  }

  constructor() {
    fs.mkdirSync(this._uploadsDir, { recursive: true });
  }

  async upload(base64: string)  {
    const fileId = crypto.randomBytes(12).toString("hex");
    const buffer = Buffer.from(base64, "base64");
    const filePath = this.buildDatasetLocation(fileId);
    await fs.promises.writeFile(filePath, buffer);
    return  {filePath, fileId}
  }

   buildDatasetLocation(fileId: string) {
    const filePath = path.join(this._uploadsDir, `${fileId}.csv`);
    return filePath;
  }
}
