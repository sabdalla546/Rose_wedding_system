import path from "path";
import type {
  GeneratedPdfDocument,
  QuotationPdfData,
} from "../document.types";
import { renderPdfFromHtml } from "../pdf.service";
import { renderTemplate } from "../template.renderer";
import {
  displayText,
  formatDate,
  formatMoney,
  formatQuantity,
  sanitizeFilenamePart,
} from "../document.utils";
import { buildQuotationPdfData } from "./quotationPdf.data";

type TemplateHelpers = {
  displayText: typeof displayText;
  formatDate: typeof formatDate;
  formatMoney: typeof formatMoney;
  formatQuantity: typeof formatQuantity;
  getItemTypeLabel: (item: QuotationPdfData["items"][number]) => string;
};

function getItemTypeLabel(item: QuotationPdfData["items"][number]) {
  if (item.isSummaryRow) {
    return "إجمالي الخدمات";
  }

  return item.itemType === "vendor" ? "شركة" : "خدمة";
}

function buildQuotationPdfFilename(data: QuotationPdfData) {
  const reference = sanitizeFilenamePart(
    data.quotation.quotationNumber || data.quotation.id,
    String(data.quotation.id),
  );

  return `quotation-${reference}.pdf`;
}

export async function generateQuotationPdfDocument(
  quotationId: number,
): Promise<GeneratedPdfDocument<QuotationPdfData>> {
  const data = await buildQuotationPdfData(quotationId);
  const templatePath = path.join(__dirname, "quotationPdf.template.ejs");
  const helpers: TemplateHelpers = {
    displayText,
    formatDate,
    formatMoney,
    formatQuantity,
    getItemTypeLabel,
  };

  const html = await renderTemplate(templatePath, {
    data,
    helpers,
  });

  const buffer = await renderPdfFromHtml(html, {
    format: "A4",
    printBackground: true,
    margin: {
      top: "14mm",
      right: "12mm",
      bottom: "16mm",
      left: "12mm",
    },
  });

  return {
    type: "quotation",
    filename: buildQuotationPdfFilename(data),
    buffer,
    data,
  };
}

export async function generateQuotationPdf(quotationId: number): Promise<Buffer> {
  const document = await generateQuotationPdfDocument(quotationId);
  return document.buffer;
}
