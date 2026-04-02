import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useToast } from "@/hooks/use-toast";
import api, { getApiErrorMessage } from "@/lib/axios";
import type {
  CreateExecutionBriefPayload,
  ExecutionAttachmentResponse,
  ExecutionBriefResponse,
  ExecutionServiceDetailResponse,
  UpdateExecutionBriefPayload,
  UpdateExecutionServiceDetailPayload,
  UploadExecutionAttachmentPayload,
} from "@/pages/execution/types";

const normalizeNullableString = (value?: string | null) => {
  if (value === null) return null;
  if (value === undefined) return undefined;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const buildCreateExecutionBriefPayload = (
  values: CreateExecutionBriefPayload,
) => ({
  eventId: values.eventId,
  quotationId: values.quotationId ?? null,
  contractId: values.contractId ?? null,
  status: values.status,
  generalNotes: normalizeNullableString(values.generalNotes),
  clientNotes: normalizeNullableString(values.clientNotes),
  designerNotes: normalizeNullableString(values.designerNotes),
  initializeFromEventServices: values.initializeFromEventServices ?? true,
});

const buildUpdateExecutionBriefPayload = (
  values: UpdateExecutionBriefPayload,
) => ({
  quotationId: values.quotationId ?? undefined,
  contractId: values.contractId ?? undefined,
  status: values.status,
  generalNotes:
    values.generalNotes !== undefined
      ? normalizeNullableString(values.generalNotes)
      : undefined,
  clientNotes:
    values.clientNotes !== undefined
      ? normalizeNullableString(values.clientNotes)
      : undefined,
  designerNotes:
    values.designerNotes !== undefined
      ? normalizeNullableString(values.designerNotes)
      : undefined,
  approvedByClientAt: values.approvedByClientAt ?? undefined,
  handedToExecutorAt: values.handedToExecutorAt ?? undefined,
});

const buildUpdateExecutionServiceDetailPayload = (
  values: UpdateExecutionServiceDetailPayload,
) => ({
  templateKey: values.templateKey,
  sortOrder: values.sortOrder,
  detailsJson: values.detailsJson,
  notes:
    values.notes !== undefined
      ? normalizeNullableString(values.notes)
      : undefined,
  executorNotes:
    values.executorNotes !== undefined
      ? normalizeNullableString(values.executorNotes)
      : undefined,
  status: values.status,
});

const buildAttachmentFormData = (values: UploadExecutionAttachmentPayload) => {
  const formData = new FormData();
  formData.append("file", values.file);

  if (values.label !== undefined && values.label !== null) {
    formData.append("label", values.label);
  }

  if (typeof values.sortOrder === "number") {
    formData.append("sortOrder", String(values.sortOrder));
  }

  return formData;
};

const invalidateExecutionQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  options?: {
    briefId?: number | string;
    eventId?: number | string;
  },
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["execution-briefs"] }),
    queryClient.invalidateQueries({
      queryKey: ["execution-brief", options?.briefId],
    }),
    queryClient.invalidateQueries({
      queryKey: ["execution-brief-by-event", options?.eventId],
    }),
  ]);
};

export const useCreateExecutionBrief = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: CreateExecutionBriefPayload) => {
      const res = await api.post<ExecutionBriefResponse>(
        "/execution-briefs",
        buildCreateExecutionBriefPayload(values),
      );
      return res.data.data;
    },
    onSuccess: async (brief) => {
      await invalidateExecutionQueries(queryClient, {
        briefId: brief.id,
        eventId: brief.eventId,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.toast.briefCreated", {
          defaultValue: "Execution brief created successfully",
        }),
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.toast.briefCreateFailed", {
            defaultValue: "Failed to create execution brief",
          }),
        ),
      });
    },
  });
};

export const useUpdateExecutionBrief = (
  id?: number | string,
  options?: { eventId?: number | string },
) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (values: UpdateExecutionBriefPayload) => {
      const res = await api.patch<ExecutionBriefResponse>(
        `/execution-briefs/${id}`,
        buildUpdateExecutionBriefPayload(values),
      );
      return res.data.data;
    },
    onSuccess: async (brief) => {
      await invalidateExecutionQueries(queryClient, {
        briefId: brief.id,
        eventId: options?.eventId ?? brief.eventId,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.toast.briefUpdated", {
          defaultValue: "Execution brief updated successfully",
        }),
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.toast.briefUpdateFailed", {
            defaultValue: "Failed to update execution brief",
          }),
        ),
      });
    },
  });
};

export const useUpdateExecutionServiceDetail = (options?: {
  briefId?: number | string;
  eventId?: number | string;
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: number | string;
      values: UpdateExecutionServiceDetailPayload;
    }) => {
      const res = await api.patch<ExecutionServiceDetailResponse>(
        `/execution-briefs/service-details/${id}`,
        buildUpdateExecutionServiceDetailPayload(values),
      );
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidateExecutionQueries(queryClient, {
        briefId: options?.briefId,
        eventId: options?.eventId,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.toast.serviceDetailUpdated", {
          defaultValue: "Execution service detail updated successfully",
        }),
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.toast.serviceDetailUpdateFailed", {
            defaultValue: "Failed to update execution service detail",
          }),
        ),
      });
    },
  });
};

export const useUploadExecutionBriefAttachment = (options?: {
  briefId?: number | string;
  eventId?: number | string;
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      briefId,
      values,
    }: {
      briefId: number | string;
      values: UploadExecutionAttachmentPayload;
    }) => {
      const formData = buildAttachmentFormData(values);
      const res = await api.post<ExecutionAttachmentResponse>(
        `/execution-briefs/${briefId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidateExecutionQueries(queryClient, {
        briefId: options?.briefId,
        eventId: options?.eventId,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.toast.attachmentUploaded", {
          defaultValue: "Attachment uploaded successfully",
        }),
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.toast.attachmentUploadFailed", {
            defaultValue: "Failed to upload attachment",
          }),
        ),
      });
    },
  });
};

export const useUploadExecutionServiceDetailAttachment = (options?: {
  briefId?: number | string;
  eventId?: number | string;
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      serviceDetailId,
      values,
    }: {
      serviceDetailId: number | string;
      values: UploadExecutionAttachmentPayload;
    }) => {
      const formData = buildAttachmentFormData(values);
      const res = await api.post<ExecutionAttachmentResponse>(
        `/execution-briefs/service-details/${serviceDetailId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidateExecutionQueries(queryClient, {
        briefId: options?.briefId,
        eventId: options?.eventId,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.toast.attachmentUploaded", {
          defaultValue: "Attachment uploaded successfully",
        }),
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.toast.attachmentUploadFailed", {
            defaultValue: "Failed to upload attachment",
          }),
        ),
      });
    },
  });
};

export const useDeleteExecutionAttachment = (options?: {
  briefId?: number | string;
  eventId?: number | string;
}) => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (attachmentId: number | string) => {
      await api.delete(`/execution-briefs/attachments/${attachmentId}`);
    },
    onSuccess: async () => {
      await invalidateExecutionQueries(queryClient, {
        briefId: options?.briefId,
        eventId: options?.eventId,
      });

      toast({
        title: t("common.success", { defaultValue: "Success" }),
        description: t("execution.toast.attachmentDeleted", {
          defaultValue: "Attachment deleted successfully",
        }),
      });
    },
    onError: (error) => {
      toast({
        variant: "error",
        title: t("common.error", { defaultValue: "Error" }),
        description: getApiErrorMessage(
          error,
          t("execution.toast.attachmentDeleteFailed", {
            defaultValue: "Failed to delete attachment",
          }),
        ),
      });
    },
  });
};
