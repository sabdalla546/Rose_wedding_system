'use strict';

const vendorTypeValues = [
  'dj',
  'lighting',
  'barcode',
  'photography',
  'perfumes',
  'coffee_station',
  'cheese',
  'ac_generator',
  'bleachers',
  'instant_photography',
  'valet',
  'female_supplies',
  'family_services',
  'sweets_savories',
  'other',
];

const serviceCategoryValues = [
  'internal_setup',
  'external_service',
  'flowers',
  'stage',
  'entrance',
  'chairs',
  'tables',
  'buffet',
  'lighting',
  'photography',
  'audio',
  'hospitality',
  'female_supplies',
  'transport',
  'other',
];

const appointmentTypeValues = [
  'New Appointment 1',
  'New Appointment 2',
  'New Appointment 3',
  'Details Appointment 1',
  'Details Appointment 2',
  'Details Appointment 3',
  'Office Visit',
];

const appointmentStatusValues = [
  'scheduled',
  'confirmed',
  'completed',
  'rescheduled',
  'cancelled',
  'no_show',
];

const customerStatusValues = ['active', 'inactive'];
const eventStatusValues = [
  'draft',
  'designing',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];
const eventServiceStatusValues = [
  'draft',
  'approved',
  'confirmed',
  'cancelled',
  'completed',
];
const quotationStatusValues = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'expired',
  'converted_to_contract',
];
const contractStatusValues = [
  'draft',
  'active',
  'completed',
  'cancelled',
  'terminated',
];
const itemTypeValues = ['service', 'vendor'];
const paymentScheduleTypeValues = ['deposit', 'installment', 'final'];
const paymentScheduleStatusValues = ['pending', 'paid', 'cancelled', 'overdue'];

const idColumn = () => ({
  type: { kind: 'INTEGER', unsigned: true },
  allowNull: false,
  primaryKey: true,
  autoIncrement: true,
});

const unsignedInteger = (extra = {}) => ({
  type: { kind: 'INTEGER', unsigned: true },
  ...extra,
});

const integer = (extra = {}) => ({
  type: { kind: 'INTEGER' },
  ...extra,
});

const string = (length, extra = {}) => ({
  type: { kind: 'STRING', length },
  ...extra,
});

const boolean = (extra = {}) => ({
  type: { kind: 'BOOLEAN' },
  ...extra,
});

const dateTime = (extra = {}) => ({
  type: { kind: 'DATE' },
  ...extra,
});

const dateOnly = (extra = {}) => ({
  type: { kind: 'DATEONLY' },
  ...extra,
});

const text = (extra = {}) => ({
  type: { kind: 'TEXT' },
  ...extra,
});

const json = (extra = {}) => ({
  type: { kind: 'JSON' },
  ...extra,
});

const decimal = (precision, scale, extra = {}) => ({
  type: { kind: 'DECIMAL', precision, scale },
  ...extra,
});

const enumColumn = (values, extra = {}) => ({
  type: { kind: 'ENUM', values },
  ...extra,
});

const references = (model, onDelete = 'SET NULL', onUpdate = 'CASCADE') => ({
  references: { model, key: 'id' },
  onDelete,
  onUpdate,
});

const tableOptions = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
};

const tableDefinitions = [
  {
    name: 'users',
    columns: {
      id: idColumn(),
      email: string(150, { allowNull: false, unique: true }),
      password: string(255, { allowNull: false }),
      fullName: string(150, { allowNull: false }),
      isActive: boolean({ defaultValue: true }),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [],
  },
  {
    name: 'roles',
    columns: {
      id: idColumn(),
      name: string(100, { allowNull: false, unique: true }),
      description: string(255),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
    },
    indexes: [],
  },
  {
    name: 'permissions',
    columns: {
      id: idColumn(),
      code: string(150, { allowNull: false, unique: true }),
      description: string(255),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
    },
    indexes: [],
  },
  {
    name: 'venues',
    columns: {
      id: idColumn(),
      name: string(150, { allowNull: false, unique: true }),
      city: string(100),
      area: string(100),
      address: string(255),
      phone: string(30),
      contactPerson: string(150),
      notes: text(),
      isActive: boolean({ allowNull: false, defaultValue: true }),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [],
  },
  {
    name: 'refresh_tokens',
    columns: {
      id: idColumn(),
      userId: unsignedInteger({
        allowNull: false,
        ...references('users', 'NO ACTION'),
      }),
      token: string(500, { allowNull: false, unique: true }),
      expiresAt: dateTime({ allowNull: false }),
      revoked: boolean({ defaultValue: false }),
      replacedByToken: string(500, { allowNull: true }),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
    },
    indexes: [
      { name: 'refresh_tokens_user_id', fields: ['userId'] },
      { name: 'refresh_tokens_expires_at', fields: ['expiresAt'] },
    ],
  },
  {
    name: 'customers',
    columns: {
      id: idColumn(),
      fullName: string(150, { allowNull: false }),
      mobile: string(30, { allowNull: false }),
      mobile2: string(30),
      email: string(150),
      nationalId: string(12),
      address: string(255),
      notes: text(),
      status: enumColumn(customerStatusValues, {
        allowNull: false,
        defaultValue: 'active',
      }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'customers_mobile', fields: ['mobile'] },
      { name: 'customers_national_id', fields: ['nationalId'] },
      { name: 'customers_status', fields: ['status'] },
    ],
  },
  {
    name: 'vendor_types',
    columns: {
      id: idColumn(),
      name: string(150, { allowNull: false }),
      nameAr: string(150, { allowNull: false }),
      slug: string(150, { allowNull: false, unique: true }),
      isActive: boolean({ allowNull: false, defaultValue: true }),
      sortOrder: integer({ allowNull: false, defaultValue: 0 }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'vendor_types_is_active', fields: ['isActive'] },
      { name: 'vendor_types_sort_order', fields: ['sortOrder'] },
    ],
  },
  {
    name: 'services',
    columns: {
      id: idColumn(),
      name: string(150, { allowNull: false }),
      code: string(50, { allowNull: true }),
      category: enumColumn(serviceCategoryValues, { allowNull: false }),
      pricingType: enumColumn(['fixed', 'per_guest', 'per_unit', 'custom'], {
        allowNull: false,
        defaultValue: 'fixed',
      }),
      basePrice: decimal(12, 3, { allowNull: true }),
      unitName: string(50, { allowNull: true }),
      description: text({ allowNull: true }),
      isActive: boolean({ allowNull: false, defaultValue: true }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'services_name', fields: ['name'] },
      { name: 'services_code', fields: ['code'] },
      { name: 'services_category', fields: ['category'] },
      { name: 'services_is_active', fields: ['isActive'] },
    ],
  },
  {
    name: 'inventory_items',
    columns: {
      id: idColumn(),
      name: string(150, { allowNull: false }),
      quantity: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      imagePath: string(255, { allowNull: true }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
    },
    indexes: [
      { name: 'inventory_items_name', fields: ['name'] },
      { name: 'inventory_items_quantity', fields: ['quantity'] },
      { name: 'inventory_items_created_by', fields: ['createdBy'] },
      { name: 'inventory_items_updated_by', fields: ['updatedBy'] },
    ],
  },
  {
    name: 'user_roles',
    columns: {
      userId: unsignedInteger({
        allowNull: false,
        primaryKey: true,
        ...references('users', 'CASCADE'),
      }),
      roleId: unsignedInteger({
        allowNull: false,
        primaryKey: true,
        ...references('roles', 'CASCADE'),
      }),
    },
    indexes: [],
  },
  {
    name: 'role_permissions',
    columns: {
      roleId: unsignedInteger({
        allowNull: false,
        primaryKey: true,
        ...references('roles', 'CASCADE'),
      }),
      permissionId: unsignedInteger({
        allowNull: false,
        primaryKey: true,
        ...references('permissions', 'CASCADE'),
      }),
    },
    indexes: [],
  },
  {
    name: 'appointments',
    columns: {
      id: idColumn(),
      customerId: unsignedInteger({
        allowNull: false,
        ...references('customers', 'CASCADE'),
      }),
      appointmentDate: dateOnly({ allowNull: false }),
      appointmentStartTime: string(10, { allowNull: false }),
      appointmentEndTime: string(10, { allowNull: true }),
      meetingType: enumColumn(appointmentTypeValues, {
        allowNull: false,
        defaultValue: 'Office Visit',
      }),
      weddingDate: dateOnly({ allowNull: true }),
      guestCount: unsignedInteger({ allowNull: true }),
      venueId: unsignedInteger(references('venues')),
      notes: text({ allowNull: true }),
      status: enumColumn(appointmentStatusValues, {
        allowNull: false,
        defaultValue: 'scheduled',
      }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'appointments_customer_id', fields: ['customerId'] },
      { name: 'appointments_appointment_date', fields: ['appointmentDate'] },
      { name: 'appointments_venue_id', fields: ['venueId'] },
      { name: 'appointments_status', fields: ['status'] },
    ],
  },
  {
    name: 'vendors',
    columns: {
      id: idColumn(),
      name: string(150, { allowNull: false }),
      type: string(150, { allowNull: false }),
      typeId: unsignedInteger(references('vendor_types')),
      contactPerson: string(150, { allowNull: true }),
      phone: string(30, { allowNull: true }),
      phone2: string(30, { allowNull: true }),
      email: string(150, { allowNull: true }),
      address: string(255, { allowNull: true }),
      notes: text({ allowNull: true }),
      isActive: boolean({ allowNull: false, defaultValue: true }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'vendors_name', fields: ['name'] },
      { name: 'vendors_type', fields: ['type'] },
      { name: 'vendors_type_id', fields: ['typeId'] },
      { name: 'vendors_is_active', fields: ['isActive'] },
    ],
  },
  {
    name: 'events',
    columns: {
      id: idColumn(),
      customerId: unsignedInteger(references('customers')),
      sourceAppointmentId: unsignedInteger(references('appointments')),
      title: string(200, { allowNull: true }),
      eventDate: dateOnly({ allowNull: false }),
      venueId: unsignedInteger(references('venues')),
      venueNameSnapshot: string(150, { allowNull: true }),
      groomName: string(150, { allowNull: true }),
      brideName: string(150, { allowNull: true }),
      guestCount: unsignedInteger({ allowNull: true }),
      notes: text({ allowNull: true }),
      status: enumColumn(eventStatusValues, {
        allowNull: false,
        defaultValue: 'draft',
      }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'events_customer_id', fields: ['customerId'] },
      { name: 'events_source_appointment_id', fields: ['sourceAppointmentId'] },
      { name: 'events_event_date', fields: ['eventDate'] },
      { name: 'events_venue_id', fields: ['venueId'] },
      { name: 'events_status', fields: ['status'] },
    ],
  },
  {
    name: 'vendor_sub_services',
    columns: {
      id: idColumn(),
      vendorId: unsignedInteger(references('vendors')),
      vendorType: enumColumn(vendorTypeValues, { allowNull: true }),
      name: string(150, { allowNull: false }),
      code: string(50, { allowNull: true }),
      description: text({ allowNull: true }),
      sortOrder: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      isActive: boolean({ allowNull: false, defaultValue: true }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'vendor_sub_services_vendor_id', fields: ['vendorId'] },
      { name: 'vendor_sub_services_vendor_type', fields: ['vendorType'] },
      { name: 'vendor_sub_services_name', fields: ['name'] },
      { name: 'vendor_sub_services_code', fields: ['code'] },
      { name: 'vendor_sub_services_sort_order', fields: ['sortOrder'] },
      { name: 'vendor_sub_services_is_active', fields: ['isActive'] },
    ],
  },
  {
    name: 'vendor_pricing_plans',
    columns: {
      id: idColumn(),
      vendorId: unsignedInteger(references('vendors')),
      vendorType: enumColumn(vendorTypeValues, { allowNull: true }),
      name: string(150, { allowNull: false }),
      minSubServices: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      maxSubServices: unsignedInteger({ allowNull: true }),
      price: decimal(12, 3, { allowNull: false, defaultValue: 0 }),
      notes: text({ allowNull: true }),
      isActive: boolean({ allowNull: false, defaultValue: true }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'vendor_pricing_plans_vendor_id', fields: ['vendorId'] },
      { name: 'vendor_pricing_plans_vendor_type', fields: ['vendorType'] },
      { name: 'vendor_pricing_plans_name', fields: ['name'] },
      {
        name: 'vendor_pricing_plans_min_sub_services',
        fields: ['minSubServices'],
      },
      {
        name: 'vendor_pricing_plans_max_sub_services',
        fields: ['maxSubServices'],
      },
      { name: 'vendor_pricing_plans_is_active', fields: ['isActive'] },
    ],
  },
  {
    name: 'event_services',
    columns: {
      id: idColumn(),
      eventId: unsignedInteger({
        allowNull: false,
        ...references('events', 'CASCADE'),
      }),
      serviceId: unsignedInteger(references('services')),
      serviceNameSnapshot: string(150, { allowNull: false }),
      category: string(100, { allowNull: false }),
      quantity: decimal(12, 3, { allowNull: false, defaultValue: 1 }),
      unitPrice: decimal(12, 3, { allowNull: true }),
      totalPrice: decimal(12, 3, { allowNull: true }),
      notes: text({ allowNull: true }),
      status: enumColumn(eventServiceStatusValues, {
        allowNull: false,
        defaultValue: 'draft',
      }),
      sortOrder: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'event_services_event_id', fields: ['eventId'] },
      { name: 'event_services_service_id', fields: ['serviceId'] },
      { name: 'event_services_category', fields: ['category'] },
      { name: 'event_services_status', fields: ['status'] },
      { name: 'event_services_sort_order', fields: ['sortOrder'] },
    ],
  },
  {
    name: 'quotations',
    columns: {
      id: idColumn(),
      eventId: unsignedInteger({
        allowNull: false,
        ...references('events', 'CASCADE'),
      }),
      customerId: unsignedInteger(references('customers')),
      leadId: unsignedInteger({ allowNull: true }),
      quotationNumber: string(100, { allowNull: true }),
      issueDate: dateOnly({ allowNull: false }),
      validUntil: dateOnly({ allowNull: true }),
      subtotal: decimal(12, 3, { allowNull: true }),
      discountAmount: decimal(12, 3, { allowNull: true, defaultValue: 0 }),
      totalAmount: decimal(12, 3, { allowNull: true }),
      notes: text({ allowNull: true }),
      status: enumColumn(quotationStatusValues, {
        allowNull: false,
        defaultValue: 'draft',
      }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'quotations_event_id', fields: ['eventId'] },
      { name: 'quotations_customer_id', fields: ['customerId'] },
      { name: 'quotations_lead_id', fields: ['leadId'] },
      { name: 'quotations_quotation_number', fields: ['quotationNumber'] },
      { name: 'quotations_issue_date', fields: ['issueDate'] },
      { name: 'quotations_status', fields: ['status'] },
    ],
  },
  {
    name: 'event_vendors',
    columns: {
      id: idColumn(),
      eventId: unsignedInteger({
        allowNull: false,
        ...references('events', 'CASCADE'),
      }),
      vendorType: string(100, { allowNull: false }),
      providedBy: enumColumn(['company', 'client'], { allowNull: false }),
      vendorId: unsignedInteger(references('vendors')),
      companyNameSnapshot: string(150, { allowNull: true }),
      pricingPlanId: unsignedInteger(references('vendor_pricing_plans')),
      selectedSubServicesCount: unsignedInteger({
        allowNull: false,
        defaultValue: 0,
      }),
      agreedPrice: decimal(12, 3, { allowNull: true }),
      notes: text({ allowNull: true }),
      status: enumColumn(['pending', 'approved', 'confirmed', 'cancelled'], {
        allowNull: false,
        defaultValue: 'pending',
      }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'event_vendors_event_id', fields: ['eventId'] },
      { name: 'event_vendors_vendor_id', fields: ['vendorId'] },
      { name: 'event_vendors_pricing_plan_id', fields: ['pricingPlanId'] },
      { name: 'event_vendors_vendor_type', fields: ['vendorType'] },
      {
        name: 'event_vendors_selected_sub_services_count',
        fields: ['selectedSubServicesCount'],
      },
      { name: 'event_vendors_provided_by', fields: ['providedBy'] },
      { name: 'event_vendors_status', fields: ['status'] },
    ],
  },
  {
    name: 'contracts',
    columns: {
      id: idColumn(),
      quotationId: unsignedInteger(references('quotations')),
      eventId: unsignedInteger({
        allowNull: false,
        ...references('events', 'CASCADE'),
      }),
      customerId: unsignedInteger(references('customers')),
      leadId: unsignedInteger({ allowNull: true }),
      contractNumber: string(100, { allowNull: true }),
      signedDate: dateOnly({ allowNull: false }),
      eventDate: dateOnly({ allowNull: true }),
      subtotal: decimal(12, 3, { allowNull: true }),
      discountAmount: decimal(12, 3, { allowNull: true, defaultValue: 0 }),
      totalAmount: decimal(12, 3, { allowNull: true }),
      notes: text({ allowNull: true }),
      status: enumColumn(contractStatusValues, {
        allowNull: false,
        defaultValue: 'draft',
      }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'contracts_quotation_id', fields: ['quotationId'] },
      { name: 'contracts_event_id', fields: ['eventId'] },
      { name: 'contracts_customer_id', fields: ['customerId'] },
      { name: 'contracts_lead_id', fields: ['leadId'] },
      { name: 'contracts_contract_number', fields: ['contractNumber'] },
      { name: 'contracts_signed_date', fields: ['signedDate'] },
      { name: 'contracts_status', fields: ['status'] },
    ],
  },
  {
    name: 'event_vendor_sub_services',
    columns: {
      id: idColumn(),
      eventVendorId: unsignedInteger({
        allowNull: false,
        ...references('event_vendors', 'CASCADE'),
      }),
      vendorSubServiceId: unsignedInteger(references('vendor_sub_services')),
      nameSnapshot: string(150, { allowNull: false }),
      notes: text({ allowNull: true }),
      sortOrder: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      {
        name: 'event_vendor_sub_services_event_vendor_id',
        fields: ['eventVendorId'],
      },
      {
        name: 'event_vendor_sub_services_vendor_sub_service_id',
        fields: ['vendorSubServiceId'],
      },
      { name: 'event_vendor_sub_services_sort_order', fields: ['sortOrder'] },
    ],
  },
  {
    name: 'quotation_items',
    columns: {
      id: idColumn(),
      quotationId: unsignedInteger({
        allowNull: false,
        ...references('quotations', 'CASCADE'),
      }),
      itemType: enumColumn(itemTypeValues, {
        allowNull: false,
        defaultValue: 'service',
      }),
      eventServiceId: unsignedInteger(references('event_services')),
      serviceId: unsignedInteger(references('services')),
      eventVendorId: unsignedInteger(references('event_vendors')),
      vendorId: unsignedInteger(references('vendors')),
      pricingPlanId: unsignedInteger(references('vendor_pricing_plans')),
      itemName: string(150, { allowNull: false }),
      category: string(100, { allowNull: true }),
      quantity: decimal(12, 3, { allowNull: false, defaultValue: 1 }),
      unitPrice: decimal(12, 3, { allowNull: false, defaultValue: 0 }),
      totalPrice: decimal(12, 3, { allowNull: false, defaultValue: 0 }),
      notes: text({ allowNull: true }),
      sortOrder: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'quotation_items_quotation_id', fields: ['quotationId'] },
      { name: 'quotation_items_item_type', fields: ['itemType'] },
      { name: 'quotation_items_event_service_id', fields: ['eventServiceId'] },
      { name: 'quotation_items_service_id', fields: ['serviceId'] },
      { name: 'quotation_items_event_vendor_id', fields: ['eventVendorId'] },
      { name: 'quotation_items_vendor_id', fields: ['vendorId'] },
      { name: 'quotation_items_pricing_plan_id', fields: ['pricingPlanId'] },
      { name: 'quotation_items_category', fields: ['category'] },
      { name: 'quotation_items_sort_order', fields: ['sortOrder'] },
    ],
  },
  {
    name: 'payment_schedules',
    columns: {
      id: idColumn(),
      contractId: unsignedInteger({
        allowNull: false,
        ...references('contracts', 'CASCADE'),
      }),
      installmentName: string(150, { allowNull: false }),
      scheduleType: enumColumn(paymentScheduleTypeValues, { allowNull: false }),
      dueDate: dateOnly({ allowNull: true }),
      amount: decimal(12, 3, { allowNull: false }),
      status: enumColumn(paymentScheduleStatusValues, {
        allowNull: false,
        defaultValue: 'pending',
      }),
      notes: text({ allowNull: true }),
      sortOrder: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'payment_schedules_contract_id', fields: ['contractId'] },
      { name: 'payment_schedules_schedule_type', fields: ['scheduleType'] },
      { name: 'payment_schedules_status', fields: ['status'] },
      { name: 'payment_schedules_due_date', fields: ['dueDate'] },
      { name: 'payment_schedules_sort_order', fields: ['sortOrder'] },
    ],
  },
  {
    name: 'execution_briefs',
    columns: {
      id: idColumn(),
      eventId: unsignedInteger({
        allowNull: false,
        unique: true,
        ...references('events', 'NO ACTION'),
      }),
      quotationId: unsignedInteger(references('quotations')),
      contractId: unsignedInteger(references('contracts')),
      status: string(40, { allowNull: false, defaultValue: 'draft' }),
      generalNotes: text({ allowNull: true }),
      clientNotes: text({ allowNull: true }),
      designerNotes: text({ allowNull: true }),
      approvedByClientAt: dateTime({ allowNull: true }),
      handedToExecutorAt: dateTime({ allowNull: true }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'execution_briefs_quotation_id', fields: ['quotationId'] },
      { name: 'execution_briefs_contract_id', fields: ['contractId'] },
      { name: 'execution_briefs_status', fields: ['status'] },
      { name: 'execution_briefs_created_by', fields: ['createdBy'] },
      { name: 'execution_briefs_updated_by', fields: ['updatedBy'] },
    ],
  },
  {
    name: 'contract_items',
    columns: {
      id: idColumn(),
      contractId: unsignedInteger({
        allowNull: false,
        ...references('contracts', 'CASCADE'),
      }),
      itemType: enumColumn(itemTypeValues, {
        allowNull: false,
        defaultValue: 'service',
      }),
      quotationItemId: unsignedInteger(references('quotation_items')),
      eventServiceId: unsignedInteger(references('event_services')),
      serviceId: unsignedInteger(references('services')),
      eventVendorId: unsignedInteger(references('event_vendors')),
      vendorId: unsignedInteger(references('vendors')),
      pricingPlanId: unsignedInteger(references('vendor_pricing_plans')),
      itemName: string(150, { allowNull: false }),
      category: string(100, { allowNull: true }),
      quantity: decimal(12, 3, { allowNull: false, defaultValue: 1 }),
      unitPrice: decimal(12, 3, { allowNull: false }),
      totalPrice: decimal(12, 3, { allowNull: false }),
      notes: text({ allowNull: true }),
      sortOrder: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      createdBy: unsignedInteger(references('users')),
      updatedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'contract_items_contract_id', fields: ['contractId'] },
      { name: 'contract_items_item_type', fields: ['itemType'] },
      { name: 'contract_items_quotation_item_id', fields: ['quotationItemId'] },
      { name: 'contract_items_event_service_id', fields: ['eventServiceId'] },
      { name: 'contract_items_service_id', fields: ['serviceId'] },
      { name: 'contract_items_event_vendor_id', fields: ['eventVendorId'] },
      { name: 'contract_items_vendor_id', fields: ['vendorId'] },
      { name: 'contract_items_pricing_plan_id', fields: ['pricingPlanId'] },
      { name: 'contract_items_category', fields: ['category'] },
      { name: 'contract_items_sort_order', fields: ['sortOrder'] },
    ],
  },
  {
    name: 'execution_service_details',
    columns: {
      id: idColumn(),
      briefId: unsignedInteger({
        allowNull: false,
        ...references('execution_briefs', 'CASCADE'),
      }),
      eventId: unsignedInteger({
        allowNull: false,
        ...references('events', 'NO ACTION'),
      }),
      serviceId: unsignedInteger({
        allowNull: false,
        ...references('services', 'NO ACTION'),
      }),
      serviceNameSnapshot: string(255, { allowNull: true }),
      templateKey: string(120, { allowNull: false }),
      sortOrder: integer({ allowNull: false, defaultValue: 0 }),
      detailsJson: json({ allowNull: true }),
      notes: text({ allowNull: true }),
      executorNotes: text({ allowNull: true }),
      status: string(40, { allowNull: false, defaultValue: 'pending' }),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'execution_service_details_brief_id', fields: ['briefId'] },
      { name: 'execution_service_details_event_id', fields: ['eventId'] },
      { name: 'execution_service_details_service_id', fields: ['serviceId'] },
      {
        name: 'execution_service_details_template_key',
        fields: ['templateKey'],
      },
      { name: 'execution_service_details_status', fields: ['status'] },
      {
        name: 'execution_service_details_brief_id_service_id',
        fields: ['briefId', 'serviceId'],
        unique: true,
      },
    ],
  },
  {
    name: 'execution_attachments',
    columns: {
      id: idColumn(),
      briefId: unsignedInteger({
        allowNull: false,
        ...references('execution_briefs', 'CASCADE'),
      }),
      serviceDetailId: unsignedInteger(references('execution_service_details')),
      fileName: string(255, { allowNull: false }),
      originalName: string(255, { allowNull: false }),
      mimeType: string(120, { allowNull: false }),
      size: unsignedInteger({ allowNull: false, defaultValue: 0 }),
      filePath: string(500, { allowNull: false }),
      fileUrl: string(1000, { allowNull: true }),
      label: string(255, { allowNull: true }),
      sortOrder: integer({ allowNull: false, defaultValue: 0 }),
      uploadedBy: unsignedInteger(references('users')),
      createdAt: dateTime({ allowNull: false }),
      updatedAt: dateTime({ allowNull: false }),
      deletedAt: dateTime(),
    },
    indexes: [
      { name: 'execution_attachments_brief_id', fields: ['briefId'] },
      {
        name: 'execution_attachments_service_detail_id',
        fields: ['serviceDetailId'],
      },
      { name: 'execution_attachments_mime_type', fields: ['mimeType'] },
      { name: 'execution_attachments_uploaded_by', fields: ['uploadedBy'] },
    ],
  },
];

function buildDataType(Sequelize, definition) {
  switch (definition.kind) {
    case 'INTEGER':
      return definition.unsigned ? Sequelize.INTEGER.UNSIGNED : Sequelize.INTEGER;
    case 'STRING':
      return Sequelize.STRING(definition.length);
    case 'BOOLEAN':
      return Sequelize.BOOLEAN;
    case 'DATE':
      return Sequelize.DATE;
    case 'DATEONLY':
      return Sequelize.DATEONLY;
    case 'TEXT':
      return Sequelize.TEXT;
    case 'JSON':
      return Sequelize.JSON;
    case 'DECIMAL':
      return Sequelize.DECIMAL(definition.precision, definition.scale);
    case 'ENUM':
      return Sequelize.ENUM(...definition.values);
    default:
      throw new Error(`Unsupported column type: ${definition.kind}`);
  }
}

function buildColumns(Sequelize, columns) {
  return Object.fromEntries(
    Object.entries(columns).map(([columnName, definition]) => {
      const column = {
        type: buildDataType(Sequelize, definition.type),
      };

      if (Object.prototype.hasOwnProperty.call(definition, 'allowNull')) {
        column.allowNull = definition.allowNull;
      }
      if (Object.prototype.hasOwnProperty.call(definition, 'defaultValue')) {
        column.defaultValue = definition.defaultValue;
      }
      if (definition.primaryKey) {
        column.primaryKey = true;
      }
      if (definition.autoIncrement) {
        column.autoIncrement = true;
      }
      if (definition.unique) {
        column.unique = true;
      }
      if (definition.references) {
        column.references = definition.references;
        column.onDelete = definition.onDelete;
        column.onUpdate = definition.onUpdate;
      }

      return [columnName, column];
    }),
  );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const table of tableDefinitions) {
      await queryInterface.createTable(
        table.name,
        buildColumns(Sequelize, table.columns),
        tableOptions,
      );

      for (const index of table.indexes) {
        await queryInterface.addIndex(table.name, index.fields, {
          name: index.name,
          unique: index.unique,
        });
      }
    }
  },

  async down(queryInterface) {
    for (const table of [...tableDefinitions].reverse()) {
      await queryInterface.dropTable(table.name);
    }
  },
};
