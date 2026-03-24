import { Transaction } from "sequelize";
import { initDatabase, sequelize } from "../config/database";
import { Vendor, VendorPricingPlan, VendorSubService } from "../models";
import type { VendorType } from "../models/vendor.model";

type SeedVendorDefinition = {
  name: string;
  type: VendorType;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes: string;
  subServices: Array<{
    name: string;
    code: string;
    description?: string;
  }>;
  pricingPlans: Array<{
    name: string;
    minSubServices: number;
    maxSubServices: number | null;
    price: number;
    notes?: string;
  }>;
};

const seedSourceNote =
  "Seeded from شركات خارجية 1.docx and شركات خارجية 2.docx";

const buildPricingPlans = (
  low: number,
  medium: number,
  high: number
): SeedVendorDefinition["pricingPlans"] => [
  {
    name: "باقة أساسية",
    minSubServices: 1,
    maxSubServices: 2,
    price: low,
    notes: "للحد الأدنى من الخدمات المختارة.",
  },
  {
    name: "باقة تشغيلية",
    minSubServices: 3,
    maxSubServices: 5,
    price: medium,
    notes: "للتشغيل المتوسط والخدمات الأساسية الممتدة.",
  },
  {
    name: "باقة كاملة",
    minSubServices: 6,
    maxSubServices: null,
    price: high,
    notes: "تشغيل كامل يغطي أغلب البنود المذكورة في نموذج الشركات الخارجية.",
  },
];

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
      { name: "مونيتور للمسرح", code: "seed:dj-stage-monitor" },
      { name: "تشغيل الزفات", code: "seed:dj-zaffa-playback" },
      { name: "فحص صوت قبل الحفل", code: "seed:dj-sound-check" },
    ],
    pricingPlans: buildPricingPlans(120, 220, 320),
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
    pricingPlans: buildPricingPlans(180, 320, 480),
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
    pricingPlans: buildPricingPlans(150, 280, 420),
  },
  {
    name: "روز للعطور",
    type: "perfumes",
    contactPerson: "فريق العطور",
    phone: "90000004",
    email: "perfumes@rose.local",
    notes: "مستند إلى بند العطور الفرنسية والعربية في الملخص.",
    subServices: [
      { name: "عطور فرنسية", code: "seed:perfume-french" },
      { name: "عطور عربية", code: "seed:perfume-arabic" },
      { name: "تبخير المداخل", code: "seed:perfume-entrance-incense" },
      { name: "تبخير الصالة", code: "seed:perfume-hall-incense" },
      { name: "معطرات طاولات", code: "seed:perfume-table-scents" },
      { name: "معطرات دورات المياه", code: "seed:perfume-restroom-scents" },
      { name: "هدايا عطرية", code: "seed:perfume-gift-bottles" },
      { name: "طاقم توزيع", code: "seed:perfume-distribution-team" },
    ],
    pricingPlans: buildPricingPlans(90, 170, 260),
  },
  {
    name: "محطة روز كوفي",
    type: "coffee_station",
    contactPerson: "فريق القهوة",
    phone: "90000005",
    email: "coffee@rose.local",
    notes: "كوفي ستيشن مستند إلى الملخص وبنود الضيافة الخارجية.",
    subServices: [
      { name: "قهوة عربية", code: "seed:coffee-arabic" },
      { name: "قهوة مختصة", code: "seed:coffee-specialty" },
      { name: "شاي وضيافة ساخنة", code: "seed:coffee-tea" },
      { name: "باريستا", code: "seed:coffee-barista" },
      { name: "ركن تقديم", code: "seed:coffee-serving-station" },
      { name: "أكواب مخصصة", code: "seed:coffee-custom-cups" },
      { name: "إعادة تعبئة", code: "seed:coffee-refill" },
      { name: "ضيافة VIP", code: "seed:coffee-vip-service" },
    ],
    pricingPlans: buildPricingPlans(110, 210, 310),
  },
  {
    name: "ركن الأجبان",
    type: "cheese",
    contactPerson: "فريق الأجبان",
    phone: "90000006",
    email: "cheese@rose.local",
    notes: "قسم الأجبان مذكور بوضوح في ملخص تفاصيل الحفل.",
    subServices: [
      { name: "تشكيلة أجبان فاخرة", code: "seed:cheese-premium-selection" },
      { name: "فواكه مرافقة", code: "seed:cheese-fruit-pairing" },
      { name: "مكسرات ومقرمشات", code: "seed:cheese-crackers" },
      { name: "ترتيب الركن", code: "seed:cheese-station-setup" },
      { name: "طاقم خدمة", code: "seed:cheese-service-staff" },
      { name: "إعادة تعبئة", code: "seed:cheese-refill" },
      { name: "أدوات تقديم", code: "seed:cheese-serving-tools" },
      { name: "لوحات تعريف", code: "seed:cheese-labels" },
    ],
    pricingPlans: buildPricingPlans(100, 190, 285),
  },
  {
    name: "روز للحلويات والصواني",
    type: "sweets_savories",
    contactPerson: "فريق الحلويات",
    phone: "90000007",
    email: "sweets@rose.local",
    notes: "الحلويات والموالح والصواني مستندة إلى البنود الواردة في الملفين.",
    subServices: [
      { name: "صواني حلو", code: "seed:sweets-sweet-trays" },
      { name: "صواني موالح", code: "seed:sweets-savory-trays" },
      { name: "تجهيز الطاولات", code: "seed:sweets-table-setup" },
      { name: "بطاقات تعريف", code: "seed:sweets-labels" },
      { name: "إعادة تعبئة", code: "seed:sweets-refill" },
      { name: "خدمة VIP", code: "seed:sweets-vip" },
      { name: "تنسيق البوفيه", code: "seed:sweets-buffet-styling" },
      { name: "متابعة الكميات", code: "seed:sweets-quantity-tracking" },
    ],
    pricingPlans: buildPricingPlans(95, 175, 255),
  },
  {
    name: "باور كول جنريتر",
    type: "ac_generator",
    contactPerson: "فريق التشغيل",
    phone: "90000008",
    email: "powercool@rose.local",
    notes: "تكييف ومولدات كهرباء مستندان إلى الملخص.",
    subServices: [
      { name: "مولد رئيسي", code: "seed:power-main-generator" },
      { name: "مولد احتياطي", code: "seed:power-backup-generator" },
      { name: "تكييف صحراوي", code: "seed:power-cooling" },
      { name: "توزيع أحمال", code: "seed:power-load-balancing" },
      { name: "تمديدات كهرباء", code: "seed:power-wiring" },
      { name: "فني تشغيل", code: "seed:power-technician" },
      { name: "صيانة طارئة", code: "seed:power-emergency-maintenance" },
      { name: "فحص قبل الحفل", code: "seed:power-precheck" },
    ],
    pricingPlans: buildPricingPlans(200, 360, 520),
  },
  {
    name: "لمسة نسائية",
    type: "female_supplies",
    contactPerson: "قسم المستلزمات النسائية",
    phone: "90000009",
    email: "female.supplies@rose.local",
    notes: "مستلزمات نسائية مستندة مباشرة إلى القائمة الظاهرة في الملف الأول.",
    subServices: [
      { name: "سليبرات", code: "seed:female-slippers" },
      { name: "مهفات", code: "seed:female-fans" },
      { name: "أكياس عبايات", code: "seed:female-abaya-bags" },
      { name: "صينية حمام", code: "seed:female-bathroom-tray" },
      { name: "صندوق أثواب", code: "seed:female-clothes-box" },
      { name: "ملافع", code: "seed:female-scarves" },
      { name: "مناديل الحلو", code: "seed:female-sweets-napkins" },
      { name: "كلمة محجوز", code: "seed:female-reserved-sign" },
    ],
    pricingPlans: buildPricingPlans(80, 140, 210),
  },
  {
    name: "خدمات أهل الحفل",
    type: "family_services",
    contactPerson: "فريق التشغيل الميداني",
    phone: "90000010",
    email: "family.services@rose.local",
    notes: "خدمات أهل الحفل مستندة مباشرة إلى البنود الواضحة في الملف الأول.",
    subServices: [
      { name: "إشراف", code: "seed:family-supervision" },
      { name: "تفتيش وسحب هواتف", code: "seed:family-phone-collection" },
      { name: "بنات استقبال للعروس", code: "seed:family-bride-reception-team" },
      { name: "خدمة كفرات", code: "seed:family-chair-cover-service" },
      { name: "بنات نقاب", code: "seed:family-niqab-team" },
      { name: "تبخير", code: "seed:family-incense-service" },
      { name: "عاملة لدورة المياه", code: "seed:family-bathroom-worker" },
      { name: "سيرفس", code: "seed:family-service-staff" },
    ],
    pricingPlans: buildPricingPlans(130, 240, 360),
  },
];

const upsertSeedVendor = async (
  vendorSeed: SeedVendorDefinition,
  transaction: Transaction
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
        notes: `${seedSourceNote}. ${vendorSeed.notes}`,
        isActive: true,
      },
      { transaction }
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
      description: subService.description ?? `${subService.name} - ${vendorSeed.name}`,
      sortOrder: index + 1,
      isActive: true,
      createdBy: null,
      updatedBy: null,
    })),
    { transaction }
  );

  await VendorPricingPlan.destroy({
    where: { vendorId: vendor.id },
    force: true,
    transaction,
  });

  await VendorPricingPlan.bulkCreate(
    vendorSeed.pricingPlans.map((plan) => ({
      vendorId: vendor.id,
      vendorType: vendorSeed.type,
      name: plan.name,
      minSubServices: plan.minSubServices,
      maxSubServices: plan.maxSubServices,
      price: plan.price,
      notes: plan.notes ?? null,
      isActive: true,
      createdBy: null,
      updatedBy: null,
    })),
    { transaction }
  );

  return vendor;
};

const seedExternalVendors = async () => {
  await initDatabase();

  await sequelize.transaction(async (transaction) => {
    for (const vendorSeed of externalVendorSeeds) {
      await upsertSeedVendor(vendorSeed, transaction);
    }
  });

  console.log(
    `External vendors seeded: ${externalVendorSeeds.length} vendors, ${externalVendorSeeds.length * 8} sub-services, ${externalVendorSeeds.length * 3} pricing plans`
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
