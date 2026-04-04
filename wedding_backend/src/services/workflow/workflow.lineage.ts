type WorkflowLineageRefs = Partial<{
  appointmentId: number | null;
  sourceAppointmentId: number | null;
  eventId: number | null;
  quotationId: number | null;
  contractId: number | null;
  executionBriefId: number | null;
}>;

const normalizeLineageId = (value?: number | null) =>
  typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;

export const normalizeWorkflowLineageRefs = (
  refs?: WorkflowLineageRefs | null,
) => {
  const normalized = {
    appointmentId: normalizeLineageId(refs?.appointmentId),
    sourceAppointmentId: normalizeLineageId(refs?.sourceAppointmentId),
    eventId: normalizeLineageId(refs?.eventId),
    quotationId: normalizeLineageId(refs?.quotationId),
    contractId: normalizeLineageId(refs?.contractId),
    executionBriefId: normalizeLineageId(refs?.executionBriefId),
  };

  if (Object.values(normalized).every((value) => value === null)) {
    return undefined;
  }

  return normalized;
};

export const buildWorkflowLineageSummary = (refs?: WorkflowLineageRefs | null) => {
  const normalized = normalizeWorkflowLineageRefs(refs);
  if (!normalized) {
    return undefined;
  }

  const commercialBasis = normalized.contractId
    ? { entityType: "contract", entityId: normalized.contractId }
    : normalized.quotationId
      ? { entityType: "quotation", entityId: normalized.quotationId }
      : normalized.eventId
        ? { entityType: "event", entityId: normalized.eventId }
        : null;

  const executionBasis = normalized.executionBriefId
    ? { entityType: "execution_brief", entityId: normalized.executionBriefId }
    : null;

  return {
    ...normalized,
    commercialBasis,
    executionBasis,
  };
};

export const buildEventLineage = (event: {
  id: number;
  sourceAppointmentId?: number | null;
}) =>
  buildWorkflowLineageSummary({
    sourceAppointmentId: event.sourceAppointmentId ?? null,
    eventId: event.id,
  });

export const buildQuotationLineage = (quotation: {
  id: number;
  eventId: number;
}) =>
  buildWorkflowLineageSummary({
    eventId: quotation.eventId,
    quotationId: quotation.id,
  });

export const buildContractLineage = (contract: {
  id: number;
  eventId: number;
  quotationId?: number | null;
}) =>
  buildWorkflowLineageSummary({
    eventId: contract.eventId,
    quotationId: contract.quotationId ?? null,
    contractId: contract.id,
  });

export const buildExecutionBriefLineage = (brief: {
  id: number;
  eventId: number;
  quotationId?: number | null;
  contractId?: number | null;
}) =>
  buildWorkflowLineageSummary({
    eventId: brief.eventId,
    quotationId: brief.quotationId ?? null,
    contractId: brief.contractId ?? null,
    executionBriefId: brief.id,
  });
