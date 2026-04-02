import type { TFunction } from "i18next";

export type ExecutionTemplateKey =
  | "kosha_setup"
  | "flowers_setup"
  | "entrance_setup"
  | "buffet_setup"
  | "front_seating_setup"
  | "generic_execution_setup";

export type DynamicFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "checkbox";

export type DynamicFieldOption = {
  value: string;
  label: string;
};

export type DynamicFieldDefinition = {
  key: string;
  label: string;
  type: DynamicFieldType;
  placeholder?: string;
  options?: DynamicFieldOption[];
};

export const executionTemplateKeys: ExecutionTemplateKey[] = [
  "kosha_setup",
  "flowers_setup",
  "entrance_setup",
  "buffet_setup",
  "front_seating_setup",
  "generic_execution_setup",
];

export const getExecutionTemplateOptions = (t: TFunction) =>
  [
    {
      value: "kosha_setup",
      label: t("execution.templates.kosha_setup", {
        defaultValue: "Kosha Setup",
      }),
    },
    {
      value: "flowers_setup",
      label: t("execution.templates.flowers_setup", {
        defaultValue: "Flowers Setup",
      }),
    },
    {
      value: "entrance_setup",
      label: t("execution.templates.entrance_setup", {
        defaultValue: "Entrance Setup",
      }),
    },
    {
      value: "buffet_setup",
      label: t("execution.templates.buffet_setup", {
        defaultValue: "Buffet Setup",
      }),
    },
    {
      value: "front_seating_setup",
      label: t("execution.templates.front_seating_setup", {
        defaultValue: "Front Seating Setup",
      }),
    },
    {
      value: "generic_execution_setup",
      label: t("execution.templates.generic_execution_setup", {
        defaultValue: "Generic Execution Setup",
      }),
    },
  ] as const;

export const getExecutionStructuredFields = (
  templateKey: string,
  t: TFunction,
): DynamicFieldDefinition[] => {
  const map: Record<string, DynamicFieldDefinition[]> = {
    kosha_setup: [
      {
        key: "koshaType",
        label: t("execution.fields.koshaType", {
          defaultValue: "Kosha Type",
        }),
        type: "select",
        options: [
          {
            value: "ready",
            label: t("execution.options.ready", { defaultValue: "Ready" }),
          },
          {
            value: "new",
            label: t("execution.options.new", { defaultValue: "New" }),
          },
        ],
      },
      {
        key: "chairType",
        label: t("execution.fields.chairType", {
          defaultValue: "Chair Type",
        }),
        type: "text",
        placeholder: t("execution.placeholders.chairType", {
          defaultValue: "Same design / custom",
        }),
      },
      {
        key: "chairWoodColor",
        label: t("execution.fields.chairWoodColor", {
          defaultValue: "Chair Wood Color",
        }),
        type: "text",
        placeholder: t("execution.placeholders.chairWoodColor", {
          defaultValue: "Beige",
        }),
      },
      {
        key: "chairFabricColor",
        label: t("execution.fields.chairFabricColor", {
          defaultValue: "Chair Fabric Color",
        }),
        type: "text",
        placeholder: t("execution.placeholders.chairFabricColor", {
          defaultValue: "Off-white",
        }),
      },
      {
        key: "cushionDetails",
        label: t("execution.fields.cushionDetails", {
          defaultValue: "Cushion Details",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.cushionDetails", {
          defaultValue: "Color, count, style...",
        }),
      },
      {
        key: "flooringType",
        label: t("execution.fields.flooringType", {
          defaultValue: "Flooring Type",
        }),
        type: "select",
        options: [
          {
            value: "carpet",
            label: t("execution.options.carpet", { defaultValue: "Carpet" }),
          },
          {
            value: "acrylic",
            label: t("execution.options.acrylic", { defaultValue: "Acrylic" }),
          },
          {
            value: "banner",
            label: t("execution.options.banner", { defaultValue: "Banner" }),
          },
          {
            value: "parquet",
            label: t("execution.options.parquet", { defaultValue: "Parquet" }),
          },
          {
            value: "sticker",
            label: t("execution.options.sticker", { defaultValue: "Sticker" }),
          },
        ],
      },
      {
        key: "stairsCount",
        label: t("execution.fields.stairsCount", {
          defaultValue: "Stairs Count",
        }),
        type: "number",
        placeholder: "6",
      },
      {
        key: "stairsNotes",
        label: t("execution.fields.stairsNotes", {
          defaultValue: "Stairs Notes",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.stairsNotes", {
          defaultValue: "Curve / edge to stage / cover details...",
        }),
      },
    ],
    flowers_setup: [
      {
        key: "flowerColors",
        label: t("execution.fields.flowerColors", {
          defaultValue: "Flower Colors",
        }),
        type: "text",
        placeholder: t("execution.placeholders.flowerColors", {
          defaultValue: "Burgundy, soft pink, green",
        }),
      },
      {
        key: "flowerType",
        label: t("execution.fields.flowerType", {
          defaultValue: "Flower Type",
        }),
        type: "select",
        options: [
          {
            value: "natural",
            label: t("execution.options.natural", { defaultValue: "Natural" }),
          },
          {
            value: "artificial",
            label: t("execution.options.artificial", {
              defaultValue: "Artificial",
            }),
          },
        ],
      },
      {
        key: "distributionAreas",
        label: t("execution.fields.distributionAreas", {
          defaultValue: "Distribution Areas",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.distributionAreas", {
          defaultValue: "Kosha, entrance, front seating, buffet...",
        }),
      },
      {
        key: "bouquetIncluded",
        label: t("execution.fields.bouquetIncluded", {
          defaultValue: "Bouquet Included",
        }),
        type: "checkbox",
        placeholder: t("execution.placeholders.bouquetIncluded", {
          defaultValue: "Include bouquet",
        }),
      },
      {
        key: "flowerNotes",
        label: t("execution.fields.flowerNotes", {
          defaultValue: "Flower Notes",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.flowerNotes", {
          defaultValue: "Any flower-specific remarks...",
        }),
      },
    ],
    entrance_setup: [
      {
        key: "entranceStyle",
        label: t("execution.fields.entranceStyle", {
          defaultValue: "Entrance Style",
        }),
        type: "text",
        placeholder: t("execution.placeholders.entranceStyle", {
          defaultValue: "Classic, floral arch, curtain entry...",
        }),
      },
      {
        key: "entranceCarpetType",
        label: t("execution.fields.entranceCarpetType", {
          defaultValue: "Entrance Carpet Type",
        }),
        type: "text",
        placeholder: t("execution.placeholders.entranceCarpetType", {
          defaultValue: "Carpet / banner / acrylic",
        }),
      },
      {
        key: "entranceDecor",
        label: t("execution.fields.entranceDecor", {
          defaultValue: "Entrance Decor",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.entranceDecor", {
          defaultValue: "Florals, lighting, hanging decor...",
        }),
      },
      {
        key: "entranceNotes",
        label: t("execution.fields.entranceNotes", {
          defaultValue: "Entrance Notes",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.entranceNotes", {
          defaultValue: "Important entrance execution notes...",
        }),
      },
    ],
    buffet_setup: [
      {
        key: "buffetTableSource",
        label: t("execution.fields.buffetTableSource", {
          defaultValue: "Buffet Table Source",
        }),
        type: "text",
        placeholder: t("execution.placeholders.buffetTableSource", {
          defaultValue: "Hotel / internal / rental",
        }),
      },
      {
        key: "buffetChairSource",
        label: t("execution.fields.buffetChairSource", {
          defaultValue: "Buffet Chair Source",
        }),
        type: "text",
        placeholder: t("execution.placeholders.buffetChairSource", {
          defaultValue: "Hotel / rental",
        }),
      },
      {
        key: "buffetFlowerStyle",
        label: t("execution.fields.buffetFlowerStyle", {
          defaultValue: "Buffet Flower Style",
        }),
        type: "text",
        placeholder: t("execution.placeholders.buffetFlowerStyle", {
          defaultValue: "Same event flowers / custom",
        }),
      },
      {
        key: "buffetAccessories",
        label: t("execution.fields.buffetAccessories", {
          defaultValue: "Buffet Accessories",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.buffetAccessories", {
          defaultValue: "Candles, tissue box, water bottles...",
        }),
      },
      {
        key: "buffetNotes",
        label: t("execution.fields.buffetNotes", {
          defaultValue: "Buffet Notes",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.buffetNotes", {
          defaultValue: "Additional buffet notes...",
        }),
      },
    ],
    front_seating_setup: [
      {
        key: "seatingType",
        label: t("execution.fields.seatingType", {
          defaultValue: "Seating Type",
        }),
        type: "text",
        placeholder: t("execution.placeholders.seatingType", {
          defaultValue: "Straight / curve / L-shape",
        }),
      },
      {
        key: "cushionStyle",
        label: t("execution.fields.cushionStyle", {
          defaultValue: "Cushion Style",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.cushionStyle", {
          defaultValue: "Colors, count, patterns...",
        }),
      },
      {
        key: "sideTables",
        label: t("execution.fields.sideTables", {
          defaultValue: "Side Tables / Lamps",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.sideTables", {
          defaultValue: "Tables, lamps, vases...",
        }),
      },
      {
        key: "seatingNotes",
        label: t("execution.fields.seatingNotes", {
          defaultValue: "Seating Notes",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.seatingNotes", {
          defaultValue: "Front seating notes...",
        }),
      },
    ],
    generic_execution_setup: [
      {
        key: "summary",
        label: t("execution.fields.summary", {
          defaultValue: "Execution Summary",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.summary", {
          defaultValue: "Describe what should be executed for this service...",
        }),
      },
      {
        key: "style",
        label: t("execution.fields.style", {
          defaultValue: "Style",
        }),
        type: "text",
        placeholder: t("execution.placeholders.style", {
          defaultValue: "Classic / modern / romantic...",
        }),
      },
      {
        key: "colors",
        label: t("execution.fields.colors", {
          defaultValue: "Colors",
        }),
        type: "text",
        placeholder: t("execution.placeholders.colors", {
          defaultValue: "Main color directions",
        }),
      },
      {
        key: "specialInstructions",
        label: t("execution.fields.specialInstructions", {
          defaultValue: "Special Instructions",
        }),
        type: "textarea",
        placeholder: t("execution.placeholders.specialInstructions", {
          defaultValue: "Anything the executor must know...",
        }),
      },
    ],
  };

  return map[templateKey] ?? map.generic_execution_setup;
};
