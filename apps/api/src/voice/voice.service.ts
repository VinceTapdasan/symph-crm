import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Groq from 'groq-sdk'
import { toFile } from 'groq-sdk/uploads'

const SUPPORTED_AUDIO_TYPES = new Set([
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/x-m4a',
])

// Extension from mimetype for Groq upload filename
const MIME_TO_EXT: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
  'audio/x-m4a': 'm4a',
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name)
  private groq: Groq | null = null

  constructor(private config: ConfigService) {
    const key = config.get<string>('GROQ_API_KEY')
    if (key) {
      this.groq = new Groq({ apiKey: key })
      this.logger.log('Groq Whisper initialized')
    } else {
      this.logger.warn('GROQ_API_KEY not configured — voice transcription is disabled.')
    }
  }

  get isConfigured(): boolean {
    return this.groq !== null
  }

  canTranscribe(mimetype: string): boolean {
    const base = mimetype.split(';')[0].trim()
    return SUPPORTED_AUDIO_TYPES.has(base) || SUPPORTED_AUDIO_TYPES.has(mimetype)
  }

  async transcribe(buffer: Buffer, mimetype: string, filename?: string): Promise<string> {
    if (!this.groq) {
      throw new Error('Voice transcription is not configured. Add GROQ_API_KEY to environment.')
    }

    const baseMime = mimetype.split(';')[0].trim()
    const ext = MIME_TO_EXT[baseMime] ?? 'webm'
    const uploadFilename = filename ?? `audio.${ext}`

    this.logger.log(`Transcribing audio: ${uploadFilename} (${buffer.length} bytes)`)

    const audioFile = await toFile(buffer, uploadFilename, { type: mimetype })

    const transcription = await this.groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo', // best quality / speed balance
      language: 'en',
      response_format: 'text',
    })

    // groq returns string when response_format is 'text'
    const text = (transcription as unknown as string).trim()
    this.logger.log(`Transcription complete: ${text.length} chars`)
    return text
  }
}
