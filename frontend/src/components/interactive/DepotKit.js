import * as THREE from 'three';

/**
 * DepotKit
 * Constructeurs d'objets 3D procéduraux pour le hub logistique Transporter-Pro.
 * Utilise uniquement des primitives Three.js (aucune dépendance à des fichiers .glb externes lourds).
 */

export const COLORS = {
  background: 0x0A0A0C,
  asphalt: 0x121316,
  roadMarking: 0xE4E4E7,
  yellowMarking: 0xF59E0B,
  warehouseWall: 0x18191E,
  warehouseRoof: 0x0E0E11,
  accentBlue: 0x0066FF,
  accentCyan: 0x06B6D4,
  dockMetal: 0x27272A,
  truckCab: 0x1A1B20,
  truckTrailer: 0x22242A,
  wheel: 0x0A0A0B,
  headlight: 0xFFFFFF,
  taillight: 0xEF4444,
  status: {
    pending: 0xF59E0B,
    assigned: 0x3B82F6,
    in_transit: 0x06B6D4,
    delivered: 0x10B981,
    failed: 0xF43F5E,
  }
};

/**
 * Nettoie récursivement un noeud Three.js pour éviter toute fuite de mémoire WebGL.
 */
export const disposeHierarchy = (node) => {
  if (!node) return;
  node.traverse((child) => {
    if (child.isMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
  });
};

/**
 * Crée le sol du dépôt logistique avec asphalt, voies de circulation et quais.
 */
export const createDepotGround = () => {
  const groundGroup = new THREE.Group();
  groundGroup.name = 'DepotGround';

  // 1. Dalle asphalt générale (140 x 140)
  const groundGeo = new THREE.PlaneGeometry(160, 160);
  const groundMat = new THREE.MeshStandardMaterial({
    color: COLORS.asphalt,
    roughness: 0.85,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  groundGroup.add(ground);

  // 2. Grille de circulation / Lignes de guidage (marquages au sol blancs et jaunes)
  const lineMat = new THREE.MeshBasicMaterial({ color: COLORS.roadMarking, transparent: true, opacity: 0.6 });
  const yellowLineMat = new THREE.MeshBasicMaterial({ color: COLORS.yellowMarking, transparent: true, opacity: 0.8 });

  // Piste de circulation périphérique
  const trackGeo = new THREE.RingGeometry(48, 52, 64);
  const track = new THREE.Mesh(trackGeo, new THREE.MeshBasicMaterial({ color: 0x1A1B20, side: THREE.DoubleSide }));
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.01;
  groundGroup.add(track);

  // Ligne pointillée centrale sur l'anneau routier
  const dashedRingGeo = new THREE.RingGeometry(49.8, 50.2, 48);
  const dashedRing = new THREE.Mesh(dashedRingGeo, yellowLineMat);
  dashedRing.rotation.x = -Math.PI / 2;
  dashedRing.position.y = 0.02;
  groundGroup.add(dashedRing);

  // 3. Baies de stationnement & Quais de chargement (4 baies de quai)
  for (let i = 0; i < 4; i++) {
    const xPos = -24 + i * 16;
    const bayGeo = new THREE.PlaneGeometry(10, 22);
    const bayMat = new THREE.MeshStandardMaterial({ color: 0x16181D, roughness: 0.9 });
    const bay = new THREE.Mesh(bayGeo, bayMat);
    bay.rotation.x = -Math.PI / 2;
    bay.position.set(xPos, 0.015, -12);
    groundGroup.add(bay);

    // Lignes blanches délimitant la baie
    const borderGeo = new THREE.PlaneGeometry(0.3, 22);
    const borderL = new THREE.Mesh(borderGeo, lineMat);
    borderL.rotation.x = -Math.PI / 2;
    borderL.position.set(xPos - 5, 0.02, -12);
    groundGroup.add(borderL);

    const borderR = new THREE.Mesh(borderGeo, lineMat);
    borderR.rotation.x = -Math.PI / 2;
    borderR.position.set(xPos + 5, 0.02, -12);
    groundGroup.add(borderR);
  }

  return groundGroup;
};

/**
 * Crée le bâtiment d'entrepôt logistique principal.
 */
export const createWarehouseBuilding = () => {
  const buildingGroup = new THREE.Group();
  buildingGroup.name = 'WarehouseBuilding';

  // 1. Corps principal du bâtiment (Largeur 80, Hauteur 14, Profondeur 30)
  const wallGeo = new THREE.BoxGeometry(80, 14, 30);
  const wallMat = new THREE.MeshStandardMaterial({
    color: COLORS.warehouseWall,
    roughness: 0.6,
    metalness: 0.2,
  });
  const building = new THREE.Mesh(wallGeo, wallMat);
  building.position.set(0, 7, -38);
  building.castShadow = true;
  building.receiveShadow = true;
  buildingGroup.add(building);

  // 2. Toit avec casquette / auvent
  const roofGeo = new THREE.BoxGeometry(84, 1.2, 36);
  const roofMat = new THREE.MeshStandardMaterial({
    color: COLORS.warehouseRoof,
    roughness: 0.4,
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 14.6, -35);
  buildingGroup.add(roof);

  // 3. Portes de quai sectionnelles (4 portes)
  for (let i = 0; i < 4; i++) {
    const xPos = -24 + i * 16;

    // Cadre de porte
    const doorFrameGeo = new THREE.BoxGeometry(9, 7.5, 0.6);
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: COLORS.dockMetal, metalness: 0.8 });
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat);
    doorFrame.position.set(xPos, 3.75, -22.7);
    buildingGroup.add(doorFrame);

    // Rideau métallique
    const doorGeo = new THREE.BoxGeometry(8, 6.8, 0.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x33363F, roughness: 0.5 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(xPos, 3.4, -22.4);
    buildingGroup.add(door);

    // Voyant lumineux de quai (vert = quai libre, bleu = en cours)
    const dockLightGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const dockLightMat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? COLORS.status.in_transit : COLORS.status.delivered
    });
    const dockLight = new THREE.Mesh(dockLightGeo, dockLightMat);
    dockLight.position.set(xPos, 8.2, -22.4);
    buildingGroup.add(dockLight);
  }

  // 4. Enseigne lumineuse Transporter-Pro en façade
  const signGeo = new THREE.BoxGeometry(26, 2.4, 0.4);
  const signMat = new THREE.MeshStandardMaterial({
    color: 0x0052CC,
    emissive: COLORS.accentBlue,
    emissiveIntensity: 0.4,
    roughness: 0.3,
  });
  const sign = new THREE.Mesh(signGeo, signMat);
  sign.position.set(0, 11.5, -22.7);
  buildingGroup.add(sign);

  return buildingGroup;
};

/**
 * Crée un camion poids lourd de la flotte (tracteur + semi-remorque).
 */
export const createFleetTruck = (data) => {
  const truck = new THREE.Group();
  truck.name = `Truck_${data.tracking_id || data.id}`;
  truck.userData = { ...data, isTruck: true };

  const statusColor = COLORS.status[data.status] || COLORS.status.pending;

  // --- SEMI-REMORQUE (Trailer) ---
  const trailerGeo = new THREE.BoxGeometry(4.2, 4.4, 10.5);
  const trailerMat = new THREE.MeshStandardMaterial({
    color: COLORS.truckTrailer,
    roughness: 0.4,
    metalness: 0.3,
  });
  const trailer = new THREE.Mesh(trailerGeo, trailerMat);
  trailer.position.set(0, 3.2, -1.5);
  trailer.castShadow = true;
  trailer.receiveShadow = true;
  truck.add(trailer);

  // Bande latérale bleue Transporter-Pro sur la remorque
  const stripeGeo = new THREE.BoxGeometry(4.25, 0.6, 9.8);
  const stripeMat = new THREE.MeshStandardMaterial({
    color: COLORS.accentBlue,
    emissive: COLORS.accentBlue,
    emissiveIntensity: 0.25,
  });
  const stripe = new THREE.Mesh(stripeGeo, stripeMat);
  stripe.position.set(0, 3.2, -1.5);
  truck.add(stripe);

  // --- CABINE DU TRACTEUR (Cab) ---
  const cabGeo = new THREE.BoxGeometry(4.0, 4.0, 3.8);
  const cabMat = new THREE.MeshStandardMaterial({
    color: COLORS.truckCab,
    roughness: 0.3,
    metalness: 0.5,
  });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 2.8, 5.2);
  cab.castShadow = true;
  cab.receiveShadow = true;
  truck.add(cab);

  // Pare-brise avant
  const glassGeo = new THREE.BoxGeometry(3.6, 1.6, 0.2);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.1,
    metalness: 0.9,
  });
  const windshield = new THREE.Mesh(glassGeo, glassMat);
  windshield.position.set(0, 3.6, 7.15);
  truck.add(windshield);

  // Phares avant (LED blanches)
  const lightGeo = new THREE.BoxGeometry(0.8, 0.4, 0.1);
  const lightMat = new THREE.MeshBasicMaterial({ color: COLORS.headlight });
  
  const lightL = new THREE.Mesh(lightGeo, lightMat);
  lightL.position.set(-1.3, 1.6, 7.15);
  truck.add(lightL);

  const lightR = new THREE.Mesh(lightGeo, lightMat);
  lightR.position.set(1.3, 1.6, 7.15);
  truck.add(lightR);

  // Feux arrière remorque
  const tailGeo = new THREE.BoxGeometry(0.6, 0.3, 0.1);
  const tailMat = new THREE.MeshBasicMaterial({ color: COLORS.taillight });
  
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(-1.6, 1.4, -6.8);
  truck.add(tailL);

  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(1.6, 1.4, -6.8);
  truck.add(tailR);

  // --- ROUES (6 roues) ---
  const wheelGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: COLORS.wheel, roughness: 0.9 });

  const wheelPositions = [
    [-2.0, 0.9, 5.0],   // Cabine avant G
    [2.0, 0.9, 5.0],    // Cabine avant D
    [-2.0, 0.9, -3.5],  // Remorque essieu 1 G
    [2.0, 0.9, -3.5],   // Remorque essieu 1 D
    [-2.0, 0.9, -5.5],  // Remorque essieu 2 G
    [2.0, 0.9, -5.5],   // Remorque essieu 2 D
  ];

  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    truck.add(wheel);
  });

  // --- BALISE HOLOGRAPHIQUE DE STATUT FLOTTE ---
  // Gyrophare / indicateur dynamique
  const beaconGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
  const beaconMat = new THREE.MeshBasicMaterial({ color: statusColor });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 5.0, 5.2);
  beacon.name = 'Beacon';
  truck.add(beacon);

  // Anneau flottant au-dessus du camion (pour clic / détection visuelle)
  const pinGeo = new THREE.TorusGeometry(1.6, 0.12, 8, 24);
  const pinMat = new THREE.MeshBasicMaterial({
    color: statusColor,
    transparent: true,
    opacity: 0.85,
  });
  const halo = new THREE.Mesh(pinGeo, pinMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.set(0, 7.8, 0);
  halo.name = 'Halo';
  truck.add(halo);

  return truck;
};
