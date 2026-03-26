import puppeteer from "puppeteer";
import type { PdfRenderOptions } from "./document.types";

const DEFAULT_PDF_OPTIONS: Required<PdfRenderOptions> = {
  format: "A4",
  landscape: false,
  printBackground: true,
  margin: {
    top: "16mm",
    right: "12mm",
    bottom: "16mm",
    left: "12mm",
  },
};

export async function renderPdfFromHtml(
  html: string,
  options: PdfRenderOptions = {},
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const mergedOptions = {
      ...DEFAULT_PDF_OPTIONS,
      ...options,
      margin: {
        ...DEFAULT_PDF_OPTIONS.margin,
        ...(options.margin ?? {}),
      },
    };

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: mergedOptions.format,
      landscape: mergedOptions.landscape,
      printBackground: mergedOptions.printBackground,
      margin: mergedOptions.margin,
      preferCSSPageSize: true,
    });

    await page.close();

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
