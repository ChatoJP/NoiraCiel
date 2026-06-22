import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export function Skeleton({ className = '', width, height, rounded = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-noir-silver/10 ${rounded ? 'rounded-full' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 px-2 border-b border-noir-silver/5" aria-hidden="true">
      <Skeleton width={32} height={32} />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton height={13} width="55%" />
        <Skeleton height={10} width="30%" />
      </div>
      <Skeleton height={12} width={36} />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <Skeleton className="aspect-square w-full" />
      <Skeleton height={14} width="70%" />
      <Skeleton height={11} width="45%" />
    </div>
  )
}
