import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type EventSectionType =
  | "client_info"
  | "stage"
  | "chairs"
  | "floor"
  | "hall_sides"
  | "entrance"
  | "vip_front"
  | "back_seating"
  | "buffet"
  | "flowers"
  | "groom_stage"
  | "external_companies"
  | "summary"
  | "designer_notes"
  | "general_notes";

export interface EventSectionAttributes {
  id: number;
  eventId: number;
  sectionType: EventSectionType;
  title?: string | null;
  sortOrder: number;
  data: object;
  notes?: string | null;
  isCompleted: boolean;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type EventSectionCreationAttributes = Optional<
  EventSectionAttributes,
  | "id"
  | "title"
  | "sortOrder"
  | "notes"
  | "isCompleted"
  | "createdBy"
  | "updatedBy"
>;

export class EventSection
  extends Model<EventSectionAttributes, EventSectionCreationAttributes>
  implements EventSectionAttributes
{
  public id!: number;
  public eventId!: number;
  public sectionType!: EventSectionType;
  public title?: string | null;
  public sortOrder!: number;
  public data!: object;
  public notes?: string | null;
  public isCompleted!: boolean;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

EventSection.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    eventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    sectionType: {
      type: DataTypes.ENUM(
        "client_info",
        "stage",
        "chairs",
        "floor",
        "hall_sides",
        "entrance",
        "vip_front",
        "back_seating",
        "buffet",
        "flowers",
        "groom_stage",
        "external_companies",
        "summary",
        "designer_notes",
        "general_notes",
      ),
      allowNull: false,
    },

    title: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    data: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    updatedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "event_sections",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["eventId"] },
      { fields: ["sectionType"] },
      { fields: ["sortOrder"] },
    ],
  },
);
