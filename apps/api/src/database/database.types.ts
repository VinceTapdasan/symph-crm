import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from '@symph-crm/database'

export type Database = ReturnType<typeof drizzle<typeof schema>>
