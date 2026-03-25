import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common'
import { NotesService } from './notes.service'
import { notes } from '@symph-crm/database'

@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  find(@Query('dealId') dealId?: string, @Query('companyId') companyId?: string) {
    if (dealId) return this.notesService.findByDeal(dealId)
    if (companyId) return this.notesService.findByCompany(companyId)
    return []
  }

  @Post()
  create(@Body() data: typeof notes.$inferInsert) {
    return this.notesService.create(data)
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<typeof notes.$inferInsert>) {
    return this.notesService.update(id, data)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notesService.remove(id)
  }
}
