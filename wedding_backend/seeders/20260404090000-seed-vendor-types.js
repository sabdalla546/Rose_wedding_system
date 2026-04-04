'use strict';

const vendorTypeCatalog = require('../src/seed/vendorTypeCatalog.data.json');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    const timestamp = new Date();
    const rows = vendorTypeCatalog.map((definition) => ({
      name: definition.name,
      nameAr: definition.nameAr,
      slug: definition.slug,
      isActive: true,
      sortOrder: definition.sortOrder,
      createdBy: null,
      updatedBy: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    }));

    await queryInterface.bulkInsert('vendor_types', rows, {
      updateOnDuplicate: [
        'name',
        'nameAr',
        'isActive',
        'sortOrder',
        'updatedBy',
        'updatedAt',
        'deletedAt',
      ],
    });

    await queryInterface.sequelize.query(`
      UPDATE vendors AS v
      INNER JOIN vendor_types AS vt
        ON vt.slug = v.type
      SET v.typeId = vt.id
      WHERE v.typeId IS NULL OR v.typeId <> vt.id
    `);
  },

  async down(queryInterface) {
    const slugs = vendorTypeCatalog.map((definition) => definition.slug);

    await queryInterface.sequelize.query(
      `
        UPDATE vendors AS v
        INNER JOIN vendor_types AS vt
          ON vt.id = v.typeId
        SET v.typeId = NULL
        WHERE vt.slug IN (:slugs)
      `,
      {
        replacements: { slugs },
      },
    );

    await queryInterface.bulkDelete('vendor_types', {
      slug: slugs,
    });
  },
};
