declare module "sanitize-html" {
  interface SanitizeHtmlOptions {
    allowedTags?: readonly string[];
    allowedAttributes?: Record<string, string[]>;
    allowedSchemes?: string[];
    allowedStyles?: Record<string, Record<string, RegExp[]>>;
  }

  export default function sanitizeHtml(value: string, options?: SanitizeHtmlOptions): string;
}

declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to?: string;
    replyTo?: string;
    subject?: string;
    text?: string;
    html?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  interface CreateTransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }

  const nodemailer: {
    createTransport(options: CreateTransportOptions): Transporter;
  };

  export default nodemailer;
}
