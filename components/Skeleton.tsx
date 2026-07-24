import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'heading' | 'card' | 'circle' | 'line'
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: { height: height || '14px', width: width || '60%', borderRadius: '4px' },
    heading: { height: height || '24px', width: width || '75%', borderRadius: '6px', marginBottom: '8px' },
    card: { height: height || '128px', width: width || '100%', borderRadius: '12px' },
    circle: { height: height || '40px', width: width || '40px', borderRadius: '50%' },
    line: { height: height || '1px', width: width || '100%' },
  }

  const baseStyle: React.CSSProperties = {
    animation: 'pulse-skeleton 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#EAEAE6', // matches var(--sw-line)
    display: 'block',
    ...variantStyles[variant],
    ...style,
  }

  return (
    <div
      className={`skeleton-loader ${className}`}
      style={baseStyle}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse-skeleton {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}} />
    </div>
  )
}
