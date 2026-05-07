import {
  Controller, Get, Post, Delete, Param, Body, Headers,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { RecordingsService } from './recordings.service'

const DEFAULT_WORKSPACE = '60f84f03-283e-4c1a-8c88-b8330dc71d32'

@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  /**
   * POST /api/recordings/upload  (multipart/form-data)
   * Fields: file (audio blob), title (string), duration (number string)
   *
   * Uploads via server-side Supabase SDK, bypasses bucket RLS entirely.
   * This is the primary upload path; the old presign flow is removed.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; duration?: string },
    @Headers('x-user-id') userId: string,
  ) {
    if (!file) throw new BadRequestException('No audio file provided')
    return this.recordingsService.upload(userId, file, {
      title: body.title || `Recording ${new Date().toLocaleTimeString('en-PH')}`,
      duration: body.duration ? Math.round(Number(body.duration)) : null,
      workspaceId: DEFAULT_WORKSPACE,
    })
  }

  @Get()
  findAll(@Headers('x-user-id') userId: string) {
    return this.recordingsService.findAll(userId)
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ) {
    return this.recordingsService.remove(id, userId)
  }
}
