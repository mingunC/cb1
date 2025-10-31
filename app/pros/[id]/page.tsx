'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/clients'
import { 
  Star, Award, Calendar, Users, 
  CheckCircle, Phone, Mail, Globe, Clock, Building,
  Briefcase, Shield, ChevronLeft, X, MessageCircle, Image as ImageIcon,
  ArrowLeft, Reply, Edit2, Trash2
} from 'lucide-react'
import Link from 'next/link'
import ReviewForm from '@/components/ReviewForm'
import toast from 'react-hot-toast'

interface Contractor {
  id: string
  company_name: string
  contact_name: string
  phone: string
  email: string
  website?: string
  company_logo?: string
  description?: string
  years_in_business?: number
  specialties?: string[]
  rating?: number
  portfolio_count?: number
  status?: string
  created_at: string
  logo_url?: string
  cover_image?: string
  established_year?: number
  employee_count?: string
  service_areas: string[]
  certifications: string[]
  review_count: number
  completed_projects: number
  response_time?: string
  min_budget?: number
  is_verified: boolean
  is_premium: boolean
}

interface Review {
  id: string
  contractor_id: string
  customer_id: string
  quote_id: string | null
  rating: number | null
  title: string
  comment: string
  photos: string[]
  is_verified: boolean
  created_at: string
  contractor_reply: string | null
  contractor_reply_date: string | null
  customer: {
    first_name: string | null
    last_name: string | null
    email: string
  }
}

export default function ContractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const contractorId = params.id as string
  
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])