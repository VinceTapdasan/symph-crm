import { Module } from '@nestjs/common'
import { ChatController } from './chat.controller'
import { ChatService } from './chat.service'
import { CompaniesModule } from '../companies/companies.module'
import { DocumentsModule } from '../documents/documents.module'

@Module({
  imports: [CompaniesModule, DocumentsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
