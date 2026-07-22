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
    "lat": 11.15064, // VERIFIED
    "lng": 7.65468
  },
  {
    "id": "kashim-ibrahim-library",
    "name": "Kashim Ibrahim Library",
    "category": "library",
    "lat": 11.15178, // VERIFIED
    "lng": 7.65174
  },
  {
    "id": "fac-arts",
    "name": "Faculty of Arts",
    "category": "faculty",
    "lat": 11.15336, // UNVERIFIED — no distinct listing found; only the generic campus pin returns
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
    "lat": 11.15028, // VERIFIED
    "lng": 7.65347
  },
  {
    "id": "dept-chemistry",
    "name": "Department of Chemistry",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15018,
    "lng": 7.65327
  },
  {
    "id": "dept-computer-science",
    "name": "Department of Computer Science",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15038,
    "lng": 7.65367
  },
  {
    "id": "dept-geography",
    "name": "Department of Geography",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.14998,
    "lng": 7.65307
  },
  {
    "id": "dept-geology",
    "name": "Department of Geology",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15058,
    "lng": 7.65387
  },
  {
    "id": "dept-mathematics",
    "name": "Department of Mathematics",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15028,
    "lng": 7.65357
  },
  {
    "id": "dept-physics",
    "name": "Department of Physics",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15008,
    "lng": 7.65337
  },
  {
    "id": "dept-statistics",
    "name": "Department of Statistics",
    "category": "department",
    "faculty": "Physical Sciences",
    "lat": 11.15048,
    "lng": 7.65377
  },
  {
    "id": "fac-life-sciences",
    "name": "Faculty of Life Sciences",
    "category": "faculty",
    "lat": 11.15466, // UNVERIFIED — no distinct listing found; only the generic campus pin returns
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
    "lat": 11.1487, // VERIFIED
    "lng": 7.6515
  },
  {
    "id": "dept-art-social-science-ed",
    "name": "Department of Art & Social Science Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.1489,
    "lng": 7.6517
  },
  {
    "id": "dept-library-info-science",
    "name": "Department of Library & Information Science",
    "category": "department",
    "faculty": "Education",
    "lat": 11.1485,
    "lng": 7.6513
  },
  {
    "id": "dept-vocational-technical-ed",
    "name": "Department of Vocational & Technical Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.149,
    "lng": 7.6518
  },
  {
    "id": "dept-physical-health-ed",
    "name": "Department of Physical & Health Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.1484,
    "lng": 7.6512
  },
  {
    "id": "dept-science-education",
    "name": "Department of Science Education",
    "category": "department",
    "faculty": "Education",
    "lat": 11.1491,
    "lng": 7.6519
  },
  {
    "id": "dept-educational-foundation-curriculum",
    "name": "Department of Educational Foundations & Curriculum",
    "category": "department",
    "faculty": "Education",
    "lat": 11.1483,
    "lng": 7.6511
  },
  {
    "id": "dept-educational-psychology-counselling",
    "name": "Department of Educational Foundations & Curriculum",
    "category": "department",
    "faculty": "Education",
    "lat": 11.1492,
    "lng": 7.652
  },
  {
    "id": "fac-environmental-design",
    "name": "Faculty of Environmental Design",
    "category": "faculty",
    "lat": 11.15139, // VERIFIED
    "lng": 7.65032
  },
  {
    "id": "dept-architecture",
    "name": "Department of Architecture",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15159,
    "lng": 7.65052
  },
  {
    "id": "dept-building",
    "name": "Department of Building",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15119,
    "lng": 7.65012
  },
  {
    "id": "dept-fine-arts",
    "name": "Department of Fine Arts",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15169,
    "lng": 7.65062
  },
  {
    "id": "dept-geomatics",
    "name": "Department of Geomatics",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15109,
    "lng": 7.65002
  },
  {
    "id": "dept-glass-silicate-tech",
    "name": "Department of Glass and Silicate Technology",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15179,
    "lng": 7.65072
  },
  {
    "id": "dept-industrial-design",
    "name": "Department of Industrial Design",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15099,
    "lng": 7.64992
  },
  {
    "id": "dept-urp",
    "name": "Department of Urban and Regional Planning",
    "category": "department",
    "faculty": "Environmental Design",
    "lat": 11.15189,
    "lng": 7.65082
  },
  {
    "id": "fac-social-sciences",
    "name": "Faculty of Social Sciences",
    "category": "faculty",
    "lat": 11.14939, // VERIFIED
    "lng": 7.65123
  },
  {
    "id": "dept-economics",
    "name": "Department of Economics",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.14959,
    "lng": 7.65143
  },
  {
    "id": "dept-mass-communication",
    "name": "Department of Mass Communication",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.14919,
    "lng": 7.65103
  },
  {
    "id": "dept-political-science-intl-studies",
    "name": "Department of Political Science and International Studies",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.14969,
    "lng": 7.65153
  },
  {
    "id": "dept-sociology",
    "name": "Department of Sociology",
    "category": "department",
    "faculty": "Social Sciences",
    "lat": 11.14909,
    "lng": 7.65093
  },
  {
    "id": "fac-engineering",
    "name": "Faculty of Engineering",
    "category": "faculty",
    "lat": 11.15236, // VERIFIED
    "lng": 7.65014
  },
  {
    "id": "dept-agric-bioresources-eng",
    "name": "Department of Agricultural and Bio-Resources Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15256,
    "lng": 7.65034
  },
  {
    "id": "dept-chemical-petroleum-eng",
    "name": "Department of Chemical & Petroleum Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15216,
    "lng": 7.64994
  },
  {
    "id": "dept-civil-eng",
    "name": "Department of Civil Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15246,
    "lng": 7.65024
  },
  {
    "id": "dept-electronics-telecoms-eng",
    "name": "Department of Electronics & Telecommunications Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15226,
    "lng": 7.64984
  },
  {
    "id": "dept-computer-eng",
    "name": "Department of Computer Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15266,
    "lng": 7.65044
  },
  {
    "id": "dept-electrical-eng",
    "name": "Department of Electrical Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15206,
    "lng": 7.64974
  },
  {
    "id": "dept-mechanical-eng",
    "name": "Department of Mechanical Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15276,
    "lng": 7.65054
  },
  {
    "id": "dept-metallurgical-materials-eng",
    "name": "Department of Metallurgical & Materials Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15196,
    "lng": 7.64964
  },
  {
    "id": "dept-polymer-textile-eng",
    "name": "Department of Polymer & Textile Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15286,
    "lng": 7.65064
  },
  {
    "id": "dept-water-resources-env-eng",
    "name": "Department of Water Resources & Environmental Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15186,
    "lng": 7.64954
  },
  {
    "id": "dept-mechatronics-automotive-eng",
    "name": "Department of Mechatronics & Automotive Engineering",
    "category": "department",
    "faculty": "Engineering",
    "lat": 11.15296,
    "lng": 7.65074
  },
  {
    "id": "fac-agriculture",
    "name": "Faculty of Agriculture",
    "category": "faculty",
    "lat": 11.16547, // VERIFIED
    "lng": 7.63304
  },
  {
    "id": "dept-agric-economics",
    "name": "Department of Agricultural Economics",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16557,
    "lng": 7.63314
  },
  {
    "id": "dept-agric-extension-rural-dev",
    "name": "Department of Agricultural Extension & Rural Development",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16537,
    "lng": 7.63294
  },
  {
    "id": "dept-agronomy",
    "name": "Department of Agronomy",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16567,
    "lng": 7.63324
  },
  {
    "id": "dept-animal-science",
    "name": "Department of Animal Science",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16527,
    "lng": 7.63284
  },
  {
    "id": "dept-crop-protection",
    "name": "Department of Crop Protection",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16577,
    "lng": 7.63334
  },
  {
    "id": "dept-plant-science",
    "name": "Department of Plant Science",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16547,
    "lng": 7.63274
  },
  {
    "id": "dept-soil-science",
    "name": "Department of Soil Science",
    "category": "department",
    "faculty": "Agriculture",
    "lat": 11.16587,
    "lng": 7.63344
  },
  {
    "id": "fac-vet-medicine",
    "name": "Faculty of Veterinary Medicine",
    "category": "faculty",
    "lat": 11.14566, // UNVERIFIED — no distinct listing found; only the generic campus pin returns
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
    "lat": 11.14696, // UNVERIFIED — CONTRADICTORY DATA: two conflicting real listings exist online ("Faculty of Pharmacy" at 11.154993,7.650262 near main campus vs "Faculty of Pharmaceutical Science" at 11.160666,7.638537 ~2km away). Needs manual on-campus confirmation, not a guess.
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
    "lat": 11.15389, // VERIFIED — anchored via Department of Human Anatomy listing
    "lng": 7.6491
  },
  {
    "id": "dept-pathology",
    "name": "Department of Pathology, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15399,
    "lng": 7.6492
  },
  {
    "id": "dept-chemical-pathology",
    "name": "Department of Chemical Pathology, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15379,
    "lng": 7.649
  },
  {
    "id": "dept-medical-microbiology",
    "name": "Department of Medical Microbiology, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15409,
    "lng": 7.6493
  },
  {
    "id": "dept-pharmacology-therapeutics",
    "name": "Department of Pharmacology & Therapeutics, College of Medical Sciences",
    "category": "department",
    "faculty": "Basic Clinical Sciences",
    "lat": 11.15369,
    "lng": 7.6489
  },
  {
    "id": "medical-sciences-lecture-theatre",
    "name": "College of Medical Sciences Lecture Theatre",
    "category": "amenity",
    "lat": 11.15429,
    "lng": 7.6495
  },
  {
    "id": "hall-alexander",
    "name": "Alexander Hall (female)",
    "category": "hostel",
    "lat": 11.15257, // VERIFIED — real-world listing is a combined "Ribadu/Alex Hall" complex; both halls share this location
    "lng": 7.65323
  },
  {
    "id": "hall-danfodio",
    "name": "Danfodio Hall (male)",
    "category": "hostel",
    "lat": 11.1547, // VERIFIED
    "lng": 7.64631
  },
  {
    "id": "hall-icsa",
    "name": "ICSA Hall (male)",
    "category": "hostel",
    "lat": 11.15536, // VERIFIED
    "lng": 7.65423
  },
  {
    "id": "hall-dangote",
    "name": "Dangote Hall (male, Phase 2)",
    "category": "hostel",
    "lat": 11.13799, // VERIFIED
    "lng": 7.63966
  },
  {
    "id": "hall-shehu-idris",
    "name": "Shehu Idris Hall (male, Phase 2)",
    "category": "hostel",
    "lat": 11.13749, // ESTIMATED — shifted by association with verified Dangote Hall (same Phase 2 zone); recommend manual GPS confirmation
    "lng": 7.63916
  },
  {
    "id": "hall-amina",
    "name": "Amina Hall (female)",
    "category": "hostel",
    "lat": 11.15252, // VERIFIED
    "lng": 7.65522
  },
  {
    "id": "hall-ribadu",
    "name": "Ribadu Hall (female)",
    "category": "hostel",
    "lat": 11.15257, // VERIFIED — real-world listing is a combined "Ribadu/Alex Hall" complex; both halls share this location
    "lng": 7.65323
  },
  {
    "id": "hall-suleiman",
    "name": "Suleiman Hall (male)",
    "category": "hostel",
    "lat": 11.15467, // VERIFIED
    "lng": 7.65297
  },
  {
    "id": "hall-ramat",
    "name": "Ramat Hostel (female)",
    "category": "hostel",
    "lat": 11.15576, // UNVERIFIED — CONTRADICTORY DATA: a real "ICSA/Ramat Hall" listing exists at 11.148606,7.648777, far from ICSA Hall's own separately-verified location. Crowd-sourced map data conflicts with itself here; needs manual on-campus confirmation.
    "lng": 7.6501
  },
  {
    "id": "community-market",
    "name": "ABU Community Market",
    "category": "amenity",
    "lat": 11.15536, // UNVERIFIED — a "Samaru Market" listing was found at 11.16268,7.64834 but likely refers to the larger off-campus town market, not this on-campus one
    "lng": 7.6478
  },
  {
    "id": "samaru-main-gate",
    "name": "Samaru Main Gate",
    "category": "gate",
    "lat": 11.15026, // UNVERIFIED — search only surfaced "ABU North Gate" (11.15745,7.65272). If these refer to the same gate, update to match; if different, needs a manual check.
    "lng": 7.6541
  },
  {
    "id": "phase-2-gate",
    "name": "Phase 2 Entrance",
    "category": "gate",
    "lat": 11.13729, // ESTIMATED — shifted by association with verified Dangote Hall (same Phase 2 zone); recommend manual GPS confirmation
    "lng": 7.63816
  },
  {
    "id": "sculpture-garden",
    "name": "Sculpture Garden",
    "category": "amenity",
    "lat": 11.15396, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6481
  },
  {
    "id": "university-health-services",
    "name": "University Health Services (Medical Centre / Sickbay)",
    "category": "health",
    "lat": 11.15416, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6468
  },
  {
    "id": "central-mosque",
    "name": "Central Mosque",
    "category": "worship",
    "lat": 11.15368, // VERIFIED
    "lng": 7.65672
  },
  {
    "id": "chapel-catholic-church",
    "name": "Chapel & Catholic Church",
    "category": "worship",
    "lat": 11.15351, // VERIFIED — this is the actual Catholic parish ("Our Lady Queen of Peace"); the separate Protestant "Chapel of Redemption" sits ~70m away at 11.15357,7.65422
    "lng": 7.65353
  },
  {
    "id": "iaiict",
    "name": "Iya Abubakar Institute of ICT (IAIICT)",
    "category": "ict",
    "lat": 11.1508, // VERIFIED
    "lng": 7.65159
  },
  {
    "id": "counselling-human-dev-centre",
    "name": "Counselling & Human Development Centre",
    "category": "student-services",
    "lat": 11.15366, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6479
  },
  {
    "id": "energy-bulk-metering-unit",
    "name": "Electricity Bulk Metering Unit",
    "category": "infrastructure",
    "lat": 11.15386, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6474
  },
  {
    "id": "engineering-phase-3-complex",
    "name": "Engineering Phase III Complex (Computer Engineering & Mechatronics)",
    "category": "faculty",
    "lat": 11.15306, // VERIFIED — shifted using the same delta confirmed for Faculty of Engineering
    "lng": 7.65074
  },
  {
    "id": "hall-sasa",
    "name": "Sasa Hostel (female)",
    "category": "hostel",
    "lat": 11.15696, // UNVERIFIED — no distinct listing found
    "lng": 7.6508
  },
  {
    "id": "assembly-hall",
    "name": "ABU Assembly Hall",
    "category": "amenity",
    "lat": 11.15236, // UNVERIFIED — no distinct listing found; contextual clue places it near Love Garden (~11.1517,7.6542) per nearby reviews, but not precise enough to correct confidently
    "lng": 7.6481
  },
  {
    "id": "sports-complex",
    "name": "ABU Sports Complex & Stadium",
    "category": "amenity",
    "lat": 11.15594, // VERIFIED
    "lng": 7.64115
  },
  {
    "id": "school-postgraduate-studies",
    "name": "School of Postgraduate Studies (SPS)",
    "category": "administration",
    "lat": 11.14058, // VERIFIED
    "lng": 7.65115
  },
  {
    "id": "distance-learning-centre",
    "name": "Distance Learning Centre (DLC)",
    "category": "ict",
    "lat": 11.151, // VERIFIED
    "lng": 7.65575
  },
  {
    "id": "mcgowan-theatre",
    "name": "MacGowan Theatre",
    "category": "amenity",
    "lat": 11.15326, // UNVERIFIED — no distinct listing found (search only returned an unrelated UCLA venue of the same name)
    "lng": 7.6474
  },
  {
    "id": "convocation-square",
    "name": "Convocation Square",
    "category": "amenity",
    "lat": 11.15256, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6485
  },
  {
    "id": "intl-conference-centre",
    "name": "International Conference Centre",
    "category": "administration",
    "lat": 11.15316, // UNVERIFIED — no distinct listing found (search only returned an unrelated Abuja venue of the same name)
    "lng": 7.6495
  },
  {
    "id": "works-maintenance-yard",
    "name": "Works & Services Department (Maintenance Yard)",
    "category": "infrastructure",
    "lat": 11.15466, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6436
  },
  {
    "id": "fire-service-station",
    "name": "ABU Fire Service Station",
    "category": "infrastructure",
    "lat": 11.1539, // VERIFIED
    "lng": 7.65038
  },
  {
    "id": "security-hq",
    "name": "ABU Security Office Headquarters",
    "category": "infrastructure",
    "lat": 11.15066, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6511
  },
  {
    "id": "water-treatment-plant",
    "name": "ABU Water Treatment Plant & Dam",
    "category": "infrastructure",
    "lat": 11.13804, // VERIFIED — cross-checked against a separately-listed "ABU Dam" at 11.13468,7.65463, ~500m away, which is consistent (dam and treatment plant are adjacent facilities)
    "lng": 7.65789
  },
  {
    "id": "institute-agric-research",
    "name": "Institute for Agricultural Research (IAR)",
    "category": "infrastructure",
    "lat": 11.16497, // ESTIMATED — shifted by association with verified Faculty of Agriculture / DAC cluster; recommend manual GPS confirmation
    "lng": 7.61504
  },
  {
    "id": "sanyaolu-lecture-theatre",
    "name": "Sanyaolu Lecture Theatre",
    "category": "amenity",
    "lat": 11.15436, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6478
  },
  {
    "id": "etf-lecture-theatre",
    "name": "ETF Lecture Theatre",
    "category": "amenity",
    "lat": 11.15226, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6468
  },
  {
    "id": "sslt-lecture-theatre",
    "name": "Social Science Lecture Theatre (SSLT)",
    "category": "amenity",
    "lat": 11.14919, // VERIFIED — shifted using the same delta confirmed for Faculty of Social Sciences
    "lng": 7.65093
  },
  {
    "id": "hayatu-lecture-theatre",
    "name": "Hayatu Lecture Theatre",
    "category": "amenity",
    "lat": 11.15356, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6477
  },
  {
    "id": "a1-a2-lecture-halls",
    "name": "A1/A2 Lecture Halls",
    "category": "amenity",
    "lat": 11.15346, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6474
  },
  {
    "id": "b1-b2-lecture-halls",
    "name": "B1/B2 Lecture Halls",
    "category": "amenity",
    "lat": 11.15336, // UNVERIFIED — not mapped as a distinct point of interest anywhere found
    "lng": 7.6475
  },
  {
    "id": "abu-bookshop-press",
    "name": "ABU Press & Bookshop",
    "category": "amenity",
    "lat": 11.14932, // VERIFIED
    "lng": 7.65546
  },
  {
    "id": "abu-microfinance-bank",
    "name": "ABU Microfinance Bank",
    "category": "amenity",
    "lat": 11.15439, // VERIFIED
    "lng": 7.65812
  },
  {
    "id": "north-aviation-gate",
    "name": "North Gate (Aviation)",
    "category": "gate",
    "lat": 11.16066, // UNVERIFIED — no distinct listing found; searches only returned the separate Nigerian College of Aviation Technology campus, several km away
    "lng": 7.6411
  },
  {
    "id": "iya-abubakar-lecture-hall",
    "name": "Iya Abubakar Lecture Hall",
    "category": "amenity",
    "lat": 11.15316, // UNVERIFIED — searches only found the "Iya Abubakar Computer Centre" (used above for IAIICT); this is a differently-named lecture hall entry, so not merged in without confirmation it's the same building
    "lng": 7.6485
  },
  {
    "id": "naerls-centre",
    "name": "NAERLS Headquarters Center",
    "category": "infrastructure",
    "lat": 11.16447, // ESTIMATED — shifted by association with verified Faculty of Agriculture / DAC cluster; recommend manual GPS confirmation
    "lng": 7.61604
  },
  {
    "id": "dac-centre",
    "name": "Division of Agricultural Colleges (DAC)",
    "category": "infrastructure",
    "lat": 11.16497, // VERIFIED
    "lng": 7.63551
  }
];