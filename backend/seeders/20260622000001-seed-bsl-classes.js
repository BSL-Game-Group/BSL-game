'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('bsl_classes', [
      { class_number: 1, description: 'Minimal risk — basic teaching lab' },
      { class_number: 2, description: 'Moderate risk — agents of moderate hazard' },
      { class_number: 3, description: 'High risk — aerosol-transmissible agents' },
      { class_number: 4, description: 'Extreme risk — dangerous, life-threatening agents' },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bsl_classes', null, {});
  },
};
