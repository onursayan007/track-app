import nodemailer from 'nodemailer';
import { BadRequestError } from '../utils/errors';

export interface OutgoingMailInput {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType?: string;
  }>;
}

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const portRaw = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || !Number.isFinite(portRaw)) {
    throw new BadRequestError('SMTP configuration missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  return nodemailer.createTransport({
    host,
    port: portRaw,
    secure: portRaw === 465,
    auth: { user, pass },
  });
}

export class MailService {
  static async send({ to, subject, html, attachments }: OutgoingMailInput) {
    const transport = buildTransport();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@servisimgeliyor.com';

    const result = await transport.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    return {
      messageId: result.messageId,
      accepted: result.accepted,
      rejected: result.rejected,
    };
  }
}
