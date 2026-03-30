import { Module } from '@nestjs/common'
import { GmailController } from './gmail.controller'
import { GmailService } from './gmail.service'
import { CalendarModule } from '../calendar/calendar.module'

@Module({
  imports: [CalendarModule],
  controllers: [GmailController],
  providers: [GmailService],
  exports: [GmailService],
})
export class GmailModule {}
