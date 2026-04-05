export const inventoryAr = {
  "sidebar": {
    "nav": {
      "inventory": "المخزون"
    }
  },
  "inventory": {
    "title": "المخزون",
    "description": "إدارة أصناف المخزون المستقلة والكميات والصور المرجعية الاختيارية.",
    "totalItems": "إجمالي الأصناف",
    "listTitle": "أصناف المخزون",
    "create": "إنشاء صنف",
    "createTitle": "إنشاء صنف مخزون",
    "editTitle": "تعديل صنف مخزون",
    "createDescription": "أضف صنف مخزون مستقل مع كمية مباشرة وصورة مرجعية اختيارية.",
    "editDescription": "حدث اسم صنف المخزون المستقل وكميته وصورته المرجعية.",
    "backToInventory": "العودة إلى المخزون",
    "basicInformation": "المعلومات الأساسية",
    "basicInformationHint": "أدخل اسم المنتج والكمية المتوفرة حاليًا لهذا الصنف المستقل.",
    "name": "اسم المنتج",
    "namePlaceholder": "أدخل اسم المنتج",
    "quantity": "الكمية",
    "quantityPlaceholder": "أدخل الكمية المتوفرة",
    "quantityHelper": "استخدم صفرًا للأصناف غير المتوفرة حاليًا.",
    "image": "الصورة",
    "imageSection": "الصورة المرجعية",
    "imageSectionHint": "ارفع صورة منتج اختيارية لتسهيل التعرف على الصنف سريعًا.",
    "imageUpload": "رفع صورة",
    "imageHint": "يُسمح بملفات الصور فقط. حافظ على حجم أقل من 5 ميجابايت لسلاسة أفضل.",
    "imageMaxSize": "الحد الموصى به: 5 ميجابايت",
    "selectedImage": "الصورة المحددة",
    "preview": "معاينة",
    "previewHint": "ستظهر الصورة المحددة في قائمة المخزون وصفحة التفاصيل.",
    "noImage": "لا توجد صورة",
    "noImageHint": "أضف صورة اختيارية لتسهيل مسح قائمة المخزون.",
    "imagePath": "مسار الصورة",
    "stockStatus": "حالة التوفر",
    "currentQuantity": "الكمية الحالية",
    "auditTrail": "سجل التتبع",
    "auditTrailHint": "تتبع من أنشأ الصنف ومتى تم تحديث سجله.",
    "createdBy": "أنشئ بواسطة",
    "updatedBy": "حدث بواسطة",
    "createdAt": "تاريخ الإنشاء",
    "updatedAt": "تاريخ التحديث",
    "searchPlaceholder": "ابحث في المخزون باسم المنتج...",
    "filterDescription": "صفّ قائمة المخزون حسب اسم المنتج وحالة التوفر.",
    "stockFilter": "مرشح المخزون",
    "emptyTitle": "لا توجد أصناف مخزون بعد",
    "emptyDescription": "ابدأ قائمة المخزون المستقلة بإنشاء أول صنف وإضافة كميته وصورته.",
    "emptyAction": "إنشاء أول صنف",
    "emptyFilteredTitle": "لا توجد أصناف مطابقة",
    "emptyFilteredDescription": "حاول تغيير نص البحث أو مرشح المخزون للوصول إلى النتائج.",
    "deleteTitle": "حذف صنف مخزون",
    "deleteMessage": "هل أنت متأكد من حذف صنف المخزون هذا؟",
    "units_one": "وحدة",
    "units_other": "وحدات",
    "filters": {
      "all": "كل الأصناف",
      "in-stock": "متوفر",
      "out-of-stock": "غير متوفر"
    },
    "status": {
      "inStock": "متوفر",
      "outOfStock": "غير متوفر"
    },
    "toast": {
      "created": "تم إنشاء صنف المخزون بنجاح",
      "createFailed": "تعذر إنشاء صنف المخزون",
      "updated": "تم تحديث صنف المخزون بنجاح",
      "updateFailed": "تعذر تحديث صنف المخزون",
      "deleted": "تم حذف صنف المخزون بنجاح",
      "deleteFailed": "تعذر حذف صنف المخزون"
    },
    "validation": {
      "nameRequired": "اسم المنتج مطلوب",
      "quantityRequired": "الكمية مطلوبة",
      "quantityInteger": "يجب أن تكون الكمية رقمًا صحيحًا",
      "quantityMin": "لا يمكن أن تكون الكمية سالبة"
    }
  }
} as const;
