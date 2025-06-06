export default function Logo() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          d="M32 4C24 16 48 24 32 48C44 40 16 32 32 4Z"
          fill="url(#fireGradient)"
        />
        <defs>
          <linearGradient id="fireGradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFA500" />
            <stop offset="1" stopColor="#FF4500" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  );
} 