import { Module } from '@nestjs/common'
import { VoiceService } from './voice.service'
import { VoiceUploadService } from './voice-upload.service'
import { VoiceController } from './voice.controller'

@Module({
  controllers: [VoiceController],
  providers: [VoiceService, VoiceUploadService],
  exports: [VoiceService, VoiceUploadService],
})
export class VoiceModule {}
