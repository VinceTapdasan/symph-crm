import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { DealsService } from './deals.service'
import { deals } from '@symph-crm/database'

@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  findAll() {
    return this.dealsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id)
  }

  @Post()
  create(@Body() data: typeof deals.$inferInsert) {
    return this.dealsService.create(data)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<typeof deals.$inferInsert>) {
    return this.dealsService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dealsService.remove(id)
  }
}
