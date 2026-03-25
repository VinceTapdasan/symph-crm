import { Controller, Post, Get, Param, Body } from '@nestjs/common'
import { ChatService, ChatMessageDto } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * POST /api/chat/message
   * Main endpoint: send a message to the AI, get a reply + list of actions taken.
   */
  @Post('message')
  sendMessage(@Body() dto: ChatMessageDto) {
    return this.chatService.sendMessage(dto)
  }

  /**
   * GET /api/chat/sessions/:sessionId/history
   * Returns the full message history for a session.
   */
  @Get('sessions/:sessionId/history')
  getHistory(@Param('sessionId') sessionId: string) {
    return this.chatService.getHistory(sessionId)
  }
}
