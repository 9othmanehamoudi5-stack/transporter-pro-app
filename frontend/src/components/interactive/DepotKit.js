import * as THREE from 'three';

/**
 * DepotKit 2.0 — High-Fidelity 3D Logistics Visual Engine
 * Design System Transporter-Pro : Rendu haute précision, contrastes éclatants,
 * textures architecturales procédurales, éclairage studio fintech.
 */

export const COLORS = {
  background: 0x0B0F19,        // Nuit bleu marine profond
  ground: 0x151C2C,            // Dalle asphalt architectural
  groundLane: 0x101624,        // Pistes de roulement
  gridLine: 0x25334D,          // Grille technologique
  roadLine: 0xF8FAFC,          // Marquages blancs éclatants
  yellowStripe: 0xF59E0B,      // Lignes de guidage jaune sécurité
  accentBlue: 0x0066FF,        // Bleu signature Transporter-Pro
  accentCyan: 0x06B6D4,        // Cyan électrique télématique
  warehouseBody: 0x1A2234,     // Façade béton / métal moderne
  warehouseTrim: 0x2A3752,     // Montants aluminium architecturaux
  glass: 0x1E3A8A,             // Baies vitrées bleutées
  dockMetal: 0x334155,         // Rideaux métalliques industriels
  bollard: 0xF59E0B,           // Poteaux de protection
  truckCab: 0xF8FAFC,          // Cabine Blanc Polaire (ultra visible)
  truckCabBlue: 0x0052CC,      // Cabine Bleu Transporter-Pro
  truckTrailer: 0xE2E8F0,      // Semi-remorque blanche immaculée
  truckChassis: 0x1E293B,      // Châssis métallique gris foncé
  wheelRubber: 0x0F172A,       // Pneu vulcanisé
  wheelRim: 0x94A3B8,          // Jantes chrome/alu
  headlight: 0xFFFFFF,         // Phares LED blanc pur
  taillight: 0xEF4444,         // Feux arrière rubis
  status: {
    pending: 0xF59E0B,         // Ambre quai
    assigned: 0x3B82F6,        // Bleu préparation
    in_transit: 0x06B6D4,      // Cyan circulation
    delivered: 0x10B981,       // Émeraude validé
    failed: 0xF43F5E,          // Rose litige
  }
};

/**
 * Crée une texture de texte Canvas haute résolution pour enseignes et badges.
 */
export const createTextCanvasTexture = (text, {
  fontSize = 32,
  color = '#FFFFFF',
  bgColor = null,
  borderColor = null,
  padding = 12,
  fontFamily = 'Inter, system-ui, sans-serif',
  fontWeight = 'bold'
} = {}) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const textMetrics = ctx.measureText(text);
  const width = Math.ceil(textMetrics.width + padding * 2);
  const height = Math.ceil(fontSize * 1.6 + padding);

  canvas.width = Math.max(width, 64);
  canvas.height = Math.max(height, 32);

  const ctx2 = canvas.getContext('2d');
  ctx2.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx2.textBaseline = 'middle';

  if (bgColor) {
    ctx2.fillStyle = bgColor;
    ctx2.beginPath();
    ctx2.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx2.fill();
  }

  if (borderColor) {
    ctx2.strokeStyle = borderColor;
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.roundRect(1.5, 1.5, canvas.width - 3, canvas.height - 3, 8);
    ctx2.stroke();
  }

  ctx2.fillStyle = color;
  ctx2.textAlign = 'center';
  ctx2.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

/**
 * Nettoie récursivement un noeud Three.js pour éviter toute fuite WebGL.
 */
export const disposeHierarchy = (node) => {
  if (!node) return;
  node.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            if (mat.map) mat.map.dispose();
            mat.dispose();
          });
        } else {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      }
    }
  });
};

/**
 * Sol du hub logistique : asphalt contrasté, marquages routiers, baies numérotées, passages piétons.
 */
export const createDepotGround = () => {
  const groundGroup = new THREE.Group();
  groundGroup.name = 'DepotGround';

  // 1. Dalle générale asphalt haut de gamme
  const groundGeo = new THREE.PlaneGeometry(170, 170);
  const groundMat = new THREE.MeshStandardMaterial({
    color: COLORS.ground,
    roughness: 0.7,
    metalness: 0.15,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  groundGroup.add(ground);

  // 2. Grille technologique discrète
  const gridHelper = new THREE.GridHelper(160, 40, COLORS.accentBlue, COLORS.gridLine);
  gridHelper.position.y = 0.01;
  gridHelper.material.opacity = 0.35;
  gridHelper.material.transparent = true;
  groundGroup.add(gridHelper);

  // 3. Piste de circulation périphérique
  const trackGeo = new THREE.RingGeometry(46, 54, 64);
  const trackMat = new THREE.MeshStandardMaterial({
    color: COLORS.groundLane,
    roughness: 0.6,
    side: THREE.DoubleSide
  });
  const track = new THREE.Mesh(trackGeo, trackMat);
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.02;
  track.receiveShadow = true;
  groundGroup.add(track);

  // Ligne axiale jaune sécurité pointillée sur la piste
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: COLORS.yellowStripe });
  const centerRingGeo = new THREE.RingGeometry(49.85, 50.15, 64);
  const centerRing = new THREE.Mesh(centerRingGeo, yellowLineMat);
  centerRing.rotation.x = -Math.PI / 2;
  centerRing.position.y = 0.03;
  groundGroup.add(centerRing);

  // Bordures blanches extérieures et intérieures de la piste
  const whiteLineMat = new THREE.MeshBasicMaterial({ color: COLORS.roadLine });
  const innerRing = new THREE.Mesh(new THREE.RingGeometry(46.0, 46.2, 64), whiteLineMat);
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.03;
  groundGroup.add(innerRing);

  const outerRing = new THREE.Mesh(new THREE.RingGeometry(53.8, 54.0, 64), whiteLineMat);
  outerRing.rotation.x = -Math.PI / 2;
  outerRing.position.y = 0.03;
  groundGroup.add(outerRing);

  // 4. Baies de stationnement & Quais de chargement (4 quais)
  const dockXCoords = [-24, -8, 8, 24];
  dockXCoords.forEach((xPos, idx) => {
    // Sol de la baie de recul
    const bayGeo = new THREE.PlaneGeometry(11, 24);
    const bayMat = new THREE.MeshStandardMaterial({ color: 0x121824, roughness: 0.75 });
    const bay = new THREE.Mesh(bayGeo, bayMat);
    bay.rotation.x = -Math.PI / 2;
    bay.position.set(xPos, 0.035, -12);
    bay.receiveShadow = true;
    groundGroup.add(bay);

    // Lignes de guidage peintes en jaune et blanc
    const borderGeo = new THREE.PlaneGeometry(0.35, 24);
    const borderL = new THREE.Mesh(borderGeo, whiteLineMat);
    borderL.rotation.x = -Math.PI / 2;
    borderL.position.set(xPos - 5.5, 0.04, -12);
    groundGroup.add(borderL);

    const borderR = new THREE.Mesh(borderGeo, whiteLineMat);
    borderR.rotation.x = -Math.PI / 2;
    borderR.position.set(xPos + 5.5, 0.04, -12);
    groundGroup.add(borderR);

    // Numéro de quai peint au sol (01, 02, 03, 04)
    const numTexture = createTextCanvasTexture(`QUAI 0${idx + 1}`, {
      fontSize: 28,
      color: '#FBBF24',
      bgColor: 'rgba(15, 23, 42, 0.85)',
      borderColor: '#F59E0B',
      padding: 8
    });
    const numGeo = new THREE.PlaneGeometry(5, 2);
    const numMat = new THREE.MeshBasicMaterial({ map: numTexture, transparent: true });
    const numMesh = new THREE.Mesh(numGeo, numMat);
    numMesh.rotation.x = -Math.PI / 2;
    numMesh.position.set(xPos, 0.045, -22);
    groundGroup.add(numMesh);

    // Poteaux de guidage de quai (Bollards de sécurité jaune sécurité)
    [-5.8, 5.8].forEach((bX) => {
      const bollardGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.4, 16);
      const bollardMat = new THREE.MeshStandardMaterial({ color: COLORS.bollard, roughness: 0.4, metalness: 0.6 });
      const bollard = new THREE.Mesh(bollardGeo, bollardMat);
      bollard.position.set(xPos + bX, 0.7, -22);
      bollard.castShadow = true;
      groundGroup.add(bollard);
    });
  });

  // 5. Zone de stationnement d'attente (5 baies marquées)
  for (let i = 0; i < 5; i++) {
    const xPos = -32 + i * 16;
    const parkBorderGeo = new THREE.PlaneGeometry(0.3, 14);
    const parkBorder = new THREE.Mesh(parkBorderGeo, whiteLineMat);
    parkBorder.rotation.x = -Math.PI / 2;
    parkBorder.position.set(xPos, 0.035, 24);
    groundGroup.add(parkBorder);
  }

  // 6. Passage piéton / Sécurité quai (Zebra crossing)
  for (let z = 0; z < 8; z++) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.45), whiteLineMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-36 + z * 2.2, 0.04, 0);
    groundGroup.add(stripe);
  }

  return groundGroup;
};

/**
 * Bâtiment d'entrepôt moderne : architecture vitrée, auvent lumineux, enseigne Transporter-Pro.
 */
export const createWarehouseBuilding = () => {
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'WarehouseBuilding';

  // 1. Corps principal du hub (Largeur 88, Hauteur 16, Profondeur 34)
  const wallGeo = new THREE.BoxGeometry(88, 16, 34);
  const wallMat = new THREE.MeshStandardMaterial({
    color: COLORS.warehouseBody,
    roughness: 0.5,
    metalness: 0.35,
  });
  const building = new THREE.Mesh(wallGeo, wallMat);
  building.position.set(0, 8, -42);
  building.castShadow = true;
  building.receiveShadow = true;
  buildingGroup.add(building);

  // 2. Bandeau supérieur architectural avec bandeau LED bleu
  const ledStripeGeo = new THREE.BoxGeometry(90, 0.5, 36);
  const ledStripeMat = new THREE.MeshStandardMaterial({
    color: COLORS.accentBlue,
    emissive: COLORS.accentBlue,
    emissiveIntensity: 0.8,
  });
  const ledStripe = new THREE.Mesh(ledStripeGeo, ledStripeMat);
  ledStripe.position.set(0, 16.2, -42);
  buildingGroup.add(ledStripe);

  // 3. Toiture avec auvent débordant au-dessus des quais
  const roofGeo = new THREE.BoxGeometry(92, 1.4, 40);
  const roofMat = new THREE.MeshStandardMaterial({
    color: COLORS.warehouseTrim,
    roughness: 0.4,
    metalness: 0.6,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 17, -39);
  roof.castShadow = true;
  buildingGroup.add(roof);

  // 4. Verrière panoramique de supervision au 1er étage
  const glassGeo = new THREE.BoxGeometry(78, 3.6, 0.3);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: COLORS.glass,
    roughness: 0.1,
    metalness: 0.85,
    transmission: 0.3,
    transparent: true,
    opacity: 0.85,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 12.8, -24.8);
  buildingGroup.add(glass);

  // 5. Portes de quai sectionnelles industrielles (4 portes)
  const dockXCoords = [-24, -8, 8, 24];
  dockXCoords.forEach((xPos, idx) => {
    // Encadrement de porte renforcé
    const frameGeo = new THREE.BoxGeometry(10.2, 8.4, 0.8);
    const frameMat = new THREE.MeshStandardMaterial({ color: COLORS.warehouseTrim, metalness: 0.7 });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(xPos, 4.2, -24.7);
    buildingGroup.add(frame);

    // Tablier sectionnel métallique
    const doorGeo = new THREE.BoxGeometry(9.2, 7.6, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({ color: COLORS.dockMetal, roughness: 0.5, metalness: 0.5 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(xPos, 3.8, -24.4);
    buildingGroup.add(door);

    // Feu bicolore de quai (vert = disponible, bleu = opération en cours)
    const lightGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const lightColor = idx % 2 === 0 ? COLORS.status.in_transit : COLORS.status.delivered;
    const lightMat = new THREE.MeshBasicMaterial({ color: lightColor });
    const light = new THREE.Mesh(lightGeo, lightMat);
    light.position.set(xPos, 8.8, -24.2);
    buildingGroup.add(light);
  });

  // 6. Enseigne lumineuse haute visibilité "TRANSPORTER-PRO FLEET HUB"
  const signTexture = createTextCanvasTexture('TRANSPORTER-PRO • FLEET HUB', {
    fontSize: 34,
    color: '#38BDF8',
    bgColor: '#0B132B',
    borderColor: '#0066FF',
    padding: 16
  });
  const signGeo = new THREE.PlaneGeometry(32, 3.2);
  const signMat = new THREE.MeshBasicMaterial({ map: signTexture, transparent: true });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 13.0, -24.6);
  buildingGroup.add(sign);

  return buildingGroup;
};

/**
 * Camion Poids Lourd Transporter-Pro haute fidélité :
 * Cabine profilée blanche/argentée étincelante, calandre chromée, phares LED,
 * semi-remorque carrossée avec livrée officielle, badge holographique 3D au-dessus.
 */
export const createFleetTruck = (data) => {
  const truck = new THREE.Group();
  truck.name = `Truck_${data.tracking_id || data.id}`;
  truck.userData = { ...data, isTruck: true };

  const statusColor = COLORS.status[data.status] || COLORS.status.pending;

  // --- 1. CABINE TRACTEUR ROUTIER ---
  const cabGroup = new THREE.Group();
  cabGroup.name = 'CabGroup';

  // Corps de cabine aérodynamique (Blanc Polaire éclatant)
  const cabGeo = new THREE.BoxGeometry(4.2, 4.4, 4.2);
  const cabMat = new THREE.MeshStandardMaterial({
    color: COLORS.truckCab,
    roughness: 0.25,
    metalness: 0.35,
  });
  const cabBody = new THREE.Mesh(cabGeo, cabMat);
  cabBody.position.set(0, 3.2, 5.2);
  cabBody.castShadow = true;
  cabBody.receiveShadow = true;
  cabGroup.add(cabBody);

  // Bas de caisse / pare-chocs avant en Bleu Transporter-Pro
  const bumperGeo = new THREE.BoxGeometry(4.3, 1.4, 1.2);
  const bumperMat = new THREE.MeshStandardMaterial({
    color: COLORS.accentBlue,
    roughness: 0.3,
    metalness: 0.4,
  });
  const bumper = new THREE.Mesh(bumperGeo, bumperMat);
  bumper.position.set(0, 1.2, 6.8);
  bumper.castShadow = true;
  cabGroup.add(bumper);

  // Pare-brise panoramique teinté
  const windshieldGeo = new THREE.BoxGeometry(3.9, 1.8, 0.3);
  const windshieldMat = new THREE.MeshPhysicalMaterial({
    color: 0x0F172A,
    roughness: 0.05,
    metalness: 0.9,
    reflectivity: 0.95,
  });
  const windshield = new THREE.Mesh(windshieldGeo, windshieldMat);
  windshield.position.set(0, 4.0, 7.25);
  cabGroup.add(windshield);

  // Calandre chromée
  const grilleGeo = new THREE.BoxGeometry(2.6, 1.2, 0.15);
  const grilleMat = new THREE.MeshStandardMaterial({ color: 0x64748B, metalness: 0.85, roughness: 0.2 });
  const grille = new THREE.Mesh(grilleGeo, grilleMat);
  grille.position.set(0, 2.3, 7.32);
  cabGroup.add(grille);

  // Phares LED avant ultra-lumineux
  const headLightGeo = new THREE.BoxGeometry(0.85, 0.45, 0.15);
  const headLightMat = new THREE.MeshBasicMaterial({ color: COLORS.headlight });
  
  const headL = new THREE.Mesh(headLightGeo, headLightMat);
  headL.position.set(-1.45, 1.8, 7.35);
  cabGroup.add(headL);

  const headR = new THREE.Mesh(headLightGeo, headLightMat);
  headR.position.set(1.45, 1.8, 7.35);
  cabGroup.add(headR);

  // Cône de lumière projeté sur le sol (simulation faisceau phares)
  const beamGeo = new THREE.ConeGeometry(2.8, 9, 16);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x93C5FD,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.rotation.x = Math.PI / 2;
  beam.position.set(0, 0.6, 11.5);
  cabGroup.add(beam);

  // Rétroviseurs aérodynamiques
  [-2.25, 2.25].forEach((mX) => {
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.4), bumperMat);
    mirror.position.set(mX, 3.8, 6.2);
    cabGroup.add(mirror);
  });

  truck.add(cabGroup);

  // --- 2. SEMI-REMORQUE (Trailer) ---
  const trailerGroup = new THREE.Group();
  trailerGroup.name = 'TrailerGroup';

  // Caisse frigorifique blanche isolée
  const trailerGeo = new THREE.BoxGeometry(4.3, 4.6, 11.4);
  const trailerMat = new THREE.MeshStandardMaterial({
    color: COLORS.truckTrailer,
    roughness: 0.35,
    metalness: 0.2,
  });
  const trailer = new THREE.Mesh(trailerGeo, trailerMat);
  trailer.position.set(0, 3.5, -2.0);
  trailer.castShadow = true;
  trailer.receiveShadow = true;
  trailerGroup.add(trailer);

  // Bandeau latéral bleu électrique Transporter-Pro
  const stripeGeo = new THREE.BoxGeometry(4.35, 0.85, 10.8);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: COLORS.accentBlue,
    emissive: COLORS.accentBlue,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 3.5, -2.0);
  trailerGroup.add(stripe);

  // Feux de gabarit rouges à l'arrière
  const tailGeo = new THREE.BoxGeometry(0.75, 0.35, 0.15);
  const tailMat = new THREE.MeshBasicMaterial({ color: COLORS.taillight });

  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-1.6, 1.4, -7.75);
  trailerGroup.add(tailL);

  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(1.6, 1.4, -7.75);
  trailerGroup.add(tailR);

  truck.add(trailerGroup);

  // --- 3. CHÂSSIS & ROUES (8 roues avec jantes alu) ---
  const wheelGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.75, 20);
  const wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.wheelRubber, roughness: 0.8 });
  const rimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.78, 16);
  const rimMat = new THREE.MeshStandardMaterial({ color: COLORS.wheelRim, metalness: 0.9, roughness: 0.2 });

  const wheelPositions = [
    [-2.1, 0.95, 5.2],   // Avant G
    [2.1, 0.95, 5.2],    // Avant D
    [-2.1, 0.95, -3.2],  // Remorque essieu 1 G
    [2.1, 0.95, -3.2],   // Remorque essieu 1 D
    [-2.1, 0.95, -5.2],  // Remorque essieu 2 G
    [2.1, 0.95, -5.2],   // Remorque essieu 2 D
    [-2.1, 0.95, -7.0],  // Remorque essieu 3 G
    [2.1, 0.95, -7.0],   // Remorque essieu 3 D
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);
    wheelGroup.rotation.z = Math.PI / 2;

    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    truck.add(wheelGroup);
  });

  // --- 4. BALISE HOLOGRAPHIQUE & BADGE FLOTTANT ---
  // Anneau lumineux au-dessus de la cabine
  const haloGeo = new THREE.TorusGeometry(1.8, 0.15, 12, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: statusColor,
    transparent: true,
    opacity: 0.9,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 8.2, 2.0);
  halo.name = 'Halo';
  truck.add(halo);

  // Badge étiquette 3D flottante avec Nom Chauffeur + Tracking
  const labelText = `${data.driver_name ? data.driver_name.split(' ')[0] : 'Camion'} • ${data.tracking_id || 'TRP'}`;
  const badgeTexture = createTextCanvasTexture(labelText, {
    fontSize: 24,
    color: '#FFFFFF',
    bgColor: 'rgba(11, 15, 25, 0.90)',
    borderColor: statusColor === COLORS.status.in_transit ? '#06B6D4' :
                 statusColor === COLORS.status.delivered ? '#10B981' : '#F59E0B',
    padding: 10
  });
  const badgeGeo = new THREE.PlaneGeometry(6.4, 1.8);
  const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true, side: THREE.DoubleSide });
  const badge = new THREE.Mesh(badgeGeo, badgeMat);
  badge.position.set(0, 9.8, 2.0);
  badge.name = 'BadgeLabel';
  truck.add(badge);

  return truck;
};
