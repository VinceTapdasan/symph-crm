import { Module } from '@nestjs/common'
import { ProposalsController } from './proposals.controller'
import { PublicProposalsController } from './public-proposals.controller'
import { ProposalsService } from './proposals.service'
import { AuditLogsModule } from '../audit-logs/audit-logs.module'

// StorageModule is @Global() — no need to import.
@Module({
  imports: [AuditLogsModule],
  controllers: [ProposalsController, PublicProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}
