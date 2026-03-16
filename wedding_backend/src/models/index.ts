// src/models/index.ts
import { sequelize } from "../config/database";
import { User } from "./user.model";
import { Role } from "./role.model";
import { Permission } from "./permission.model";
import { UserRole } from "./userRole.model";
import { RolePermission } from "./rolePermission.model";
import { RefreshToken } from "./refreshToken.model";
import { Appointment } from "./appointment.model";
import { Lead } from "./lead.model";
import { Venue } from "./venue.model";
import { Customer } from "./customer.model";

// علاقات
User.belongsToMany(Role, { through: UserRole, foreignKey: "userId" });
Role.belongsToMany(User, { through: UserRole, foreignKey: "roleId" });

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
});

RefreshToken.belongsTo(User, { foreignKey: "userId" });
User.hasMany(RefreshToken, { foreignKey: "userId" });

// =========================
// Wedding starter relations
// =========================

// Venue -> Lead
Venue.hasMany(Lead, {
  foreignKey: "venueId",
  as: "leads",
});
Lead.belongsTo(Venue, {
  foreignKey: "venueId",
  as: "venue",
});

// Lead -> Appointment
Lead.hasMany(Appointment, {
  foreignKey: "leadId",
  as: "appointments",
});
Appointment.belongsTo(Lead, {
  foreignKey: "leadId",
  as: "lead",
});

// User -> Appointment (assigned employee)
User.hasMany(Appointment, {
  foreignKey: "assignedToUserId",
  as: "assignedAppointments",
});
Appointment.belongsTo(User, {
  foreignKey: "assignedToUserId",
  as: "assignedToUser",
});

// User -> Lead (audit)
User.hasMany(Lead, {
  foreignKey: "createdBy",
  as: "createdLeads",
});
Lead.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Lead, {
  foreignKey: "updatedBy",
  as: "updatedLeads",
});
Lead.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> Appointment (audit)
User.hasMany(Appointment, {
  foreignKey: "createdBy",
  as: "createdAppointments",
});
Appointment.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Appointment, {
  foreignKey: "updatedBy",
  as: "updatedAppointments",
});
Appointment.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// Venue -> Customer
Venue.hasMany(Customer, {
  foreignKey: "venueId",
  as: "customers",
});
Customer.belongsTo(Venue, {
  foreignKey: "venueId",
  as: "venue",
});

// Lead -> Customer (source lead)
Lead.hasOne(Customer, {
  foreignKey: "sourceLeadId",
  as: "customer",
});
Customer.belongsTo(Lead, {
  foreignKey: "sourceLeadId",
  as: "sourceLead",
});

// User -> Customer (audit)
User.hasMany(Customer, {
  foreignKey: "createdBy",
  as: "createdCustomers",
});
Customer.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Customer, {
  foreignKey: "updatedBy",
  as: "updatedCustomers",
});
Customer.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});
export {
  sequelize,
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  RefreshToken,
  Venue,
  Lead,
  Appointment,
  Customer,
};
