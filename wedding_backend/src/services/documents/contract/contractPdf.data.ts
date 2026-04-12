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
  Venue,
} from "../../../models";
import dayjs from "dayjs";
import type {
  ContractPdfData,
  PdfClause,
  PdfLineItem,
  PdfPairedLineItem,
} from "../document.types";
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

function buildPdfItems(items?: any[]): PdfLineItem[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((item: any) => ({
    itemType: item.itemType === "vendor" ? "vendor" : "service",
    itemName: item.itemName,
    category: item.category ?? null,
    quantity: normalizeDecimal(item.quantity ?? 1),
    unitPrice: normalizeDecimal(item.unitPrice ?? 0),
    totalPrice: normalizeDecimal(item.totalPrice ?? item.unitPrice ?? 0),
    notes: item.notes ?? null,
    isSummaryRow:
      item.itemType === "service"
      && item.category === MANUAL_SERVICES_SUMMARY_CATEGORY,
  }));
}

function buildPairedItems(items: PdfLineItem[]): PdfPairedLineItem[] {
  const serviceItems = items.filter((item) => item.itemType === "service");
  const vendorItems = items.filter((item) => item.itemType === "vendor");

  return Array.from(
    { length: Math.max(serviceItems.length, vendorItems.length) },
    (_, index) => ({
      serviceItem: serviceItems[index],
      vendorItem: vendorItems[index],
    }),
  );
}

function computeVendorTotalAmount(items: PdfLineItem[]) {
  return normalizeDecimal(
    items
      .filter((item) => item.itemType === "vendor")
      .reduce((sum, item) => sum + normalizeDecimal(item.totalPrice), 0),
  );
}

function formatArabicWeekday(value?: string | null) {
  if (!value) {
    return "........";
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) {
    return "........";
  }

  return new Intl.DateTimeFormat("ar-KW", { weekday: "long" }).format(parsed.toDate());
}

function buildVenueAddress(venue?: {
  address?: string | null;
  area?: string | null;
  city?: string | null;
}) {
  if (!venue) {
    return null;
  }

  const parts = [venue.address, venue.area, venue.city]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" - ") : null;
}

function buildPaymentScheduleParagraphs(schedules: ContractPdfData["paymentSchedules"]) {
  const labels = ["الدفعة الأولى", "الدفعة الثانية", "الدفعة الثالثة"];

  const paragraphs = labels.map((label, index) => {
    const schedule = schedules[index];
    const amount = schedule ? `${normalizeDecimal(schedule.amount).toFixed(3)} د.ك` : "................";
    const dueDate = schedule?.dueDate ? formatDate(schedule.dueDate) : "....../....../2026";

    if (index === 0) {
      return `${label}: مبلغ وقدره (${amount}) فقط كعربون في يوم ${dueDate}.`;
    }

    if (index === 1) {
      return `${label}: مبلغ وقدره (${amount}) فقط للتجهيز في يوم ${dueDate}.`;
    }

    return `${label}: مبلغ وقدره (${amount}) فقط نهاية التعاقد في يوم ${dueDate}.`;
  });

  if (schedules.length > labels.length) {
    schedules.slice(labels.length).forEach((schedule, index) => {
      const ordinal = index + labels.length + 1;
      paragraphs.push(
        `الدفعة رقم (${ordinal}): مبلغ وقدره (${normalizeDecimal(schedule.amount).toFixed(3)} د.ك) فقط مستحق في يوم ${formatDate(schedule.dueDate)}.`,
      );
    });
  }

  return paragraphs;
}

function buildContractClauses(data: {
  venueName: string;
  venueAddress: string;
  eventTitle: string;
  eventDate: string;
  eventDateRaw?: string | null;
  guestCount: string;
  totalAmount: string;
  paymentSchedules: ContractPdfData["paymentSchedules"];
}): PdfClause[] {
  const eventWeekday = formatArabicWeekday(data.eventDateRaw);
  const paymentParagraphs = buildPaymentScheduleParagraphs(data.paymentSchedules);

  return [
    {
      title: "التمهيد",
      paragraphs: [
        `حيث أن الطرف الثاني يرغب في إقامة حفل مناسبة (${data.eventTitle}) وقد أبدى رغبته للطرف الأول وهي شركة متخصصة بأعمال ولوازم المناسبات والحفلات، وطلب منها توريد وتجهيز قاعة الحفل (${data.venueName} - ${data.venueAddress}) على أن تكون جاهزة لإقامة الحفلة والمناسبة بما يتماشى مع متطلبات الطرف الثاني والمتفق عليها أعلاه.`,
        "وبعد أن أقر المتعاقدان بأهليتهما للتصرف والتعاقد وخلو إرادتهما من كافة العيوب اتفقا على ما يلي من شروط وأحكام للعقد.",
      ],
    },
    {
      title: "البند الأول",
      paragraphs: [
        "يعتبر التمهيد جزء لا يتجزأ من هذا العقد ومرتبط ومفسر ومكمل لأحكامه وشروطه وفق الضوابط القانونية في دولة الكويت.",
      ],
    },
    {
      title: "البند الثاني: التعريفات.",
      paragraphs: [
        "تفسر وتعرف المصطلحات والكلمات الواردة أدناه بالتعريف قرين كل تعريف على حدى.",
      ],
      definitions: [
        {
          number: "1",
          term: "الحفل",
          definition:
            "المناسبة التي تقام في الفندق أو الصالة المقام عليه حفل الزفاف أو الخطوبة أو التفوق والنجاح أو أي مكان يتم اختياره من قبل الطرف الثاني.",
        },
        {
          number: "2",
          term: "الطرف الأول",
          definition: "المصمم لكافة تفاصيل مناسبة الحفل.",
        },
        {
          number: "3",
          term: "الطرف الثاني",
          definition: "الزبون أو العميل.",
        },
        {
          number: "4",
          term: "الغير",
          definition: "هم رواد الحفل بوجه عام وكل من يتواجد في قاعة الحفل ووقت المناسبة.",
        },
      ],
    },
    {
      title: "البند الثالث: نطاق التزامات الطرف الأول (المصمم).",
      paragraphs: [
        "1- تجهيز كافة اللوازم المدونة بالورقة الأولى (1) بهذا العقد.",
        "2- إنهاء كافة تفاصيل حفل الزفاف مع الطرف الثاني (العميل) في مدة من 30 يوم إلى 45 يوم قبل موعد وتاريخ الحفل المنوه عنه بالبند الرابع فقرة (2).",
        "3- للطرف الأول (المصمم) الحق التام في تجهيز القاعة وفق المظهر العام الذي يراه مناسباً دون الرجوع إلى الطرف الثاني.",
        `4- يلتزم الطرف الأول (المصمم) بتجهيز وتسليم الصالة المقام عليها الحفل للطرف الثاني (العميل) في تمام الساعة السابعة مساءً يوم الحفل الموافق ${eventWeekday} بتاريخ ${data.eventDate}، وفي حالة عدم حضور العميل في يوم استلام القاعة لا يحق له المطالبة بأي من البنود الواردة محل العقد والمبلغ المتفق عليه كاملاً وذلك بمثابة توقيعه على محضر استلام كافة التجهيزات الكاملة للحفل، وعلى الطرف الثاني الحضور مبكراً في يوم الحفل تقريباً في حدود الساعة 3:00 مساءً إلى 4:00 مساءً إذا رغب في وضع اللمسات الأخيرة للتجهيزات داخل القاعة حتى يتسنى للطرف الأول القيام بها وإذا لم يحضر في ذلك الوقت فلا يحق له التعديل على وضع التجهيزات داخل القاعة.`,
      ],
    },
    {
      title: "البند الرابع: الحفل والمدة وعدد الحضور.",
      paragraphs: [
        "1- أقر واتفق الطرف الثاني وأكد على منح المصمم حق توريد وتجهيز كافة لوازم حفل الزفاف والمبينة وصفاً وتفصيلاً في الصفحة الأولى من العقد، وفي حال إضافة أي بنود أو إلغاء أي بند تم التعاقد عليه في الصفحة رقم (1) تلحق بملحق تابع للعقد المذكور أعلاه والتوقيع عليه من قبل الطرفين.",
        `2- يبدأ هذا العقد بين الطرفين اعتباراً من تاريخ التوقيع عليه وتنتهي تلقائياً في يوم (${eventWeekday}) الموافق ${data.eventDate}.`,
        `3- اتفق الطرفان على أن إجمالي عدد حضور حفل الزفاف هو ${data.guestCount} شخص ومكان الحفل هو (${data.venueName}) ولا يتحمل الطرف الأول الزيادة فوق العدد المتفق عليه.`,
        "4- لا يكون الطرف الأول مسؤولاً عن أي أضرار تحدث نتيجة خطأ الطرف الثاني أو الغير (رواد الحفلة) في يوم الحفلة أو المناسبة ويكون الطرف الثاني مسؤولاً مسؤولية تضامنية مع الغير عن تعويض الطرف الأول عن هذه الأضرار.",
      ],
    },
    {
      title: "البند الخامس: كيفية السداد (القيمة النقدية وطرق الدفعات لتوريد وتجهيز لوازم الحفلة).",
      paragraphs: [
        `اتفق الطرف الثاني مع الطرف الأول على توريد وتجهيز الصالة (${data.venueName}) الكائنة في (${data.venueAddress}) على التالي:`,
        "أولاً: تجهيز القاعة وإعدادها وهذا على سبيل المثال لا الحصر (تجهيز الكوشة من حيث نوع الكوشة والكراسي والخام وجوانب الكراسي وأرضية الكوشة وجوانب الصالة وممر العروس - الأطقم الأمامية وإكسسوارات الطاولة الأمامية - البنشات الخلفية ونوعها - طاولات القاعة - أماكن استخدام الورد - صواني الحلويات - تجهيزات الصالة من إضاءات - المدخل - أخرى (DJ - كروت - تصوير - عطور - لون الاكسسوارات - الكلينكسات - الاسامي - مهفات) وتعتبر قيمة تفاصيل الحفل جزء من مقابل التعاقد.",
        `ثانياً: يلتزم الطرف الثاني بدفع مبلغ وقدره (${data.totalAmount}) فقط للطرف الأول مقابل تجهيزه الحفل ويكون سدادها على النحو التالي:-`,
        ...paymentParagraphs,
      ],
    },
    {
      title: "البند السادس: التزامات وتعهدات الطرف الثاني (العميل أو الزبون).",
      paragraphs: [
        "1- لا يحق للطرف الثاني (العميل) استئجار أية معدات خارجية من شركات أخرى تخص تجهيزات الحفل من ديكور إلا بعد موافقة كتابية من قبل الطرف الأول (المصمم).",
        "2- يتعهد الطرف الثاني (العميل) بأنه يتحمل مسؤولية إعادة لوازم حفل الزفاف المدونة وصفاً وتفصيلاً بالصفحة رقم (1) بهذا العقد للطرف الأول (المصمم) كاملة دون نقصان أو تلف أو تغيير يطرأ عليها من أية ظروف سواء كانت طبيعة أو قهرية سواء من قبله أو الغير (رواد الحفلة).",
        "3- يلتزم الطرف الثاني (العميل) بتحمله أية رسوم أو عمولات إضافية تفرضها الصالة المقام بها الحفل وأنها غير داخلة في نطاق العقد المتفق عليه في هذا العقد.",
        "4- يلتزم الطرف الثاني (العميل) بالعدد المحدد الذي اتفق عليه في البند (الرابع) سالف الذكر وفي حال مخالفة هذا البند يتعهد بدفع المبالغ المترتبة عليه من قبل الصالة المقام بها الحفل.",
        "5- يتعهد الطرف الثاني (العميل) للطرف الأول (المصمم) بأن المبلغ المدفوع من قبله للطرف الأول كعربون للتعاقد هو حق خالص للطرف الأول غير قابل للاسترداد في أية حال من الأحوال وذلك بعد توقيع العقد.",
        "6- يتعهد الطرف الثاني (العميل) بسداد قيمة العربون جملة وتفصيلاً إلى الطرف الأول خلال مدة أقصاها أسبوع من تاريخ التوقيع على هذا العقد، وفي حال سداد عربون أقل من مبلغ ألفين ديناراً كويتياً فإنه يلتزم باستكمال مبلغ العربون للطرف الأول (المصمم) بمدة أقصاها أسبوع من تاريخ التوقيع على هذا العقد.",
        "7- لا يحق للطرف الثاني (العميل) التدخل في كيفية تجهيز القاعة (خطة العمل) المتفق عليها بالصفحة رقم (1) بهذا العقد.",
        "8- يحق للطرف الثاني (العميل) تغيير العقد باسم شخص آخر شريطة حضوره هو والشخص الآخر إلى مقر شركة الطرف الأول وتوقيعهما على ما يلزم لذلك الأمر على أن يكون التاريخ المطلوب من الشخص الآخر متاحاً لدى الشركة (الطرف الأول).",
        "9- في حال حدوث أي ظرف مفاجئ للطرف الثاني أو حالة وفاة لا قدر الله قبل موعد الحفل أي قبل إجراءات تنفيذ المصمم لعمله المتفق عليه في هذا العقد وقرر الطرف الثاني تأجيله فلابد أن يلتزم بإبلاغ الطرف الأول (المصمم) بذلك خطياً وسوف يتم تأجيل موعد الحفل حسب الاتفاق لمدة حدها الأقصى سنة واحدة مع تحمله أي بنود للزيادة خلال تلك السنة أو تغير في خطة العمل أو الديكور المتفق عليه، أما لو حدث ذلك الأمر بعد قيام المصمم بتنفيذ بنود العقد بيوم الحفل وقبله فإن الطرف الثاني يتحمل المبلغ المالي لما قام به الطرف الأول من تنفيذ كاملاً.",
        "10- في حال رغبة الطرف الثاني تأجيل موعد الحفل لأي سبب فيلتزم بإبلاغ الطرف الأول خطياً بذلك التأجيل قبل موعد وتاريخ الحفل بمدة تقديرية (45 يوم) على أن يتم اختيار الميعاد الجديد وفق المواعيد المتاحة للطرف الأول وفي حال تغيير ميعاد الحفل وعدم إبلاغ الطرف الأول بذلك يتحمل تكاليف التجهيزات كاملةً مع عدم إلزام الطرف الأول بإجراءات التعاقد ويعتبر العقد مفسوخاً من تلقاء نفسه.",
        "11- وفي حال رغبة الطرف الثاني (العميل) بتغيير مكان حفل الزفاف وتاريخه فيلتزم بإبلاغ الطرف الأول (المصمم) وتغيير القيمة التعاقدية وفق ما يراه الطرف الأول لذلك التغيير خطياً والتوقيع على ذلك.",
        "12- في حال تأجيل الطرف الثاني (العميل) لموعد وتاريخ حفل الزفاف لمدة تزيد على شهر فإنه يحق للطرف الأول التصرف الكامل فيما تم تجهيزه من تصميم عند اختيار (كوشة كتصميم أول مرة) ويسقط حق الطرف الثاني في الاستخدام لأول مرة.",
        "13- في حالة طلب الطرف الثاني الورد المتواجد داخل القاعة يلتزم بدفع مبلغ وقدره (750 د.ك) فقط سبعمائة وخمسون د.ك، وهي قيمة المنسقين لجمع الورد داخل القاعة وإيجار السيارة المبردة للنقل وتخزين الورد داخل الثلاجة على أن يرسل إلى منزل الطرف الثاني في اليوم الثاني للحفل بعد أن يتم فرز الورد الجيد عن التالف وتنسيق الورد من جديد.",
        "(ملحوظة: تكون نسبة شراء الورد للحفلة 10% من أصل العقد المتفق عليه في تجهيز الكوشة بين الطرفين وفي حالة طلب زيادة يتم إبلاغ الطرف الأول).",
        "14- الطرف الأول ليس مسؤولاً عن الورد بعد الحفلة إلا بعد أن يتم إبلاغه من قبل الطرف الثاني عن حاجة الورد من عدمه ودفع المبلغ المبين في (البند السادس – فقرة رقم 13)، كما أن للطرف الثاني الحق في أخذ الورد المتبقي آخر الحفل على أن يقوم بجمعه من داخل القاعة بنفسه.",
        "15- يجب أن يلتزم الطرف الثاني بتوضيح متطلباته من خلال بنود العقد المذكورة في الورقة (الأولى) والتأكيد على طلبه (كوشة جديدة أول مرة) وفي حال عدم التقيد بهذا البند سوف يحق للطرف الأول الاختيار من (الكوش المجهزة من قبل).",
        "16- عند تحديد الطرف الثاني للديكور (الكوش التي تم تصميمها من قبل)، وفي حال تم مشاهدة الكوشة التي تم اختيارها (في السوشيال ميديا أو في قاعة حفلات أو عن طريق الأقارب والأصدقاء) لا يحق للطرف الثاني مطالبة الطرف الأول بتخصيص الديكور المتفق عليه وذلك لأن التصميم متواجد من قبل وبقيمة تقديرية أقل كما أنه لا يحق للطرف الثاني طلب عدم إيجار التصميم المصمم من قبل (أي حق التملك) إلى أي شخص آخر وتخلى المسؤولية كاملة من قبل الطرف الأول.",
        "17- في حال رغبة الطرف الثاني للتعاقد مع الشركات الخارجية مثل (شركة الكوفي ستيشن أو شركة الأجبان أو شركة الباركود أو شركة الصوت أو شركة التصوير أو شركات الحلو) يلتزم هو بالتعاقد المباشر مع تلك الشركات دون أدنى مسؤولية قانونية على الطرف الأول، كما أن الطرف الأول (المصمم) غير مسؤول عن ما يحدث من الشركات التي تم التعاقد معها وفي حال طلب الطرف الثاني من الطرف الأول التعاقد بدلاً منه مع الشركات فإن الطرف الأول لا يتحمل تقصير تلك الشركات في أي شيء تم الاتفاق عليه.",
        "18- يلتزم الطرف الثاني بالتنبيه والتأكيد على أي قاعة يقوم بالاتفاق معها لإقامة الحفل داخلها على تسليم المكان للطرف الأول المتعاقد معه في تمام الساعة 6:00 صباحاً يوم الحفل، وفي حال لم يتم استلام القاعة في المعاد المحدد فإن الطرف الأول غير مسؤول عن أي تأخير في عملية تجهيز القاعة.",
      ],
    },
    {
      title: "البند السابع",
      paragraphs: [
        "1- في حال حدوث أي كوارث أو قرارات من قبل الدولة بتعطيل أو إيقاف إقامة الحفل أو من قبل إدارة الفندق أو أي ظروف خارجة وطارئة فإن العربون غير مسترجع للطرف الثاني كما يلتزم الطرف الثاني بتحمل كافة أي مصروفات تم دفعها فوق مبلغ العربون بموجب فواتير وسندات صرف قبل التعطيل أو الإيقاف.",
        "2- لا يتحمل الطرف الأول (المصمم) ما يحدث بعد تسليم الحفل ولا يحق للطرف الثاني طلب أي شيء غير متفق عليه بعد عملية التسليم.",
        "3- في حال عدم وجود ألوان وأنواع الورد المتفق عليها عند التجهيز يوم الحفلة وذلك لعدم توافرها بالسوق المحلي وكذلك عدم استيرادها من الدول المصدرة فإن الطرف الأول (المصمم) لا يتحمل المسؤولية ويحق للطرف الثاني تغيير نوع ولون الورد المطلوب وفق القيمة التقديرية المتفق عليها وكذلك للطرف الأول الحق في التصرف من تلقاء نفسه لاختيار أي لون ونوع من الورد كبديل عن المطلوب بعد التواصل مع الطرف الثاني وإبلاغه بعدم توافر نوع الورد أو اللون.",
        "4- في حالة امتناع القاعة عن السماح للطرف الأول من تركيب الدبل فيس لتثبيت السجاد أو الممر في الأرض وكذلك وجود خلل في المدرجات من ناحية الأرجل أو ارتفاع المدرجات الأكبر من المعدل الطبيعي لها فإن الطرف الأول يخلي مسؤوليته من حدوث أي أضرار مترتبة على ذلك الأمر.",
      ],
    },
    {
      title: "البند الثامن: إخلال العميل.",
      paragraphs: [
        "يعتبر الطرف الثاني (العميل أو الزبون) قد اقترف إخلالات جسيمة تستوجب الفسخ الفوري لهذا العقد وذلك في حالة إخلاله بالتزاماته الواردة بالبند الخامس والبند السادس الفقرات أرقام (1، 6، 8، 10، 11) أما الإخلال بباقي بنود العقد فيستوجب قيام الطرف الأول بإخطار الطرف الثاني ومنحه مدة خمسة أيام لتلافي هذا الإخلال فإذا لم يتلاف العميل الإخلال خلال مدة الإخطار حق للطرف الأول فسخ هذا العقد مع التعويضات المستحقة ويعتبر الضرر متحققاً في جميع حالات الإخلال السابقة دون الحاجة إلى إثباته من قبل الطرف الأول.",
      ],
    },
    {
      title: "البند التاسع: التعويض عن الإنهاء المبكر قبل انتهاء مدة العقد.",
      paragraphs: [
        "يجوز للعميل طلب إنهاء العقد قبل انتهاء مدتها مع التزامه بما يلي:",
        "1- خصم المبلغ المالي المتفق عليه وقدره ألفين ديناراً كويتياً فقط لا غير قيمة العربون من المبلغ المدفوع من قبل الطرف الثاني للطرف الأول.",
        "2- خصم كافة المشتريات والتجهيزات والعرابين المدفوعة للشركات المشاركة بالعقد بموجب الفواتير المدونة للحفل ويلتزم الطرف الثاني بدفع باقي المبالغ المستحقة للطرف الأول في حال عدم كفاية المبلغ المدفوع له وتغطيته لكافة المصروفات.",
        "3- يتم صرف المبلغ المستحق للطرف الثاني بعد خصم ما سبق بيانه بعد ثلاثة أشهر من تاريخ إلغاء التعاقد والتوقيع عليه من قبله.",
      ],
    },
    {
      title: "البند العاشر: إنهاء المنازعات.",
      paragraphs: [
        "يختص القضاء الكويتي بكافة الخلافات والمنازعات التي تنشأ لا قدر الله عند تنفيذ العقد أو تطبيقه.",
      ],
    },
    {
      title: "البند الحادي عشر: نسخ العقد.",
      paragraphs: [
        "حرر هذا العقد من نسختين أصليتين، ويقر الطرفان بتوقيع كافة صفحات العقد في التاريخ المذكور أعلاه بعد معرفتهما بكافة أحكام البنود الواردة بهذا العقد ويتسلم كل طرف نسخة أصلية للعمل بموجبها عند اللزوم والاقتضاء.",
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
            ],
          },
          { model: Vendor, as: "vendor" },
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
  const eventTitle = displayText(buildEventTitle(event), "زفاف");
  const venueName = displayText(event?.venue?.name ?? event?.venueNameSnapshot, "الصالة المتفق عليها");
  const venueAddress = displayText(
    buildVenueAddress(event?.venue) ?? customer?.address,
    "العنوان غير محدد",
  );
  const guestCount = event?.guestCount ? String(event.guestCount) : "غير محدد";
  const items = buildPdfItems(plainContract.items);
  const paymentSchedules = Array.isArray(plainContract.paymentSchedules)
    ? plainContract.paymentSchedules.map((schedule: any) => ({
        installmentName: schedule.installmentName,
        dueDate: schedule.dueDate ?? null,
        amount: normalizeDecimal(schedule.amount),
        status: schedule.status ?? null,
        notes: schedule.notes ?? null,
      }))
    : [];

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
      venueAddress: buildVenueAddress(event?.venue),
      guestCount: typeof event?.guestCount === "number" ? event.guestCount : null,
    },
    items,
    pairedItems: buildPairedItems(items),
    vendorTotalAmount: computeVendorTotalAmount(items),
    paymentSchedules,
    clauses: buildContractClauses({
      venueName,
      venueAddress,
      eventTitle,
      eventDate: formatDate(plainContract.eventDate ?? event?.eventDate ?? null),
      eventDateRaw: plainContract.eventDate ?? event?.eventDate ?? null,
      guestCount,
      totalAmount: `${normalizeDecimal(plainContract.totalAmount).toFixed(3)} د.ك`,
      paymentSchedules,
    }),
  };
}
