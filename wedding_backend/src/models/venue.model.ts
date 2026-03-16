// src/models/venue.model.ts
import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

export interface VenueAttributes {
  id: number;
  name: string;
  city?: string | null;
  area?: string | null;
  address?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive: boolean;
}

type VenueCreationAttributes = Optional<
  VenueAttributes,
  | "id"
  | "city"
  | "area"
  | "address"
  | "phone"
  | "contactPerson"
  | "notes"
  | "isActive"
>;

export class Venue
  extends Model<VenueAttributes, VenueCreationAttributes>
  implements VenueAttributes
{
  public id!: number;
  public name!: string;
  public city?: string | null;
  public area?: string | null;
  public address?: string | null;
  public phone?: string | null;
  public contactPerson?: string | null;
  public notes?: string | null;
  public isActive!: boolean;
}

Venue.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },

    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    area: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    contactPerson: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "venues",
    timestamps: true,
    paranoid: true,
  },
);
