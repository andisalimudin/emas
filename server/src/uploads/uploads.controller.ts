import { BadRequestException, Controller, ForbiddenException, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as crypto from 'crypto';
import * as path from 'path';

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function extensionFromMime(mime: string) {
  const m = (mime || '').toLowerCase();
  if (m === 'application/pdf') return '.pdf';
  if (m === 'image/jpeg') return '.jpg';
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  return '';
}

@Controller('uploads')
@UseGuards(AuthGuard('jwt'))
export class UploadsController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (_req, file, cb) => {
          const originalExt = path.extname(file.originalname || '').toLowerCase();
          const ext = originalExt || extensionFromMime(file.mimetype);
          cb(null, `${crypto.randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const m = (file?.mimetype || '').toLowerCase();
        const ok =
          m === 'application/pdf' ||
          m === 'image/jpeg' ||
          m === 'image/png' ||
          m === 'image/webp' ||
          m === 'image/gif';
        cb(ok ? null : new BadRequestException('Fail mesti gambar atau PDF'), ok);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(@Req() req: any, @UploadedFile() file?: any) {
    if (!req?.user) {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    if (!file?.filename) {
      throw new BadRequestException('Fail tidak ditemui');
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return { url: `${baseUrl}/uploads/${file.filename}` };
  }
}
