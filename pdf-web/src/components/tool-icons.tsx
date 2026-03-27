import type { ReactElement, SVGProps } from "react";

interface ToolIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  strokeWidth?: number;
}

function ToolIconBase({
  size = 22,
  strokeWidth = 1.5,
  children,
  ...props
}: ToolIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MergeIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <path d="m15 9 6-6" />
      <path d="M12 22v-8.3a4 4 0 0 1 1.172-2.872" />
    </ToolIconBase>
  );
}

export function RotateIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M21.5 2v6h-6" />
      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38L21.5 8" />
    </ToolIconBase>
  );
}

export function ExtractIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M12 12h.01" />
      <path d="M17 12h.01" />
      <path d="M7 12h.01" />
    </ToolIconBase>
  );
}

export function SplitIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" />
      <path d="m21 3-8.7 8.7" />
    </ToolIconBase>
  );
}

export function ImageIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </ToolIconBase>
  );
}

export function WatermarkIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </ToolIconBase>
  );
}

export function RearrangeIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </ToolIconBase>
  );
}

export function DocxToPdfIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </ToolIconBase>
  );
}

export function PdfToDocxIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l3 3 3-3" />
    </ToolIconBase>
  );
}

export function PdfToJpgIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="10" cy="13" r="2" />
      <path d="m20 17-5-5-5 5-2-2-4 4" />
    </ToolIconBase>
  );
}

export function ProtectIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </ToolIconBase>
  );
}

export function UnlockIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </ToolIconBase>
  );
}

export function CompressIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m8 17 4 4 4-4" />
    </ToolIconBase>
  );
}

export function PdfToTextIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </ToolIconBase>
  );
}

export function RemoveMetadataIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m8 16 8-8" />
      <path d="m8 8 8 8" />
    </ToolIconBase>
  );
}

export function AddPageNumbersIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="6" y1="18" x2="18" y2="18" />
      <path d="M10 9h.01" />
      <path d="M14 9h.01" />
    </ToolIconBase>
  );
}

export function RepairIcon(props: ToolIconProps) {
  return (
    <ToolIconBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 14a3 3 0 0 1 5.12-2.12" />
      <path d="M15 10v3h-3" />
    </ToolIconBase>
  );
}

export const toolIconKeys = [
  "merge",
  "rotate",
  "extract",
  "split",
  "image",
  "watermark",
  "rearrange",
  "docxToPdf",
  "pdfToDocx",
  "pdfToJpg",
  "protect",
  "unlock",
  "compress",
  "pdfToText",
  "removeMetadata",
  "addPageNumbers",
  "repair",
] as const;

export type ToolIconKey = (typeof toolIconKeys)[number];

const toolIconMap = {
  merge: MergeIcon,
  rotate: RotateIcon,
  extract: ExtractIcon,
  split: SplitIcon,
  image: ImageIcon,
  watermark: WatermarkIcon,
  rearrange: RearrangeIcon,
  docxToPdf: DocxToPdfIcon,
  pdfToDocx: PdfToDocxIcon,
  pdfToJpg: PdfToJpgIcon,
  protect: ProtectIcon,
  unlock: UnlockIcon,
  compress: CompressIcon,
  pdfToText: PdfToTextIcon,
  removeMetadata: RemoveMetadataIcon,
  addPageNumbers: AddPageNumbersIcon,
  repair: RepairIcon,
} satisfies Record<ToolIconKey, (props: ToolIconProps) => ReactElement>;

export function getToolIcon(iconKey: ToolIconKey) {
  return toolIconMap[iconKey];
}
