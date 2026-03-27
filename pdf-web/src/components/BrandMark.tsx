interface BrandMarkProps {
  size?: number;
}

export default function BrandMark({ size = 36 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="14" fill="#08101D" />
      <path
        d="M30.4 9.5L36.7 15.8V33.3C36.7 35.6 34.8 37.5 32.5 37.5H17.4C15 37.5 13.2 35.6 13.2 33.3V14.7C13.2 12.3 15 10.5 17.4 10.5H29.4C29.8 10.5 30.1 10.2 30.4 9.5Z"
        fill="#FFF4D6"
      />
      <path d="M29.8 10.5V15.1C29.8 16.4 30.9 17.5 32.2 17.5H36.7" fill="#FFD26A" />
      <path
        d="M10.1 15.9C10.1 14 11.7 12.4 13.6 12.4H25.4C27.3 12.4 28.8 14 28.8 15.9V29.9C28.8 31.8 27.3 33.4 25.4 33.4H13.6C11.7 33.4 10.1 31.8 10.1 29.9V15.9Z"
        fill="#37D7C4"
        fillOpacity="0.9"
        transform="rotate(-8 19.45 22.9)"
      />
      <path
        d="M19.2 22.4H30.8"
        stroke="#F97316"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M19.2 27.6H27.6"
        stroke="#1F6FEB"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="35.7" cy="11.6" r="2.2" fill="#FF7A18" />
      <path
        d="M35.7 7.8V15.4M31.9 11.6H39.5"
        stroke="#FFD26A"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
