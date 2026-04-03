import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { DocumentsModule } from '../documents/documents.module'
import { FileParserModule } from '../file-parser/file-parser.module'
import { VoiceModule } from '../voice/voice.module'

@Module({
  imports: [
    DocumentsModule,
    FileParserModule,
    VoiceModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService, VoiceModule],
})
export class ChatModule {}
