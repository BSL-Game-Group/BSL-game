// Finnish version of the BSL reference material shown in the lecture-materials
// popup. Same structure as bslMaterial.js — see that file for sources.

export const intro = {
  heading: 'Kansainvälinen kehitys',
  paragraphs: [
    'BSL-järjestelmän juuret ovat 1970-luvun rekombinantti-DNA-tutkimuksessa. Asilomarin konferenssin jälkeen Yhdysvaltain NIH julkaisi vuonna 1976 ohjeet rekombinantti-nukleiinihappotutkimukselle. WHO seurasi perässä vuonna 1983 julkaisemalla ensimmäisen Laboratory Biosafety Manual -käsikirjan, jota on sittemmin päivitetty useita kertoja — kolmas painos 2004 sisälsi ensimmäistä kertaa biosecurity-käsitteen, ja neljäs painos (2020) siirtyi voimakkaammin riskiperusteiseen arviointiin.',
    'Keskeinen periaate kaikissa järjestelmissä on sama: jokainen biologinen tekijä luokitellaan ensin riskiryhmään (Risk Group 1–4) sen patogeenisuuden, tartuntareitin, hoidon saatavuuden ja yhteisöriskin perusteella. Tämän jälkeen laboratorio, jossa organismia käsitellään, saa vastaavan biosafety-tason (BSL 1–4) joka määrittää käytännöt, suojavarustuksen ja tilavaatimukset.',
  ],
}

export const riskGroups = {
  heading: 'Neljä riskiryhmää (Nambisan, NIH Guidelines Appendix B)',
  intro: 'Riskiryhmän määrittäminen perustuu neljään tekijään:',
  factors: [
    'Organismin patogeenisuus (aiheuttaako se tautia ylipäätään)',
    'Isäntäkirjo ja tartuntatapa',
    'Tehokkaiden ehkäisykeinojen paikallinen saatavuus',
    'Tehokkaan hoidon paikallinen saatavuus',
  ],
}

export const bslLevels = [
  {
    level: 1,
    title: 'BSL-1 — Matala riski',
    description:
      'BSL-1-organismit eivät aiheuta tauteja terveille aikuisille. Niitä käytetään perustutkimuksessa ja opetuksessa. Laboratorio ei tarvitse erityistä eristystä, ja työ tehdään avoimella pöydällä.',
    equipment: ['Laboratoriotakki', 'Käsineet tarvittaessa', 'Suojalasit roiskeilta'],
    examples: 'Leivinhiiva, maaperäbakteerit, laboratorio-E. coli -kannat.',
  },
  {
    level: 2,
    title: 'BSL-2 — Kohtalainen riski',
    description:
      'BSL-2-organismit voivat aiheuttaa tauteja, mutta tehokas hoito tai rokote on yleensä saatavilla. Tartunta vaatii suoran kontaktin (veri, eritteet, ruoka) — ei leviä ilmateitse. Pääsy laboratorioon on rajoitettu työn aikana.',
    equipment: [
      'Laboratoriotakki',
      'Käsineet aina',
      'Suojalasit tai kasvonsuoja',
      'Biosafety-kaappi aerosolien käsittelyyn',
    ],
    examples: 'Salmonella, stafylokokki, vesirokko, hepatiitti A, klamydia.',
  },
  {
    level: 3,
    title: 'BSL-3 — Korkea riski',
    description:
      'BSL-3-organismit voivat aiheuttaa vakavan tai hengenvaarallisen taudin, ja osa leviää ilmateitse aerosoleina. Pääsy on tiukasti valvottu, ja laboratoriossa on suunnattu ilmavirtaus joka estää patogeenien pääsyn ulos.',
    equipment: [
      'Kertakäyttöhaalari tai suljettava kokovartalotakki',
      'Kaksinkertaiset käsineet',
      'Hengityssuojain (N95 tai parempi)',
      'Suihku ulosmenoon',
    ],
    examples: 'Tuberkuloosi, pernarutto, COVID-19 (virusviljely), HIV, hepatiitti B ja C, dengue.',
  },
  {
    level: 4,
    title: 'BSL-4 — Maksimaalinen riski',
    description:
      'BSL-4-organismit aiheuttavat usein kuolemaan johtavan taudin, eikä tehokasta hoitoa tai rokotetta ole saatavilla. Vaaditaan täysi eristys ympäristöstä ja erikoisrakennettu laboratorio.',
    equipment: [
      'Täysin suljettu positiivipaineinen suojapuku omalla ilmansyötöllä',
      'Käsineet integroituna puvun sisään',
      'Suihku ja dekontaminaatio ulosmenossa',
      'Kaikki materiaali autoklavoidaan',
    ],
    examples: 'Ebola, Marburg, Lassa-kuume, isorokko (hävitetty), Krimin-Kongon verenvuotokuume.',
  },
]

export const organismTables = [
  {
    level: 1,
    heading: 'BSL-1 — Matala riski (15 organismia)',
    rows: [
      [1, 'Leivinhiiva', 'Saccharomyces cerevisiae', 'Sieni', 'Eukaryoottisen solubiologian mallieliö'],
      [2, 'Maaperäbakteeri', 'Bacillus subtilis', 'Bakteeri', 'Sporulointitutkimuksen malli'],
      [3, 'Laboratorio-E. coli', 'E. coli (ei-patogeeniset kannat)', 'Bakteeri', 'Biologisesti heikennetty (EK1-järjestelmä)'],
      [4, 'Nurmikohiiva', 'Kluyveromyces lactis', 'Sieni', 'GRAS-organismi'],
      [5, 'Adeno-assosioitunut virus', 'AAV', 'Virus', 'Ei replikoidu ilman avustajavirusta'],
      [6, 'Maitohappobakteeri', 'Lactobacillus acidophilus', 'Bakteeri', 'Osa suoliston normaaliflooraa'],
      [7, 'Caulobacter', 'Caulobacter crescentus', 'Bakteeri', 'Solunjakautumisen tutkimusmalli'],
      [8, 'Halobakteeri', 'Halobacterium salinarum', 'Arkkibakteeri', 'Ekstremofiili, ei elä ihmiskehossa'],
      [9, 'Sinileväbakteeri', 'Synechocystis spp.', 'Bakteeri', 'Fotosynteesin tutkimusmalli'],
      [10, 'Phi29-bakteriofagi', 'Bacillus phage phi29', 'Virus', 'Infektoi vain bakteereja'],
      [11, 'Pseudomonas fluorescens', 'Pseudomonas fluorescens', 'Bakteeri', 'Ei-patogeeninen maaperälaji'],
      [12, 'Agrobacterium', 'Agrobacterium tumefaciens', 'Bakteeri', 'Infektoi vain kasveja'],
      [13, 'Tetrahymena', 'Tetrahymena thermophila', 'Alkueliö', 'Nobel-palkittu tutkimusmalli'],
      [14, 'Lambda-bakteriofagi', 'Enterobacteria phage lambda', 'Virus', 'Geenisääntelyn klassinen malli'],
      [15, 'Neurospora-homesieni', 'Neurospora crassa', 'Sieni', 'Genetiikan tutkimusmalli 1940-luvulta'],
    ],
  },
  {
    level: 2,
    heading: 'BSL-2 — Kohtalainen riski (21 organismia)',
    note: 'HIV, hepatiitti B, hepatiitti C ja dengue eivät ole tässä BSL-2-listassa — ne on siirretty BSL-3:een Suomen lainsäädännön mukaisesti (ks. Osa 3).',
    rows: [
      [16, 'Influenssa A', 'Kausi-influenssavirukset', 'Virus', 'Rokote saatavilla'],
      [17, 'Tuhkarokko', 'Morbillivirus', 'Virus', 'MPR-rokote suojaa'],
      [18, 'Salmonella', 'Salmonella Typhimurium', 'Bakteeri', 'Ruokavälitteinen'],
      [19, 'Stafylokokki', 'Staphylococcus aureus', 'Bakteeri', 'MRSA-kannat resistenttejä'],
      [20, 'Lymen borrelioosi', 'Borrelia burgdorferi', 'Bakteeri', 'Puutiaisvälitteinen'],
      [21, 'Kolera', 'Vibrio cholerae', 'Bakteeri', 'Vesivälitteinen, rokote saatavilla'],
      [22, 'Vesirokko', 'VZV', 'Virus', 'Rokote suojaa'],
      [23, 'Norovirus', 'Norwalk-virus', 'Virus', 'Uloste-suureittiä'],
      [24, 'Kuppa', 'Treponema pallidum', 'Bakteeri', 'Penisilliini tehoaa'],
      [25, 'Hinkuyskä', 'Bordetella pertussis', 'Bakteeri', 'Rokote suojaa'],
      [26, 'Klamydia', 'Chlamydia trachomatis', 'Bakteeri', 'Yleisin sukupuolitautibakteeri'],
      [27, 'Meningokokki', 'Neisseria meningitidis', 'Bakteeri', 'Rokote suojaa'],
      [28, 'Toksoplasmoosi', 'Toxoplasma gondii', 'Alkueliö/loinen', 'Vaarallinen raskaana oleville'],
      [29, 'Kryptosporidioosi', 'Cryptosporidium parvum', 'Loinen', 'Kestää klooria'],
      [30, 'Candida', 'Candida albicans', 'Sieni', 'Yleisin sieni-infektio'],
      [31, 'Aspergillus', 'Aspergillus fumigatus', 'Sieni', 'Allergeeninen'],
      [32, 'Listeria', 'Listeria monocytogenes', 'Bakteeri', 'Kasvaa jääkaappilämpötilassa'],
      [33, 'Papilloomavirus', 'HPV', 'Virus', 'Rokote suojaa syöpäkannilta'],
      [34, 'Hepatiitti A', 'Hepatovirus A', 'Virus', 'Uloste-suutartunta'],
      [35, 'Jäykkäkouristus', 'Clostridium tetani', 'Bakteeri', 'Rokote erittäin tehokas'],
      [36, 'Malaria (muut lajit)', 'Plasmodium spp.', 'Loinen', 'Hyttysvälitteinen'],
    ],
  },
  {
    level: 3,
    heading: 'BSL-3 — Korkea riski (15 organismia)',
    rows: [
      [37, 'Tuberkuloosi', 'Mycobacterium tuberculosis', 'Bakteeri', 'Leviää ilmateitse'],
      [38, 'Pernarutto', 'Bacillus anthracis', 'Bakteeri', 'Itiöt säilyvät vuosikymmeniä'],
      [39, 'COVID-19 (virusviljely)', 'SARS-CoV-2', 'Virus', 'Diagnostiikka BSL-2, viljely BSL-3'],
      [40, 'Rutto', 'Yersinia pestis', 'Bakteeri', 'Keuhkomuoto ilmateitse'],
      [41, 'Myyräkuume', 'Puumala-ortohantavirus', 'Virus', 'Villityyppi BSL-3, soluviljelmäkanta BSL-2'],
      [42, 'Keltakuume', 'Keltakuumevirus', 'Virus', 'Rokote saatavilla'],
      [43, 'Puutiaisaivotulehdus', 'TBE-virus', 'Virus', 'Rokote saatavilla'],
      [44, 'Malaria (falciparum)', 'Plasmodium falciparum', 'Loinen', 'Aivomalarian riski'],
      [45, 'Brucelloosi', 'Brucella melitensis', 'Bakteeri', 'Aerosolileviäminen mahdollista'],
      [46, 'Papukaijakuume', 'Chlamydia psittaci (lintukannat)', 'Bakteeri', 'Muut kannat BSL-2'],
      [47, 'CJD-prioni', 'Creutzfeldt-Jacobin taudin aiheuttaja', 'Prioni', 'Ei tuhoudu steriloinnissa'],
      [48, 'HIV', 'Ihmisen immuunikatovirus 1', 'Virus', 'Suomessa BSL-3'],
      [49, 'Hepatiitti B', 'Hepatiitti B -virus', 'Virus', 'Suomessa BSL-3'],
      [50, 'Hepatiitti C', 'Hepacivirus C', 'Virus', 'Suomessa BSL-3'],
      [51, 'Dengue', 'Denguevirus', 'Virus', 'Suomessa BSL-3'],
    ],
  },
  {
    level: 4,
    heading: 'BSL-4 — Maksimaalinen riski (9 organismia)',
    rows: [
      [52, 'Ebola', 'Ebolavirus', 'Virus', 'Kuolleisuus jopa 90 %'],
      [53, 'Marburg', 'Marburg-marburgvirus', 'Virus', 'Ensimmäinen epidemia laboratoriossa'],
      [54, 'Lassa-kuume', 'Lassa-mammarenavirus', 'Virus', 'Leviää ihmiseltä ihmiselle'],
      [55, 'Nipah-aivotulehdus', 'Nipah-henipavirus', 'Virus', 'Kuolleisuus 40–75 %'],
      [56, 'Hendra-virus', 'Hendra-henipavirus', 'Virus', 'Tarttunut hevosista'],
      [57, 'Krimin-Kongon verenvuotokuume', 'CCHFV', 'Virus', 'Puutiais- ja verikontakti'],
      [58, 'Isorokko', 'Variola major', 'Virus', 'Hävitetty luonnosta 1980'],
      [59, 'Bolivian verenvuotokuume', 'Machupo-mammarenavirus', 'Virus', 'Sairaalaleviäminen dokumentoitu'],
      [60, 'Junín-virus', 'Junín-mammarenavirus', 'Virus', 'Vain erikoislaboratoriot'],
    ],
  },
]

export const sources = [
  {
    text: 'Sosiaali- ja terveysministeriön asetus 748/2020 biologisista tekijöistä. Perustuu EU-direktiiveihin 2000/54/EY, 2019/1833 ja 2020/739.',
    url: 'https://www.edilex.fi/lainsaadanto/aiempi/20200748',
  },
  {
    text: 'WHO Laboratory Biosafety Manual, 4th Edition (2020) ja 3rd Edition (2004).',
    url: 'https://iris.who.int/server/api/core/bitstreams/6bcee6cb-9841-4c36-a86f-f0caf920fa46/content',
  },
  {
    text: 'Trapotsis, A. "Biosafety Levels 1, 2, 3 & 4: What\'s the Difference?" — perustuu CDC:n Biosafety in Microbiological and Biomedical Laboratories (BMBL), 6th Edition.',
    url: 'https://consteril.com/biosafety-levels-difference/',
  },
  {
    text: 'Nambisan, P. "Chapter 11 — Laboratory Biosafety and Good Laboratory Practices." Perustuu NIH Guidelines for Research Involving Recombinant or Synthetic Nucleic Acid Molecules ja WHO Laboratory Biosafety Manual (2004).',
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
    text: 'BSL materiaali',
    url: 'https://tuttnauer.com/sites/default/files/2021-07/bsl-lab-tuttnauer-en-29-07-21.pdf',
  },
]
