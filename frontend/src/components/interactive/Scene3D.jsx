import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  createDepotGround, 
  createWarehouseBuilding, 
  createFleetTruck, 
  disposeHierarchy, 
  COLORS 
} from './DepotKit';
import { AlertCircle, RotateCcw } from 'lucide-react';

/**
 * Vérifie si le navigateur et le GPU supportent WebGL.
 */
const isWebGLAvailable = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export const Scene3D = ({
  deliveries = [],
  drivers = [],
  onSelectTruck,
  selectedTruckId,
  viewMode = 'iso', // 'iso' | 'top'
  filter = 'all',   // 'all' | 'in_transit' | 'dock' | 'delivered'
  onFallbackToClassic,
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const trucksGroupRef = useRef(null);
  const animFrameId = useRef(null);
  const hoveredObjectRef = useRef(null);

  const [hasWebGL, setHasWebGL] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  // Détection WebGL au montage
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setHasWebGL(false);
    }
  }, []);

  // Détection du mode mouvement réduit (accessibilité)
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialisation de la scène Three.js
  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene & Brouillard sombre d'ambiance
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.FogExp2(COLORS.background, 0.008);
    sceneRef.current = scene;

    // 2. Camera Isométrique
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(38, aspect, 0.5, 500);
    camera.position.set(55, 45, 55);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer WebGL avec ombres douces
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    containerRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.05; // Empêche de passer sous le sol
    controls.minDistance = 20;
    controls.maxDistance = 150;
    controls.target.set(0, 2, -6);
    controlsRef.current = controls;

    // 5. Éclairage
    const ambientLight = new THREE.AmbientLight(0x282E3D, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x60A5FA, 0x111317, 0.6);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 1.8);
    sunLight.position.set(40, 60, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 160;
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    scene.add(sunLight);

    // 6. Environnement statique du dépôt
    const ground = createDepotGround();
    scene.add(ground);

    const warehouse = createWarehouseBuilding();
    scene.add(warehouse);

    // 7. Groupe de camions dynamiques
    const trucksGroup = new THREE.Group();
    trucksGroup.name = 'TrucksGroup';
    scene.add(trucksGroup);
    trucksGroupRef.current = trucksGroup;

    // 8. Redimensionnement réactif
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    // 9. Boucle de rendu
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Mettre à jour les contrôles
      controls.update();

      // Animation des camions en transit si pas de mode réduit
      if (!prefersReducedMotion && trucksGroupRef.current) {
        trucksGroupRef.current.children.forEach((truck) => {
          // Animation du halo
          const halo = truck.getObjectByName('Halo');
          if (halo) {
            halo.rotation.z = elapsedTime * 1.5;
            halo.position.y = 7.8 + Math.sin(elapsedTime * 2.5 + (truck.userData.idIndex || 0)) * 0.25;
          }

          // Déplacement des camions en transit sur la boucle routière
          if (truck.userData.status === 'in_transit' && truck.userData.trackAngle !== undefined) {
            truck.userData.trackAngle += 0.003;
            const radius = 50;
            const x = Math.cos(truck.userData.trackAngle) * radius;
            const z = Math.sin(truck.userData.trackAngle) * radius;
            truck.position.set(x, 0, z);
            truck.rotation.y = -truck.userData.trackAngle + Math.PI / 2;
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Nettoyage au démontage
    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      controls.dispose();
      disposeHierarchy(scene);
      renderer.dispose();
    };
  }, [hasWebGL, prefersReducedMotion]);

  // Synchronisation des camions avec les données réelles (Single Source of Truth)
  useEffect(() => {
    if (!trucksGroupRef.current) return;

    const group = trucksGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      disposeHierarchy(child);
    }

    // Préparer la liste des missions à afficher
    let sourceData = deliveries;

    // Si aucune livraison n'existe encore en base, utiliser un jeu de simulation réaliste
    if (!sourceData || sourceData.length === 0) {
      sourceData = [
        {
          id: 'demo-1',
          tracking_id: 'TP-DEMO-01',
          driver_name: 'Alexandre Mercier',
          status: 'in_transit',
          origin: 'Dépôt Central Paris',
          destination: 'Plateforme Lyon St-Exupéry',
          isDemo: true,
        },
        {
          id: 'demo-2',
          tracking_id: 'TP-DEMO-02',
          driver_name: 'Marc Fontana',
          status: 'pending',
          origin: 'Quai 01 Dépôt Nord',
          destination: 'Hub Logistique Lille',
          isDemo: true,
        },
        {
          id: 'demo-3',
          tracking_id: 'TP-DEMO-03',
          driver_name: 'Sophie Laurent',
          status: 'delivered',
          origin: 'Dépôt Central',
          destination: 'Centre Commercial Marseille',
          isDemo: true,
        },
      ];
    }

    // Filtrer selon l'état sélectionné dans le HUD
    const filtered = sourceData.filter((item) => {
      if (filter === 'all') return true;
      if (filter === 'in_transit') return item.status === 'in_transit';
      if (filter === 'dock') return item.status === 'pending' || item.status === 'assigned';
      if (filter === 'delivered') return item.status === 'delivered';
      return true;
    });

    const dockPositions = [-24, -8, 8, 24];
    let dockIndex = 0;
    let inTransitIndex = 0;
    let parkIndex = 0;

    filtered.forEach((item, index) => {
      const truck = createFleetTruck({
        ...item,
        idIndex: index,
      });

      if (item.status === 'pending' || item.status === 'assigned') {
        // Positionnement aux quais de déchargement
        const x = dockPositions[dockIndex % dockPositions.length];
        truck.position.set(x, 0, -14);
        truck.rotation.y = 0; // Tourné vers le quai
        dockIndex++;
      } else if (item.status === 'in_transit') {
        // Positionnement sur l'anneau routier périphérique
        const baseAngle = (inTransitIndex * (Math.PI / 2)) + 0.5;
        truck.userData.trackAngle = baseAngle;
        const radius = 50;
        truck.position.set(Math.cos(baseAngle) * radius, 0, Math.sin(baseAngle) * radius);
        truck.rotation.y = -baseAngle + Math.PI / 2;
        inTransitIndex++;
      } else {
        // Positionnement dans les baies de stationnement d'attente
        const x = -30 + (parkIndex * 15);
        truck.position.set(x, 0, 26);
        truck.rotation.y = Math.PI;
        parkIndex++;
      }

      group.add(truck);
    });
  }, [deliveries, filter]);

  // Changement d'angle de caméra (Isométrique ou Vue du Dessus 2D)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (viewMode === 'top') {
      camera.position.set(0, 95, -5);
      controls.target.set(0, 0, -5);
    } else {
      camera.position.set(55, 45, 55);
      controls.target.set(0, 2, -6);
    }
    controls.update();
  }, [viewMode]);

  // Raycasting : Détection du survol et clic souris
  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current || !sceneRef.current || !cameraRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    if (!trucksGroupRef.current) return;
    const intersects = raycaster.intersectObjects(trucksGroupRef.current.children, true);

    if (intersects.length > 0) {
      let rootTruck = intersects[0].object;
      while (rootTruck.parent && rootTruck.parent !== trucksGroupRef.current) {
        rootTruck = rootTruck.parent;
      }

      containerRef.current.style.cursor = 'pointer';
      hoveredObjectRef.current = rootTruck;

      // Afficher tooltip flottant
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        tracking_id: rootTruck.userData?.tracking_id || 'TRP',
        driver_name: rootTruck.userData?.driver_name || 'Chauffeur',
        status: rootTruck.userData?.status || 'pending',
      });
    } else {
      containerRef.current.style.cursor = 'default';
      hoveredObjectRef.current = null;
      setTooltip(null);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredObjectRef.current && hoveredObjectRef.current.userData) {
      onSelectTruck(hoveredObjectRef.current.userData);
    }
  }, [onSelectTruck]);

  // Si WebGL n'est pas disponible, affiche une vue dégradée élégante (Règle 5)
  if (!hasWebGL) {
    return (
      <div className="w-full h-full min-h-[500px] flex items-center justify-center p-6 bg-[#0E0E11] border border-[#27272A] rounded-2xl">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Accélération matérielle 3D non disponible</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Votre navigateur ou appareil ne prend pas en charge WebGL. La vue classique avec tableaux et cartes reste pleinement fonctionnelle.
          </p>
          <button
            onClick={onFallbackToClassic}
            className="px-4 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium text-xs transition-colors"
          >
            Revenir à la vue classique
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-[#27272A] bg-[#0A0A0C]">
      {/* Canvas Three.js */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="w-full h-full outline-none focus:ring-1 focus:ring-[#0066FF]"
        tabIndex={0}
        aria-label="Scène 3D interactive du dépôt logistique et de la flotte routière"
      />

      {/* Tooltip au survol */}
      {tooltip && (
        <div
          style={{ left: `${tooltip.x + 14}px`, top: `${tooltip.y + 14}px` }}
          className="absolute z-20 pointer-events-none px-3 py-2 rounded-xl bg-[#121216]/95 border border-[#27272A] shadow-xl backdrop-blur-md text-xs space-y-0.5"
        >
          <div className="font-mono font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
            {tooltip.tracking_id}
          </div>
          <div className="text-zinc-400 text-[11px]">{tooltip.driver_name}</div>
          <div className="text-[10px] text-cyan-400 font-medium capitalize">
            {tooltip.status === 'in_transit' ? 'En transit routier' : 
             tooltip.status === 'delivered' ? 'Livré' : 'Au quai de chargement'}
          </div>
        </div>
      )}

      {/* Indicateur de contrôles 3D en bas à gauche */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A0A0B]/80 backdrop-blur-md border border-[#27272A] text-[11px] text-zinc-400">
        <span>🖱️ Clic gauche : Rotation</span>
        <span>•</span>
        <span>Clic droit : Pan</span>
        <span>•</span>
        <span>Molette : Zoom</span>
      </div>
    </div>
  );
};

export default Scene3D;
