import { AbuZone } from '../types';

export const ABU_LAT = 11.1517;
export const ABU_LNG = 7.6481; // Re-centered to focus on the real heart of the campus

export const abuGeoJson = {
  "type": "FeatureCollection",
  "features": [
    { "type": "Feature", "properties": { "zone_id": "senate-building", "name": "Senate Building", "category": "administration" }, "geometry": { "type": "Point", "coordinates": [7.6496, 11.1523] } },
    { "type": "Feature", "properties": { "zone_id": "kashim-ibrahim-library", "name": "Kashim Ibrahim Library", "category": "library" }, "geometry": { "type": "Point", "coordinates": [7.6481, 11.1517] } },

    { "type": "Feature", "properties": { "zone_id": "fac-arts", "name": "Faculty of Arts", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6480, 11.1522] } },
    { "type": "Feature", "properties": { "zone_id": "dept-african-languages-cultures", "name": "Department of African Languages and Cultures", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6483, 11.1523] } },
    { "type": "Feature", "properties": { "zone_id": "dept-arabic", "name": "Department of Arabic", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6481, 11.1521] } },
    { "type": "Feature", "properties": { "zone_id": "dept-archaeology-heritage", "name": "Department of Archaeology and Heritage Studies", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6484, 11.1524] } },
    { "type": "Feature", "properties": { "zone_id": "dept-english-literary", "name": "Department of English and Literary Studies", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6480, 11.1520] } },
    { "type": "Feature", "properties": { "zone_id": "dept-french", "name": "Department of French", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6483, 11.1521] } },
    { "type": "Feature", "properties": { "zone_id": "dept-history", "name": "Department of History", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6481, 11.1523] } },
    { "type": "Feature", "properties": { "zone_id": "dept-philosophy", "name": "Department of Philosophy", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6484, 11.1522] } },
    { "type": "Feature", "properties": { "zone_id": "dept-theater-performing-arts", "name": "Department of Theater and Performing Arts", "category": "department", "faculty": "Arts" }, "geometry": { "type": "Point", "coordinates": [7.6480, 11.1524] } },

    { "type": "Feature", "properties": { "zone_id": "fac-physical-sciences", "name": "Faculty of Physical Sciences", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6485, 11.1528] } },
    { "type": "Feature", "properties": { "zone_id": "dept-chemistry", "name": "Department of Chemistry", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6486, 11.1529] } },
    { "type": "Feature", "properties": { "zone_id": "dept-computer-science", "name": "Department of Computer Science", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6484, 11.1527] } },
    { "type": "Feature", "properties": { "zone_id": "dept-geography", "name": "Department of Geography", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6487, 11.1530] } },
    { "type": "Feature", "properties": { "zone_id": "dept-geology", "name": "Department of Geology", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6483, 11.1526] } },
    { "type": "Feature", "properties": { "zone_id": "dept-mathematics", "name": "Department of Mathematics", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6488, 11.1531] } },
    { "type": "Feature", "properties": { "zone_id": "dept-physics", "name": "Department of Physics", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6485, 11.1528] } },
    { "type": "Feature", "properties": { "zone_id": "dept-statistics", "name": "Department of Statistics", "category": "department", "faculty": "Physical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6482, 11.1525] } },

    { "type": "Feature", "properties": { "zone_id": "fac-life-sciences", "name": "Faculty of Life Sciences", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6490, 11.1530] } },
    { "type": "Feature", "properties": { "zone_id": "dept-biology", "name": "Department of Biology", "category": "department", "faculty": "Life Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6496, 11.1525] } },
    { "type": "Feature", "properties": { "zone_id": "dept-biochemistry", "name": "Department of Biochemistry", "category": "department", "faculty": "Life Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6494, 11.1523] } },
    { "type": "Feature", "properties": { "zone_id": "dept-botany", "name": "Department of Botany", "category": "department", "faculty": "Life Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6497, 11.1526] } },
    { "type": "Feature", "properties": { "zone_id": "dept-microbiology-life", "name": "Department of Microbiology", "category": "department", "faculty": "Life Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6493, 11.1522] } },
    { "type": "Feature", "properties": { "zone_id": "dept-zoology", "name": "Department of Zoology", "category": "department", "faculty": "Life Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6498, 11.1527] } },

    { "type": "Feature", "properties": { "zone_id": "fac-education", "name": "Faculty of Education", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6450, 11.1522] } },
    { "type": "Feature", "properties": { "zone_id": "dept-art-social-science-ed", "name": "Department of Art & Social Science Education", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6451, 11.1523] } },
    { "type": "Feature", "properties": { "zone_id": "dept-library-info-science", "name": "Department of Library & Information Science", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6449, 11.1521] } },
    { "type": "Feature", "properties": { "zone_id": "dept-vocational-technical-ed", "name": "Department of Vocational & Technical Education", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6452, 11.1524] } },
    { "type": "Feature", "properties": { "zone_id": "dept-physical-health-ed", "name": "Department of Physical & Health Education", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6448, 11.1520] } },
    { "type": "Feature", "properties": { "zone_id": "dept-science-education", "name": "Department of Science Education", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6453, 11.1525] } },
    { "type": "Feature", "properties": { "zone_id": "dept-educational-foundation-curriculum", "name": "Department of Educational Foundations & Curriculum", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6447, 11.1519] } },
    { "type": "Feature", "properties": { "zone_id": "dept-educational-psychology-counselling", "name": "Department of Educational Psychology & Counselling", "category": "department", "faculty": "Education" }, "geometry": { "type": "Point", "coordinates": [7.6454, 11.1526] } },

    { "type": "Feature", "properties": { "zone_id": "fac-environmental-design", "name": "Faculty of Environmental Design", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6469, 11.1506] } },
    { "type": "Feature", "properties": { "zone_id": "dept-architecture", "name": "Department of Architecture", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6470, 11.1507] } },
    { "type": "Feature", "properties": { "zone_id": "dept-building", "name": "Department of Building", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6468, 11.1505] } },
    { "type": "Feature", "properties": { "zone_id": "dept-fine-arts", "name": "Department of Fine Arts", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6471, 11.1508] } },
    { "type": "Feature", "properties": { "zone_id": "dept-geomatics", "name": "Department of Geomatics", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6467, 11.1504] } },
    { "type": "Feature", "properties": { "zone_id": "dept-glass-silicate-tech", "name": "Department of Glass and Silicate Technology", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6472, 11.1509] } },
    { "type": "Feature", "properties": { "zone_id": "dept-industrial-design", "name": "Department of Industrial Design", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6466, 11.1503] } },
    { "type": "Feature", "properties": { "zone_id": "dept-urp", "name": "Department of Urban and Regional Planning", "category": "department", "faculty": "Environmental Design" }, "geometry": { "type": "Point", "coordinates": [7.6473, 11.1510] } },

    { "type": "Feature", "properties": { "zone_id": "fac-social-sciences", "name": "Faculty of Social Sciences", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6461, 11.1514] } },
    { "type": "Feature", "properties": { "zone_id": "dept-economics", "name": "Department of Economics", "category": "department", "faculty": "Social Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6462, 11.1515] } },
    { "type": "Feature", "properties": { "zone_id": "dept-mass-communication", "name": "Department of Mass Communication", "category": "department", "faculty": "Social Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6460, 11.1513] } },
    { "type": "Feature", "properties": { "zone_id": "dept-political-science-intl-studies", "name": "Department of Political Science and International Studies", "category": "department", "faculty": "Social Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6463, 11.1516] } },
    { "type": "Feature", "properties": { "zone_id": "dept-sociology", "name": "Department of Sociology", "category": "department", "faculty": "Social Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6459, 11.1512] } },

    { "type": "Feature", "properties": { "zone_id": "fac-engineering", "name": "Faculty of Engineering", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6481, 11.1500] } },
    { "type": "Feature", "properties": { "zone_id": "dept-agric-bioresources-eng", "name": "Department of Agricultural and Bio-Resources Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6482, 11.1501] } },
    { "type": "Feature", "properties": { "zone_id": "dept-chemical-petroleum-eng", "name": "Department of Chemical & Petroleum Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6480, 11.1499] } },
    { "type": "Feature", "properties": { "zone_id": "dept-civil-eng", "name": "Department of Civil Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6483, 11.1502] } },
    { "type": "Feature", "properties": { "zone_id": "dept-electronics-telecoms-eng", "name": "Department of Electronics & Telecommunications Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6479, 11.1498] } },
    { "type": "Feature", "properties": { "zone_id": "dept-computer-eng", "name": "Department of Computer Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6484, 11.1503] } },
    { "type": "Feature", "properties": { "zone_id": "dept-electrical-eng", "name": "Department of Electrical Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6478, 11.1497] } },
    { "type": "Feature", "properties": { "zone_id": "dept-mechanical-eng", "name": "Department of Mechanical Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6485, 11.1504] } },
    { "type": "Feature", "properties": { "zone_id": "dept-metallurgical-materials-eng", "name": "Department of Metallurgical & Materials Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6477, 11.1496] } },
    { "type": "Feature", "properties": { "zone_id": "dept-polymer-textile-eng", "name": "Department of Polymer & Textile Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6486, 11.1505] } },
    { "type": "Feature", "properties": { "zone_id": "dept-water-resources-env-eng", "name": "Department of Water Resources & Environmental Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6476, 11.1495] } },
    { "type": "Feature", "properties": { "zone_id": "dept-mechatronics-automotive-eng", "name": "Department of Mechatronics & Automotive Engineering", "category": "department", "faculty": "Engineering" }, "geometry": { "type": "Point", "coordinates": [7.6487, 11.1506] } },

    { "type": "Feature", "properties": { "zone_id": "fac-agriculture", "name": "Faculty of Agriculture", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6455, 11.1478] } },
    { "type": "Feature", "properties": { "zone_id": "dept-agric-economics", "name": "Department of Agricultural Economics", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6456, 11.1479] } },
    { "type": "Feature", "properties": { "zone_id": "dept-agric-extension-rural-dev", "name": "Department of Agricultural Extension & Rural Development", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6454, 11.1477] } },
    { "type": "Feature", "properties": { "zone_id": "dept-agronomy", "name": "Department of Agronomy", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6457, 11.1480] } },
    { "type": "Feature", "properties": { "zone_id": "dept-animal-science", "name": "Department of Animal Science", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6453, 11.1476] } },
    { "type": "Feature", "properties": { "zone_id": "dept-crop-protection", "name": "Department of Crop Protection", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6458, 11.1481] } },
    { "type": "Feature", "properties": { "zone_id": "dept-plant-science", "name": "Department of Plant Science", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6452, 11.1475] } },
    { "type": "Feature", "properties": { "zone_id": "dept-soil-science", "name": "Department of Soil Science", "category": "department", "faculty": "Agriculture" }, "geometry": { "type": "Point", "coordinates": [7.6459, 11.1482] } },

    { "type": "Feature", "properties": { "zone_id": "fac-vet-medicine", "name": "Faculty of Veterinary Medicine", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6453, 11.1445] } },
    { "type": "Feature", "properties": { "zone_id": "dept-vet-anatomy", "name": "Department of Veterinary Anatomy", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6454, 11.1446] } },
    { "type": "Feature", "properties": { "zone_id": "dept-vet-medicine", "name": "Department of Veterinary Medicine", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6452, 11.1444] } },
    { "type": "Feature", "properties": { "zone_id": "dept-vet-microbiology", "name": "Department of Veterinary Microbiology", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6455, 11.1447] } },
    { "type": "Feature", "properties": { "zone_id": "dept-parasitology-entomology", "name": "Department of Parasitology and Entomology", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6451, 11.1443] } },
    { "type": "Feature", "properties": { "zone_id": "dept-vet-pathology", "name": "Department of Veterinary Pathology", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6456, 11.1448] } },
    { "type": "Feature", "properties": { "zone_id": "dept-pharmacology-toxicology-vet", "name": "Department of Pharmacology and Toxicology", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6450, 11.1442] } },
    { "type": "Feature", "properties": { "zone_id": "dept-vet-physiology", "name": "Department of Veterinary Physiology", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6457, 11.1449] } },
    { "type": "Feature", "properties": { "zone_id": "dept-public-health-preventive-medicine", "name": "Department of Public Health and Preventive Medicine", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6449, 11.1441] } },
    { "type": "Feature", "properties": { "zone_id": "dept-surgery-radiology", "name": "Department of Surgery and Radiology", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6458, 11.1450] } },
    { "type": "Feature", "properties": { "zone_id": "dept-theriogenology", "name": "Department of Theriogenology and Production", "category": "department", "faculty": "Veterinary Medicine" }, "geometry": { "type": "Point", "coordinates": [7.6448, 11.1440] } },

    { "type": "Feature", "properties": { "zone_id": "fac-pharmaceutical-sciences", "name": "Faculty of Pharmaceutical Sciences", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6465, 11.1458] } },
    { "type": "Feature", "properties": { "zone_id": "dept-clinical-pharmacy-practice", "name": "Department of Clinical Pharmacy & Pharmacy Practice", "category": "department", "faculty": "Pharmaceutical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6466, 11.1459] } },
    { "type": "Feature", "properties": { "zone_id": "dept-pharmacognosy-drug-dev", "name": "Department of Pharmacognosy and Drug Development", "category": "department", "faculty": "Pharmaceutical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6464, 11.1457] } },
    { "type": "Feature", "properties": { "zone_id": "dept-pharm-medicinal-chemistry", "name": "Department of Pharmaceutical and Medicinal Chemistry", "category": "department", "faculty": "Pharmaceutical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6467, 11.1460] } },
    { "type": "Feature", "properties": { "zone_id": "dept-pharmaceutics-pharm-microbiology", "name": "Department of Pharmaceutics and Pharmaceutical Microbiology", "category": "department", "faculty": "Pharmaceutical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6463, 11.1456] } },
    { "type": "Feature", "properties": { "zone_id": "dept-pharmacology-clinical-pharmacy", "name": "Department of Pharmacology and Clinical Pharmacy", "category": "department", "faculty": "Pharmaceutical Sciences" }, "geometry": { "type": "Point", "coordinates": [7.6468, 11.1461] } },

    { "type": "Feature", "properties": { "zone_id": "hall-alexander", "name": "Alexander Hall (female)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6515, 11.1550] } },
    { "type": "Feature", "properties": { "zone_id": "hall-danfodio", "name": "Danfodio Hall (male)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6521, 11.1555] } },
    { "type": "Feature", "properties": { "zone_id": "hall-icsa", "name": "ICSA Hall (male)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6510, 11.1545] } },
    { "type": "Feature", "properties": { "zone_id": "hall-dangote", "name": "Dangote Hall (male, Phase 2)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6505, 11.1565] } },
    { "type": "Feature", "properties": { "zone_id": "hall-shehu-idris", "name": "Shehu Idris Hall (male, Phase 2)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6500, 11.1560] } },
    { "type": "Feature", "properties": { "zone_id": "hall-amina", "name": "Amina Hall (female)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6468, 11.1534] } },
    { "type": "Feature", "properties": { "zone_id": "hall-ribadu", "name": "Ribadu Hall (female)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6465, 11.1540] } },
    { "type": "Feature", "properties": { "zone_id": "hall-suleiman", "name": "Suleiman Hall (female)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6453, 11.1551] } },
    { "type": "Feature", "properties": { "zone_id": "hall-ramat", "name": "Ramat Hostel (female)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6457, 11.1546] } },

    { "type": "Feature", "properties": { "zone_id": "community-market", "name": "ABU Community Market", "category": "amenity" }, "geometry": { "type": "Point", "coordinates": [7.6482, 11.1542] } },
    { "type": "Feature", "properties": { "zone_id": "samaru-main-gate", "name": "Samaru Main Gate", "category": "gate" }, "geometry": { "type": "Point", "coordinates": [7.6525, 11.1491] } },
    { "type": "Feature", "properties": { "zone_id": "phase-2-gate", "name": "Phase 2 Entrance", "category": "gate" }, "geometry": { "type": "Point", "coordinates": [7.6490, 11.1568] } },
    { "type": "Feature", "properties": { "zone_id": "sculpture-garden", "name": "Sculpture Garden", "category": "amenity" }, "geometry": { "type": "Point", "coordinates": [7.6485, 11.1528] } },

    { "type": "Feature", "properties": { "zone_id": "university-health-services", "name": "University Health Services (Medical Centre / Sickbay)", "category": "health" }, "geometry": { "type": "Point", "coordinates": [7.6472, 11.1530] } },
    { "type": "Feature", "properties": { "zone_id": "central-mosque", "name": "Central Mosque", "category": "worship" }, "geometry": { "type": "Point", "coordinates": [7.6496, 11.1525] } },
    { "type": "Feature", "properties": { "zone_id": "chapel-catholic-church", "name": "Chapel & Catholic Church", "category": "worship" }, "geometry": { "type": "Point", "coordinates": [7.6508, 11.1529] } },
    { "type": "Feature", "properties": { "zone_id": "iaiict", "name": "Iya Abubakar Institute of ICT (IAIICT)", "category": "ict" }, "geometry": { "type": "Point", "coordinates": [7.6488, 11.1519] } },
    { "type": "Feature", "properties": { "zone_id": "counselling-human-dev-centre", "name": "Counselling & Human Development Centre", "category": "student-services" }, "geometry": { "type": "Point", "coordinates": [7.6483, 11.1525] } },
    { "type": "Feature", "properties": { "zone_id": "energy-bulk-metering-unit", "name": "Electricity Bulk Metering Unit", "category": "infrastructure" }, "geometry": { "type": "Point", "coordinates": [7.6478, 11.1527] } },
    { "type": "Feature", "properties": { "zone_id": "engineering-phase-3-complex", "name": "Engineering Phase III Complex (Computer Engineering & Mechatronics)", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6480, 11.1505] } },
    { "type": "Feature", "properties": { "zone_id": "fac-law", "name": "Faculty of Law", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6435, 11.1508] } },
    { "type": "Feature", "properties": { "zone_id": "hall-sasa", "name": "Sasa Hostel (female)", "category": "hostel" }, "geometry": { "type": "Point", "coordinates": [7.6512, 11.1558] } },
    { "type": "Feature", "properties": { "zone_id": "assembly-hall", "name": "ABU Assembly Hall", "category": "amenity" }, "geometry": { "type": "Point", "coordinates": [7.6485, 11.1512] } },
    { "type": "Feature", "properties": { "zone_id": "sports-complex", "name": "ABU Sports Complex & Stadium", "category": "amenity" }, "geometry": { "type": "Point", "coordinates": [7.6460, 11.1555] } },
    { "type": "Feature", "properties": { "zone_id": "fac-admin", "name": "Faculty of Administration", "category": "faculty" }, "geometry": { "type": "Point", "coordinates": [7.6438, 11.1530] } },
    { "type": "Feature", "properties": { "zone_id": "dept-public-admin", "name": "Department of Public Administration", "category": "department", "faculty": "Administration" }, "geometry": { "type": "Point", "coordinates": [7.6439, 11.1531] } },
    { "type": "Feature", "properties": { "zone_id": "dept-business-admin", "name": "Department of Business Administration", "category": "department", "faculty": "Administration" }, "geometry": { "type": "Point", "coordinates": [7.6437, 11.1529] } },
    { "type": "Feature", "properties": { "zone_id": "dept-accounting", "name": "Department of Accounting", "category": "department", "faculty": "Administration" }, "geometry": { "type": "Point", "coordinates": [7.6440, 11.1532] } },
    { "type": "Feature", "properties": { "zone_id": "school-postgraduate-studies", "name": "School of Postgraduate Studies (SPS)", "category": "administration" }, "geometry": { "type": "Point", "coordinates": [7.6475, 11.1525] } },
    { "type": "Feature", "properties": { "zone_id": "distance-learning-centre", "name": "Distance Learning Centre (DLC)", "category": "ict" }, "geometry": { "type": "Point", "coordinates": [7.6530, 11.1520] } },
    { "type": "Feature", "properties": { "zone_id": "mcgowan-theatre", "name": "MacGowan Theatre", "category": "amenity" }, "geometry": { "type": "Point", "coordinates": [7.6478, 11.1521] } },
    { "type": "Feature", "properties": { "zone_id": "convocation-square", "name": "Convocation Square", "category": "amenity" }, "geometry": { "type": "Point", "coordinates": [7.6489, 11.1514] } },
    { "type": "Feature", "properties": { "zone_id": "intl-conference-centre", "name": "International Conference Centre", "category": "administration" }, "geometry": { "type": "Point", "coordinates": [7.6499, 11.1520] } },
    { "type": "Feature", "properties": { "zone_id": "works-maintenance-yard", "name": "Works & Services Department (Maintenance Yard)", "category": "infrastructure" }, "geometry": { "type": "Point", "coordinates": [7.6440, 11.1535] } },
    { "type": "Feature", "properties": { "zone_id": "fire-service-station", "name": "ABU Fire Service Station", "category": "infrastructure" }, "geometry": { "type": "Point", "coordinates": [7.6472, 11.1532] } },
    { "type": "Feature", "properties": { "zone_id": "security-hq", "name": "ABU Security Office Headquarters", "category": "infrastructure" }, "geometry": { "type": "Point", "coordinates": [7.6515, 11.1495] } },
    { "type": "Feature", "properties": { "zone_id": "water-treatment-plant", "name": "ABU Water Treatment Plant & Dam", "category": "infrastructure" }, "geometry": { "type": "Point", "coordinates": [7.6410, 11.1560] } },
    { "type": "Feature", "properties": { "zone_id": "institute-agric-research", "name": "Institute for Agricultural Research (IAR)", "category": "infrastructure" }, "geometry": { "type": "Point", "coordinates": [7.6350, 11.1470] } }
  ]
};

const CATEGORY_COLORS: Record<string, string> = {
  administration: '#3b82f6', // blue
  library: '#6366f1',        // indigo
  faculty: '#10b981',        // emerald
  department: '#14b8a6',     // teal
  hostel: '#ec4899',         // pink
  amenity: '#f59e0b',        // amber
  gate: '#ef4444',           // red
  health: '#06b6d4',         // cyan
  worship: '#8b5cf6',        // violet
  ict: '#f43f5e',            // rose
  'student-services': '#e11d48', // rose/red
  infrastructure: '#64748b'  // slate
};

// Map GeoJSON points into visual click boxes (tiny polygons around the center coordinates)
export const abuZones: AbuZone[] = abuGeoJson.features.map((feature) => {
  const [lng, lat] = feature.geometry.coordinates;
  const p = feature.properties;
  
  // Custom description based on the entity's category
  let description = `${p.name} on ABU Samaru main campus`;
  if (p.category === 'department' && p.faculty) {
    description = `Department within the Faculty of ${p.faculty}`;
  } else if (p.category === 'department') {
    description = 'Academic Department';
  } else if (p.category === 'faculty') {
    description = 'Academic Faculty Center & Offices';
  } else if (p.category === 'hostel') {
    description = 'Student Residence Hostel';
  } else if (p.category === 'gate') {
    description = 'Main Entrance Security Gate';
  } else if (p.category === 'library') {
    description = 'Library Reading & Research Center';
  } else if (p.category === 'administration') {
    description = 'Central Administration Headquarters';
  } else if (p.category === 'health') {
    description = 'University Medical & Health Services Centre';
  } else if (p.category === 'worship') {
    description = 'Place of Worship & Spiritual Activities';
  } else if (p.category === 'ict') {
    description = 'Information & Communication Technology Center';
  } else if (p.category === 'student-services') {
    description = 'Student Support & Guidance Services';
  } else if (p.category === 'infrastructure') {
    description = 'Campus Utility & Infrastructure Facility';
  }

  const color = CATEGORY_COLORS[p.category] || '#64748b';
  
  // Set a small offset for building polygon box so it draws nicely
  const delta = 0.00015;
  const coordinates: [number, number][] = [
    [lng - delta, lat + delta],
    [lng + delta, lat + delta],
    [lng + delta, lat - delta],
    [lng - delta, lat - delta]
  ];

  return {
    id: p.zone_id,
    name: p.name,
    description,
    color,
    coordinates,
    category: p.category
  };
});

// Helper to find which zone contains a given coordinate (or is closest to it)
export function findZoneForCoordinates(lat: number, lng: number): AbuZone | null {
  let minDistance = Infinity;
  let closestZone: AbuZone | null = null;
  
  for (const zone of abuZones) {
    // Calculate center of the zone box
    const lngs = zone.coordinates.map(c => c[0]);
    const lats = zone.coordinates.map(c => c[1]);
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    const dist = Math.sqrt(Math.pow(lat - centerLat, 2) + Math.pow(lng - centerLng, 2));
    if (dist < minDistance) {
      minDistance = dist;
      closestZone = zone;
    }
  }
  
  // Return the closest zone if it is within reasonable limits (e.g. 2 kilometers / ~0.02 coordinate degrees)
  if (minDistance < 0.02) {
    return closestZone;
  }
  
  return null;
}
