import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { companies } from '@symph-crm/database'

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id)
  }

  @Post()
  create(@Body() data: typeof companies.$inferInsert) {
    return this.companiesService.create(data)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<typeof companies.$inferInsert>) {
    return this.companiesService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id)
  }
}
