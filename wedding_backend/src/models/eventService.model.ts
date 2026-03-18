import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type EventServiceStatus =
  | "draft"
  | "approved"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface EventServiceAttributes {
  id: number;
  eventId: number;

  serviceId?: number | null;
  serviceNameSnapshot: string;
  category: string;

  quantity: number;
  unitPrice?: number | null;
  totalPrice?: number | null;

  notes?: string | null;
  status: EventServiceStatus;
  sortOrder: number;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type EventServiceCreationAttributes = Optional<
  EventServiceAttributes,
  | "id"
  | "serviceId"
  | "unitPrice"
  | "totalPrice"
  | "notes"
  | "status"
  | "sortOrder"
  | "createdBy"
  | "updatedBy"
>;

export class EventService
  extends Model<EventServiceAttributes, EventServiceCreationAttributes>
  implements EventServiceAttributes
{
  public id!: number;
  public eventId!: number;

  public serviceId?: number | null;
  public serviceNameSnapshot!: string;
  public category!: string;

  public quantity!: number;
  public unitPrice?: number | null;
  public totalPrice?: number | null;

  public notes?: string | null;
  public status!: EventServiceStatus;
  public sortOrder!: number;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

EventService.init(
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

    serviceId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    serviceNameSnapshot: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    quantity: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
      defaultValue: 1,
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    totalPrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "draft",
        "approved",
        "confirmed",
        "cancelled",
        "completed",
      ),
      allowNull: false,
      defaultValue: "draft",
    },

    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
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
    tableName: "event_services",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["eventId"] },
      { fields: ["serviceId"] },
      { fields: ["category"] },
      { fields: ["status"] },
      { fields: ["sortOrder"] },
    ],
  },
);
