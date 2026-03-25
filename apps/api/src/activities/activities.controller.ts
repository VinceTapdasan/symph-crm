import { Controller, Get, Query } from '@nestjs/common'
import { ActivitiesService } from './activities.service'

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  find(@Query('dealId') dealId?: string, @Query('companyId') companyId?: string) {
    if (dealId) return this.activitiesService.findByDeal(dealId)
    if (companyId) return this.activitiesService.findByCompany(companyId)
    return []
  }
}
