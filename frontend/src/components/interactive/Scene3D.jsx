import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  createCompleteDiorama, 
  createFleetTruck, 
  disposeHierarchy, 
  DIORAMA_THEME 
} from './DepotKit';
import { AlertCircle } from 'lucide-react';

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
  viewMode = 'iso',
  filter = 'all',
  onFallbackToClassic,
  cameraControlAction = null, // 'zoomIn' | 'zoomOut' | 'reset' | null
  onCameraControlHandled = null,
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

  // Initialisation du diorama 3D
  useEffect(() => {
    if (!hasWebGL || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // 1. Scène avec fond architectural doux & lumineux (Style Novalis)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(DIORAMA_THEME.canvasBg);
    sceneRef.current = scene;

    // 2. Caméra à faible champ de vision (rendu quasi isométrique architectural)
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(26, aspect, 1, 800);
    // Position isométrique idéale 45°
    camera.position.set(65, 52, 65);
    camera.lookAt(0, 3, 0);
    cameraRef.current = camera;

    // 3. Renderer WebGL haute fidélité avec ombres douces de contact
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    containerRef.current.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls fluides
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.15; // Évite de passer sous la table
    controls.minDistance = 25;
    controls.maxDistance = 180;
    controls.target.set(0, 3, 0);
    controlsRef.current = controls;

    // 5. Éclairage Studio Solaire Chaud (Style Maquette Architecturale)
    // A. Lumière du soleil dorée & ombres douces
    const sunLight = new THREE.DirectionalLight(0xFFF7ED, 2.6);
    sunLight.position.set(55, 80, 45);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 20;
    sunLight.shadow.camera.far = 220;
    sunLight.shadow.camera.left = -75;
    sunLight.shadow.camera.right = 75;
    sunLight.shadow.camera.top = 75;
    sunLight.shadow.camera.bottom = -75;
    sunLight.shadow.bias = -0.0003;
    scene.add(sunLight);

    // B. Lumière hémisphérique (Ciel bleuté / Rebond terre chaud)
    const hemiLight = new THREE.HemisphereLight(0xBAE6FD, 0xFDE68A, 1.4);
    scene.add(hemiLight);

    // C. Lumière d'ambiance générale
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.3);
    scene.add(ambientLight);

    // D. Lumière de débouchage bleutée arrière
    const backFill = new THREE.DirectionalLight(0xE0F2FE, 0.9);
    backFill.position.set(-45, 35, -45);
    scene.add(backFill);

    // 6. Maquette Diorama complète (Socle, bureaux, cloisons, entrepôt, verdure, terrasse)
    const diorama = createCompleteDiorama();
    scene.add(diorama);

    // 7. Groupe des camions de la flotte
    const trucksGroup = new THREE.Group();
    trucksGroup.name = 'FleetTrucks';
    scene.add(trucksGroup);
    trucksGroupRef.current = trucksGroup;

    // 8. Gestion réactive du redimensionnement
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

      if (!prefersReducedMotion && trucksGroupRef.current) {
        trucksGroupRef.current.children.forEach((truck) => {
          const halo = truck.getObjectByName('Halo');
          if (halo) {
            halo.rotation.z = elapsedTime * 2;
            halo.position.y = 7.2 + Math.sin(elapsedTime * 2.5 + (truck.userData.idIndex || 0)) * 0.25;
          }

          // Déplacement des camions en transit sur la route au premier plan
          if (truck.userData.status === 'in_transit' && truck.userData.startX !== undefined) {
            truck.position.x += 0.08;
            if (truck.position.x > 50) truck.position.x = -50;
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
          origin: 'Hub Paris',
          destination: 'Lyon',
          isDemo: true,
        },
        {
          id: 'demo-2',
          tracking_id: 'TP-DEMO-02',
          driver_name: 'Bastien Jordan',
          status: 'pending',
          origin: 'Quai 01',
          destination: 'Lille',
          isDemo: true,
        },
        {
          id: 'demo-3',
          tracking_id: 'TP-DEMO-03',
          driver_name: 'Sophie Laurent',
          status: 'delivered',
          origin: 'Quai 02',
          destination: 'Marseille',
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

    // Positions de chargement devant l'entrepôt et sur la route
    let dockIndex = 0;
    let inTransitIndex = 0;
    let parkIndex = 0;

    filtered.forEach((item, index) => {
      const truck = createFleetTruck({
        ...item,
        idIndex: index,
      });

      if (item.status === 'pending' || item.status === 'assigned') {
        // Camion au quai de l'entrepôt (à droite du bâtiment, cabine orientée vers l'avant)
        const x = 32 + (dockIndex * 9);
        truck.position.set(x, 0, -22);
        truck.rotation.y = 0;
        dockIndex++;
      } else if (item.status === 'in_transit') {
        // Camion en circulation sur la route au premier plan
        truck.userData.startX = -35 + inTransitIndex * 35;
        truck.position.set(truck.userData.startX, 0, 32);
        truck.rotation.y = Math.PI / 2; // Roulant vers la droite
        inTransitIndex++;
      } else {
        // Camion en attente stationné
        const x = -40 + parkIndex * 14;
        truck.position.set(x, 0, 16);
        truck.rotation.y = -Math.PI / 3;
        parkIndex++;
      }

      group.add(truck);
    });
  }, [deliveries, filter]);

  // Actions de contrôle de caméra depuis les boutons du HUD (+, -, Reset)
  useEffect(() => {
    if (!cameraControlAction || !cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    if (cameraControlAction === 'zoomIn') {
      camera.position.multiplyScalar(0.85);
    } else if (cameraControlAction === 'zoomOut') {
      camera.position.multiplyScalar(1.15);
    } else if (cameraControlAction === 'reset') {
      camera.position.set(65, 52, 65);
      controls.target.set(0, 3, 0);
    } else if (cameraControlAction === 'rotate') {
      const angle = Math.PI / 4;
      const x = camera.position.x * Math.cos(angle) - camera.position.z * Math.sin(angle);
      const z = camera.position.x * Math.sin(angle) + camera.position.z * Math.cos(angle);
      camera.position.x = x;
      camera.position.z = z;
    }

    controls.update();
    onCameraControlHandled?.();
  }, [cameraControlAction, onCameraControlHandled]);

  // Raycasting & Clic souris
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
      <div className="w-full h-full min-h-[500px] flex items-center justify-center p-6 bg-[#F5F2EB] border border-[#E2DDD5] rounded-3xl">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">Accélération matérielle 3D non disponible</h3>
          <p className="text-xs text-zinc-600 leading-relaxed">
            Votre appareil ne prend pas en charge WebGL. La vue classique reste pleinement fonctionnelle.
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
    <div className="relative w-full h-full min-h-[640px] rounded-3xl overflow-hidden shadow-2xl border border-[#E5E0D8] bg-[#ECE8E1]">
      {/* Canvas Three.js */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        className="w-full h-full outline-none"
        tabIndex={0}
        aria-label="Diorama architectural 3D du siège et de la flotte Transporter-Pro"
      />

      {/* Tooltip au survol */}
      {tooltip && (
        <div
          style={{ left: `${tooltip.x + 16}px`, top: `${tooltip.y + 16}px` }}
          className="absolute z-20 pointer-events-none px-3.5 py-2.5 rounded-2xl bg-white/95 border border-zinc-200/80 shadow-xl backdrop-blur-md text-xs space-y-0.5 text-zinc-900"
        >
          <div className="font-mono font-bold text-zinc-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse" />
            <span>{tooltip.tracking_id}</span>
          </div>
          <div className="text-zinc-600 text-[11px] font-medium">{tooltip.driver_name}</div>
          <div className="text-[10px] text-[#0066FF] font-semibold uppercase tracking-wider">
            {tooltip.status === 'in_transit' ? '• En transit routier' : 
             tooltip.status === 'delivered' ? '• Mission livrée' : '• Au quai de chargement'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scene3D;
