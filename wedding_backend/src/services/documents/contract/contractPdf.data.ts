import {
  Contract,
  ContractItem,
  Customer,
  Event,
  EventService,
  EventVendor,
  PaymentSchedule,
  Quotation,
  QuotationItem,
  Service,
  Vendor,
  VendorPricingPlan,
  Venue,
} from "../../../models";
import type { ContractPdfData } from "../document.types";
import { DocumentServiceError } from "../document.types";
import { displayText, formatDate, getCompanyProfile, normalizeDecimal } from "../document.utils";

const MANUAL_SERVICES_SUMMARY_CATEGORY = "service_summary";

function buildEventTitle(event?: any) {
  if (!event) {
    return null;
  }

  const explicitTitle = typeof event.title === "string" ? event.title.trim() : "";
  if (explicitTitle) {
    return explicitTitle;
  }

  const participants = [event.groomName, event.brideName]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  if (participants.length > 0) {
    return participants.join(" / ");
  }

  return `Event #${event.id}`;
}

function buildContractClauses(data: {
  companyName: string;
  customerName: string;
  venueName: string;
  eventTitle: string;
  eventDate: string;
  guestCount: string;
}) {
  return [
    {
      title: "التمهيد",
      paragraphs: [
        `حيث إن الطرف الثاني يرغب في إقامة مناسبة ${data.eventTitle} وقد عهد إلى الطرف الأول ${data.companyName} بتجهيز وإدارة الحفل في ${data.venueName} بما يتوافق مع البنود والاشتراطات الواردة بهذا العقد.`,
        "يعتبر هذا التمهيد جزءا لا يتجزأ من العقد ومكملا ومفسرا لجميع أحكامه.",
      ],
    },
    {
      title: "البند الأول: محل العقد",
      paragraphs: [
        "يلتزم الطرف الأول بتجهيز وتوريد وتنفيذ البنود الموضحة في جدول البنود بهذا العقد، ويعد هذا الجدول المرجع التجاري والفني للعقد.",
        "أي إضافة أو إلغاء على البنود المتفق عليها يتم فقط بملحق لاحق موقع من الطرفين.",
      ],
    },
    {
      title: "البند الثاني: تعريف الأطراف والمناسبة",
      paragraphs: [
        `الطرف الأول: ${data.companyName}.`,
        `الطرف الثاني: ${data.customerName}. المناسبة: ${data.eventTitle}. تاريخ الحفل: ${data.eventDate}. عدد الحضور المتوقع: ${data.guestCount}.`,
      ],
    },
    {
      title: "البند الثالث: نطاق التزامات الطرف الأول",
      paragraphs: [
        "يلتزم الطرف الأول بتنفيذ وتجهيز الأعمال المتفق عليها بجودة مهنية ووفق ما تسمح به ظروف الموقع واشتراطات القاعة.",
        "يتم التنسيق النهائي على التفاصيل قبل الحفل بمدة مناسبة، وللطرف الأول حق التنفيذ الفني وفق الرؤية المعتمدة والمتفق على نطاقها.",
      ],
    },
    {
      title: "البند الرابع: التسليم ويوم الحفل",
      paragraphs: [
        "يلتزم الطرف الثاني بالتنسيق مع القاعة أو الموقع لتسليم المكان في الوقت المناسب للطرف الأول حتى يتمكن من تنفيذ التجهيزات دون تأخير.",
        "في حال عدم حضور الطرف الثاني أو من ينوب عنه وقت الاستلام أو المعاينة النهائية، يعد ذلك قبولا ضمنيا بما تم تجهيزه وتسليمه وفقا للعقد.",
      ],
    },
    {
      title: "البند الخامس: القيمة المالية",
      paragraphs: [
        "القيمة المالية المعتمدة لهذا العقد هي إجمالي العقد الموضح في خانة الإجماليات، ويشمل ذلك إجمالي الخدمات والبنود الخارجية المدرجة ضمن هذا المستند.",
        "أي خصومات أو تعديلات مالية لا تكون معتمدة إلا إذا كانت مثبتة داخل العقد أو بملحق موقع من الطرفين.",
      ],
    },
    {
      title: "البند السادس: مسؤولية الشركات الخارجية",
      paragraphs: [
        "في حال وجود شركات خارجية أو موردين مستقلين ضمن بنود العقد، فإن التزام الطرف الأول يقتصر على ما هو مثبت بالعقد وبحسب دور كل بند كما تم التعاقد عليه.",
        "يبقى كل بند خارجي جزءا من snapshot هذا العقد بقيمته المعتمدة دون أن يغير ذلك طبيعة التزامات الجهات الأخرى المتعاقد معها.",
      ],
    },
    {
      title: "البند السابع: الظروف الطارئة",
      paragraphs: [
        "في حال وقوع ظروف قاهرة أو تعليمات رسمية أو قرارات من الجهات المختصة أو من إدارة الموقع تؤثر على إقامة الحفل، تطبق الأحكام النظامية والعقدية على ما تم تنفيذه أو دفعه فعليا.",
        "لا يتحمل الطرف الأول ما ينتج عن هذه الظروف متى كانت خارجة عن إرادته وبما لا يخالف ما تم الاتفاق عليه في هذا العقد.",
      ],
    },
    {
      title: "البند الثامن: الإخلال بالعقد",
      paragraphs: [
        "يعد الإخلال الجوهري بأي من الالتزامات الأساسية الواردة بهذا العقد سببا يخول الطرف المتضرر اتخاذ الإجراءات النظامية المناسبة وحفظ حقوقه.",
        "يبقى للطرف الأول الحق في المطالبة بالتعويض عن الأضرار المباشرة الناتجة عن الإخلال من الطرف الثاني أو من تابعيه أو ضيوفه داخل موقع الحفل.",
      ],
    },
    {
      title: "البند التاسع: الإنهاء المبكر",
      paragraphs: [
        "يجوز للطرف الثاني طلب إنهاء العقد قبل موعد الحفل، على أن تتم التسوية المالية وفقا لما تم تنفيذه أو التعاقد عليه فعليا وما يترتب على الإلغاء من التزامات.",
        "أي مبالغ غير مستردة أو مصروفات مؤكدة تخص موردين أو تجهيزات أو حجوزات يتم التعامل معها وفقا للمستندات والالتزامات الفعلية ذات الصلة.",
      ],
    },
    {
      title: "البند العاشر: الاختصاص",
      paragraphs: [
        "تختص محاكم دولة الكويت بالفصل في أي نزاع ينشأ عن تفسير هذا العقد أو تنفيذه، ما لم يوجد اتفاق مكتوب لاحق بخلاف ذلك.",
      ],
    },
    {
      title: "البند الحادي عشر: النسخ والتوقيع",
      paragraphs: [
        "حرر هذا العقد من نسختين أصليتين بيد كل طرف نسخة للعمل بموجبها، ويقر الطرفان بأنهما اطلعا على كافة البنود الواردة فيه ووافقا عليها.",
      ],
    },
  ];
}

export async function buildContractPdfData(contractId: number): Promise<ContractPdfData> {
  const contract = await Contract.findByPk(contractId, {
    include: [
      { model: Quotation, as: "quotation" },
      { model: Customer, as: "customer" },
      {
        model: Event,
        as: "event",
        include: [
          { model: Customer, as: "customer" },
          { model: Venue, as: "venue" },
        ],
      },
      {
        model: ContractItem,
        as: "items",
        separate: true,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
        include: [
          { model: QuotationItem, as: "quotationItem" },
          { model: EventService, as: "eventService" },
          { model: Service, as: "service" },
          {
            model: EventVendor,
            as: "eventVendor",
            include: [
              { model: Vendor, as: "vendor" },
              {
                model: VendorPricingPlan,
                as: "pricingPlan",
                include: [{ model: Vendor, as: "vendor" }],
              },
            ],
          },
          { model: Vendor, as: "vendor" },
          {
            model: VendorPricingPlan,
            as: "pricingPlan",
            include: [{ model: Vendor, as: "vendor" }],
          },
        ],
      },
      {
        model: PaymentSchedule,
        as: "paymentSchedules",
        separate: true,
        order: [
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
      },
    ],
  });

  if (!contract) {
    throw new DocumentServiceError(404, "Contract not found");
  }

  const plainContract = contract.toJSON() as any;
  const event = plainContract.event;
  const customer = plainContract.customer || event?.customer || null;
  const companyProfile = getCompanyProfile();
  const customerName = displayText(customer?.fullName, "الطرف الثاني");
  const eventTitle = displayText(buildEventTitle(event), "الحفل");
  const venueName = displayText(event?.venue?.name ?? event?.venueNameSnapshot, "الموقع المتفق عليه");
  const guestCount = event?.guestCount ? String(event.guestCount) : "غير محدد";

  return {
    company: companyProfile,
    contract: {
      id: plainContract.id,
      contractNumber:
        (typeof plainContract.contractNumber === "string"
          && plainContract.contractNumber.trim())
          ? plainContract.contractNumber.trim()
          : String(plainContract.id),
      signedDate: plainContract.signedDate,
      eventDate: plainContract.eventDate ?? event?.eventDate ?? null,
      status: plainContract.status ?? null,
      notes: plainContract.notes ?? null,
      subtotal: normalizeDecimal(plainContract.subtotal),
      discountAmount: normalizeDecimal(plainContract.discountAmount),
      totalAmount: normalizeDecimal(plainContract.totalAmount),
    },
    quotation: {
      id: plainContract.quotation?.id ?? plainContract.quotationId ?? null,
      quotationNumber: plainContract.quotation?.quotationNumber ?? null,
    },
    customer: {
      fullName: customer?.fullName ?? null,
      mobile1: customer?.mobile ?? null,
      mobile2: customer?.mobile2 ?? null,
      address: customer?.address ?? null,
      civilId: customer?.nationalId ?? null,
    },
    event: {
      title: buildEventTitle(event),
      eventDate: plainContract.eventDate ?? event?.eventDate ?? null,
      venueName: event?.venue?.name ?? event?.venueNameSnapshot ?? null,
      guestCount: typeof event?.guestCount === "number" ? event.guestCount : null,
    },
    items: Array.isArray(plainContract.items)
      ? plainContract.items.map((item: any) => ({
          itemType: item.itemType === "vendor" ? "vendor" : "service",
          itemName: item.itemName,
          category: item.category ?? null,
          quantity: normalizeDecimal(item.quantity ?? 1),
          unitPrice: normalizeDecimal(item.unitPrice ?? 0),
          totalPrice: normalizeDecimal(item.totalPrice ?? 0),
          notes: item.notes ?? null,
          isSummaryRow:
            item.itemType === "service"
            && item.category === MANUAL_SERVICES_SUMMARY_CATEGORY,
        }))
      : [],
    paymentSchedules: Array.isArray(plainContract.paymentSchedules)
      ? plainContract.paymentSchedules.map((schedule: any) => ({
          installmentName: schedule.installmentName,
          dueDate: schedule.dueDate ?? null,
          amount: normalizeDecimal(schedule.amount),
          status: schedule.status ?? null,
          notes: schedule.notes ?? null,
        }))
      : [],
    clauses: buildContractClauses({
      companyName: displayText(companyProfile.name, "شركة أي بي روزس"),
      customerName,
      venueName,
      eventTitle,
      eventDate: formatDate(plainContract.eventDate ?? event?.eventDate ?? null),
      guestCount,
    }),
  };
}
