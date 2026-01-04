// /app/components/FrostLogo.tsx
export default function FrostLogo({ size = 44 }) {
 return (
  <svg height={size} width={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
   <rect width="44" height="44" rx="12" fill="url(#frost_linear_bg)" />
   <g filter="url(#frost_blur)">
    <polygon points="22,8 36,15 22,22 8,15 22,8"
      fill="#E6F0FA" />
    <polygon points="22,22 36,15 36,29 22,36 22,22"
      fill="#A4D8F8" />
    <polygon points="22,22 22,36 8,29 8,15 22,22"
      fill="#BEE8FC" />
   </g>
   <defs>
    <linearGradient id="frost_linear_bg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
     <stop stopColor="#EBF5FF"/>
     <stop offset="1" stopColor="#CDE8FD"/>
    </linearGradient>
    <filter id="frost_blur" x="6" y="6" width="32" height="32" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
     <feGaussianBlur stdDeviation="0.5"/>
    </filter>
   </defs>
  </svg>
 )
}
