import { initDatabase, sequelize } from "../config/database";
import {
  APPOINTMENT_STATUSES,
  type AppointmentStatus,
} from "../constants/workflow-statuses";
import { Appointment, Customer, Event } from "../models";
import { ensureSeedVenues } from "./seedVenues";

const SEED_COUNT = 50;
const SEED_EMAIL_DOMAIN = "seed.rose.local";
const SEED_NOTE_TAG = "[seed:customers-appointments-events]";

const appointmentTypes = [
  "New Appointment 1",
  "New Appointment 2",
  "New Appointment 3",
  "Details Appointment 1",
  "Details Appointment 2",
  "Details Appointment 3",
  "Office Visit 1",
  "Office Visit 2",
  "Office Visit 3",
] as const;

const appointmentStatuses: readonly AppointmentStatus[] = APPOINTMENT_STATUSES;

const eventStatuses = [
  "draft",
  "designing",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const venueSnapshots = [
  "قاعة روز الكبرى",
  "قاعة اللؤلؤة",
  "فندق الشاطئ",
  "قاعة النخبة",
  "قاعة السيف",
  "منتجع الواحة",
];

const groomNames = [
  "محمد",
  "أحمد",
  "عبدالله",
  "خالد",
  "يوسف",
  "علي",
  "سلمان",
  "ناصر",
  "فيصل",
  "راشد",
];

const brideNames = [
  "نور",
  "دانة",
  "سارة",
  "جوري",
  "حصة",
  "العنود",
  "شيخة",
  "شهد",
  "ريم",
  "غدير",
];

const familyNames = [
  "العتيبي",
  "المطيري",
  "الرشيدي",
  "الشمري",
  "الدوسري",
  "العجمي",
  "الهاجري",
  "القحطاني",
  "السبيعي",
  "العنزي",
];

const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatTime = (hours: number, minutes: number) =>
  `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

const buildAppointmentSlot = (slotIndex: number) => {
  const startMinutes = 10 * 60 + slotIndex * 30;
  const endMinutes = startMinutes + 30;

  return {
    startTime: formatTime(Math.floor(startMinutes / 60), startMinutes % 60),
    endTime: formatTime(Math.floor(endMinutes / 60), endMinutes % 60),
  };
};

const buildCustomerEmail = (index: number) =>
  `seed.customer.${String(index + 1).padStart(2, "0")}@${SEED_EMAIL_DOMAIN}`;

const buildCustomerMobile = (index: number) =>
  `500${String(10000 + index).padStart(5, "0")}`;

const buildCustomerNationalId = (index: number) =>
  `2810${String(10000000 + index).slice(-8)}`;

const buildCustomerAddress = (index: number) =>
  `Block ${String((index % 12) + 1)}, Street ${String((index % 20) + 1)}, Building ${String((index % 30) + 1)}`;

const buildCustomerName = (index: number) => {
  const familyName = familyNames[index % familyNames.length];
  return `عميل روز ${String(index + 1).padStart(2, "0")} ${familyName}`;
};

const buildGroomName = (index: number) =>
  `${groomNames[index % groomNames.length]} ${familyNames[index % familyNames.length]}`;

const buildBrideName = (index: number) =>
  `${brideNames[index % brideNames.length]} ${familyNames[(index + 3) % familyNames.length]}`;

const seedCustomersAppointmentsEvents = async () => {
  await initDatabase();

  await sequelize.transaction(async (transaction) => {
    const seededVenues = await ensureSeedVenues(transaction);

    if (seededVenues.length === 0) {
      throw new Error("No venues available for event seeding");
    }

    const seededCustomers = await Customer.findAll({
      where: {
        email: Array.from({ length: SEED_COUNT }, (_, index) =>
          buildCustomerEmail(index),
        ),
      },
      transaction,
      paranoid: false,
    });

    const seededCustomerIds = seededCustomers.map((customer) => customer.id);

    if (seededCustomerIds.length > 0) {
      await Event.destroy({
        where: { customerId: seededCustomerIds },
        force: true,
        transaction,
      });

      await Appointment.destroy({
        where: { customerId: seededCustomerIds },
        force: true,
        transaction,
      });

      await Customer.destroy({
        where: { id: seededCustomerIds },
        force: true,
        transaction,
      });
    }

    for (let index = 0; index < SEED_COUNT; index += 1) {
      const customer = await Customer.create(
        {
          fullName: buildCustomerName(index),
          mobile: buildCustomerMobile(index),
          mobile2: null,
          email: buildCustomerEmail(index),
          nationalId: buildCustomerNationalId(index),
          address: buildCustomerAddress(index),
          notes: `${SEED_NOTE_TAG} Generated customer ${index + 1}`,
          status: index % 8 === 0 ? "inactive" : "active",
          createdBy: null,
          updatedBy: null,
        },
        { transaction },
      );

      const appointmentDayOffset = index % 12;
      const appointmentSlotIndex = Math.floor(index / 12);
      const appointmentDate = addDays(new Date(), appointmentDayOffset);
      const { startTime, endTime } = buildAppointmentSlot(appointmentSlotIndex);

      await Appointment.create(
        {
          customerId: customer.id,
          appointmentDate: formatDateOnly(appointmentDate),
          startTime,
          endTime,
          type: appointmentTypes[index % appointmentTypes.length],
          notes: `${SEED_NOTE_TAG} Appointment ${index + 1}`,
          status: appointmentStatuses[index % appointmentStatuses.length],
          createdBy: null,
          updatedBy: null,
        },
        { transaction },
      );

      const eventDayOffset = 5 + ((index * 9) % 46);
      const eventDate = addDays(appointmentDate, eventDayOffset);
      const venue = seededVenues[index % seededVenues.length];

      await Event.create(
        {
          customerId: customer.id,
          title: `حفل رقم ${String(index + 1).padStart(2, "0")}`,
          eventDate: formatDateOnly(eventDate),
          venueId: venue.id,
          venueNameSnapshot: venue.name,
          groomName: buildGroomName(index),
          brideName: buildBrideName(index),
          guestCount: 150 + ((index * 25) % 350),
          notes: `${SEED_NOTE_TAG} Event ${index + 1} created ${eventDayOffset} days after the appointment date at ${venue.name}`,
          status: eventStatuses[index % eventStatuses.length],
          createdBy: null,
          updatedBy: null,
        },
        { transaction },
      );
    }
  });

  console.log(
    `Seed completed: ${SEED_COUNT} customers, ${SEED_COUNT} appointments, ${SEED_COUNT} events linked to seeded venues`,
  );
};

seedCustomersAppointmentsEvents()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Customers / appointments / events seed failed:", error);
    await sequelize.close();
    process.exit(1);
  });
