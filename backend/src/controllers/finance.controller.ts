import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { ok } from '../utils/response';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { MailService } from '../services/mail.service';
import PDFDocument from 'pdfkit';

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}

function getYearRange() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end = new Date(year + 1, 0, 1, 0, 0, 0, 0);
  return { year, start, end };
}

async function generateClientInvoiceNo() {
  const now = new Date();
  const prefix = `CINV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const last = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
  });

  let seq = 1;
  if (last) {
    const parts = last.invoiceNo.split('-');
    const parsed = Number(parts[parts.length - 1]);
    if (Number.isFinite(parsed)) seq = parsed + 1;
  }

  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

function toTry(value: number) {
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
}

async function buildInvoicePdfBuffer(input: {
  invoiceNo: string;
  issueDate: Date;
  dueDate: Date;
  clientName: string;
  taxNumber: string;
  invoiceAddress: string;
  routes: Array<{ name: string; monthlyRevenue: number }>;
  totalAmount: number;
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on('error', reject);
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text('Servisim Geliyor', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#475569').text('Müşteri Tahakkuk Faturası', { align: 'left' });
    doc.fillColor('#0f172a');
    doc.moveDown(1);

    doc.fontSize(11).text(`Fatura No: ${input.invoiceNo}`);
    doc.text(`Fatura Tarihi: ${input.issueDate.toLocaleDateString('tr-TR')}`);
    doc.text(`Vade Tarihi: ${input.dueDate.toLocaleDateString('tr-TR')}`);
    doc.moveDown(0.6);

    doc.text(`Müşteri: ${input.clientName}`);
    doc.text(`Vergi No: ${input.taxNumber}`);
    doc.text(`Fatura Adresi: ${input.invoiceAddress}`);
    doc.moveDown(1);

    doc.fontSize(12).text('Rota Bazlı Kırılım');
    doc.moveDown(0.4);
    doc.fontSize(10).text('#', 40, doc.y, { continued: true });
    doc.text('Rota', 70, doc.y, { continued: true });
    doc.text('Aylık Bedel', 420, doc.y, { align: 'right' });
    doc.moveDown(0.3);

    input.routes.forEach((route, index) => {
      doc.text(String(index + 1), 40, doc.y, { continued: true });
      doc.text(route.name, 70, doc.y, { continued: true });
      doc.text(toTry(Number(route.monthlyRevenue || 0)), 420, doc.y, { align: 'right' });
      doc.moveDown(0.2);
    });

    if (input.routes.length === 0) {
      doc.text('Tanımlı rota bulunamadı.', { align: 'left' });
      doc.moveDown(0.3);
    }

    doc.moveDown(1);
    doc.fontSize(14).text(`Toplam Tahakkuk: ${toTry(input.totalAmount)}`, { align: 'right' });

    doc.end();
  });
}

export class FinanceController {
  private static async getClientBillingSnapshot(tenantId: string, clientId: string, customAmount?: number) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        routes: {
          select: { id: true, name: true, monthlyRevenue: true },
        },
      },
    });

    if (!client) throw new NotFoundError('Client');

    const routeRevenue = client.routes.reduce((sum, route) => sum + Number(route.monthlyRevenue || 0), 0);
    const clientMonthlyAllowance = Number((client as any).monthlyAllowance || 0);
    const defaultAmount = clientMonthlyAllowance > 0 ? clientMonthlyAllowance : routeRevenue;
    const requestedAmount = customAmount !== undefined ? Number(customAmount) : defaultAmount;

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      throw new BadRequestError('Invoice amount must be greater than 0');
    }

    return {
      client,
      routeRevenue,
      invoiceAmount: requestedAmount,
    };
  }

  static async summary(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { start, end } = getMonthRange();

    const [incomeAgg, expenseAgg, pendingInvoices] = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: {
          tenantId,
          type: 'INCOME',
          date: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: {
          tenantId,
          type: 'EXPENSE',
          date: { gte: start, lt: end },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['PENDING', 'OVERDUE'] },
        },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount || 0;
    const totalExpense = expenseAgg._sum.amount || 0;

    return ok(res, {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      pendingInvoices,
    });
  }

  static async chart(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { year, start, end } = getYearRange();

    const transactions = await prisma.financialTransaction.findMany({
      where: {
        tenantId,
        date: { gte: start, lt: end },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
      orderBy: { date: 'asc' },
    });

    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const buckets = monthNames.map((label, index) => ({
      month: index + 1,
      label,
      income: 0,
      expense: 0,
    }));

    for (const tx of transactions) {
      const monthIndex = new Date(tx.date).getMonth();
      if (tx.type === 'INCOME') buckets[monthIndex].income += tx.amount;
      if (tx.type === 'EXPENSE') buckets[monthIndex].expense += tx.amount;
    }

    return ok(res, {
      year,
      data: buckets,
    });
  }

  static async transactions(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;

    const items = await prisma.financialTransaction.findMany({
      where: { tenantId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return ok(res, items);
  }

  static async clientSummary(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const { start, end } = getMonthRange();

    const clients = await prisma.client.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: {
        routes: {
          select: {
            id: true,
            name: true,
            status: true,
            monthlyRevenue: true,
          },
        },
      },
    });

    const routeIds = clients.flatMap((client) => client.routes.map((route) => route.id));
    const txByRoute = routeIds.length
      ? await prisma.financialTransaction.groupBy({
          by: ['relatedRecordId'],
          where: {
            tenantId,
            type: 'INCOME',
            date: { gte: start, lt: end },
            relatedRecordId: { in: routeIds },
          },
          _sum: { amount: true },
        })
      : [];

    const txMap = new Map(txByRoute.map((item) => [item.relatedRecordId, item._sum.amount || 0]));

    const data = clients.map((client) => {
      const clientMonthlyAllowance = Number((client as any).monthlyAllowance || 0);
      const routes = client.routes.map((route) => ({
        id: route.id,
        name: route.name,
        status: route.status,
        monthlyRevenue: Number(route.monthlyRevenue || 0),
        thisMonthBilled: Number(txMap.get(route.id) || 0),
      }));

      const totalRevenue = routes.reduce((sum, item) => sum + item.monthlyRevenue, 0);
      const thisMonthBilled = routes.reduce((sum, item) => sum + item.thisMonthBilled, 0);

      return {
        clientId: client.id,
        clientName: client.name,
        taxNumber: client.taxNumber,
        contactEmail: client.contactEmail,
        monthlyAllowance: clientMonthlyAllowance,
        routeCount: routes.length,
        totalRevenue,
        invoiceTargetAmount: clientMonthlyAllowance > 0 ? clientMonthlyAllowance : totalRevenue,
        thisMonthBilled,
        routes,
      };
    });

    return ok(res, {
      monthStart: start,
      monthEnd: end,
      data,
    });
  }

  static async sendClientInvoice(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const clientId = req.params.clientId as string;
    const customAmountRaw = req.body?.amount;

    const snapshot = await FinanceController.getClientBillingSnapshot(
      tenantId,
      clientId,
      customAmountRaw !== undefined ? Number(customAmountRaw) : undefined
    );
    const { client, invoiceAmount } = snapshot;

    const issueDate = new Date();
    const dueDate = new Date(issueDate.getFullYear(), issueDate.getMonth() + 1, 5, 23, 59, 59, 999);
    const invoiceNo = await generateClientInvoiceNo();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        tenantId,
        clientId: client.id,
        amount: invoiceAmount,
        type: 'RECURRING',
        status: 'PENDING',
        description: `${client.name} - Aylık servis tahakkuku`,
        issueDate,
        dueDate,
      },
    });

    await prisma.financialTransaction.create({
      data: {
        tenantId,
        type: 'INCOME',
        category: 'MUSTERI_TAHAKKUK',
        amount: invoiceAmount,
        date: issueDate,
        description: `${client.name} için aylık tahakkuk (${invoiceNo})`,
        relatedRecordId: invoice.id,
      },
    });

    const monthLabel = issueDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    const routeRows = client.routes
      .map(
        (route, index) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${index + 1}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">${route.name}</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">${Number(route.monthlyRevenue || 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</td>
          </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;max-width:680px;">
        <h2 style="margin:0 0 8px;">Servisim Geliyor</h2>
        <p style="margin:0 0 16px;font-size:13px;color:#475569;">Müşteri Fatura Bildirimi • ${monthLabel}</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 14px;border-radius:10px;margin-bottom:16px;">
          <div><strong>Fatura No:</strong> ${invoiceNo}</div>
          <div><strong>Müşteri:</strong> ${client.name}</div>
          <div><strong>Vergi No:</strong> ${client.taxNumber}</div>
          <div><strong>Fatura Adresi:</strong> ${client.invoiceAddress}</div>
          <div><strong>Vade:</strong> ${dueDate.toLocaleDateString('tr-TR')}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #cbd5e1;">#</th>
              <th style="text-align:left;padding:8px;border-bottom:2px solid #cbd5e1;">Rota</th>
              <th style="text-align:right;padding:8px;border-bottom:2px solid #cbd5e1;">Aylık Bedel</th>
            </tr>
          </thead>
          <tbody>${routeRows || '<tr><td colspan="3" style="padding:8px;color:#64748b;">Rota tanımı bulunamadı.</td></tr>'}</tbody>
        </table>
        <div style="text-align:right;font-size:18px;font-weight:700;">Toplam Tahakkuk: ${invoiceAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
      </div>
    `;

    const pdfBuffer = await buildInvoicePdfBuffer({
      invoiceNo,
      issueDate,
      dueDate,
      clientName: client.name,
      taxNumber: client.taxNumber,
      invoiceAddress: client.invoiceAddress,
      routes: client.routes.map((route) => ({ name: route.name, monthlyRevenue: Number(route.monthlyRevenue || 0) })),
      totalAmount: invoiceAmount,
    });

    const mailResult = await MailService.send({
      to: client.contactEmail,
      subject: `Servisim Geliyor | Aylık Tahakkuk Faturası (${invoiceNo})`,
      html,
      attachments: [
        {
          filename: `${invoiceNo}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return ok(res, {
      invoice,
      email: {
        to: client.contactEmail,
        messageId: mailResult.messageId,
        accepted: mailResult.accepted,
        rejected: mailResult.rejected,
      },
    });
  }

  static async downloadClientInvoicePdf(req: Request, res: Response) {
    const tenantId = (req as any).tenantScope as string;
    const clientId = req.params.clientId as string;
    const amountRaw = req.query.amount as string | undefined;
    const amount = amountRaw !== undefined ? Number(amountRaw) : undefined;

    const snapshot = await FinanceController.getClientBillingSnapshot(tenantId, clientId, amount);
    const { client, invoiceAmount } = snapshot;
    const now = new Date();
    const invoiceNo = await generateClientInvoiceNo();
    const dueDate = new Date(now.getFullYear(), now.getMonth() + 1, 5, 23, 59, 59, 999);

    const pdfBuffer = await buildInvoicePdfBuffer({
      invoiceNo,
      issueDate: now,
      dueDate,
      clientName: client.name,
      taxNumber: client.taxNumber,
      invoiceAddress: client.invoiceAddress,
      routes: client.routes.map((route) => ({ name: route.name, monthlyRevenue: Number(route.monthlyRevenue || 0) })),
      totalAmount: invoiceAmount,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoiceNo}.pdf"`);
    return res.status(200).send(pdfBuffer);
  }
}
