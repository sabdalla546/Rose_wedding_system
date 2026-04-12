import { Transaction } from "sequelize";
import { initDatabase, sequelize } from "../config/database";
import { Vendor, VendorSubService, VendorType } from "../models";
import type { VendorType as LegacyVendorType } from "../models/vendor.model";

/** One catalog sub-service row; each row has its own list `price` (no vendor pricing plans). */
type SeedSubServiceDefinition = {
  name: string;
  code: string;
  description?: string;
  /** List price for this line; if omitted, `defaultSubServicePrice` on the vendor is used. */
  price?: number;
};

type SeedVendorDefinition = {
  name: string;
  type: LegacyVendorType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes: string;
  subServices: SeedSubServiceDefinition[];
  /** Default list price (KWD, 3 dp) for sub-services that do not set `price`. */
  defaultSubServicePrice: number;
};

const seedSourceNote =
  "Seeded from شركات خارجية 1.docx and شركات خارجية 2.docx";

const externalVendorSeeds: SeedVendorDefinition[] = [
  {
    name: "نايت ساوند",
    type: "dj",
    contactPerson: "فريق نايت ساوند",
    phone: "90000001",
    email: "nightsound@rose.local",
    notes: "هندسة صوت مستندة إلى بند هندسة الصوت في الملف.",
    subServices: [
      { name: "سماعات رئيسية", code: "seed:dj-main-speakers" },
      { name: "ميكسر احترافي", code: "seed:dj-mixer" },
      { name: "مايك لاسلكي", code: "seed:dj-wireless-mic" },
      { name: "مهندس صوت", code: "seed:dj-sound-engineer" },
      { name: "منصة DJ", code: "seed:dj-booth" },
      { name: "مونيتر للمسرح", code: "seed:dj-stage-monitor" },
      { name: "تشغيل الزفات", code: "seed:dj-zaffa-playback" },
      { name: "فحص صوت قبل الحفل", code: "seed:dj-sound-check" },
    ],
    defaultSubServicePrice: 120,
  },
  {
    name: "سوبت لايت",
    type: "lighting",
    contactPerson: "رامي",
    phone: "90000002",
    email: "sobtlight@rose.local",
    notes: "إضاءة مستندة إلى نموذج الإضاءات المذكور في الملف.",
    subServices: [
      { name: "تراس معلق", code: "seed:lighting-hanging-truss" },
      { name: "Led فقط", code: "seed:lighting-led-only" },
      { name: "زووم لايت", code: "seed:lighting-zoom-light" },
      { name: "دخان", code: "seed:lighting-smoke" },
      { name: "جوانب الصالة", code: "seed:lighting-hall-sides" },
      { name: "إضاءة البوفيه", code: "seed:lighting-buffet" },
      { name: "إضاءة المدخل", code: "seed:lighting-entrance" },
      { name: "سيتي كلر", code: "seed:lighting-city-color" },
    ],
    defaultSubServicePrice: 180,
  },
  {
    name: "حنين فوتو",
    type: "photography",
    contactPerson: "استوديو حنين",
    phone: "90000003",
    email: "hanin.photo@rose.local",
    notes: "تصوير فيديو وفوتو مستند إلى بنود التصوير في الملفات.",
    subServices: [
      { name: "تصوير فوتوغرافي", code: "seed:photo-photography" },
      { name: "تصوير فيديو", code: "seed:photo-video" },
      { name: "ريلز سريعة", code: "seed:photo-reels" },
      { name: "تصوير الكوشة", code: "seed:photo-stage" },
      { name: "تصوير الضيوف", code: "seed:photo-guests" },
      { name: "تسليم رقمي", code: "seed:photo-digital-delivery" },
      { name: "ألبوم أولي", code: "seed:photo-preview-album" },
      { name: "فريق تغطية مزدوج", code: "seed:photo-dual-team" },
    ],
    defaultSubServicePrice: 150,
  },
];

const upsertSeedVendor = async (
  vendorSeed: SeedVendorDefinition,
  vendorTypesBySlug: Map<string, number>,
  transaction: Transaction,
) => {
  const [vendor, created] = await Vendor.findOrCreate({
    transaction,
    where: {
      name: vendorSeed.name,
      type: vendorSeed.type,
    },
    defaults: {
      name: vendorSeed.name,
      type: vendorSeed.type,
      typeId: vendorTypesBySlug.get(vendorSeed.type) ?? null,
      contactPerson: vendorSeed.contactPerson ?? null,
      phone: vendorSeed.phone ?? null,
      email: vendorSeed.email ?? null,
      notes: `${seedSourceNote}. ${vendorSeed.notes}`,
      isActive: true,
    },
  });

  if (!created) {
    await vendor.update(
      {
        contactPerson: vendorSeed.contactPerson ?? null,
        phone: vendorSeed.phone ?? null,
        email: vendorSeed.email ?? null,
        typeId: vendorTypesBySlug.get(vendorSeed.type) ?? null,
        notes: `${seedSourceNote}. ${vendorSeed.notes}`,
        isActive: true,
      },
      { transaction },
    );
  }

  await VendorSubService.destroy({
    where: { vendorId: vendor.id },
    force: true,
    transaction,
  });

  await VendorSubService.bulkCreate(
    vendorSeed.subServices.map((subService, index) => ({
      vendorId: vendor.id,
      vendorType: vendorSeed.type,
      name: subService.name,
      code: subService.code,
      description:
        subService.description ?? `${subService.name} - ${vendorSeed.name}`,
      price: subService.price ?? vendorSeed.defaultSubServicePrice,
      sortOrder: index + 1,
      isActive: true,
      createdBy: null,
      updatedBy: null,
    })),
    { transaction },
  );

  return vendor;
};

const seedExternalVendors = async () => {
  await initDatabase();

  const vendorTypes = await VendorType.findAll({
    attributes: ["id", "slug"],
  });
  const vendorTypesBySlug = new Map(
    vendorTypes.map((vendorType) => [vendorType.slug, vendorType.id]),
  );

  await sequelize.transaction(async (transaction) => {
    for (const vendorSeed of externalVendorSeeds) {
      await upsertSeedVendor(vendorSeed, vendorTypesBySlug, transaction);
    }
  });

  const subServiceCount = externalVendorSeeds.reduce(
    (sum, vendorSeed) => sum + vendorSeed.subServices.length,
    0,
  );
  console.log(
    `External vendors seeded: ${externalVendorSeeds.length} vendors, ${subServiceCount} sub-services (per-line list prices)`,
  );
};

seedExternalVendors()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("External vendors seed failed:", error);
    await sequelize.close();
    process.exit(1);
  });
