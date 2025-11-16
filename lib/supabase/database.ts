import { createServerClient } from './clients'
import { Database } from '@/types/database'

// Server-side database operations
export class DatabaseService {
  private supabase = createServerClient()

  // Quotes operations
  async createQuote(quoteData: Database['public']['Tables']['quotes']['Insert']) {
    const { data, error } = await this.supabase
      .from('quotes')
      .insert(quoteData)
      .select()
      .single()

    return { data, error }
  }

  async getQuotesByCustomer(customerId: string) {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async getQuotesByContractor(contractorId: string) {
    const { data, error } = await this.supabase
      .from('quotes')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async updateQuote(id: string, updates: Database['public']['Tables']['quotes']['Update']) {
    const { data, error } = await this.supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  // Temp quotes operations
  async createTempQuote(tempQuoteData: Database['public']['Tables']['temp_quotes']['Insert']) {
    const { data, error } = await this.supabase
      .from('temp_quotes')
      .insert(tempQuoteData)
      .select()
      .single()

    return { data, error }
  }

  async getTempQuoteBySession(sessionId: string) {
    const { data, error } = await this.supabase
      .from('temp_quotes')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    return { data, error }
  }

  async updateTempQuote(id: string, updates: Database['public']['Tables']['temp_quotes']['Update']) {
    const { data, error } = await this.supabase
      .from('temp_quotes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  async deleteTempQuote(id: string) {
    const { error } = await this.supabase
      .from('temp_quotes')
      .delete()
      .eq('id', id)

    return { error }
  }

  // Pros operations
  async createPro(proData: Database['public']['Tables']['pros']['Insert']) {
    const { data, error } = await this.supabase
      .from('pros')
      .insert(proData)
      .select()
      .single()

    return { data, error }
  }

  async getProByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('pros')
      .select('*')
      .eq('user_id', userId)
      .single()

    return { data, error }
  }

  async getVerifiedPros() {
    const { data, error } = await this.supabase
      .from('pros')
      .select('*')
      .eq('is_verified', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async updatePro(id: string, updates: Database['public']['Tables']['pros']['Update']) {
    const { data, error } = await this.supabase
      .from('pros')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  // Portfolio operations
  async createPortfolio(portfolioData: Database['public']['Tables']['portfolios']['Insert']) {
    const { data, error } = await this.supabase
      .from('portfolios')
      .insert(portfolioData)
      .select()
      .single()

    return { data, error }
  }

  async getPortfoliosByContractor(contractorId: string) {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('contractor_id', contractorId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async getFeaturedPortfolios() {
    const { data, error } = await this.supabase
      .from('portfolios')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async updatePortfolio(id: string, updates: Database['public']['Tables']['portfolios']['Update']) {
    const { data, error } = await this.supabase
      .from('portfolios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  async deletePortfolio(id: string) {
    const { error } = await this.supabase
      .from('portfolios')
      .delete()
      .eq('id', id)

    return { error }
  }

  // Reviews operations
  async createReview(reviewData: Database['public']['Tables']['reviews']['Insert']) {
    const { data, error } = await this.supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single()

    return { data, error }
  }

  async getReviewsByContractor(contractorId: string) {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('contractor_id', contractorId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async getReviewsByCustomer(customerId: string) {
    const { data, error } = await this.supabase
      .from('reviews')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async updateReview(id: string, updates: Database['public']['Tables']['reviews']['Update']) {
    const { data, error } = await this.supabase
      .from('reviews')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  // Events operations
  async createEvent(eventData: Database['public']['Tables']['events']['Insert']) {
    const { data, error } = await this.supabase
      .from('events')
      .insert(eventData)
      .select()
      .single()

    return { data, error }
  }

  async getActiveEvents() {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true })

    return { data, error }
  }

  async updateEvent(id: string, updates: Database['public']['Tables']['events']['Update']) {
    const { data, error } = await this.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    return { data, error }
  }

  async deleteEvent(id: string) {
    const { error } = await this.supabase
      .from('events')
      .delete()
      .eq('id', id)

    return { error }
  }

  // User operations
  async getUserRole(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_role', {
      user_id: userId
    })

    return { data, error }
  }

  async isAdmin(userId: string) {
    const { data, error } = await this.supabase.rpc('is_admin', {
      user_id: userId
    })

    return { data, error }
  }

  async updateUserRole(userId: string, newRole: string) {
    const { data, error } = await this.supabase.rpc('update_user_role', {
      user_id: userId,
      new_role: newRole
    })

    return { data, error }
  }
}

// Export singleton instance
export const db = new DatabaseService()
