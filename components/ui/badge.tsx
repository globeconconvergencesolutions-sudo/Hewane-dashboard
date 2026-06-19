import { cn } from '@/lib/utils'

const variants = {
  default: 'border-transparent bg-primary/10 text-primary',
  secondary: 'border-transparent bg-secondary/20 text-secondary-foreground',
  success: 'border-transparent bg-emerald-100 text-emerald-800',
  warning: 'border-transparent bg-amber-100 text-amber-900',
  danger: 'border-transparent bg-red-100 text-red-800',
  muted: 'border-border bg-muted text-muted-foreground',
  outline: 'border-border text-foreground',
} as const

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'span'> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
