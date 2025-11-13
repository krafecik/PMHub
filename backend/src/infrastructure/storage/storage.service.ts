import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class StorageService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;
  private readonly maxTotalSize: number;
  private readonly allowedMimeTypes: string[];

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.maxFileSize = this.configService.get<number>('UPLOAD_MAX_FILE_SIZE', 10485760); // 10MB
    this.maxTotalSize = this.configService.get<number>('UPLOAD_MAX_TOTAL_SIZE', 52428800); // 50MB
    this.allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
  }

  async uploadFile(
    file: Express.Multer.File,
    tenantId: string,
    userId: string,
  ): Promise<UploadResult> {
    // Validações
    if (file.size > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.maxFileSize} bytes`);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error('Tipo de arquivo não permitido');
    }

    // Gerar nome único
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${tenantId}/${userId}/${Date.now()}-${uniqueSuffix}${ext}`;

    // Criar estrutura de diretórios
    const fullPath = path.join(this.uploadDir, filename);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    // Salvar arquivo
    await fs.writeFile(fullPath, file.buffer);

    return {
      url: `/uploads/${filename}`,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const filename = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(this.uploadDir, filename);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Arquivo já não existe, ignorar erro
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getFileStream(fileUrl: string): Promise<Buffer> {
    const filename = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(this.uploadDir, filename);
    return fs.readFile(fullPath);
  }

  isValidFileSize(size: number): boolean {
    return size <= this.maxFileSize;
  }

  isValidMimeType(mimeType: string): boolean {
    return this.allowedMimeTypes.includes(mimeType);
  }
}
