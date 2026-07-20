'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('bsl_classes', 'required_equipment',
       { type: Sequelize.ARRAY(Sequelize.STRING),
         allowNull: false,
         defaultValue: '[]' });

    const requiredByClass = {
      1: ['lab_coat', 'glasses', 'gloves'],
      2: ['lab_coat', 'glasses', 'gloves', 'face_shield'],
      3: ['disposable_overall','closable_lab_coat', 'glasses','face_shield',
         'double_gloves', 'respirator', 'mask'],
      4: ['pressurized_suit', 'gloves'],
       };
       for (const [classNumber, equipment] of Object.entries(requiredByClass)) {
         await queryInterface.bulkUpdate(
           'bsl_classes',
           { required_equipment: equipment },
           { class_number: classNumber }
         );
       }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bsl_classes', 'required_equipment');
  }
};
