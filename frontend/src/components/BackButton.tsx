"use client";

import { usePathname, useRouter } from "next/navigation";

interface BackButtonProps {
  label: string;
  ariaLabel: string;
}

export default function BackButton({ label, ariaLabel }: BackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/") {
    return null;
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <div className="tool-page-back-row">
      <button
        type="button"
        onClick={handleBack}
        className="tool-page-back text-sm font-semibold"
        aria-label={ariaLabel}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {label}
      </button>
    </div>
  );
}
