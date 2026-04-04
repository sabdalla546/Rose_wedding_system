export class WorkflowDomainError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "WorkflowDomainError";
    this.statusCode = statusCode;
  }
}

export const isWorkflowDomainError = (
  error: unknown,
): error is WorkflowDomainError => error instanceof WorkflowDomainError;

export const appointmentAlreadyConvertedError = () =>
  new WorkflowDomainError("Appointment already converted", 409);

export const invalidStatusTransitionError = (
  message = "Invalid status transition",
) => new WorkflowDomainError(message, 400);

export const cancelledEventQuotationError = () =>
  new WorkflowDomainError("Cannot create quotation for cancelled event", 400);
