import {
  Controller,
  Post,
  Get,
  Param,
  UnprocessableEntityException,
} from '@nestjs/common'
import { VoiceUploadService, TranscribeError } from './voice-upload.service'

/**
 * VoiceController — transcription retry and audio URL endpoints.
 *
 * The primary upload path is POST /api/chat/upload (existing FE integration).
 * This controller adds the retry flow: when Groq fails the FE calls
 * POST /api/voice/retry/:fileId, gets the transcription text back, then
 * completes the chat send via the normal POST /api/chat/message endpoint.
 *
 * Two-step FE flow on retry:
 *   1. POST /api/voice/retry/:fileId  →  { text, fileId }
 *   2. POST /api/chat/message          →  { content: text, ...rest }
 */
@Controller('voice')
export class VoiceController {
  constructor(private readonly voiceUpload: VoiceUploadService) {}

  /**
   * POST /api/voice/retry/:fileId
   * Re-transcribes a stored audio file without re-upload.
   * Returns the transcription text on success so the FE can complete the chat.
   */
  @Post('retry/:fileId')
  async retry(@Param('fileId') fileId: string) {
    try {
      const { text, fileId: id } = await this.voiceUpload.retryTranscription(fileId)
      return { ok: true, text, fileId: id }
    } catch (err: unknown) {
      const te = err as TranscribeError
      if (te.retryable) {
        throw new UnprocessableEntityException({
          error: 'TranscriptionFailed',
          message: te.message,
          fileId,
          retryable: true,
        })
      }
      throw err
    }
  }

  /**
   * GET /api/voice/files/:fileId/url
   * Returns a 1-hour signed URL to play back the stored audio file.
   */
  @Get('files/:fileId/url')
  async getAudioUrl(@Param('fileId') fileId: string) {
    const url = await this.voiceUpload.getAudioUrl(fileId)
    return { url }
  }
}
