import * as THREE from 'three';

/**
 * DepotKit 3.0 — Architectural Miniature Diorama Engine
 * Inspiré des rendus architecturaux isométriques haut de gamme (style Novalis SA).
 * Scène miniature vivante : maquette découpée, bureaux, parquet chêne,
 * entrepôt avec racks et palettes, chariots élévateurs, quais, camions blancs & bleus,
 * espaces verts, arbres stylisés, terrasse avec parasols et petites voitures.
 */

export const DIORAMA_THEME = {
  // Fond architectural doux & lumineux
  canvasBg: 0xECE8E1,
  pedestalTop: 0xF5F2EB,
  pedestalSide: 0xD9D3C7,

  // Sols intérieurs
  woodFloor: 0xE2BA84,      // Parquet chêne blond chaleureux
  concreteFloor: 0xD4D8E0,  // Béton ciré industriel entrepôt
  carpetMeeting: 0x94A3B8,  // Moquette grise feutrée salle réunion
  poolTableFelt: 0x2563EB,  // Tapis bleu billard lounge

  // Sols extérieurs
  grass: 0x86EFAC,          // Pelouse verte printanière
  grassShadow: 0x4ADE80,    // Bordures vertes
  roadAsphalt: 0x475569,    // Enrobé routier moderne
  roadMarking: 0xF8FAFC,    // Lignes blanches nettes
  sidewalk: 0xE2DDD5,       // Trottoir pavé clair
  woodDeck: 0xC89B65,       // Terrasse extérieure bois

  // Architecture & Cloisons
  cutawayWall: 0xF8FAFC,    // Murs blancs épurés
  wallCap: 0x334155,        // Lisse haute sombre
  glassPartition: 0x93C5FD, // Verre bleuté limpide
  doorFrame: 0x1E293B,      // Huisseries aluminium noir

  // Végétation
  treeFoliage1: 0x4ADE80,   // Vert tendre
  treeFoliage2: 0x22C55E,   // Vert émeraude
  treeFoliage3: 0x16A34A,   // Vert forêt
  treeTrunk: 0xA16207,      // Bois naturel
  hedge: 0x15803D,          // Haies taillées

  // Mobilier
  deskWood: 0xF1F5F9,       // Bureaux contemporains blancs
  chairFabric: 0x0F172A,    // Fauteuils noirs ergonomiques
  screenGlow: 0x38BDF8,     // Écrans allumés
  sofaColor: 0xEA580C,      // Canapés chaleureux ocre/orange
  palletWood: 0xD97706,     // Palettes bois brut
  cargoBox1: 0x3B82F6,      // Colis bleus
  cargoBox2: 0xF59E0B,      // Colis ambre
  cargoBox3: 0xEF4444,      // Colis rouges
  forkliftYellow: 0xFACC15, // Chariot élévateur jaune

  // Véhicules de la flotte Transporter-Pro
  truckCab: 0xFFFFFF,       // Cabine blanc pur laqué
  truckBlue: 0x0066FF,      // Bandeau bleu électrique Transporter-Pro
  truckTrailer: 0xF8FAFC,   // Remorque blanche impeccable
  truckChassis: 0x334155,   // Châssis gris foncé
  wheelRubber: 0x1E293B,    // Pneus
  wheelHub: 0xCBD5E1,       // Jantes argentées
  carBlue: 0x2563EB,        // Voiture berline bleue
  carOrange: 0xD97706,      // Voiture berline ocre
  vanWhite: 0xFFFFFF,       // Fourgon utilitaire blanc

  // Parasols terrasse
  umbrellaBlue: 0x0284C7,
  umbrellaOrange: 0xEA580C,
};

/**
 * Nettoyage récursif Three.js
 */
export const disposeHierarchy = (node) => {
  if (!node) return;
  node.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }
  });
};

/**
 * Matériau standard mat doux pour le style maquette architecturale / diorama clay
 */
const createClayMat = (color, { roughness = 0.65, metalness = 0.1, transparent = false, opacity = 1.0 } = {}) => {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent,
    opacity,
  });
};

/**
 * Socle flottant de la maquette (Piédestal architectural avec chanfrein)
 */
export const createDioramaPedestal = (width = 130, depth = 90, height = 3.5) => {
  const pedestalGroup = new THREE.Group();
  pedestalGroup.name = 'PedestalGroup';

  // Base biseautée
  const shape = new THREE.Shape();
  const radius = 6;
  const x = -width / 2;
  const z = -depth / 2;

  shape.moveTo(x + radius, z);
  shape.lineTo(x + width - radius, z);
  shape.quadraticCurveTo(x + width, z, x + width, z + radius);
  shape.lineTo(x + width, z + depth - radius);
  shape.quadraticCurveTo(x + width, z + depth, x + width - radius, z + depth);
  shape.lineTo(x + radius, z + depth);
  shape.quadraticCurveTo(x, z + depth, x, z + depth - radius);
  shape.lineTo(x, z + radius);
  shape.quadraticCurveTo(x, z, x + radius, z);

  const extrudeSettings = {
    depth: height,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 1.2,
    bevelThickness: 1.2,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const mat = createClayMat(DIORAMA_THEME.pedestalTop, { roughness: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = -height;
  mesh.receiveShadow = true;
  pedestalGroup.add(mesh);

  return pedestalGroup;
};

/**
 * Arbre miniature stylisé (style sphère nuageuse épurée / architectural toy tree)
 */
export const createMiniatureTree = (x, z, scale = 1.0, foliageColor = DIORAMA_THEME.treeFoliage1) => {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  // Tronc en bois fin
  const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 3.2 * scale, 8);
  const trunkMat = createClayMat(DIORAMA_THEME.treeTrunk, { roughness: 0.9 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 1.6 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  // Feuillage sphérique doux
  const foliageGeo = new THREE.SphereGeometry(1.8 * scale, 16, 16);
  const foliageMat = createClayMat(foliageColor, { roughness: 0.7 });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.y = 3.8 * scale;
  foliage.castShadow = true;
  foliage.receiveShadow = true;
  tree.add(foliage);

  // Ombre de sol contact
  const shadowGeo = new THREE.CircleGeometry(1.6 * scale, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.12 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.02;
  tree.add(shadow);

  return tree;
};

/**
 * Petite voiture berline miniature garée sur la route
 */
export const createMiniatureCar = (color, x, z, rotationY = 0) => {
  const car = new THREE.Group();
  car.position.set(x, 0, z);
  car.rotation.y = rotationY;

  // Carrosserie basse
  const bodyGeo = new THREE.BoxGeometry(2.4, 0.9, 4.6);
  const bodyMat = createClayMat(color, { roughness: 0.35, metalness: 0.2 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  car.add(body);

  // Pavillon / toit avec vitres
  const roofGeo = new THREE.BoxGeometry(2.1, 0.8, 2.4);
  const glassMat = createClayMat(0x1E293B, { roughness: 0.1, metalness: 0.8 });
  const roof = new THREE.Mesh(roofGeo, glassMat);
  roof.position.set(0, 1.45, -0.2);
  roof.castShadow = true;
  car.add(roof);

  // 4 petites roues
  const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
  const wheelMat = createClayMat(0x1E293B, { roughness: 0.8 });
  [[-1.25, 1.3], [1.25, 1.3], [-1.25, -1.3], [1.25, -1.3]].forEach(([wX, wZ]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wX, 0.35, wZ);
    car.add(wheel);
  });

  return car;
};

/**
 * Personnage miniature stylisé (style figurine maquette / petit collaborateur)
 */
export const createMiniaturePerson = (x, z, shirtColor = 0x2563EB, rotationY = 0) => {
  const person = new THREE.Group();
  person.position.set(x, 0, z);
  person.rotation.y = rotationY;

  // Tête sphérique couleur peau claire
  const headGeo = new THREE.SphereGeometry(0.28, 12, 12);
  const headMat = createClayMat(0xFCD34D, { roughness: 0.6 });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = 1.7;
  head.castShadow = true;
  person.add(head);

  // Torse / Chemise
  const torsoGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.7, 10);
  const torsoMat = createClayMat(shirtColor, { roughness: 0.7 });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  person.add(torso);

  // Jambes / Pantalon
  const legsGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.8, 10);
  const legsMat = createClayMat(0x1E293B, { roughness: 0.8 });
  const legs = new THREE.Mesh(legsGeo, legsMat);
  legs.position.y = 0.4;
  legs.castShadow = true;
  person.add(legs);

  return person;
};

/**
 * Chariot élévateur (Forklift) jaune miniature pour l'entrepôt
 */
export const createMiniatureForklift = (x, z, rotationY = 0) => {
  const forklift = new THREE.Group();
  forklift.position.set(x, 0, z);
  forklift.rotation.y = rotationY;

  // Corps jaune
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 2.8), createClayMat(DIORAMA_THEME.forkliftYellow));
  body.position.set(0, 0.9, -0.2);
  body.castShadow = true;
  forklift.add(body);

  // Arceau de sécurité noir
  const cage = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 1.8), createClayMat(0x1E293B));
  cage.position.set(0, 2.1, -0.4);
  forklift.add(cage);

  // Mât de levage avant et fourches
  const mast = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.2), createClayMat(0x334155));
  mast.position.set(0, 1.6, 1.3);
  forklift.add(mast);

  const forkL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 1.2), createClayMat(0x64748B));
  forkL.position.set(-0.4, 0.35, 1.9);
  forklift.add(forkL);

  const forkR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 1.2), createClayMat(0x64748B));
  forkR.position.set(0.4, 0.35, 1.9);
  forklift.add(forkR);

  // Palette chargée sur les fourches
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 1.2), createClayMat(DIORAMA_THEME.palletWood));
  pallet.position.set(0, 0.5, 1.9);
  forklift.add(pallet);

  const box = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 0.9), createClayMat(DIORAMA_THEME.cargoBox1));
  box.position.set(0, 1.05, 1.9);
  box.castShadow = true;
  forklift.add(box);

  return forklift;
};

/**
 * Création complète de la maquette diorama (Hub Transporter-Pro)
 */
export const createCompleteDiorama = () => {
  const diorama = new THREE.Group();
  diorama.name = 'CompleteArchitecturalDiorama';

  // 1. Socle principal
  diorama.add(createDioramaPedestal(120, 84, 3.0));

  // 2. Zonage des sols extérieurs
  // A. Pelouse générale (Lawn)
  const lawnGeo = new THREE.PlaneGeometry(118, 82);
  const lawnMat = createClayMat(DIORAMA_THEME.grass, { roughness: 0.85 });
  const lawn = new THREE.Mesh(lawnGeo, lawnMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.01;
  lawn.receiveShadow = true;
  diorama.add(lawn);

  // B. Route asphaltée incurvée au premier plan (devant le bâtiment)
  const roadGeo = new THREE.PlaneGeometry(118, 16);
  const roadMat = createClayMat(DIORAMA_THEME.roadAsphalt, { roughness: 0.7 });
  const road = new THREE.Mesh(roadGeo, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 32);
  road.receiveShadow = true;
  diorama.add(road);

  // Lignes blanches continues et pointillées sur la route
  const lineMat = new THREE.MeshBasicMaterial({ color: DIORAMA_THEME.roadMarking });
  const dashedLine = new THREE.Mesh(new THREE.PlaneGeometry(116, 0.3), lineMat);
  dashedLine.rotation.x = -Math.PI / 2;
  dashedLine.position.set(0, 0.03, 32);
  diorama.add(dashedLine);

  // Passage piéton zébré
  for (let z = 0; z < 7; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.5), lineMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-18 + z * 2.2, 0.035, 32);
    diorama.add(stripe);
  }

  // C. Trottoirs & Allées piétonnes en pavés clairs
  const sidewalkGeo = new THREE.PlaneGeometry(118, 4.5);
  const sidewalkMat = createClayMat(DIORAMA_THEME.sidewalk, { roughness: 0.8 });
  const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(0, 0.025, 22);
  sidewalk.receiveShadow = true;
  diorama.add(sidewalk);

  // D. Terrasse détente extérieure en bois (Outdoor Deck)
  const deckGeo = new THREE.PlaneGeometry(28, 16);
  const deckMat = createClayMat(DIORAMA_THEME.woodDeck, { roughness: 0.6 });
  const deck = new THREE.Mesh(deckGeo, deckMat);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(38, 0.03, 12);
  deck.receiveShadow = true;
  diorama.add(deck);

  // Parasols bleus et tables rondes sur la terrasse
  [[-6, 2], [5, -3]].forEach(([pX, pZ], idx) => {
    const umbrellaGroup = new THREE.Group();
    umbrellaGroup.position.set(38 + pX, 0, 12 + pZ);

    // Mât
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.8, 8), createClayMat(0x64748B));
    pole.position.y = 1.9;
    pole.castShadow = true;
    umbrellaGroup.add(pole);

    // Dôme parasol
    const dome = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.2, 12), createClayMat(idx === 0 ? DIORAMA_THEME.umbrellaBlue : DIORAMA_THEME.umbrellaOrange));
    dome.position.y = 3.6;
    dome.castShadow = true;
    umbrellaGroup.add(dome);

    // Table ronde et chaises
    const table = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.9, 16), createClayMat(0xF1F5F9));
    table.position.y = 0.45;
    umbrellaGroup.add(table);

    diorama.add(umbrellaGroup);
  });

  // 3. BÂTIMENT ARCHITECTURAL OUVERT (Cutaway Headquarters)
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'CutawayBuilding';
  buildingGroup.position.set(0, 0, -6);

  // A. Sol Parquet Chêne de l'espace Bureaux & Direction (Width 72, Depth 34)
  const officeFloorGeo = new THREE.PlaneGeometry(70, 32);
  const officeFloorMat = createClayMat(DIORAMA_THEME.woodFloor, { roughness: 0.65 });
  const officeFloor = new THREE.Mesh(officeFloorGeo, officeFloorMat);
  officeFloor.rotation.x = -Math.PI / 2;
  officeFloor.position.set(-14, 0.04, 0);
  officeFloor.receiveShadow = true;
  buildingGroup.add(officeFloor);

  // B. Sol Béton Ciré de l'espace Entrepôt & Quais (Width 36, Depth 32)
  const warehouseFloorGeo = new THREE.PlaneGeometry(34, 32);
  const warehouseFloorMat = createClayMat(DIORAMA_THEME.concreteFloor, { roughness: 0.5 });
  const warehouseFloor = new THREE.Mesh(warehouseFloorGeo, warehouseFloorMat);
  warehouseFloor.rotation.x = -Math.PI / 2;
  warehouseFloor.position.set(38, 0.04, 0);
  warehouseFloor.receiveShadow = true;
  buildingGroup.add(warehouseFloor);

  // Marquages jaunes de sécurité dans l'entrepôt
  const safetyLineMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
  const safetyBorder = new THREE.Mesh(new THREE.PlaneGeometry(33, 0.3), safetyLineMat);
  safetyBorder.rotation.x = -Math.PI / 2;
  safetyBorder.position.set(38, 0.045, -14);
  buildingGroup.add(safetyBorder);

  // C. Murs découpés architecturaux bas (Hauteur 2.6m pour voir à l'intérieur comme dans Novalis)
  const wallMat = createClayMat(DIORAMA_THEME.cutawayWall, { roughness: 0.7 });
  const wallCapMat = createClayMat(DIORAMA_THEME.wallCap, { roughness: 0.4 });

  const buildCutawayWall = (w, h, d, x, y, z) => {
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wallMesh.position.set(x, y, z);
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;

    // Baguette supérieure sombre (wall cap)
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.15, d + 0.1), wallCapMat);
    cap.position.set(0, h / 2 + 0.08, 0);
    wallMesh.add(cap);

    return wallMesh;
  };

  // Murs extérieurs périmétriques
  buildingGroup.add(buildCutawayWall(106, 2.6, 0.8, 3, 1.3, -16.4)); // Mur du fond
  buildingGroup.add(buildCutawayWall(0.8, 2.6, 33, -49.4, 1.3, 0));  // Mur gauche
  buildingGroup.add(buildCutawayWall(0.8, 2.6, 33, 55.4, 1.3, 0));   // Mur droit

  // Murs intérieurs délimitant les pièces
  buildingGroup.add(buildCutawayWall(0.5, 2.2, 32, 21, 1.1, 0));     // Séparation Bureaux / Entrepôt
  buildingGroup.add(buildCutawayWall(36, 2.2, 0.5, -31, 1.1, -2));   // Séparation Direction / Open space
  buildingGroup.add(buildCutawayWall(0.5, 2.2, 14, -13, 1.1, -9));   // Séparation Salle de réunion
  buildingGroup.add(buildCutawayWall(28, 2.2, 0.5, 7, 1.1, -2));     // Séparation Espace Pause / Lounge

  // D. Cloisons vitrées transparentes avec cadres noirs
  const glassMat = createClayMat(DIORAMA_THEME.glassPartition, { roughness: 0.1, transparent: true, opacity: 0.45 });
  const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(12, 2.2, 0.1), glassMat);
  glassDoor.position.set(-13, 1.1, 5);
  buildingGroup.add(glassDoor);

  // 4. MOBILIER & AMÉNAGEMENT INTÉRIEUR DÉTAILLÉ

  // --- PIÈCE 1 : SALLE DE RÉUNION (Meeting Room) ---
  const meetingTable = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 4.2), createClayMat(0x38BDF8, { roughness: 0.4 }));
  meetingTable.position.set(-31, 0.8, -9);
  meetingTable.castShadow = true;
  buildingGroup.add(meetingTable);

  // 6 Chaises autour de la table
  [-3.8, 0, 3.8].forEach((cOffset) => {
    [-2.6, 2.6].forEach((zSide) => {
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.8), createClayMat(0x1E293B));
      chair.position.set(-31 + cOffset, 0.5, -9 + zSide);
      chair.castShadow = true;
      buildingGroup.add(chair);
    });
  });

  // Grand écran de visioconférence au mur
  const tvScreen = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.0, 0.2), createClayMat(0x0F172A));
  tvScreen.position.set(-31, 1.8, -15.9);
  buildingGroup.add(tvScreen);

  // --- PIÈCE 2 : OPEN SPACE OPÉRATIONS & DISPATCH FLOTTE ---
  // 6 Postes de travail informatiques avec doubles écrans (comme dans Novalis)
  const deskCoords = [
    [-38, 4], [-38, 10],
    [-26, 4], [-26, 10],
    [-14, 4], [-14, 10]
  ];

  deskCoords.forEach(([dX, dZ], i) => {
    // Bureau blanc
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.75, 2.4), createClayMat(DIORAMA_THEME.deskWood));
    desk.position.set(dX, 0.45, dZ);
    desk.castShadow = true;
    buildingGroup.add(desk);

    // Double écran de supervision
    const screen1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), createClayMat(DIORAMA_THEME.screenGlow));
    screen1.position.set(dX - 0.7, 1.15, dZ - 0.6);
    buildingGroup.add(screen1);

    const screen2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.1), createClayMat(0x0F172A));
    screen2.position.set(dX + 0.7, 1.15, dZ - 0.6);
    buildingGroup.add(screen2);

    // Chaise de bureau
    const chair = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 12), createClayMat(0x334155));
    chair.position.set(dX, 0.45, dZ + 1.2);
    buildingGroup.add(chair);

    // Collaborateur assis à certains postes
    if (i % 2 === 0) {
      buildingGroup.add(createMiniaturePerson(dX, dZ + 1.2, i === 0 ? 0x2563EB : 0x059669, Math.PI));
    }
  });

  // --- PIÈCE 3 : ESPACE DÉTENTE & LOUNGE ---
  // Table de billard / baby-foot avec tapis bleu vif (élément clé du visuel Novalis)
  const poolTable = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.9, 3.4), createClayMat(DIORAMA_THEME.poolTableFelt, { roughness: 0.8 }));
  poolTable.position.set(8, 0.6, 9);
  poolTable.castShadow = true;
  buildingGroup.add(poolTable);

  const poolBorder = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.3, 3.8), createClayMat(0x78350F));
  poolBorder.position.set(8, 0.95, 9);
  buildingGroup.add(poolBorder);

  // Canapés chaleureux ocre et table basse
  const sofa = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.1, 1.8), createClayMat(DIORAMA_THEME.sofaColor));
  sofa.position.set(8, 0.65, -9);
  sofa.castShadow = true;
  buildingGroup.add(sofa);

  const coffeeTable = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 1.4), createClayMat(0xF1F5F9));
  coffeeTable.position.set(8, 0.3, -6.5);
  buildingGroup.add(coffeeTable);

  // Machine à café / Fontaine à eau
  const coffeeMachine = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.4, 1.2), createClayMat(0x0284C7));
  coffeeMachine.position.set(18, 1.2, -14);
  buildingGroup.add(coffeeMachine);

  // --- PIÈCE 4 : ENTREPÔT LOGISTIQUE & RACKS À PALETTES ---
  // Racks métalliques de stockage en hauteur avec palettes et caisses colorées
  const rackXPositions = [28, 46];
  rackXPositions.forEach((rX) => {
    // Structure métallique
    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6.2, 18), createClayMat(0x475569));
    rackFrame.position.set(rX, 3.1, -5);
    rackFrame.castShadow = true;
    buildingGroup.add(rackFrame);

    // Étagères de palettes chargées
    for (let level = 1; level <= 3; level++) {
      for (let slot = -7; slot <= 7; slot += 3.5) {
        const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.2, 2.8), createClayMat(DIORAMA_THEME.palletWood));
        pallet.position.set(rX, level * 1.8 - 0.4, -5 + slot);
        buildingGroup.add(pallet);

        const colors = [DIORAMA_THEME.cargoBox1, DIORAMA_THEME.cargoBox2, DIORAMA_THEME.cargoBox3];
        const boxColor = colors[Math.abs(Math.floor(slot + level)) % colors.length];
        const crate = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 2.4), createClayMat(boxColor));
        crate.position.set(rX, level * 1.8 + 0.3, -5 + slot);
        crate.castShadow = true;
        buildingGroup.add(crate);
      }
    }
  });

  // Chariot élévateur dans l'entrepôt
  buildingGroup.add(createMiniatureForklift(38, 5, -Math.PI / 2));

  // Enseigne murale lumineuse "TRANSPORTER-PRO"
  const logoBanner = new THREE.Mesh(new THREE.BoxGeometry(18, 1.8, 0.2), createClayMat(0x0066FF, { roughness: 0.3 }));
  logoBanner.position.set(-14, 2.4, -16.2);
  buildingGroup.add(logoBanner);

  diorama.add(buildingGroup);

  // 5. EXTÉRIEUR : VÉHICULES, ARBRES & PARC DE STATIONNEMENT
  // Voitures berlines garées sur la rue
  diorama.add(createMiniatureCar(DIORAMA_THEME.carBlue, -36, 33, Math.PI / 2));
  diorama.add(createMiniatureCar(DIORAMA_THEME.carOrange, -12, 33, Math.PI / 2));

  // Arbres décoratifs tout autour (style low-poly cloud trees)
  const treePositions = [
    [-52, -32, 1.2, DIORAMA_THEME.treeFoliage1],
    [-46, -35, 0.9, DIORAMA_THEME.treeFoliage2],
    [-54, 20, 1.1, DIORAMA_THEME.treeFoliage3],
    [-42, 22, 0.8, DIORAMA_THEME.treeFoliage1],
    [52, -32, 1.1, DIORAMA_THEME.treeFoliage2],
    [54, 28, 1.0, DIORAMA_THEME.treeFoliage1],
    [26, 26, 0.8, DIORAMA_THEME.treeFoliage3],
    [10, 26, 0.9, DIORAMA_THEME.treeFoliage2],
  ];

  treePositions.forEach(([tX, tZ, s, col]) => {
    diorama.add(createMiniatureTree(tX, tZ, s, col));
  });

  return diorama;
};

/**
 * Camion Poids Lourd Transporter-Pro haut de gamme adapté au style diorama miniature :
 * Cabine blanche étincelante, bandeau bleu officiel, semi-remorque blanche immaculée,
 * roues réalistes et badge holographique.
 */
export const createFleetTruck = (data) => {
  const truck = new THREE.Group();
  truck.name = `Truck_${data.tracking_id || data.id}`;
  truck.userData = { ...data, isTruck: true };

  const statusColor = data.status === 'delivered' ? 0x10B981 :
                      data.status === 'in_transit' ? 0x06B6D4 : 0xF59E0B;

  // 1. Cabine tracteur blanc polaire épuré
  const cabGeo = new THREE.BoxGeometry(3.6, 3.8, 3.6);
  const cabMat = createClayMat(DIORAMA_THEME.truckCab, { roughness: 0.35 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 2.6, 4.4);
  cab.castShadow = true;
  cab.receiveShadow = true;
  truck.add(cab);

  // Pare-brise panoramique teinté noir
  const glass = new THREE.Mesh(new THREE.BoxGeometry(3.3, 1.5, 0.2), createClayMat(0x0F172A, { roughness: 0.1, metalness: 0.8 }));
  glass.position.set(0, 3.3, 6.22);
  truck.add(glass);

  // Bas de caisse bleu Transporter-Pro
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(3.7, 1.0, 0.8), createClayMat(DIORAMA_THEME.truckBlue));
  bumper.position.set(0, 0.9, 5.8);
  truck.add(bumper);

  // Phares ronds chaleureux
  [-1.2, 1.2].forEach((hX) => {
    const light = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), new THREE.MeshBasicMaterial({ color: 0xFEF08A }));
    light.rotation.x = Math.PI / 2;
    light.position.set(hX, 1.4, 6.22);
    truck.add(light);
  });

  // 2. Semi-remorque (Trailer)
  const trailerGeo = new THREE.BoxGeometry(3.8, 4.2, 10.2);
  const trailerMat = createClayMat(DIORAMA_THEME.truckTrailer, { roughness: 0.4 });
  const trailer = new THREE.Mesh(trailerGeo, trailerMat);
  trailer.position.set(0, 2.9, -2.4);
  trailer.castShadow = true;
  trailer.receiveShadow = true;
  truck.add(trailer);

  // Bandeau bleu officiel sur le flanc de la remorque
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.85, 0.8, 9.6), createClayMat(DIORAMA_THEME.truckBlue));
  stripe.position.set(0, 2.9, -2.4);
  truck.add(stripe);

  // 3. Roues stylisées avec enjoliveurs
  const wheelGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
  const wheelMat = createClayMat(DIORAMA_THEME.wheelRubber);
  const hubGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.65, 12);
  const hubMat = createClayMat(DIORAMA_THEME.wheelHub, { metalness: 0.8 });

  const wheelsCoords = [
    [-1.8, 4.4], [1.8, 4.4],
    [-1.8, -3.4], [1.8, -3.4],
    [-1.8, -5.4], [1.8, -5.4],
  ];

  wheelsCoords.forEach(([wX, wZ]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(wX, 0.8, wZ);
    wheelGroup.rotation.z = Math.PI / 2;

    wheelGroup.add(new THREE.Mesh(wheelGeo, wheelMat));
    wheelGroup.add(new THREE.Mesh(hubGeo, hubMat));
    truck.add(wheelGroup);
  });

  // 4. Anneau holographique flottant
  const haloGeo = new THREE.TorusGeometry(1.6, 0.12, 10, 24);
  const haloMat = new THREE.MeshBasicMaterial({ color: statusColor, transparent: true, opacity: 0.9 });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 7.2, 1.0);
  halo.name = 'Halo';
  truck.add(halo);

  return truck;
};
