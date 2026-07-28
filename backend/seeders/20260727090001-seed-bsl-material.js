'use strict';

const materialEn = require('../data/bsl_material_en.json');
const materialFi = require('../data/bsl_material_fi.json');
const materialSv = require('../data/bsl_material_sv.json');

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('bsl_material', [
      { language: 'en', content: JSON.stringify(materialEn) },
      { language: 'fi', content: JSON.stringify(materialFi) },
      { language: 'sv', content: JSON.stringify(materialSv) },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('bsl_material', null, {});
  },
};
