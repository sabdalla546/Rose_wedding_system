import path from "path";
import type {
  ContractPdfData,
  GeneratedPdfDocument,
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
import { buildContractPdfData } from "./contractPdf.data";

type TemplateHelpers = {
  displayText: typeof displayText;
  formatDate: typeof formatDate;
  formatMoney: typeof formatMoney;
  formatQuantity: typeof formatQuantity;
  getItemTypeLabel: (item: ContractPdfData["items"][number]) => string;
};

function getItemTypeLabel(item: ContractPdfData["items"][number]) {
  if (item.isSummaryRow) {
    return "إجمالي الخدمات";
  }

  return item.itemType === "vendor" ? "شركة" : "خدمة";
}

function buildContractPdfFilename(data: ContractPdfData) {
  const reference = sanitizeFilenamePart(
    data.contract.contractNumber || data.contract.id,
    String(data.contract.id),
  );

  return `contract-${reference}.pdf`;
}

export async function generateContractPdfDocument(
  contractId: number,
): Promise<GeneratedPdfDocument<ContractPdfData>> {
  const data = await buildContractPdfData(contractId);
  const templatePath = path.join(__dirname, "contractPdf.template.ejs");
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
    type: "contract",
    filename: buildContractPdfFilename(data),
    buffer,
    data,
  };
}

export async function generateContractPdf(contractId: number): Promise<Buffer> {
  const document = await generateContractPdfDocument(contractId);
  return document.buffer;
}
