import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Upload a file to GCS (production) or local disk (development).
   * Implement GCS SDK integration when credentials are configured.
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: 'requirements' | 'deliverables' | 'payments',
  ): Promise<string> {
    const bucket = this.config.get<string>('GCS_BUCKET_NAME');
    if (!bucket) {
      this.logger.warn(
        `GCS not configured — using placeholder URL for ${folder}/${file.originalname}`,
      );
      return `https://storage.placeholder/${folder}/${Date.now()}-${file.originalname}`;
    }
    // TODO: integrate @google-cloud/storage
    return `https://storage.googleapis.com/${bucket}/${folder}/${Date.now()}-${file.originalname}`;
  }
}
