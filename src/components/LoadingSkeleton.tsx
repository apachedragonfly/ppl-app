interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'chart' | 'heatmap' | 'form'
  count?: number
  className?: string
}

export default function LoadingSkeleton({ 
  variant = 'card', 
  count = 1, 
  className = '' 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className={`${getVariantClasses(variant)} ${className}`}>
      {renderVariant(variant)}
    </div>
  ))

  return <>{skeletons}</>
}

function getVariantClasses(variant: string): string {
  const baseClasses = 'animate-pulse'
  
  switch (variant) {
    case 'card':
      return `${baseClasses} bg-card border border-border rounded-lg p-4 space-y-3`
    case 'list':
      return `${baseClasses} bg-card border border-border rounded-lg p-3 mb-2`
    case 'chart':
      return `${baseClasses} bg-card border border-border rounded-lg p-6`
    case 'heatmap':
      return `${baseClasses} bg-card border border-border rounded-lg p-4`
    case 'form':
      return `${baseClasses} space-y-4`
    default:
      return baseClasses
  }
}

function renderVariant(variant: string) {
  switch (variant) {
    case 'card':
      return (
        <>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-muted rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-5/6"></div>
          </div>
        </>
      )
    
    case 'list':
      return (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded"></div>
          <div className="flex-1 space-y-1">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
          <div className="w-16 h-6 bg-muted rounded"></div>
        </div>
      )
    
    case 'chart':
      return (
        <>
          <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
          <div className="flex items-end space-x-2 h-40">
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="flex-1 bg-muted rounded-t"
                style={{ height: `${Math.random() * 80 + 20}%` }}
              ></div>
            ))}
          </div>
        </>
      )
    
    case 'heatmap':
      return (
        <>
          <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => (
              <div key={i} className="w-full aspect-square bg-muted rounded-sm"></div>
            ))}
          </div>
        </>
      )
    
    case 'form':
      return (
        <>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </>
      )
    
    default:
      return <div className="h-4 bg-muted rounded"></div>
  }
}

// Specialized skeleton components for common use cases
export function WorkoutCardSkeleton({ count = 1 }: { count?: number }) {
  return <LoadingSkeleton variant="card" count={count} />
}

export function ExerciseListSkeleton({ count = 5 }: { count?: number }) {
  return <LoadingSkeleton variant="list" count={count} />
}

export function ChartSkeleton() {
  return <LoadingSkeleton variant="chart" />
}

export function HeatmapSkeleton() {
  return <LoadingSkeleton variant="heatmap" />
}

export function WorkoutFormSkeleton() {
  return <LoadingSkeleton variant="form" />
} 