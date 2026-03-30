import { Vendor, VendorType } from "../models";
import { vendorTypeCatalog } from "./vendorTypeCatalog";

export const syncVendorTypesCatalog = async () => {
  const vendorTypesBySlug = new Map<string, VendorType>();

  for (const definition of vendorTypeCatalog) {
    const [vendorType] = await VendorType.findOrCreate({
      where: { slug: definition.slug },
      defaults: {
        name: definition.name,
        nameAr: definition.nameAr,
        slug: definition.slug,
        isActive: true,
        sortOrder: definition.sortOrder,
      },
    });

    vendorTypesBySlug.set(definition.slug, vendorType);
  }

  const vendorsWithoutTypeId = await Vendor.findAll({
    where: { typeId: null },
    attributes: ["id", "type", "typeId"],
  });

  for (const vendor of vendorsWithoutTypeId) {
    const vendorType = vendorTypesBySlug.get(vendor.type);

    if (!vendorType) {
      continue;
    }

    await vendor.update({
      typeId: vendorType.id,
    });
  }
};
