import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { DealsModule } from './deals/deals.module'
import { CompaniesModule } from './companies/companies.module'
import { ContactsModule } from './contacts/contacts.module'
import { NotesModule } from './notes/notes.module'
import { ActivitiesModule } from './activities/activities.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    DatabaseModule,
    DealsModule,
    CompaniesModule,
    ContactsModule,
    NotesModule,
    ActivitiesModule,
  ],
})
export class AppModule {}
