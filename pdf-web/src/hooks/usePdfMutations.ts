import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import {
  docxToPdf,
  extractPages,
  getPageCount,
  imageToPdf,
  mergePdf,
  pdfToDocx,
  rearrangePdf,
  rotatePdf,
  splitPdf,
  watermarkPdf,
  protectPdf,
  unlockPdf,
  compressPdf,
  pdfToJpg,
  pdfToText,
  removeMetadata,
  addPageNumbers,
  repairPdf,
} from "../api/pdfApi";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || fallback;
  }

  return fallback;
}

export function useMergePdfMutation() {
  return useMutation({
    mutationFn: mergePdf,
  });
}

export function useRotatePdfMutation() {
  return useMutation({
    mutationFn: ({ file, rotation, pages }: { file: File; rotation: number; pages?: string }) =>
      rotatePdf(file, rotation, pages),
  });
}

export function useSplitPdfMutation() {
  return useMutation({
    mutationFn: ({ file, ranges }: { file: File; ranges: [number, number][] }) =>
      splitPdf(file, ranges),
  });
}

export function useExtractPagesMutation() {
  return useMutation({
    mutationFn: ({ file, pages }: { file: File; pages: string }) => extractPages(file, pages),
  });
}

export function useImageToPdfMutation() {
  return useMutation({
    mutationFn: imageToPdf,
  });
}

export function useWatermarkPdfMutation() {
  return useMutation({
    mutationFn: ({
      file,
      text,
      fontSize,
      opacity,
      rotation,
    }: {
      file: File;
      text: string;
      fontSize?: number;
      opacity?: number;
      rotation?: number;
    }) => watermarkPdf(file, text, fontSize, opacity, rotation),
  });
}

export function useRearrangePdfMutation() {
  return useMutation({
    mutationFn: ({ file, order }: { file: File; order: string }) =>
      rearrangePdf(file, order),
  });
}

export function usePageCountMutation() {
  return useMutation({
    mutationFn: getPageCount,
  });
}

export function useDocxToPdfMutation() {
  return useMutation({
    mutationFn: docxToPdf,
  });
}

export function usePdfToDocxMutation() {
  return useMutation({
    mutationFn: pdfToDocx,
  });
}

export function useProtectPdfMutation() {
  return useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) => protectPdf(file, password),
  });
}

export function useUnlockPdfMutation() {
  return useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) => unlockPdf(file, password),
  });
}

export function useCompressPdfMutation() {
  return useMutation({
    mutationFn: compressPdf,
  });
}

export function usePdfToJpgMutation() {
  return useMutation({
    mutationFn: pdfToJpg,
  });
}

export function usePdfToTextMutation() {
  return useMutation({
    mutationFn: pdfToText,
  });
}

export function useRemoveMetadataMutation() {
  return useMutation({
    mutationFn: removeMetadata,
  });
}

export function useAddPageNumbersMutation() {
  return useMutation({
    mutationFn: ({
      file,
      startNumber,
      fontSize,
      position,
    }: {
      file: File;
      startNumber?: number;
      fontSize?: number;
      position?: string;
    }) => addPageNumbers({ file, startNumber, fontSize, position }),
  });
}

export function useRepairPdfMutation() {
  return useMutation({
    mutationFn: repairPdf,
  });
}
