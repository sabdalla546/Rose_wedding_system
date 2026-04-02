import path from "path";
import { renderTemplate } from "../template.renderer";

export type EventReportRow = {
  index: number | string;
  eventTitle: string;
  customerName: string;
  eventDate: string;
  venueName: string;
  coupleNames: string;
  guestCount: string;
};

export type RenderEventReportHtmlParams = {
  pagedRows: EventReportRow[][];
  reportMonth: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  customerId?: number;
  venueId?: number;
  search: string;
};

export async function renderEventReportHtml(
  data: RenderEventReportHtmlParams,
): Promise<string> {
  const templatePath = path.join(__dirname, "eventReportPdf.template.ejs");

  return renderTemplate(templatePath, data);
}
