module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM(
        'reserved',
        'attended',
        'cancelled',
        'converted',
        'no_show',
        'scheduled',
        'completed',
        'confirmed',
        'rescheduled'
      ) NOT NULL DEFAULT 'reserved';
    `);

    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET status = 'reserved'
      WHERE status IN ('scheduled', 'confirmed', 'rescheduled');
    `);

    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET status = 'attended'
      WHERE status = 'completed';
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET status = 'scheduled'
      WHERE status = 'reserved';
    `);

    await queryInterface.sequelize.query(`
      UPDATE appointments
      SET status = 'completed'
      WHERE status = 'attended';
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE appointments
      MODIFY COLUMN status ENUM(
        'scheduled',
        'completed',
        'cancelled',
        'converted',
        'no_show',
        'confirmed',
        'rescheduled'
      ) NOT NULL DEFAULT 'scheduled';
    `);
  },
};
