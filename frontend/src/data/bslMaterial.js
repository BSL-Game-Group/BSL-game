// Full BSL (Biosafety Level) reference material shown in the lecture-materials
// popup. Content sourced from Finnish Decree 748/2020, WHO Laboratory Biosafety
// Manual (4th ed., 2020), and CDC BMBL (6th ed.) — see `sources` below.

export const intro = {
  heading: 'International development',
  paragraphs: [
    "The roots of the BSL system lie in the recombinant-DNA research of the 1970s. After the Asilomar Conference, the U.S. NIH published guidelines for recombinant nucleic acid research in 1976. The WHO followed suit in 1983 by publishing the first Laboratory Biosafety Manual, which has since been updated several times — the third edition (2004) introduced the concept of biosecurity for the first time, and the fourth edition (2020) shifted more strongly toward a risk-based assessment.",
    'The central principle in all systems is the same: every biological agent is first classified into a risk group (Risk Group 1–4) based on its pathogenicity, route of transmission, availability of treatment, and community risk. After this, the laboratory in which the organism is handled is assigned a corresponding biosafety level (BSL 1–4), which defines the practices, protective equipment, and facility requirements.',
  ],
}

export const riskGroups = {
  heading: 'The four risk groups (Nambisan, NIH Guidelines Appendix B)',
  intro: 'Assignment to a risk group is based on four factors:',
  factors: [
    'The pathogenicity of the organism (whether it causes disease at all)',
    'Host range and mode of transmission',
    'Local availability of effective preventive measures',
    'Local availability of effective treatment',
  ],
}

export const bslLevels = [
  {
    level: 1,
    title: 'BSL-1 — Low risk',
    description:
      'BSL-1 organisms do not cause disease in healthy adults. They are used in basic research and teaching. The laboratory does not require special containment, and work is carried out on an open bench.',
    equipment: ['Lab coat', 'Gloves when needed', 'Safety glasses for splashes'],
    examples: "Baker's yeast, soil bacteria, laboratory E. coli strains.",
  },
  {
    level: 2,
    title: 'BSL-2 — Moderate risk',
    description:
      'BSL-2 organisms can cause disease, but effective treatment or a vaccine is usually available. Infection requires direct contact (blood, secretions, food) — it does not spread through the air. Access to the laboratory is restricted while work is in progress.',
    equipment: [
      'Lab coat',
      'Gloves at all times',
      'Safety glasses or face shield',
      'Biosafety cabinet for handling aerosols',
    ],
    examples: 'Salmonella, staphylococcus, chickenpox, hepatitis A, chlamydia.',
  },
  {
    level: 3,
    title: 'BSL-3 — High risk',
    description:
      'BSL-3 organisms can cause serious or life-threatening disease, and some spread through the air as aerosols. Access is strictly controlled, and the laboratory has directional airflow that prevents pathogens from escaping.',
    equipment: [
      'Disposable coverall or sealable full-body gown',
      'Double gloves',
      'Respirator (N95 or better)',
      'Shower on exit',
    ],
    examples: 'Tuberculosis, anthrax, COVID-19 (virus culture), HIV, hepatitis B and C, dengue.',
  },
  {
    level: 4,
    title: 'BSL-4 — Maximum risk',
    description:
      'BSL-4 organisms often cause a fatal disease, and no effective treatment or vaccine is available. Complete isolation from the environment and a specially constructed laboratory are required.',
    equipment: [
      'Fully enclosed positive-pressure protective suit with its own air supply',
      'Gloves integrated into the suit',
      'Shower and decontamination on exit',
      'All material is autoclaved',
    ],
    examples: 'Ebola, Marburg, Lassa fever, smallpox (eradicated), Crimean-Congo hemorrhagic fever.',
  },
]

export const organismTables = [
  {
    level: 1,
    heading: 'BSL-1 — Low risk (15 organisms)',
    rows: [
      [1, "Baker's yeast", 'Saccharomyces cerevisiae', 'Fungus', 'Model organism for eukaryotic cell biology'],
      [2, 'Soil bacterium', 'Bacillus subtilis', 'Bacterium', 'Model for sporulation research'],
      [3, 'Laboratory E. coli', 'E. coli (non-pathogenic strains)', 'Bacterium', 'Biologically attenuated (EK1 system)'],
      [4, 'Milk yeast', 'Kluyveromyces lactis', 'Fungus', 'GRAS organism'],
      [5, 'Adeno-associated virus', 'AAV', 'Virus', 'Does not replicate without a helper virus'],
      [6, 'Lactic acid bacterium', 'Lactobacillus acidophilus', 'Bacterium', 'Part of the normal gut flora'],
      [7, 'Caulobacter', 'Caulobacter crescentus', 'Bacterium', 'Model for studying cell division'],
      [8, 'Halobacterium', 'Halobacterium salinarum', 'Archaeon', 'Extremophile, does not live in the human body'],
      [9, 'Cyanobacterium', 'Synechocystis spp.', 'Bacterium', 'Model for photosynthesis research'],
      [10, 'Phi29 bacteriophage', 'Bacillus phage phi29', 'Virus', 'Infects only bacteria'],
      [11, 'Pseudomonas fluorescens', 'Pseudomonas fluorescens', 'Bacterium', 'Non-pathogenic soil species'],
      [12, 'Agrobacterium', 'Agrobacterium tumefaciens', 'Bacterium', 'Infects only plants'],
      [13, 'Tetrahymena', 'Tetrahymena thermophila', 'Protist', 'Nobel Prize–winning research model'],
      [14, 'Lambda bacteriophage', 'Enterobacteria phage lambda', 'Virus', 'Classic model of gene regulation'],
      [15, 'Neurospora mold', 'Neurospora crassa', 'Fungus', 'Genetics research model since the 1940s'],
    ],
  },
  {
    level: 2,
    heading: 'BSL-2 — Moderate risk (21 organisms)',
    note: 'HIV, hepatitis B, hepatitis C, and dengue are not on this BSL-2 list — they have been moved to BSL-3 in accordance with Finnish legislation (see Part 3).',
    rows: [
      [16, 'Influenza A', 'Seasonal influenza viruses', 'Virus', 'Vaccine available'],
      [17, 'Measles', 'Morbillivirus', 'Virus', 'MMR vaccine protects'],
      [18, 'Salmonella', 'Salmonella Typhimurium', 'Bacterium', 'Foodborne'],
      [19, 'Staphylococcus', 'Staphylococcus aureus', 'Bacterium', 'MRSA strains resistant'],
      [20, 'Lyme borreliosis', 'Borrelia burgdorferi', 'Bacterium', 'Tick-borne'],
      [21, 'Cholera', 'Vibrio cholerae', 'Bacterium', 'Waterborne, vaccine available'],
      [22, 'Chickenpox', 'VZV', 'Virus', 'Vaccine protects'],
      [23, 'Norovirus', 'Norwalk virus', 'Virus', 'Fecal-oral route'],
      [24, 'Syphilis', 'Treponema pallidum', 'Bacterium', 'Penicillin effective'],
      [25, 'Whooping cough', 'Bordetella pertussis', 'Bacterium', 'Vaccine protects'],
      [26, 'Chlamydia', 'Chlamydia trachomatis', 'Bacterium', 'Most common STI bacterium'],
      [27, 'Meningococcus', 'Neisseria meningitidis', 'Bacterium', 'Vaccine protects'],
      [28, 'Toxoplasmosis', 'Toxoplasma gondii', 'Protist/parasite', 'Dangerous for pregnant women'],
      [29, 'Cryptosporidiosis', 'Cryptosporidium parvum', 'Parasite', 'Chlorine-resistant'],
      [30, 'Candida', 'Candida albicans', 'Fungus', 'Most common fungal infection'],
      [31, 'Aspergillus', 'Aspergillus fumigatus', 'Fungus', 'Allergenic'],
      [32, 'Listeria', 'Listeria monocytogenes', 'Bacterium', 'Grows at refrigerator temperature'],
      [33, 'Papillomavirus', 'HPV', 'Virus', 'Vaccine protects against cancer strains'],
      [34, 'Hepatitis A', 'Hepatovirus A', 'Virus', 'Fecal-oral transmission'],
      [35, 'Tetanus', 'Clostridium tetani', 'Bacterium', 'Vaccine highly effective'],
      [36, 'Malaria (other species)', 'Plasmodium spp.', 'Parasite', 'Mosquito-borne'],
    ],
  },
  {
    level: 3,
    heading: 'BSL-3 — High risk (15 organisms)',
    rows: [
      [37, 'Tuberculosis', 'Mycobacterium tuberculosis', 'Bacterium', 'Airborne transmission'],
      [38, 'Anthrax', 'Bacillus anthracis', 'Bacterium', 'Spores survive for decades'],
      [39, 'COVID-19 (virus culture)', 'SARS-CoV-2', 'Virus', 'Diagnostics BSL-2, culture BSL-3'],
      [40, 'Plague', 'Yersinia pestis', 'Bacterium', 'Pneumonic form airborne'],
      [41, 'Nephropathia epidemica (vole fever)', 'Puumala orthohantavirus', 'Virus', 'Wild type BSL-3, cell culture strain BSL-2'],
      [42, 'Yellow fever', 'Yellow fever virus', 'Virus', 'Vaccine available'],
      [43, 'Tick-borne encephalitis', 'TBE virus', 'Virus', 'Vaccine available'],
      [44, 'Malaria (falciparum)', 'Plasmodium falciparum', 'Parasite', 'Risk of cerebral malaria'],
      [45, 'Brucellosis', 'Brucella melitensis', 'Bacterium', 'Aerosol transmission possible'],
      [46, 'Psittacosis (parrot fever)', 'Chlamydia psittaci (avian strains)', 'Bacterium', 'Other strains BSL-2'],
      [47, 'CJD prion', 'Agent of Creutzfeldt-Jakob disease', 'Prion', 'Not destroyed by sterilization'],
      [48, 'HIV', 'Human immunodeficiency virus 1', 'Virus', 'BSL-3 in Finland'],
      [49, 'Hepatitis B', 'Hepatitis B virus', 'Virus', 'BSL-3 in Finland'],
      [50, 'Hepatitis C', 'Hepacivirus C', 'Virus', 'BSL-3 in Finland'],
      [51, 'Dengue', 'Dengue virus', 'Virus', 'BSL-3 in Finland'],
    ],
  },
  {
    level: 4,
    heading: 'BSL-4 — Maximum risk (9 organisms)',
    rows: [
      [52, 'Ebola', 'Ebolavirus', 'Virus', 'Mortality up to 90%'],
      [53, 'Marburg', 'Marburg marburgvirus', 'Virus', 'First outbreak occurred in a laboratory'],
      [54, 'Lassa fever', 'Lassa mammarenavirus', 'Virus', 'Spreads from person to person'],
      [55, 'Nipah encephalitis', 'Nipah henipavirus', 'Virus', 'Mortality 40–75%'],
      [56, 'Hendra virus', 'Hendra henipavirus', 'Virus', 'Transmitted from horses'],
      [57, 'Crimean-Congo hemorrhagic fever', 'CCHFV', 'Virus', 'Tick and blood contact'],
      [58, 'Smallpox', 'Variola major', 'Virus', 'Eradicated from nature in 1980'],
      [59, 'Bolivian hemorrhagic fever', 'Machupo mammarenavirus', 'Virus', 'Nosocomial spread documented'],
      [60, 'Junín virus', 'Junín mammarenavirus', 'Virus', 'Specialized laboratories only'],
    ],
  },
]

export const sources = [
  {
    text: 'Decree 748/2020 of the Finnish Ministry of Social Affairs and Health on biological agents. Based on EU directives 2000/54/EC, 2019/1833, and 2020/739.',
    url: 'https://www.edilex.fi/lainsaadanto/aiempi/20200748',
  },
  {
    text: 'WHO Laboratory Biosafety Manual, 4th Edition (2020) and 3rd Edition (2004).',
    url: 'https://iris.who.int/server/api/core/bitstreams/6bcee6cb-9841-4c36-a86f-f0caf920fa46/content',
  },
  {
    text: "Trapotsis, A. \"Biosafety Levels 1, 2, 3 & 4: What's the Difference?\" — based on the CDC's Biosafety in Microbiological and Biomedical Laboratories (BMBL), 6th Edition.",
    url: 'https://consteril.com/biosafety-levels-difference/',
  },
  {
    text: 'Nambisan, P. "Chapter 11 — Laboratory Biosafety and Good Laboratory Practices." Based on the NIH Guidelines for Research Involving Recombinant or Synthetic Nucleic Acid Molecules and the WHO Laboratory Biosafety Manual (2004).',
    url: 'https://www.sciencedirect.com/science/chapter/monograph/pii/B9780128092316000119',
  },
  {
    text: 'Bayot, M.L. & King, K.C. "Biohazard Levels." StatPearls (2022).',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK535351/',
  },
  {
    text: 'BSL wiki',
    url: 'https://en.wikipedia.org/wiki/Biosafety_level',
  },
  {
    text: 'BSL material',
    url: 'https://tuttnauer.com/sites/default/files/2021-07/bsl-lab-tuttnauer-en-29-07-21.pdf',
  },
]
