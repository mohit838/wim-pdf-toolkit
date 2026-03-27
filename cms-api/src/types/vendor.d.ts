declare module "sanitize-html" {
  type TransformTagResult = {
    tagName: string;
    attribs: Record<string, string | undefined>;
  };

  interface SanitizeHtmlOptions {
    allowedTags?: readonly string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedStyles?: Record<string, Record<string, RegExp[]>>;
    transformTags?: Record<string, (tagName: string, attribs: Record<string, string>) => TransformTagResult>;
  }

  export default function sanitizeHtml(value: string, options?: SanitizeHtmlOptions): string;
}
