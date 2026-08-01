'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Fix the default value by stringifying it so Postgres registers it perfectly
    await queryInterface.addColumn('bsl_classes', 'required_equipment', { 
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: JSON.stringify({
        required: [],
        anyOf: [],
        optional: [],
      }) 
    });

    const requiredByClass = {
      1: { required:['lab_coat', 'glasses'],    anyOf:[],                      optional:['gloves'] },
      2: { required:['lab_coat','gloves'],      anyOf:['mask','face_shield'],  optional:[] },
      3: {
        required: ['gloves'],
        anyOf: [
          { anyOf: ['closable_lab_coat', 'disposable_overall'] },
          { anyOf: [
              { allOf: ['mask', { anyOf: ['glasses', 'face_shield'] }] },
              'respirator'
            ]
          }
        ],
        optional: []
      },
      4: { required:['pressurized_suit', 'gloves'], anyOf:[], optional:[] },
    };

    for (const [classNumber, equipment] of Object.entries(requiredByClass)) {
      // 2. Remove manual JSON.stringify here; pass the raw object 
      // 3. Note: If rows don't exist yet, you should use bulkInsert instead of bulkUpdate
      await queryInterface.bulkUpdate(
        'bsl_classes',
        { required_equipment: equipment }, 
        { class_number: Number(classNumber) }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('bsl_classes', 'required_equipment');
  }
};