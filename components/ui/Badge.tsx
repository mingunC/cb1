import { forwardRef, type HTMLAttributes } from 'react'

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'in-progress'
  | 'completed'
  | 'bidding'
  | 'site-visit-applied'
  | 'site-visit-pending'
  | 'site-visit-completed'
  | 'quote-submitted'
  | 'not-selected'
  | 'failed-bid'
  | 'cancelled'
  | 'bidding-closed'
  | 'contractor-selected'

type BadgeSize = 'sm' | 'md' | 'lg'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  bidding: 'bg-purple-100 text-purple-800',
  'site-visit-applied': 'bg-purple-100 text-purple-800',
  'site-visit-pending': 'bg-blue-100 text-blue-800',
  'site-visit-completed': 'bg-indigo-100 text-indigo-800',
  'quote-submitted': 'bg-yellow-100 text-yellow-800',
  'not-selected': 'bg-orange-100 text-orange-800',
  'failed-bid': 'bg-red-100 text-red-800',
  cancelled: 'bg-red-100 text-red-800',
  'bidding-closed': 'bg-indigo-100 text-indigo-800',
  'contractor-selected': 'bg-emerald-100 text-emerald-800',
}

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
}

/**
 * Primitive badge component used throughout the app.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-full transition-colors',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
)

Badge.displayName = 'Badge'

interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: string
  label?: string
}

const STATUS_VARIANT_MAP: Record<string, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'pending', label: 'Pending' },
  approved: { variant: 'approved', label: 'Approved' },
  rejected: { variant: 'rejected', label: 'Rejected' },
  'in-progress': { variant: 'in-progress', label: 'In Progress' },
  'in_progress': { variant: 'in-progress', label: 'In Progress' },
  completed: { variant: 'completed', label: 'Completed' },
  bidding: { variant: 'bidding', label: 'Bidding' },
  'site-visit-applied': { variant: 'site-visit-applied', label: 'Site Visit Applied' },
  'site-visit-completed': { variant: 'site-visit-completed', label: 'Site Visit Completed' },
  'site-visit-pending': { variant: 'site-visit-pending', label: 'Site Visit Pending' },
  'quote-submitted': { variant: 'quote-submitted', label: 'Quote Submitted' },
  selected: { variant: 'approved', label: 'Selected' },
  'not-selected': { variant: 'not-selected', label: 'Not Selected' },
  'failed-bid': { variant: 'failed-bid', label: 'Failed Bid' },
  cancelled: { variant: 'cancelled', label: 'Cancelled' },
  'bidding-closed': { variant: 'bidding-closed', label: 'Bidding Closed' },
  'contractor-selected': { variant: 'contractor-selected', label: 'Contractor Selected' },
  open: { variant: 'info', label: 'Open' },
}

const formatStatusLabel = (status: string) =>
  status
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())

/**
 * Convenience component that maps a status string to a styled badge.
 */
export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, label, size = 'sm', className, ...props }, ref) => {
    const normalized = status?.toLowerCase() ?? ''
    const config = STATUS_VARIANT_MAP[normalized]

    const badgeLabel = label ?? config?.label ?? formatStatusLabel(status)
    const variant = config?.variant ?? 'default'

    return (
      <Badge ref={ref} variant={variant} size={size} className={className} {...props}>
        {badgeLabel}
      </Badge>
    )
  }
)

StatusBadge.displayName = 'StatusBadge'

