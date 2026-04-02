import { Controller, Get, Patch, Param, Headers } from '@nestjs/common'
import { NotificationsService } from './notifications.service'

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@Headers('x-user-id') userId: string) {
    return this.notificationsService.getForUser(userId)
  }

  @Patch('read-all')
  markAllRead(@Headers('x-user-id') userId: string) {
    return this.notificationsService.markAllRead(userId)
  }

  @Patch(':id/read')
  markOneRead(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.notificationsService.markOneRead(id, userId)
  }
}
