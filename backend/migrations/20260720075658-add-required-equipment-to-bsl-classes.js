'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('bsl_classes', 'required_equipment',
       { type: Sequelize.JSONB,
         allowNull: false,
         defaultValue: {} });

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
