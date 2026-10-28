import React from 'react'

/**
 * Netlink official brand logo component.
 * Features the signature #1768c4 royal blue tile and folded white ribbon "N".
 *
 * Variants:
 * - 'icon': The square tile with centered ribbon "N" (ideal for avatars, navbar, small badges)
 * - 'full': The exact lockup from the screenshot with "N" and "netlink" text below inside the #1768c4 tile
 * - 'lockup': The #1768c4 icon badge with adjacent brand text (e.g. for sidebar and login headers)
 */
export function NetlinkLogo({
  size = 32,
  variant = 'icon',
  subtitle = '',
  className = '',
  style = {},
}) {
  const blueColor = '#1768c4'

  if (variant === 'full') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`netlink-logo netlink-logo-full ${className}`}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
        aria-label="Netlink"
      >
        <defs>
          <linearGradient id="nlFullShadow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </linearGradient>
          <filter id="nlDropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0d4685" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Background rounded square */}
        <rect width="120" height="120" rx="24" fill={blueColor} />

        {/* The Folded Ribbon "N" */}
        <g filter="url(#nlDropShadow)">
          {/* Left vertical pillar */}
          <rect x="23" y="16" width="16" height="60" rx="8" fill="#ffffff" />

          {/* Right vertical pillar */}
          <rect x="81" y="16" width="16" height="60" rx="8" fill="#ffffff" />

          {/* Soft shadow under the top-left fold */}
          <polygon points="23,28 39,43 39,56 23,41" fill="url(#nlFullShadow)" />

          {/* Diagonal folded ribbon */}
          <path
            d="M23,24 C23,18.5 27.5,16 32,16 L39,16 L97,70 C97,75.5 92.5,78 88,78 L81,78 L23,24 Z"
            fill="#ffffff"
          />

          {/* Delicate fold highlight line */}
          <line x1="23.5" y1="24" x2="39" y2="40" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
        </g>

        {/* "netlink" text below the "N" */}
        <text
          x="60"
          y="104"
          textAnchor="middle"
          fill="#ffffff"
          fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="750"
          fontSize="17.5"
          letterSpacing="-0.35px"
        >
          netlink
        </text>
      </svg>
    )
  }

  if (variant === 'lockup') {
    return (
      <div
        className={`netlink-lockup ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '9px',
          ...style,
        }}
        aria-label="Netlink Travel Desk"
      >
        <NetlinkLogo size={size} variant="icon" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span
            style={{
              color: blueColor,
              fontWeight: 800,
              fontSize: `${Math.max(14, size * 0.52)}px`,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            netlink
          </span>
          {subtitle && (
            <>
              <span
                style={{
                  width: '1px',
                  height: '14px',
                  background: 'var(--border-main)',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontSize: `${Math.max(10, size * 0.36)}px`,
                  fontWeight: 650,
                  letterSpacing: '0.04em',
                  lineHeight: 1,
                }}
              >
                {subtitle}
              </span>
            </>
          )}
        </div>
      </div>
    )
  }

  // Default 'icon' variant: crisp, centered "N" badge on #1768c4
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`netlink-logo netlink-logo-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, borderRadius: `${Math.max(6, size * 0.22)}px`, ...style }}
      aria-label="Netlink logo"
    >
      <defs>
        <linearGradient id="nlIconShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Rounded tile in #1768c4 */}
      <rect width="100" height="100" rx="22" fill={blueColor} />

      {/* Folded ribbon "N" */}
      <g>
        {/* Left pillar */}
        <rect x="20" y="18" width="15" height="64" rx="7.5" fill="#ffffff" />

        {/* Right pillar */}
        <rect x="65" y="18" width="15" height="64" rx="7.5" fill="#ffffff" />

        {/* Fold crease shadow on left pillar */}
        <polygon points="20,29 35,44 35,57 20,42" fill="url(#nlIconShadow)" />

        {/* Diagonal ribbon */}
        <path
          d="M20,26 C20,20.5 24.5,18 29,18 L35,18 L80,74 C80,79.5 75.5,82 71,82 L65,82 L20,26 Z"
          fill="#ffffff"
        />

        {/* Crease line */}
        <line x1="20.5" y1="26" x2="35" y2="42" stroke="#ffffff" strokeWidth="0.8" opacity="0.65" />
      </g>
    </svg>
  )
}
