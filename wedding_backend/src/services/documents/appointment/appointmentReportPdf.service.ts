import path from "path";
import { renderTemplate } from "../template.renderer";

export type AppointmentReportRow = {
  index: number | string;
  customerName: string;
  weddingDate: string;
  venueName: string;
  customerPhone: string;
  appointmentSlot: string;
};

export type RenderAppointmentReportHtmlParams = {
  pagedRows: AppointmentReportRow[][];
  reportMonth: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  customerId?: number;
  search: string;
};

export async function renderAppointmentReportHtml(
  data: RenderAppointmentReportHtmlParams,
): Promise<string> {
  const templatePath = path.join(__dirname, "appointmentReportPdf.template.ejs");

  return renderTemplate(templatePath, data);
}
