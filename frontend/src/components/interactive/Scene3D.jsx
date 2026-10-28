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

  useEffect(() => {
    if (!isWebGLAvailable()) setHasWebGL(false);
  }, []);

  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scene lumineuse & contrastée (pas de brouillard étouffant)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.background);
    scene.fog = new THREE.Fog(COLORS.background, 90, 220); // Brouillard doux très lointain
    sceneRef.current = scene;

    // 2. Caméra isométrique optimale (vue plongeante 3/4 mettant en valeur les cabines et les quais)
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(36, aspect, 0.5, 600);
    camera.position.set(46, 38, 52);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    // 3. Renderer WebGL haute fidélité
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35; // Luminosité rehaussée pour une visibilité cristalline

    containerRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls avec inertie fluide
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.08;
    controls.minDistance = 15;
    controls.maxDistance = 140;
    controls.target.set(0, 2, -2);
    controlsRef.current = controls;

    // 5. Éclairage Studio Fintech 3 Points (Fini l'effet "trou noir")
    // A. Éclairage ambiant puissant pour déboucher tous les détails
    const ambientLight = new THREE.AmbientLight(0x475569, 2.2);
    scene.add(ambientLight);

    // B. Lumière hémisphérique (ciel bleuté / sol ardoise)
    const hemiLight = new THREE.HemisphereLight(0x93C5FD, 0x1E293B, 1.4);
    scene.add(hemiLight);

    // C. Lumière clé du soleil avec ombres nettes
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.6);
    sunLight.position.set(45, 65, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 180;
    sunLight.shadow.camera.left = -65;
    sunLight.shadow.camera.right = 65;
    sunLight.shadow.camera.top = 65;
    sunLight.shadow.camera.bottom = -65;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // D. Éclairage de contour Cyan néon (fait ressortir les arrêtes des camions et du dépôt)
    const rimLight = new THREE.DirectionalLight(0x38BDF8, 1.8);
    rimLight.position.set(-45, 30, -40);
    scene.add(rimLight);

    // E. Éclairage d'appoint frontal chaud
    const frontFill = new THREE.DirectionalLight(0xFDE68A, 1.0);
    frontFill.position.set(20, 20, 45);
    scene.add(frontFill);

    // 6. Environnement statique
    const ground = createDepotGround();
    scene.add(ground);

    const warehouse = createWarehouseBuilding();
    scene.add(warehouse);

    // 7. Groupe de camions
    const trucksGroup = new THREE.Group();
    trucksGroup.name = 'TrucksGroup';
    scene.add(trucksGroup);
    trucksGroupRef.current = trucksGroup;

    // 8. ResizeObserver
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

    // 9. Boucle d'animation
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      controls.update();

      // Faire pivoter les étiquettes et badges face à la caméra (Billboard effect)
      if (trucksGroupRef.current) {
        trucksGroupRef.current.children.forEach((truck) => {
          const badge = truck.getObjectByName('BadgeLabel');
          if (badge && camera) {
            badge.quaternion.copy(camera.quaternion);
          }

          if (!prefersReducedMotion) {
            const halo = truck.getObjectByName('Halo');
            if (halo) {
              halo.rotation.z = elapsedTime * 1.8;
              halo.position.y = 8.2 + Math.sin(elapsedTime * 2.5 + (truck.userData.idIndex || 0)) * 0.3;
            }

            // Déplacement fluide sur la boucle routière pour les camions en transit
            if (truck.userData.status === 'in_transit' && truck.userData.trackAngle !== undefined) {
              truck.userData.trackAngle += 0.0035;
              const radius = 50;
              const x = Math.cos(truck.userData.trackAngle) * radius;
              const z = Math.sin(truck.userData.trackAngle) * radius;
              truck.position.set(x, 0, z);
              truck.rotation.y = -truck.userData.trackAngle + Math.PI / 2;
            }
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      controls.dispose();
      disposeHierarchy(scene);
      renderer.dispose();
    };
  }, [hasWebGL, prefersReducedMotion]);

  // Synchronisation des camions avec les données
  useEffect(() => {
    if (!trucksGroupRef.current) return;

    const group = trucksGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      disposeHierarchy(child);
    }

    let sourceData = deliveries;
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
        // Positionnés aux quais : Remorque calée au quai, CABINE TOURNÉE VERS L'AVANT
        const x = dockPositions[dockIndex % dockPositions.length];
        truck.position.set(x, 0, -11);
        truck.rotation.y = 0; // Cabine orientée face à l'utilisateur (vue sur la calandre et phares)
        dockIndex++;
      } else if (item.status === 'in_transit') {
        // En circulation sur l'anneau routier
        const baseAngle = (inTransitIndex * (Math.PI / 2)) + 0.6;
        truck.userData.trackAngle = baseAngle;
        const radius = 50;
        truck.position.set(Math.cos(baseAngle) * radius, 0, Math.sin(baseAngle) * radius);
        truck.rotation.y = -baseAngle + Math.PI / 2;
        inTransitIndex++;
      } else {
        // Stationnement d'attente : Orientés en 3/4 élégant (angle 45° vers la caméra)
        const x = -32 + (parkIndex * 16);
        truck.position.set(x, 0, 24);
        truck.rotation.y = -Math.PI / 4; // Angle dynamique montrant à la fois cabine et flanc
        parkIndex++;
      }

      group.add(truck);
    });
  }, [deliveries, filter]);

  // Bascule caméra (Isométrique ou Vue du dessus 2D)
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (viewMode === 'top') {
      camera.position.set(0, 95, -2);
      controls.target.set(0, 0, -2);
    } else {
      camera.position.set(46, 38, 52);
      controls.target.set(0, 2, -2);
    }
    controls.update();
  }, [viewMode]);

  // Raycasting & Clic
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
    <div className="relative w-full h-full min-h-[560px] rounded-2xl overflow-hidden border border-[#27272A] bg-gradient-to-b from-[#0B0F19] to-[#080B12] shadow-2xl">
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
          className="absolute z-20 pointer-events-none px-3.5 py-2.5 rounded-xl bg-[#111827]/95 border border-[#38BDF8]/40 shadow-2xl backdrop-blur-md text-xs space-y-0.5"
        >
          <div className="font-mono font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-ping" />
            <span>{tooltip.tracking_id}</span>
          </div>
          <div className="text-zinc-300 text-[11px] font-medium">{tooltip.driver_name}</div>
          <div className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
            {tooltip.status === 'in_transit' ? '• En transit routier' : 
             tooltip.status === 'delivered' ? '• Mission livrée' : '• Au quai de chargement'}
          </div>
        </div>
      )}

      {/* Légende interactive de navigation en bas à gauche */}
      <div className="absolute bottom-3.5 left-3.5 z-10 hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#0B0F19]/85 backdrop-blur-md border border-[#27272A] text-[11px] text-zinc-300 shadow-lg">
        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-white font-mono text-[10px]">Clic G</kbd> Pivoter</span>
        <span className="text-zinc-600">•</span>
        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-white font-mono text-[10px]">Clic D</kbd> Déplacer</span>
        <span className="text-zinc-600">•</span>
        <span className="flex items-center gap-1.5"><kbd className="px-1.5 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-white font-mono text-[10px]">Molette</kbd> Zoom</span>
      </div>
    </div>
  );
};

export default Scene3D;
