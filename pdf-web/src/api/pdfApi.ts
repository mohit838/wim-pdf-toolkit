import axios from "axios";
import type { MergeResponse } from "../types/pdf";

function buildUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

const API_BASE_URL = "";

const api = axios.create({
  baseURL: API_BASE_URL,
});

export function getDownloadUrl(path: string): string {
  return buildUrl(path);
}

// ─── Merge ───
export async function mergePdf(files: File[]): Promise<MergeResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await api.post<MergeResponse>("/api/pdf/merge", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Rotate ───
export interface RotateResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function rotatePdf(
  file: File,
  rotation: number,
  pages?: string
): Promise<RotateResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("rotation", String(rotation));
  if (pages) formData.append("pages", pages);

  const response = await api.post<RotateResponse>("/api/pdf/rotate", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Split ───
export interface SplitResponse {
  success: boolean;
  message: string;
  job_id: string;
  files: { filename: string; download_url: string }[];
}

export async function splitPdf(
  file: File,
  ranges: [number, number][]
): Promise<SplitResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ranges", JSON.stringify(ranges));

  const response = await api.post<SplitResponse>("/api/pdf/split", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Extract Pages ───
export interface ExtractResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function extractPages(
  file: File,
  pages: string
): Promise<ExtractResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pages", pages);

  const response = await api.post<ExtractResponse>("/api/pdf/extract", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Image to PDF ───
export interface ImageToPdfResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function imageToPdf(files: File[]): Promise<ImageToPdfResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await api.post<ImageToPdfResponse>("/api/pdf/image-to-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Watermark ───
export interface WatermarkResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function watermarkPdf(
  file: File,
  text: string,
  fontSize?: number,
  opacity?: number,
  rotation?: number
): Promise<WatermarkResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("text", text);
  if (fontSize !== undefined) formData.append("font_size", String(fontSize));
  if (opacity !== undefined) formData.append("opacity", String(opacity));
  if (rotation !== undefined) formData.append("rotation", String(rotation));

  const response = await api.post<WatermarkResponse>("/api/pdf/watermark", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Rearrange ───
export interface RearrangeResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function rearrangePdf(
  file: File,
  order: string
): Promise<RearrangeResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("order", order);

  const response = await api.post<RearrangeResponse>("/api/pdf/rearrange", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Page Count ───
export interface PageCountResponse {
  success: boolean;
  page_count: number;
}

export async function getPageCount(file: File): Promise<PageCountResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<PageCountResponse>("/api/pdf/page-count", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── DOCX to PDF ───
export interface ConvertResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
  accuracy_estimate?: {
    min_percent: number;
    max_percent: number;
    note: string;
  };
}

export async function docxToPdf(file: File): Promise<ConvertResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ConvertResponse>("/api/pdf/docx-to-pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── PDF to DOCX ───
export async function pdfToDocx(file: File): Promise<ConvertResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ConvertResponse>("/api/pdf/pdf-to-docx", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Protect PDF ───
export interface ProtectResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function protectPdf(file: File, password: string): Promise<ProtectResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);
  const response = await api.post<ProtectResponse>("/api/pdf/protect", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Unlock PDF ───
export interface UnlockResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function unlockPdf(file: File, password: string): Promise<UnlockResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("password", password);
  const response = await api.post<UnlockResponse>("/api/pdf/unlock", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Compress PDF ───
export interface CompressResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function compressPdf(file: File): Promise<CompressResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<CompressResponse>("/api/pdf/compress", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── PDF to JPG ───
export interface PdfToJpgResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function pdfToJpg(file: File): Promise<PdfToJpgResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<PdfToJpgResponse>("/api/pdf/to-jpg", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── PDF to Text ───
export interface PdfToTextResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function pdfToText(file: File): Promise<PdfToTextResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<PdfToTextResponse>("/api/pdf/to-text", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Remove Metadata ───
export interface RemoveMetadataResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function removeMetadata(file: File): Promise<RemoveMetadataResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<RemoveMetadataResponse>("/api/pdf/remove-metadata", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Add Page Numbers ───
export interface AddPageNumbersResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export interface AddPageNumbersPayload {
  file: File;
  startNumber?: number;
  fontSize?: number;
  position?: string;
}

export async function addPageNumbers(payload: AddPageNumbersPayload): Promise<AddPageNumbersResponse> {
  const formData = new FormData();
  formData.append("file", payload.file);
  if (typeof payload.startNumber === "number") {
    formData.append("start_number", String(payload.startNumber));
  }
  if (typeof payload.fontSize === "number") {
    formData.append("font_size", String(payload.fontSize));
  }
  if (payload.position) {
    formData.append("position", payload.position);
  }

  const response = await api.post<AddPageNumbersResponse>("/api/pdf/add-page-numbers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

// ─── Repair PDF ───
export interface RepairPdfResponse {
  success: boolean;
  message: string;
  job_id: string;
  filename: string;
  download_url: string;
}

export async function repairPdf(file: File): Promise<RepairPdfResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<RepairPdfResponse>("/api/pdf/repair", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}
