import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export type ServiceCategory =
  | "internal_setup"
  | "external_service"
  | "flowers"
  | "stage"
  | "entrance"
  | "chairs"
  | "tables"
  | "buffet"
  | "lighting"
  | "photography"
  | "audio"
  | "hospitality"
  | "female_supplies"
  | "transport"
  | "other";

export type ServicePricingType = "fixed" | "per_guest" | "per_unit" | "custom";

export interface ServiceAttributes {
  id: number;
  name: string;
  code?: string | null;
  category: ServiceCategory;
  pricingType?: ServicePricingType | null;
  basePrice?: number | null;
  unitName?: string | null;
  description?: string | null;
  isActive: boolean;

  createdBy?: number | null;
  updatedBy?: number | null;
}

type ServiceCreationAttributes = Optional<
  ServiceAttributes,
  | "id"
  | "code"
  | "pricingType"
  | "basePrice"
  | "unitName"
  | "description"
  | "isActive"
  | "createdBy"
  | "updatedBy"
>;

export class Service
  extends Model<ServiceAttributes, ServiceCreationAttributes>
  implements ServiceAttributes
{
  public id!: number;
  public name!: string;
  public code?: string | null;
  public category!: ServiceCategory;
  public pricingType?: ServicePricingType | null;
  public basePrice?: number | null;
  public unitName?: string | null;
  public description?: string | null;
  public isActive!: boolean;

  public createdBy?: number | null;
  public updatedBy?: number | null;
}

Service.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    category: {
      type: DataTypes.ENUM(
        "internal_setup",
        "external_service",
        "flowers",
        "stage",
        "entrance",
        "chairs",
        "tables",
        "buffet",
        "lighting",
        "photography",
        "audio",
        "hospitality",
        "female_supplies",
        "transport",
        "other",
      ),
      allowNull: false,
    },

    pricingType: {
      type: DataTypes.ENUM("fixed", "per_guest", "per_unit", "custom"),
      allowNull: false,
      defaultValue: "fixed",
    },

    basePrice: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true,
    },

    unitName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: "services",
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ["name"] },
      { fields: ["code"] },
      { fields: ["category"] },
      { fields: ["isActive"] },
    ],
  },
);
