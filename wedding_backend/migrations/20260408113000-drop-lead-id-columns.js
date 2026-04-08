'use strict';

const TABLES = [
  {
    tableName: 'quotations',
    columnName: 'leadId',
    indexNames: ['quotations_lead_id'],
  },
  {
    tableName: 'contracts',
    columnName: 'leadId',
    indexNames: ['contracts_lead_id'],
  },
];

const getExistingIndexes = async (queryInterface, tableName) => {
  try {
    return await queryInterface.showIndex(tableName);
  } catch (_error) {
    return [];
  }
};

const dropIndexesForColumn = async (
  queryInterface,
  tableName,
  columnName,
  indexNames,
) => {
  const indexes = await getExistingIndexes(queryInterface, tableName);
  const existingIndexNames = new Set(
    indexes
      .filter((index) =>
        Array.isArray(index.fields) &&
        index.fields.some((field) => field.attribute === columnName),
      )
      .map((index) => index.name)
      .filter(Boolean),
  );

  for (const indexName of indexNames) {
    if (!existingIndexNames.has(indexName)) {
      continue;
    }

    await queryInterface.removeIndex(tableName, indexName);
  }
};

const getForeignKeyConstraintsForColumn = async (
  queryInterface,
  tableName,
  columnName,
) => {
  if (typeof queryInterface.getForeignKeyReferencesForTable === 'function') {
    try {
      const refs = await queryInterface.getForeignKeyReferencesForTable(tableName);
      return refs
        .filter((ref) => ref.columnName === columnName && ref.constraintName)
        .map((ref) => ref.constraintName);
    } catch (_error) {
      // Fall through to raw query lookup.
    }
  }

  const [databaseRows] = await queryInterface.sequelize.query('SELECT DATABASE() AS db');
  const databaseName = Array.isArray(databaseRows) ? databaseRows[0]?.db : null;

  if (!databaseName) {
    return [];
  }

  const [rows] = await queryInterface.sequelize.query(
    `
      SELECT CONSTRAINT_NAME AS constraintName
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = :databaseName
        AND TABLE_NAME = :tableName
        AND COLUMN_NAME = :columnName
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `,
    {
      replacements: {
        databaseName,
        tableName,
        columnName,
      },
    },
  );

  return Array.isArray(rows)
    ? rows
        .map((row) => row.constraintName)
        .filter(Boolean)
    : [];
};

const dropForeignKeysForColumn = async (
  queryInterface,
  tableName,
  columnName,
) => {
  const constraintNames = await getForeignKeyConstraintsForColumn(
    queryInterface,
    tableName,
    columnName,
  );

  for (const constraintName of constraintNames) {
    await queryInterface.removeConstraint(tableName, constraintName);
  }
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const { tableName, columnName, indexNames } of TABLES) {
      const definition = await queryInterface.describeTable(tableName);

      if (!definition[columnName]) {
        continue;
      }

      await dropForeignKeysForColumn(queryInterface, tableName, columnName);
      await dropIndexesForColumn(queryInterface, tableName, columnName, indexNames);
      await queryInterface.removeColumn(tableName, columnName);
    }
  },

  async down(queryInterface, Sequelize) {
    for (const { tableName, columnName, indexNames } of TABLES) {
      const definition = await queryInterface.describeTable(tableName);

      if (!definition[columnName]) {
        await queryInterface.addColumn(tableName, columnName, {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: true,
        });
      }

      const indexes = await getExistingIndexes(queryInterface, tableName);
      const existingIndexNames = new Set(indexes.map((index) => index.name));

      for (const indexName of indexNames) {
        if (existingIndexNames.has(indexName)) {
          continue;
        }

        await queryInterface.addIndex(tableName, [columnName], {
          name: indexName,
        });
      }
    }
  },
};
