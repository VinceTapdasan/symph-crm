import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { CompaniesModule } from '../companies/companies.module'
import { DocumentsModule } from '../documents/documents.module'
import { FileParserModule } from '../file-parser/file-parser.module'
import { VoiceModule } from '../voice/voice.module'

@Module({
  imports: [CompaniesModule, DocumentsModule, FileParserModule, VoiceModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
