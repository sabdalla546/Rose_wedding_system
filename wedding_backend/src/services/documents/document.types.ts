export type DocumentType =
  | "quotation"
  | "contract"
  | "invoice"
  | "purchase_order";

export type PdfRenderOptions = {
  format?: "A4";
  landscape?: boolean;
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
};

export type CompanyProfile = {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  logoUrl?: string | null;
};

export type QuotationPdfData = {
  company: CompanyProfile;
  quotation: {
    id: number;
    quotationNumber: string;
    issueDate: string;
    validUntil?: string | null;
    status?: string | null;
    notes?: string | null;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
  };
  customer: {
    fullName?: string | null;
    mobile1?: string | null;
    mobile2?: string | null;
  };
  event: {
    title?: string | null;
    eventDate?: string | null;
    venueName?: string | null;
  };
  items: Array<{
    itemType: "service" | "vendor";
    itemName: string;
    category?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
    isSummaryRow?: boolean;
  }>;
};

export type ContractPdfData = {
  company: CompanyProfile;
  contract: {
    id: number;
    contractNumber: string;
    signedDate: string;
    eventDate?: string | null;
    status?: string | null;
    notes?: string | null;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
  };
  quotation: {
    id?: number | null;
    quotationNumber?: string | null;
  };
  customer: {
    fullName?: string | null;
    mobile1?: string | null;
    mobile2?: string | null;
    address?: string | null;
    civilId?: string | null;
  };
  event: {
    title?: string | null;
    eventDate?: string | null;
    venueName?: string | null;
    guestCount?: number | null;
  };
  items: Array<{
    itemType: "service" | "vendor";
    itemName: string;
    category?: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
    isSummaryRow?: boolean;
  }>;
  paymentSchedules: Array<{
    installmentName: string;
    dueDate?: string | null;
    amount: number;
    status?: string | null;
    notes?: string | null;
  }>;
  clauses: Array<{
    title: string;
    paragraphs: string[];
  }>;
};

export type GeneratedPdfDocument<TData = unknown> = {
  type: DocumentType;
  filename: string;
  buffer: Buffer;
  data: TData;
};

export class DocumentServiceError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
