// src/models/index.ts
import { sequelize } from "../config/database";
import { User } from "./user.model";
import { Role } from "./role.model";
import { Permission } from "./permission.model";
import { UserRole } from "./userRole.model";
import { RolePermission } from "./rolePermission.model";
import { RefreshToken } from "./refreshToken.model";
import { Appointment } from "./appointment.model";
import { Venue } from "./venue.model";
import { Customer } from "./customer.model";
import { Event } from "./event.model";
import { EventSection } from "./eventSection.model";
import { Vendor } from "./vendor.model";
import { VendorSubService } from "./vendorSubService.model";
import { VendorPricingPlan } from "./vendorPricingPlan.model";
import { EventVendor } from "./eventVendor.model";
import { EventVendorSubService } from "./eventVendorSubService.model";
import { Service } from "./service.model";
import { EventService } from "./eventService.model";
import { Quotation } from "./quotation.model";
import { QuotationItem } from "./quotationItem.model";
import { Contract } from "./contract.model";
import { ContractItem } from "./contractItem.model";
import { PaymentSchedule } from "./paymentSchedule.model";
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

// Customer -> Appointment
Customer.hasMany(Appointment, {
  foreignKey: "customerId",
  as: "appointments",
});
Appointment.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

// Venue -> Appointment
Venue.hasMany(Appointment, {
  foreignKey: "venueId",
  as: "appointments",
});
Appointment.belongsTo(Venue, {
  foreignKey: "venueId",
  as: "venue",
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

// Customer -> Event
Customer.hasMany(Event, {
  foreignKey: "customerId",
  as: "events",
});
Event.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

// Venue -> Event
Venue.hasMany(Event, {
  foreignKey: "venueId",
  as: "events",
});
Event.belongsTo(Venue, {
  foreignKey: "venueId",
  as: "venue",
});

// Appointment -> Event source
Appointment.hasMany(Event, {
  foreignKey: "sourceAppointmentId",
  as: "sourcedEvents",
});
Event.belongsTo(Appointment, {
  foreignKey: "sourceAppointmentId",
  as: "sourceAppointment",
});

// Event -> EventSection
Event.hasMany(EventSection, {
  foreignKey: "eventId",
  as: "sections",
});
EventSection.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

// User -> Event audit
User.hasMany(Event, {
  foreignKey: "createdBy",
  as: "createdEvents",
});
Event.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Event, {
  foreignKey: "updatedBy",
  as: "updatedEvents",
});
Event.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> EventSection audit
User.hasMany(EventSection, {
  foreignKey: "createdBy",
  as: "createdEventSections",
});
EventSection.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(EventSection, {
  foreignKey: "updatedBy",
  as: "updatedEventSections",
});
EventSection.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// Vendor -> EventVendor
Vendor.hasMany(EventVendor, {
  foreignKey: "vendorId",
  as: "eventVendors",
});
EventVendor.belongsTo(Vendor, {
  foreignKey: "vendorId",
  as: "vendor",
});

// Vendor -> VendorSubService
Vendor.hasMany(VendorSubService, {
  foreignKey: "vendorId",
  as: "subServices",
});
VendorSubService.belongsTo(Vendor, {
  foreignKey: "vendorId",
  as: "vendor",
});

// Vendor -> VendorPricingPlan
Vendor.hasMany(VendorPricingPlan, {
  foreignKey: "vendorId",
  as: "pricingPlans",
});
VendorPricingPlan.belongsTo(Vendor, {
  foreignKey: "vendorId",
  as: "vendor",
});

// Event -> EventVendor
Event.hasMany(EventVendor, {
  foreignKey: "eventId",
  as: "vendors",
});
EventVendor.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

// VendorPricingPlan -> EventVendor
VendorPricingPlan.hasMany(EventVendor, {
  foreignKey: "pricingPlanId",
  as: "eventVendors",
});
EventVendor.belongsTo(VendorPricingPlan, {
  foreignKey: "pricingPlanId",
  as: "pricingPlan",
});

// EventVendor -> EventVendorSubService
EventVendor.hasMany(EventVendorSubService, {
  foreignKey: "eventVendorId",
  as: "selectedSubServices",
});
EventVendorSubService.belongsTo(EventVendor, {
  foreignKey: "eventVendorId",
  as: "eventVendor",
});

// VendorSubService -> EventVendorSubService
VendorSubService.hasMany(EventVendorSubService, {
  foreignKey: "vendorSubServiceId",
  as: "eventVendorSelections",
});
EventVendorSubService.belongsTo(VendorSubService, {
  foreignKey: "vendorSubServiceId",
  as: "vendorSubService",
});

// User -> Vendor audit
User.hasMany(Vendor, {
  foreignKey: "createdBy",
  as: "createdVendors",
});
Vendor.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Vendor, {
  foreignKey: "updatedBy",
  as: "updatedVendors",
});
Vendor.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> VendorSubService audit
User.hasMany(VendorSubService, {
  foreignKey: "createdBy",
  as: "createdVendorSubServices",
});
VendorSubService.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(VendorSubService, {
  foreignKey: "updatedBy",
  as: "updatedVendorSubServices",
});
VendorSubService.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> VendorPricingPlan audit
User.hasMany(VendorPricingPlan, {
  foreignKey: "createdBy",
  as: "createdVendorPricingPlans",
});
VendorPricingPlan.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(VendorPricingPlan, {
  foreignKey: "updatedBy",
  as: "updatedVendorPricingPlans",
});
VendorPricingPlan.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> EventVendor audit
User.hasMany(EventVendor, {
  foreignKey: "createdBy",
  as: "createdEventVendors",
});
EventVendor.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(EventVendor, {
  foreignKey: "updatedBy",
  as: "updatedEventVendors",
});
EventVendor.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> EventVendorSubService audit
User.hasMany(EventVendorSubService, {
  foreignKey: "createdBy",
  as: "createdEventVendorSubServices",
});
EventVendorSubService.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(EventVendorSubService, {
  foreignKey: "updatedBy",
  as: "updatedEventVendorSubServices",
});
EventVendorSubService.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// Service -> EventService
Service.hasMany(EventService, {
  foreignKey: "serviceId",
  as: "eventServices",
});
EventService.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

// Event -> EventService
Event.hasMany(EventService, {
  foreignKey: "eventId",
  as: "services",
});
EventService.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

// User -> Service audit
User.hasMany(Service, {
  foreignKey: "createdBy",
  as: "createdServices",
});
Service.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Service, {
  foreignKey: "updatedBy",
  as: "updatedServices",
});
Service.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> EventService audit
User.hasMany(EventService, {
  foreignKey: "createdBy",
  as: "createdEventServices",
});
EventService.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(EventService, {
  foreignKey: "updatedBy",
  as: "updatedEventServices",
});
EventService.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});
// Event -> Quotation
Event.hasMany(Quotation, {
  foreignKey: "eventId",
  as: "quotations",
});
Quotation.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

// Customer -> Quotation
Customer.hasMany(Quotation, {
  foreignKey: "customerId",
  as: "quotations",
});
Quotation.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

// Lead -> Quotation

// Quotation -> QuotationItem
Quotation.hasMany(QuotationItem, {
  foreignKey: "quotationId",
  as: "items",
});
QuotationItem.belongsTo(Quotation, {
  foreignKey: "quotationId",
  as: "quotation",
});

// EventService -> QuotationItem
EventService.hasMany(QuotationItem, {
  foreignKey: "eventServiceId",
  as: "quotationItems",
});
QuotationItem.belongsTo(EventService, {
  foreignKey: "eventServiceId",
  as: "eventService",
});

// Service -> QuotationItem
Service.hasMany(QuotationItem, {
  foreignKey: "serviceId",
  as: "quotationItems",
});
QuotationItem.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

// EventVendor -> QuotationItem
EventVendor.hasMany(QuotationItem, {
  foreignKey: "eventVendorId",
  as: "quotationItems",
});
QuotationItem.belongsTo(EventVendor, {
  foreignKey: "eventVendorId",
  as: "eventVendor",
});

// Vendor -> QuotationItem
Vendor.hasMany(QuotationItem, {
  foreignKey: "vendorId",
  as: "quotationItems",
});
QuotationItem.belongsTo(Vendor, {
  foreignKey: "vendorId",
  as: "vendor",
});

// VendorPricingPlan -> QuotationItem
VendorPricingPlan.hasMany(QuotationItem, {
  foreignKey: "pricingPlanId",
  as: "quotationItems",
});
QuotationItem.belongsTo(VendorPricingPlan, {
  foreignKey: "pricingPlanId",
  as: "pricingPlan",
});

// User -> Quotation audit
User.hasMany(Quotation, {
  foreignKey: "createdBy",
  as: "createdQuotations",
});
Quotation.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Quotation, {
  foreignKey: "updatedBy",
  as: "updatedQuotations",
});
Quotation.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> QuotationItem audit
User.hasMany(QuotationItem, {
  foreignKey: "createdBy",
  as: "createdQuotationItems",
});
QuotationItem.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(QuotationItem, {
  foreignKey: "updatedBy",
  as: "updatedQuotationItems",
});
QuotationItem.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// Quotation -> Contract
Quotation.hasMany(Contract, {
  foreignKey: "quotationId",
  as: "contracts",
});
Contract.belongsTo(Quotation, {
  foreignKey: "quotationId",
  as: "quotation",
});

// Event -> Contract
Event.hasMany(Contract, {
  foreignKey: "eventId",
  as: "contracts",
});
Contract.belongsTo(Event, {
  foreignKey: "eventId",
  as: "event",
});

// Customer -> Contract
Customer.hasMany(Contract, {
  foreignKey: "customerId",
  as: "contracts",
});
Contract.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

// Contract -> ContractItem
Contract.hasMany(ContractItem, {
  foreignKey: "contractId",
  as: "items",
});
ContractItem.belongsTo(Contract, {
  foreignKey: "contractId",
  as: "contract",
});

// Contract -> PaymentSchedule
Contract.hasMany(PaymentSchedule, {
  foreignKey: "contractId",
  as: "paymentSchedules",
});
PaymentSchedule.belongsTo(Contract, {
  foreignKey: "contractId",
  as: "contract",
});

// QuotationItem -> ContractItem
QuotationItem.hasMany(ContractItem, {
  foreignKey: "quotationItemId",
  as: "contractItems",
});
ContractItem.belongsTo(QuotationItem, {
  foreignKey: "quotationItemId",
  as: "quotationItem",
});

// EventService -> ContractItem
EventService.hasMany(ContractItem, {
  foreignKey: "eventServiceId",
  as: "contractItems",
});
ContractItem.belongsTo(EventService, {
  foreignKey: "eventServiceId",
  as: "eventService",
});

// Service -> ContractItem
Service.hasMany(ContractItem, {
  foreignKey: "serviceId",
  as: "contractItems",
});
ContractItem.belongsTo(Service, {
  foreignKey: "serviceId",
  as: "service",
});

// EventVendor -> ContractItem
EventVendor.hasMany(ContractItem, {
  foreignKey: "eventVendorId",
  as: "contractItems",
});
ContractItem.belongsTo(EventVendor, {
  foreignKey: "eventVendorId",
  as: "eventVendor",
});

// Vendor -> ContractItem
Vendor.hasMany(ContractItem, {
  foreignKey: "vendorId",
  as: "contractItems",
});
ContractItem.belongsTo(Vendor, {
  foreignKey: "vendorId",
  as: "vendor",
});

// VendorPricingPlan -> ContractItem
VendorPricingPlan.hasMany(ContractItem, {
  foreignKey: "pricingPlanId",
  as: "contractItems",
});
ContractItem.belongsTo(VendorPricingPlan, {
  foreignKey: "pricingPlanId",
  as: "pricingPlan",
});

// User -> Contract audit
User.hasMany(Contract, {
  foreignKey: "createdBy",
  as: "createdContracts",
});
Contract.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Contract, {
  foreignKey: "updatedBy",
  as: "updatedContracts",
});
Contract.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> ContractItem audit
User.hasMany(ContractItem, {
  foreignKey: "createdBy",
  as: "createdContractItems",
});
ContractItem.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(ContractItem, {
  foreignKey: "updatedBy",
  as: "updatedContractItems",
});
ContractItem.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

// User -> PaymentSchedule audit
User.hasMany(PaymentSchedule, {
  foreignKey: "createdBy",
  as: "createdPaymentSchedules",
});
PaymentSchedule.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(PaymentSchedule, {
  foreignKey: "updatedBy",
  as: "updatedPaymentSchedules",
});
PaymentSchedule.belongsTo(User, {
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
  Appointment,
  Customer,
  Event,
  EventSection,
  Vendor,
  VendorSubService,
  VendorPricingPlan,
  EventVendor,
  EventVendorSubService,
  Service,
  EventService,
  Quotation,
  QuotationItem,
  Contract,
  ContractItem,
  PaymentSchedule,
};
