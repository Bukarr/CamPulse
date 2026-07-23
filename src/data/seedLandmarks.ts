export interface LandmarkSeed {
  id: string;
  name: string;
  category: string;
  faculty?: string;
  lat: number;
  lng: number;
}

export const LANDMARKS_SEED: LandmarkSeed[] = [
  {
    "id": "senate-building",
    "name": "Senate Building",
    "category": "administration",
    "lat": 11.15346,
    "lng": 7.6492
  },
  {
    "id": "kashim-ibrahim-library",
    "name": "Kashim Ibrahim Library",
    "category": "library",
    "lat": 11.15286,
    "lng": 7.6477
  },
  {
    "id": "fac-arts",
    "name": "Faculty of Arts",
    "category": "faculty",
    "lat": 11.15336,
    "lng": 7.6476
  },
  {
    "id": "dept-african-languages-cultures",
    "name": "Department of African Languages and Cultures",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15346,
    "lng": 7.6479
  },
  {
    "id": "dept-arabic",
    "name": "Department of Arabic",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15326,
    "lng": 7.6477
  },
  {
    "id": "dept-archaeology-heritage",
    "name": "Department of Archaeology and Heritage Studies",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15356,
    "lng": 7.648
  },
  {
    "id": "dept-english-literary",
    "name": "Department of English and Literary Studies",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15316,
    "lng": 7.6476
  },
  {
    "id": "dept-french",
    "name": "Department of French",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15326,
    "lng": 7.6479
  },
  {
    "id": "dept-history",
    "name": "Department of History",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15346,
    "lng": 7.6477
  },
  {
    "id": "dept-philosophy",
    "name": "Department of Philosophy",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15336,
    "lng": 7.648
  },
  {
    "id": "dept-theater-performing-arts",
    "name": "Department of Theater and Performing Arts",
    "category": "department",
    "faculty": "Arts",
    "lat": 11.15356,
    "lng": 7.6476
  },
  {
    "id": "fac-physical-sciences",
    "name": "Faculty of Physical Sciences",
    "category": "faculty",
    "lat": 11.15436,
    "lng": 7.6471
  },
  {
    "id": "dept-chemistry",
    "name": "Department of Chemistry",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15426,
    "lng": 7.6469
  },
  {
    "id": "dept-computer-science",
    "name": "Department of Computer Science",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15446,
    "lng": 7.6473
  },
  {
    "id": "dept-geography",
    "name": "Department of Geography",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15406,
    "lng": 7.6467
  },
  {
    "id": "dept-geology",
    "name": "Department of Geology",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15466,
    "lng": 7.6475
  },
  {
    "id": "dept-mathematics",
    "name": "Department of Mathematics",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15436,
    "lng": 7.6472
  },
  {
    "id": "dept-physics",
    "name": "Department of Physics",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15416,
    "lng": 7.647
  },
  {
    "id": "dept-statistics",
    "name": "Department of Statistics",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15456,
    "lng": 7.6474
  },
  {
    "id": "fac-life-sciences",
    "name": "Faculty of Life Sciences",
    "category": "faculty",
    "lat": 11.15466,
    "lng": 7.6481
  },
  {
    "id": "dept-biology",
    "name": "Department of Biology",
    "category": "department",
    "faculty": "Life Sciences",
    "lat": 11.15486,
    "lng": 7.6483
  },
  {
    "id": "dept-biochemistry",
    "name": "Department of Biochemistry",
    "category": "department",
    "faculty": "Life Sciences",
    "lat": 11.15446,
    "lng": 7.6479
  },
  {
    "id": "dept-botany",
    "name": "Department of Botany",
    "category": "department",
    "faculty": "Life Sciences",
    "lat": 11.15496,
    "lng": 7.6484
  },
  {
    "id": "dept-microbiology-life",
    "name": "Department of Microbiology",
    "category": "department",
    "faculty": "Life Sciences",
    "lat": 11.15456,
    "lng": 7.648
  },
  {
    "id": "dept-zoology",
    "name": "Department of Zoology",
    "category": "department",
    "faculty": "Life Sciences",
    "lat": 11.15506,
    "lng": 7.6485
  },
  {
    "id": "fac-education",
    "name": "Faculty of Education",
    "category": "faculty",
    "lat": 11.15336,
    "lng": 7.6451
  },
  {
    "id": "dept-art-social-science-ed",
    "name": "Department of Art & Social Science Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15356,
    "lng": 7.6453
  },
  {
    "id": "dept-library-info-science",
    "name": "Department of Library & Information Science",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15316,
    "lng": 7.6449
  },
  {
    "id": "dept-vocational-technical-ed",
    "name": "Department of Vocational & Technical Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15366,
    "lng": 7.6454
  },
  {
    "id": "dept-physical-health-ed",
    "name": "Department of Physical & Health Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15306,
    "lng": 7.6448
  },
  {
    "id": "dept-science-education",
    "name": "Department of Science Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15376,
    "lng": 7.6455
  },
  {
    "id": "dept-educational-foundation-curriculum",
    "name": "Department of Educational Foundations & Curriculum",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15296,
    "lng": 7.6447
  },
  {
    "id": "dept-educational-psychology-counselling",
    "name": "Department of Educational Foundations & Curriculum",
    "category": "department",
    "faculty": "Education",
    "lat": 11.15386,
    "lng": 7.6456
  },
  {
    "id": "fac-environmental-design",
    "name": "Faculty of Environmental Design",
    "category": "faculty",
    "lat": 11.15236,
    "lng": 7.6448
  },
  {
    "id": "dept-architecture",
    "name": "Department of Architecture",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15256,
    "lng": 7.645
  },
  {
    "id": "dept-building",
    "name": "Department of Building",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15216,
    "lng": 7.6446
  },
  {
    "id": "dept-fine-arts",
    "name": "Department of Fine Arts",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15266,
    "lng": 7.6451
  },
  {
    "id": "dept-geomatics",
    "name": "Department of Geomatics",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15206,
    "lng": 7.6445
  },
  {
    "id": "dept-glass-silicate-tech",
    "name": "Department of Glass and Silicate Technology",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15276,
    "lng": 7.6452
  },
  {
    "id": "dept-industrial-design",
    "name": "Department of Industrial Design",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15196,
    "lng": 7.6444
  },
  {
    "id": "dept-urp",
    "name": "Department of Urban and Regional Planning",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15286,
    "lng": 7.6453
  },
  {
    "id": "fac-social-sciences",
    "name": "Faculty of Social Sciences",
    "category": "faculty",
    "lat": 11.15276,
    "lng": 7.6461
  },
  {
    "id": "dept-economics",
    "name": "Department of Economics",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.15296,
    "lng": 7.6463
  },
  {
    "id": "dept-mass-communication",
    "name": "Department of Mass Communication",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.15256,
    "lng": 7.6459
  },
  {
    "id": "dept-political-science-intl-studies",
    "name": "Department of Political Science and International Studies",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.15306,
    "lng": 7.6464
  },
  {
    "id": "dept-sociology",
    "name": "Department of Sociology",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.15246,
    "lng": 7.6458
  },
  {
    "id": "fac-engineering",
    "name": "Faculty of Engineering",
    "category": "faculty",
    "lat": 11.15196,
    "lng": 7.644
  },
  {
    "id": "dept-agric-bioresources-eng",
    "name": "Department of Agricultural and Bio-Resources Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15216,
    "lng": 7.6442
  },
  {
    "id": "dept-chemical-petroleum-eng",
    "name": "Department of Chemical & Petroleum Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15176,
    "lng": 7.6438
  },
  {
    "id": "dept-civil-eng",
    "name": "Department of Civil Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15206,
    "lng": 7.6441
  },
  {
    "id": "dept-electronics-telecoms-eng",
    "name": "Department of Electronics & Telecommunications Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15186,
    "lng": 7.6437
  },
  {
    "id": "dept-computer-eng",
    "name": "Department of Computer Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15226,
    "lng": 7.6443
  },
  {
    "id": "dept-electrical-eng",
    "name": "Department of Electrical Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15166,
    "lng": 7.6436
  },
  {
    "id": "dept-mechanical-eng",
    "name": "Department of Mechanical Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15236,
    "lng": 7.6444
  },
  {
    "id": "dept-metallurgical-materials-eng",
    "name": "Department of Metallurgical & Materials Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15156,
    "lng": 7.6435
  },
  {
    "id": "dept-polymer-textile-eng",
    "name": "Department of Polymer & Textile Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15246,
    "lng": 7.6445
  },
  {
    "id": "dept-water-resources-env-eng",
    "name": "Department of Water Resources & Environmental Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15146,
    "lng": 7.6434
  },
  {
    "id": "dept-mechatronics-automotive-eng",
    "name": "Department of Mechatronics & Automotive Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15256,
    "lng": 7.6446
  },
  {
    "id": "fac-agriculture",
    "name": "Faculty of Agriculture",
    "category": "faculty",
    "lat": 11.14866,
    "lng": 7.6426
  },
  {
    "id": "dept-agric-economics",
    "name": "Department of Agricultural Economics",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14876,
    "lng": 7.6427
  },
  {
    "id": "dept-agric-extension-rural-dev",
    "name": "Department of Agricultural Extension & Rural Development",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14856,
    "lng": 7.6425
  },
  {
    "id": "dept-agronomy",
    "name": "Department of Agronomy",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14886,
    "lng": 7.6428
  },
  {
    "id": "dept-animal-science",
    "name": "Department of Animal Science",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14846,
    "lng": 7.6424
  },
  {
    "id": "dept-crop-protection",
    "name": "Department of Crop Protection",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14896,
    "lng": 7.6429
  },
  {
    "id": "dept-plant-science",
    "name": "Department of Plant Science",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14866,
    "lng": 7.6423
  },
  {
    "id": "dept-soil-science",
    "name": "Department of Soil Science",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.14906,
    "lng": 7.643
  },
  {
    "id": "fac-vet-medicine",
    "name": "Faculty of Veterinary Medicine",
    "category": "faculty",
    "lat": 11.14566,
    "lng": 7.6421
  },
  {
    "id": "dept-vet-anatomy",
    "name": "Department of Veterinary Anatomy",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14576,
    "lng": 7.6422
  },
  {
    "id": "dept-vet-medicine",
    "name": "Department of Veterinary Medicine",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14556,
    "lng": 7.642
  },
  {
    "id": "dept-vet-microbiology",
    "name": "Department of Veterinary Microbiology",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14586,
    "lng": 7.6423
  },
  {
    "id": "dept-parasitology-entomology",
    "name": "Department of Parasitology and Entomology",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14546,
    "lng": 7.6419
  },
  {
    "id": "dept-vet-pathology",
    "name": "Department of Veterinary Pathology",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14596,
    "lng": 7.6424
  },
  {
    "id": "dept-pharmacology-toxicology-vet",
    "name": "Department of Pharmacology and Toxicology",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14536,
    "lng": 7.6418
  },
  {
    "id": "dept-vet-physiology",
    "name": "Department of Veterinary Physiology",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14606,
    "lng": 7.6425
  },
  {
    "id": "dept-public-health-preventive-medicine",
    "name": "Department of Public Health and Preventive Medicine",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14526,
    "lng": 7.6417
  },
  {
    "id": "dept-surgery-radiology",
    "name": "Department of Surgery and Radiology",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14616,
    "lng": 7.6426
  },
  {
    "id": "dept-theriogenology",
    "name": "Department of Theriogenology and Production",
    "category": "department",
    "faculty": "Veterinary Medicine",
    "lat": 11.14516,
    "lng": 7.6416
  },
  {
    "id": "fac-pharmaceutical-sciences",
    "name": "Faculty of Pharmaceutical Sciences",
    "category": "faculty",
    "lat": 11.14696,
    "lng": 7.6431
  },
  {
    "id": "dept-clinical-pharmacy-practice",
    "name": "Department of Clinical Pharmacy & Pharmacy Practice",
    "category": "department",
    "faculty": "Pharmaceutical Sciences",
    "lat": 11.14706,
    "lng": 7.6432
  },
  {
    "id": "dept-pharmacognosy-drug-dev",
    "name": "Department of Pharmacognosy and Drug Development",
    "category": "department",
    "faculty": "Pharmaceutical Sciences",
    "lat": 11.14686,
    "lng": 7.643
  },
  {
    "id": "dept-pharm-medicinal-chemistry",
    "name": "Department of Pharmaceutical and Medicinal Chemistry",
    "category": "department",
    "faculty": "Pharmaceutical Sciences",
    "lat": 11.14716,
    "lng": 7.6433
  },
  {
    "id": "dept-pharmaceutics-pharm-microbiology",
    "name": "Department of Pharmaceutics and Pharmaceutical Microbiology",
    "category": "department",
    "faculty": "Pharmaceutical Sciences",
    "lat": 11.14676,
    "lng": 7.6429
  },
  {
    "id": "dept-pharmacology-clinical-pharmacy",
    "name": "Department of Pharmacology and Clinical Pharmacy",
    "category": "department",
    "faculty": "Pharmaceutical Sciences",
    "lat": 11.14726,
    "lng": 7.6434
  },
  {
    "id": "fac-basic-clinical-sciences",
    "name": "Faculty of Basic Clinical Sciences, College of Medical Sciences",
    "category": "faculty",
    "lat": 11.15766,
    "lng": 7.6411
  },
  {
    "id": "dept-pathology",
    "name": "Department of Pathology, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15776,
    "lng": 7.6412
  },
  {
    "id": "dept-chemical-pathology",
    "name": "Department of Chemical Pathology, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15756,
    "lng": 7.641
  },
  {
    "id": "dept-medical-microbiology",
    "name": "Department of Medical Microbiology, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15786,
    "lng": 7.6413
  },
  {
    "id": "dept-pharmacology-therapeutics",
    "name": "Department of Pharmacology & Therapeutics, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15746,
    "lng": 7.6409
  },
  {
    "id": "medical-sciences-lecture-theatre",
    "name": "College of Medical Sciences Lecture Theatre",
    "category": "amenity",
    "lat": 11.15806,
    "lng": 7.6415
  },
  {
    "id": "hall-alexander",
    "name": "Alexander Hall (female)",
    "category": "hostel",
    "lat": 11.15616,
    "lng": 7.6511
  },
  {
    "id": "hall-danfodio",
    "name": "Danfodio Hall (male)",
    "category": "hostel",
    "lat": 11.15666,
    "lng": 7.6517
  },
  {
    "id": "hall-icsa",
    "name": "ICSA Hall (male)",
    "category": "hostel",
    "lat": 11.15566,
    "lng": 7.6506
  },
  {
    "id": "hall-dangote",
    "name": "Dangote Hall (male, Phase 2)",
    "category": "hostel",
    "lat": 11.15966,
    "lng": 7.6541
  },
  {
    "id": "hall-shehu-idris",
    "name": "Shehu Idris Hall (male, Phase 2)",
    "category": "hostel",
    "lat": 11.15916,
    "lng": 7.6536
  },
  {
    "id": "hall-amina",
    "name": "Amina Hall (female)",
    "category": "hostel",
    "lat": 11.15466,
    "lng": 7.6511
  },
  {
    "id": "hall-ribadu",
    "name": "Ribadu Hall (female)",
    "category": "hostel",
    "lat": 11.15516,
    "lng": 7.6506
  },
  {
    "id": "hall-suleiman",
    "name": "Suleiman Hall (male)",
    "category": "hostel",
    "lat": 11.15736,
    "lng": 7.653
  },
  {
    "id": "hall-ramat",
    "name": "Ramat Hostel (female)",
    "category": "hostel",
    "lat": 11.15576,
    "lng": 7.6501
  },
  {
    "id": "community-market",
    "name": "ABU Community Market",
    "category": "amenity",
    "lat": 11.15536,
    "lng": 7.6478
  },
  {
    "id": "samaru-main-gate",
    "name": "Samaru Main Gate",
    "category": "gate",
    "lat": 11.15026,
    "lng": 7.6541
  },
  {
    "id": "phase-2-gate",
    "name": "Phase 2 Entrance",
    "category": "gate",
    "lat": 11.15896,
    "lng": 7.6526
  },
  {
    "id": "sculpture-garden",
    "name": "Sculpture Garden",
    "category": "amenity",
    "lat": 11.15396,
    "lng": 7.6481
  },
  {
    "id": "university-health-services",
    "name": "University Health Services (Medical Centre / Sickbay)",
    "category": "health",
    "lat": 11.15416,
    "lng": 7.6468
  },
  {
    "id": "central-mosque",
    "name": "Central Mosque",
    "category": "worship",
    "lat": 11.15366,
    "lng": 7.6492
  },
  {
    "id": "chapel-catholic-church",
    "name": "Chapel & Catholic Church",
    "category": "worship",
    "lat": 11.15406,
    "lng": 7.6504
  },
  {
    "id": "iaiict",
    "name": "Iya Abubakar Institute of ICT (IAIICT)",
    "category": "ict",
    "lat": 11.15306,
    "lng": 7.6484
  },
  {
    "id": "counselling-human-dev-centre",
    "name": "Counselling & Human Development Centre",
    "category": "student-services",
    "lat": 11.15366,
    "lng": 7.6479
  },
  {
    "id": "energy-bulk-metering-unit",
    "name": "Electricity Bulk Metering Unit",
    "category": "infrastructure",
    "lat": 11.15386,
    "lng": 7.6474
  },
  {
    "id": "engineering-phase-3-complex",
    "name": "Engineering Phase III Complex (Computer Engineering & Mechatronics)",
    "category": "faculty",
    "lat": 11.15266,
    "lng": 7.6436
  },
  {
    "id": "fac-law",
    "name": "Faculty of Law",
    "category": "faculty",
    "lat": 11.14266,
    "lng": 7.7211
  },
  {
    "id": "hall-sasa",
    "name": "Sasa Hostel (female)",
    "category": "hostel",
    "lat": 11.15696,
    "lng": 7.6508
  },
  {
    "id": "assembly-hall",
    "name": "ABU Assembly Hall",
    "category": "amenity",
    "lat": 11.15236,
    "lng": 7.6481
  },
  {
    "id": "sports-complex",
    "name": "ABU Sports Complex & Stadium",
    "category": "amenity",
    "lat": 11.15666,
    "lng": 7.6456
  },
  {
    "id": "fac-admin",
    "name": "Faculty of Administration",
    "category": "faculty",
    "lat": 11.14196,
    "lng": 7.7194
  },
  {
    "id": "dept-public-admin",
    "name": "Department of Public Administration",
    "category": "department",
    "faculty": "Administration",
    "lat": 11.14216,
    "lng": 7.7196
  },
  {
    "id": "dept-business-admin",
    "name": "Department of Business Administration",
    "category": "department",
    "faculty": "Administration",
    "lat": 11.14176,
    "lng": 7.7192
  },
  {
    "id": "dept-accounting",
    "name": "Department of Accounting",
    "category": "department",
    "faculty": "Administration",
    "lat": 11.14236,
    "lng": 7.7198
  },
  {
    "id": "school-postgraduate-studies",
    "name": "School of Postgraduate Studies (SPS)",
    "category": "administration",
    "lat": 11.15366,
    "lng": 7.6471
  },
  {
    "id": "distance-learning-centre",
    "name": "Distance Learning Centre (DLC)",
    "category": "ict",
    "lat": 11.15316,
    "lng": 7.6526
  },
  {
    "id": "mcgowan-theatre",
    "name": "MacGowan Theatre",
    "category": "amenity",
    "lat": 11.15326,
    "lng": 7.6474
  },
  {
    "id": "convocation-square",
    "name": "Convocation Square",
    "category": "amenity",
    "lat": 11.15256,
    "lng": 7.6485
  },
  {
    "id": "intl-conference-centre",
    "name": "International Conference Centre",
    "category": "administration",
    "lat": 11.15316,
    "lng": 7.6495
  },
  {
    "id": "works-maintenance-yard",
    "name": "Works & Services Department (Maintenance Yard)",
    "category": "infrastructure",
    "lat": 11.15466,
    "lng": 7.6436
  },
  {
    "id": "fire-service-station",
    "name": "ABU Fire Service Station",
    "category": "infrastructure",
    "lat": 11.15436,
    "lng": 7.6468
  },
  {
    "id": "security-hq",
    "name": "ABU Security Office Headquarters",
    "category": "infrastructure",
    "lat": 11.15066,
    "lng": 7.6511
  },
  {
    "id": "water-treatment-plant",
    "name": "ABU Water Treatment Plant & Dam",
    "category": "infrastructure",
    "lat": 11.15716,
    "lng": 7.6326
  },
  {
    "id": "institute-agric-research",
    "name": "Institute for Agricultural Research (IAR)",
    "category": "infrastructure",
    "lat": 11.14816,
    "lng": 7.6246
  },
  {
    "id": "sanyaolu-lecture-theatre",
    "name": "Sanyaolu Lecture Theatre",
    "category": "amenity",
    "lat": 11.15436,
    "lng": 7.6478
  },
  {
    "id": "etf-lecture-theatre",
    "name": "ETF Lecture Theatre",
    "category": "amenity",
    "lat": 11.15226,
    "lng": 7.6468
  },
  {
    "id": "sslt-lecture-theatre",
    "name": "Social Science Lecture Theatre (SSLT)",
    "category": "amenity",
    "lat": 11.15256,
    "lng": 7.6458
  },
  {
    "id": "hayatu-lecture-theatre",
    "name": "Hayatu Lecture Theatre",
    "category": "amenity",
    "lat": 11.15356,
    "lng": 7.6477
  },
  {
    "id": "a1-a2-lecture-halls",
    "name": "A1/A2 Lecture Halls",
    "category": "amenity",
    "lat": 11.15346,
    "lng": 7.6474
  },
  {
    "id": "b1-b2-lecture-halls",
    "name": "B1/B2 Lecture Halls",
    "category": "amenity",
    "lat": 11.15336,
    "lng": 7.6475
  },
  {
    "id": "abu-bookshop-press",
    "name": "ABU Press & Bookshop",
    "category": "amenity",
    "lat": 11.15326,
    "lng": 7.6487
  },
  {
    "id": "abu-microfinance-bank",
    "name": "ABU Microfinance Bank",
    "category": "amenity",
    "lat": 11.15496,
    "lng": 7.6471
  },
  {
    "id": "north-aviation-gate",
    "name": "North Gate (Aviation)",
    "category": "gate",
    "lat": 11.16066,
    "lng": 7.6411
  },
  {
    "id": "iya-abubakar-lecture-hall",
    "name": "Iya Abubakar Lecture Hall",
    "category": "amenity",
    "lat": 11.15316,
    "lng": 7.6485
  },
  {
    "id": "naerls-centre",
    "name": "NAERLS Headquarters Center",
    "category": "infrastructure",
    "lat": 11.14766,
    "lng": 7.6256
  },
  {
    "id": "dac-centre",
    "name": "Division of Agricultural Colleges (DAC)",
    "category": "infrastructure",
    "lat": 11.14796,
    "lng": 7.6251
  }
];
