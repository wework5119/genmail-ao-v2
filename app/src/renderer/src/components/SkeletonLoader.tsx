interface SkeletonLoaderProps {
  count?: number
}

function SkeletonMessage() {
  return (
    <div className="px-6 py-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-skeleton-base flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-2">
            <div className="h-3.5 bg-skeleton-base rounded w-28" />
            <div className="h-3 bg-skeleton-base rounded w-12" />
          </div>
          <div className="h-3 bg-skeleton-base rounded w-48 mb-1.5" />
          <div className="h-3 bg-skeleton-base rounded w-full mb-1" />
          <div className="h-3 bg-skeleton-base rounded w-3/4 mb-1" />
          <div className="h-3 bg-skeleton-base rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}

export default function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonMessage key={i} />
      ))}
    </div>
  )
}
