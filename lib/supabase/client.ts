import { createBrowserClient } from './clients'

/**
 * Client-side Supabase client
 * Use this in React components and client-side code
 */
export const createClient = createBrowserClient

// Re-export for convenience
export { createBrowserClient } from './clients'
