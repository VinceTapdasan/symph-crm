import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { StorageModule } from './storage/storage.module'
import { DealsModule } from './deals/deals.module'
import { CompaniesModule } from './companies/companies.module'
import { ContactsModule } from './contacts/contacts.module'
import { DocumentsModule } from './documents/documents.module'
import { ActivitiesModule } from './activities/activities.module'
import { ChatModule } from './chat/chat.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    DatabaseModule,
    StorageModule,
    DealsModule,
    CompaniesModule,
    ContactsModule,
    DocumentsModule,
    ActivitiesModule,
    ChatModule,
  ],
})
export class AppModule {}
