import { Module } from '@nestjs/common'
import { InternalProductsController } from './internal-products.controller'
import { InternalProductsService } from './internal-products.service'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [StorageModule],
  controllers: [InternalProductsController],
  providers: [InternalProductsService],
  exports: [InternalProductsService],
})
export class InternalProductsModule {}
