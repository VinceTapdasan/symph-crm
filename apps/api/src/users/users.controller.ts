import { Controller, Post, Patch, Get, Body, Param } from '@nestjs/common'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /api/users/sync
   * Called by NextAuth jwt callback on every first sign-in.
   * Upserts the Google OAuth user into public.users and returns full user record
   * (including role and isOnboarded) so the JWT can be enriched.
   */
  @Post('sync')
  sync(@Body() body: { id: string; email: string; name?: string; image?: string }) {
    return this.usersService.sync(body)
  }

  /**
   * PATCH /api/users/onboarding
   * Complete the onboarding profile for a user.
   * Sets name fields and flips isOnboarded to true.
   */
  @Patch('onboarding')
  completeOnboarding(
    @Body()
    body: {
      id: string
      firstName: string
      middleName: string
      lastName: string
      nickname?: string
    },
  ) {
    return this.usersService.completeOnboarding(body.id, body)
  }

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id)
  }
}
