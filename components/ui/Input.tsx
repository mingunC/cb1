import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import type { ReactNode } from 'react'

const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ')

interface BaseFieldProps {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseFieldProps {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const inputStyles = cn(
      'block rounded-lg border px-4 py-2 transition-colors text-sm sm:text-base',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      error
        ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500',
      leftIcon && 'pl-10',
      rightIcon && 'pr-10',
      fullWidth ? 'w-full' : undefined,
      className
    )

    return (
      <div className={cn('space-y-1', fullWidth ? 'w-full' : undefined)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {leftIcon}
            </div>
          )}

          <input ref={ref} id={inputId} className={inputStyles} {...props} />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-gray-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, BaseFieldProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, fullWidth = false, className, id, rows = 4, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const textareaStyles = cn(
      'block rounded-lg border px-4 py-2 transition-colors text-sm sm:text-base resize-y',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:bg-gray-100 disabled:cursor-not-allowed',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500',
      fullWidth ? 'w-full' : undefined,
      className
    )

    return (
      <div className={cn('space-y-1', fullWidth ? 'w-full' : undefined)}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <textarea ref={ref} id={inputId} rows={rows} className={textareaStyles} {...props} />

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : helperText ? (
          <p className="text-sm text-gray-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

