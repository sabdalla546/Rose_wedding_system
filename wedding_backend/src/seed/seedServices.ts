import { Op } from "sequelize";
import { initDatabase, sequelize } from "../config/database";
import { Service } from "../models";
import type {
  ServiceCategory,
  ServicePricingType,
} from "../models/service.model";

type SeedServiceDefinition = {
  name: string;
  category: ServiceCategory;
  pricingType: ServicePricingType;
  basePrice: number;
  unitName?: string | null;
  description: string;
};

const SEED_TAG = "[seed:services]";

const serviceSeeds: SeedServiceDefinition[] = [
  { name: "تنسيق مسار الدخول", category: "entrance", pricingType: "fixed", basePrice: 120, unitName: "event", description: "تنسيق ممر الدخول واللمسات الأولى للضيوف." },
  { name: "بوابة ورود", category: "entrance", pricingType: "fixed", basePrice: 180, unitName: "event", description: "بوابة استقبال مزهرة لمدخل الحفل." },
  { name: "إضاءة مدخل", category: "lighting", pricingType: "fixed", basePrice: 140, unitName: "event", description: "إضاءة موجهة لمنطقة المدخل." },
  { name: "لوحة ترحيبية", category: "entrance", pricingType: "fixed", basePrice: 85, unitName: "item", description: "لوحة استقبال مخصصة بأسماء المناسبة." },
  { name: "ستاندات ورد", category: "flowers", pricingType: "per_unit", basePrice: 35, unitName: "stand", description: "ستاندات وردية موزعة على المدخل." },

  { name: "كوشة رئيسية", category: "stage", pricingType: "fixed", basePrice: 350, unitName: "event", description: "تنفيذ الكوشة الرئيسية للحفل." },
  { name: "خلفية مسرح", category: "stage", pricingType: "fixed", basePrice: 260, unitName: "event", description: "خلفية ديكورية لمنطقة المسرح." },
  { name: "منصة عروسين", category: "stage", pricingType: "fixed", basePrice: 220, unitName: "event", description: "منصة مخصصة لمنطقة العروسين." },
  { name: "سجاد المسرح", category: "stage", pricingType: "per_unit", basePrice: 40, unitName: "meter", description: "فرش أرضي لمنطقة المسرح." },
  { name: "مؤثرات ستارة", category: "stage", pricingType: "fixed", basePrice: 125, unitName: "event", description: "معالجة الستائر والطبقات الخلفية." },

  { name: "طاولات ضيوف", category: "tables", pricingType: "per_unit", basePrice: 12, unitName: "table", description: "تجهيز طاولات الضيوف الأساسية." },
  { name: "طاولات VIP", category: "tables", pricingType: "per_unit", basePrice: 22, unitName: "table", description: "طاولات مميزة للصفوف الأمامية." },
  { name: "كراسي شيفاري", category: "chairs", pricingType: "per_unit", basePrice: 5, unitName: "chair", description: "كراسي شيفاري بتجهيز كامل." },
  { name: "كراسي ملكية", category: "chairs", pricingType: "per_unit", basePrice: 9, unitName: "chair", description: "كراسي ملكية للمناطق الخاصة." },
  { name: "أغطية كراسي", category: "chairs", pricingType: "per_unit", basePrice: 3, unitName: "chair", description: "أغطية وربطات للكراسي." },

  { name: "توزيع ورد طبيعي", category: "flowers", pricingType: "per_unit", basePrice: 18, unitName: "arrangement", description: "تنسيق ورد طبيعي على الطاولات." },
  { name: "بوكيه عروس", category: "flowers", pricingType: "fixed", basePrice: 95, unitName: "item", description: "باقة عروس طبيعية." },
  { name: "ورد جانبي", category: "flowers", pricingType: "per_unit", basePrice: 28, unitName: "arrangement", description: "ترتيبات جانبية للموقع." },
  { name: "زينة طاولات", category: "flowers", pricingType: "per_unit", basePrice: 14, unitName: "table", description: "تنسيق طاولات بلمسات وردية." },
  { name: "زينة كوشة", category: "flowers", pricingType: "fixed", basePrice: 175, unitName: "event", description: "عناصر وردية مخصصة للكوشة." },

  { name: "بوفيه رئيسي", category: "buffet", pricingType: "per_guest", basePrice: 8, unitName: "guest", description: "بوفيه أساسي محسوب لكل ضيف." },
  { name: "ركن حلويات", category: "buffet", pricingType: "fixed", basePrice: 210, unitName: "event", description: "ركن حلويات منفصل." },
  { name: "ركن موالح", category: "buffet", pricingType: "fixed", basePrice: 185, unitName: "event", description: "ركن موالح وتجهيزات تقديم." },
  { name: "أدوات تقديم", category: "buffet", pricingType: "per_unit", basePrice: 6, unitName: "set", description: "أدوات وصواني تقديم إضافية." },
  { name: "تنسيق البوفيه", category: "buffet", pricingType: "fixed", basePrice: 130, unitName: "event", description: "تنسيق بصري كامل لمنطقة البوفيه." },

  { name: "إضاءة عامة", category: "lighting", pricingType: "fixed", basePrice: 240, unitName: "event", description: "خطة إضاءة عامة للحفل." },
  { name: "إضاءة طاولات", category: "lighting", pricingType: "per_unit", basePrice: 10, unitName: "table", description: "إضاءة مخصصة للطاولات." },
  { name: "إضاءة كوشة", category: "lighting", pricingType: "fixed", basePrice: 170, unitName: "event", description: "إضاءة موجهة لمنطقة الكوشة." },
  { name: "زووم لايت", category: "lighting", pricingType: "fixed", basePrice: 150, unitName: "event", description: "وحدات Zoom light للمسرح." },
  { name: "دخان بارد", category: "lighting", pricingType: "fixed", basePrice: 110, unitName: "event", description: "خدمة دخان بارد للمداخل أو الكوشة." },

  { name: "تصوير فوتو", category: "photography", pricingType: "fixed", basePrice: 260, unitName: "event", description: "تغطية تصوير فوتوغرافي." },
  { name: "تصوير فيديو", category: "photography", pricingType: "fixed", basePrice: 280, unitName: "event", description: "تغطية فيديو للمناسبة." },
  { name: "تصوير فوري", category: "photography", pricingType: "fixed", basePrice: 190, unitName: "event", description: "خدمة طباعة فورية أثناء الحفل." },
  { name: "فوتوبوث", category: "photography", pricingType: "fixed", basePrice: 230, unitName: "event", description: "ركن تصوير تفاعلي للضيوف." },
  { name: "ألبوم رقمي", category: "photography", pricingType: "fixed", basePrice: 75, unitName: "item", description: "ألبوم رقمي بعد الحفل." },

  { name: "دي جي", category: "audio", pricingType: "fixed", basePrice: 300, unitName: "event", description: "تشغيل موسيقي وإدارة DJ." },
  { name: "نظام صوت", category: "audio", pricingType: "fixed", basePrice: 260, unitName: "event", description: "نظام صوت متكامل." },
  { name: "مايك لاسلكي", category: "audio", pricingType: "per_unit", basePrice: 18, unitName: "mic", description: "مايك لاسلكي إضافي." },
  { name: "مهندس صوت", category: "audio", pricingType: "fixed", basePrice: 125, unitName: "event", description: "إشراف فني على الصوت." },
  { name: "تشغيل زفات", category: "audio", pricingType: "fixed", basePrice: 95, unitName: "event", description: "تحضير وتشغيل الزفات والمؤثرات." },

  { name: "ضيافة قهوة", category: "hospitality", pricingType: "fixed", basePrice: 210, unitName: "event", description: "ضيافة قهوة عربية للحفل." },
  { name: "كوفي ستيشن", category: "hospitality", pricingType: "fixed", basePrice: 260, unitName: "event", description: "ركن قهوة متكامل." },
  { name: "ماء وعصائر", category: "hospitality", pricingType: "per_guest", basePrice: 4, unitName: "guest", description: "مشروبات خفيفة لكل ضيف." },
  { name: "طاقم ضيافة", category: "hospitality", pricingType: "per_unit", basePrice: 35, unitName: "staff", description: "مضيفات ومقدمي ضيافة." },
  { name: "ضيافة VIP", category: "hospitality", pricingType: "fixed", basePrice: 145, unitName: "event", description: "خدمة ضيافة خاصة للصفوف المميزة." },

  { name: "سليبرات", category: "female_supplies", pricingType: "per_unit", basePrice: 2.5, unitName: "pair", description: "سليبرات للضيوف." },
  { name: "مهفات", category: "female_supplies", pricingType: "per_unit", basePrice: 1.5, unitName: "item", description: "مهفات نسائية للضيافة." },
  { name: "أكياس عبايات", category: "female_supplies", pricingType: "per_unit", basePrice: 1.2, unitName: "bag", description: "أكياس عبايات مخصصة." },
  { name: "صينية حمام", category: "female_supplies", pricingType: "fixed", basePrice: 65, unitName: "event", description: "تجهيز صينية الحمام النسائي." },
  { name: "كلمة محجوز", category: "female_supplies", pricingType: "per_unit", basePrice: 6, unitName: "sign", description: "لوحات حجز للطاولات." },

  { name: "نقل ضيوف", category: "transport", pricingType: "per_unit", basePrice: 55, unitName: "trip", description: "تنسيق نقل الضيوف." },
  { name: "سيارة عروس", category: "transport", pricingType: "fixed", basePrice: 240, unitName: "event", description: "سيارة خاصة للعروس." },
  { name: "شحن وتجهيز", category: "internal_setup", pricingType: "fixed", basePrice: 150, unitName: "event", description: "تحميل ونقل وتجهيز داخلي." },
  { name: "فك وتركيب", category: "internal_setup", pricingType: "fixed", basePrice: 175, unitName: "event", description: "فك وتركيب عناصر الموقع." },
  { name: "خدمة خارجية مخصصة", category: "external_service", pricingType: "custom", basePrice: 0, unitName: "custom", description: "خدمة خارجية حسب طلب العميل." },
];

const seedServices = async () => {
  await initDatabase();

  await sequelize.transaction(async (transaction) => {
    await Service.destroy({
      where: {
        code: {
          [Op.like]: "seed:svc:%",
        },
      },
      force: true,
      transaction,
    });

    await Service.bulkCreate(
      serviceSeeds.map((service, index) => ({
        name: service.name,
        code: `seed:svc:${String(index + 1).padStart(3, "0")}`,
        category: service.category,
        pricingType: service.pricingType,
        basePrice: service.basePrice,
        unitName: service.unitName ?? null,
        description: `${SEED_TAG} ${service.description}`,
        isActive: true,
        createdBy: null,
        updatedBy: null,
      })),
      { transaction }
    );
  });

  console.log(`Seed completed: ${serviceSeeds.length} services created`);
};

seedServices()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Services seed failed:", error);
    await sequelize.close();
    process.exit(1);
  });
