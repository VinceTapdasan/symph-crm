import { Controller, Get, Query } from '@nestjs/common'
import { PipelineService } from './pipeline.service'

@Controller('pipeline')
export class PipelineController {
  constructor(private readonly pipelineService: PipelineService) {}

  /**
   * GET /api/pipeline/summary
   * Returns aggregated KPI data for the dashboard:
   * totalDeals, activeDeals, totalPipeline, avgDealSize, winRate, dealsByStage
   *
   * Optional query params `from` and `to` (ISO date strings) filter by created_at.
   */
  @Get('summary')
  getSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pipelineService.getSummary({ from, to })
  }

  /**
   * GET /api/pipeline/funnel
   * Returns historical stage conversion funnel derived from audit_logs.
   * Each stage shows entry count (unique deals that ever reached it) and
   * conversion rate to the next stage. Terminal stages (closed_won, closed_lost)
   * are returned as separate wonCount / lostCount fields.
   *
   * Optional query params `from` and `to` (ISO date strings) filter by audit log date.
   */
  @Get('funnel')
  getFunnel(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pipelineService.getFunnel({ from, to })
  }
}
