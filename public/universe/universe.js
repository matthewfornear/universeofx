// universe.js - Solar System optimized for clarity: 10 planets, visibly orbiting dispersed moons with Z elevation
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Pre-load all textures before starting
const loader = new THREE.TextureLoader();
const texturePromises = [
  loader.loadAsync('/universe/textures/planets/2k_sun.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_mercury.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_mars.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_jupiter.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_saturn.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_uranus.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_neptune.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_ceres_fictional.jpg'),
  loader.loadAsync('/universe/textures/moons/2k_moon.jpg'),
  loader.loadAsync('/universe/textures/planets/2k_saturn_ring_alpha.png')
];

// Wait for all textures to load before starting
Promise.all([fetch('/universe/universeseed.json').then(res => res.json()), ...texturePromises])
  .then(([users, ...textures]) => {
    // Store loaded textures
    const [
      sunTexture,
      mercuryTexture,
      marsTexture,
      jupiterTexture,
      saturnTexture,
      uranusTexture,
      neptuneTexture,
      ceresTexture,
      moonTexture,
      ringTexture
    ] = textures;

    // Set texture properties
    textures.forEach(texture => {
      if (texture) {
        texture.encoding = THREE.sRGBEncoding;
        texture.needsUpdate = true;
      }
    });

    // Add validation for users array
    if (!Array.isArray(users) || users.length === 0) {
      console.error('No users loaded or malformed data:', users);
      return;
    }

    // Filter out users with 0 or null followers first
    users = users.filter(user => user && typeof user.followers === 'number' && user.followers > 0);
    console.log('Filtered users count:', users.length);

    const sorted = [...users].sort((a, b) => b.followers - a.followers);
    const sun = sorted[0];
    const maxFollowers = sun.followers;
    const planetUsers = sorted.slice(1, 101);
    const moonUsers = sorted.slice(11);

    // Store planet textures in an object for easy access
    const planetTextures = {
      mercury: mercuryTexture,
      mars: marsTexture,
      jupiter: jupiterTexture,
      saturn: saturnTexture,
      uranus: uranusTexture,
      neptune: neptuneTexture,
      ceres: ceresTexture
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 1500, 3000);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);
    camera.position.set(0, 600, 1600);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Starfield background
    const stars = new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(
          Array.from({ length: 3000 * 3 }, () => THREE.MathUtils.randFloatSpread(4000)),
          3
        )
      ),
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.7,
        sizeAttenuation: true,
        opacity: 0.3,
        transparent: true
      })
    );
    scene.add(stars);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    new RGBELoader()
      .setPath('/universe/HDRI/')
      .load('1.hdr', texture => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        // scene.environment = envMap; // Disabled for debug/lighting
        // scene.background = envMap; // Disabled for debug/lighting
        texture.dispose();
        pmremGenerator.dispose();
      });

    // Add a stronger ambient light for debug
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 500;
    controls.maxDistance = 3000;

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.2, 0.6);
    composer.addPass(bloomPass);

    const createGlowMaterial = (color = 0xffffff, intensity = 1, size = 64) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      const c = new THREE.Color(color);
      gradient.addColorStop(0, `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, ${intensity * 0.1})`);
      gradient.addColorStop(1, `rgba(${c.r * 255}, ${c.g * 255}, ${c.b * 255}, 0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      const texture = new THREE.CanvasTexture(canvas);
      texture.encoding = THREE.sRGBEncoding;
      texture.anisotropy = 1;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      return new THREE.SpriteMaterial({ map: texture, blending: THREE.AdditiveBlending, transparent: true });
    };

    // Create shared glow materials
    const sharedPlanetGlowMaterial = createGlowMaterial(0xffffff, 0.5);
    const sharedMoonGlowMaterial = createGlowMaterial(0xaaaaaa, 0.4);

    const planetNames = ['mercury','mars','jupiter','saturn','uranus','neptune','ceres'];

    // --- SOLAR SYSTEMS DATA STRUCTURE ---
    // Group users into solar systems of up to 10 users each
    const systems = [];
    for (let i = 0; i < users.length; i += 10) {
      systems.push(users.slice(i, i + 10));
    }
    // For each system, the first user is the sun (most followers in that group)
    const solarSystems = systems.map(systemUsers => {
      const sorted = [...systemUsers].sort((a, b) => b.followers - a.followers);
      const sun = sorted[0];
      const planets = sorted.slice(1);
      return { sun, planets };
    });

    let mainSystemIndex = 0;
    let maxFollowersMain = 0;
    solarSystems.forEach((sys, i) => {
      if (sys.sun.followers > maxFollowersMain) {
        maxFollowersMain = sys.sun.followers;
        mainSystemIndex = i;
      }
    });

    // --- Minimap hover state (fix ReferenceError) ---
    let minimapMouse = { x: 0, y: 0 };
    let minimapHoveredIndex = null;

    // --- GALAXY LAYOUT: RANDOM NON-OVERLAPPING SPHERE ---
    function randomPointInSphere(radius) {
      let u = Math.random();
      let v = Math.random();
      let theta = 2 * Math.PI * u;
      let phi = Math.acos(2 * v - 1);
      let r = Math.cbrt(Math.random()) * radius;
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
      };
    }
    function distance3D(a, b) {
      return Math.sqrt((a.x-b.x)**2 + (a.y-b.y)**2 + (a.z-b.z)**2);
    }
    const galaxyRadius = 6000;
    const minDist = 500;
    const edgeBuffer = 300;
    const solarSystemPositions = [];
    for (let i = 0; i < solarSystems.length; i++) {
      let pt, tries = 0;
      do {
        pt = randomPointInSphere(galaxyRadius - edgeBuffer);
        tries++;
      } while (
        solarSystemPositions.some(p => distance3D(p, pt) < minDist) && tries < 1000
      );
      solarSystemPositions.push(pt);
    }

    // --- CONSTELLATION MINIMAP GUI ---
    // Compute bounding box of all solar system positions in galaxy space
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < solarSystemPositions.length; i++) {
      const pos = solarSystemPositions[i];
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
      if (pos.y < minY) minY = pos.y;
      if (pos.y > maxY) maxY = pos.y;
      if (pos.z < minZ) minZ = pos.z;
      if (pos.z > maxZ) maxZ = pos.z;
    }
    // Calculate the absolute center of the universe bounding box
    const galaxyCenter = {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    };
    // Add margin
    const margin = 60;
    minX -= margin; maxX += margin; minY -= margin; maxY += margin;
    const minimapWidth = Math.ceil((maxX - minX) / (galaxyRadius * 2) * 600) + margin * 2;
    const minimapHeight = Math.ceil((maxY - minY) / (galaxyRadius * 2) * 600) + margin * 2;
    const minimapCanvas = document.createElement('canvas');
    minimapCanvas.width = minimapWidth;
    minimapCanvas.height = minimapHeight;
    minimapCanvas.style.position = 'fixed';
    minimapCanvas.style.top = '24px';
    minimapCanvas.style.right = '24px';
    minimapCanvas.style.width = minimapWidth + 'px';
    minimapCanvas.style.height = minimapHeight + 'px';
    minimapCanvas.style.zIndex = '2001';
    minimapCanvas.style.pointerEvents = 'auto';
    minimapCanvas.style.background = 'transparent';
    minimapCanvas.style.borderRadius = '18px';
    minimapCanvas.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)';
    document.body.appendChild(minimapCanvas);
    const minimapCtx = minimapCanvas.getContext('2d');
    let focusedSystemIndex = null;

    // --- Minimap label and instructions ---
    const minimapLabel = document.createElement('div');
    minimapLabel.innerText = 'Minimap';
    minimapLabel.style.position = 'fixed';
    minimapLabel.style.top = '30px';
    minimapLabel.style.right = (24 + minimapWidth/2 - 60) + 'px';
    minimapLabel.style.width = '120px';
    minimapLabel.style.textAlign = 'center';
    minimapLabel.style.fontWeight = 'bold';
    minimapLabel.style.fontSize = '18px';
    minimapLabel.style.color = '#fff';
    minimapLabel.style.zIndex = '2002';
    minimapLabel.style.pointerEvents = 'none';
    minimapLabel.style.textShadow = '0 2px 8px #000';
    document.body.appendChild(minimapLabel);
    const minimapInstr = document.createElement('div');
    minimapInstr.innerText = 'click a star system to visit it';
    minimapInstr.style.position = 'fixed';
    minimapInstr.style.top = '54px';
    minimapInstr.style.right = (24 + minimapWidth/2 - 100) + 'px';
    minimapInstr.style.width = '200px';
    minimapInstr.style.textAlign = 'center';
    minimapInstr.style.fontSize = '13px';
    minimapInstr.style.color = '#fff';
    minimapInstr.style.zIndex = '2002';
    minimapInstr.style.pointerEvents = 'none';
    minimapInstr.style.textShadow = '0 2px 8px #000';
    document.body.appendChild(minimapInstr);

    // Update galaxyToMinimap to use bounding box
    function galaxyToMinimap(x, y) {
      const scaleX = (minimapWidth - margin * 2) / (maxX - minX);
      const scaleY = (minimapHeight - margin * 2) / (maxY - minY);
      return {
        x: margin + (x - minX) * scaleX,
        y: minimapHeight - (margin + (y - minY) * scaleY)
      };
    }

    // Helper to get camera yaw (rotation around Y axis)
    function getCameraYaw() {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      return Math.atan2(dir.x, dir.z);
    }

    // --- CREATE SIMPLE (FAKE) SOLAR SYSTEMS FOR LOD ---
    const allMeshes = [];
    const moonOrbitGroups = [];
    const simpleSystemGroups = [];
    solarSystems.forEach((system, sysIdx) => {
      const { sun, planets } = system;
      const systemGroup = new THREE.Object3D();
      const sysPos = solarSystemPositions[sysIdx];
      systemGroup.position.set(sysPos.x, sysPos.y, sysPos.z);
      scene.add(systemGroup);
      simpleSystemGroups.push(systemGroup);

      // Sun (simple yellow sphere)
      const sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(12, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffcc33 })
      );
      sunMesh.userData = { ...sun, isSun: true, systemIndex: sysIdx };
      sunMesh.position.set(0, 0, 0);
      systemGroup.add(sunMesh);
      allMeshes.push(sunMesh);

      // Planets (simple blue/gray spheres)
      planets.forEach((u, i) => {
        const orbitRadius = 80 + i * 60;
        let size = 5 + 10 * ((u.followers || 1) / (sun.followers || 1));
        size = !isFinite(size) || size <= 0 ? 2 : size;
        const orbitGroup = new THREE.Object3D();
        orbitGroup.rotation.y = Math.random() * Math.PI * 2;
        systemGroup.add(orbitGroup);
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 16, 16),
          new THREE.MeshBasicMaterial({ color: 0xaaaaff })
        );
        mesh.userData = { ...u, isSun: false, systemIndex: sysIdx };
        mesh.position.set(orbitRadius, 0, 0);
        orbitGroup.add(mesh);
        allMeshes.push(mesh);
      });
    });

    // --- CREATE POINT CLOUD FOR NON-FOCUSED SYSTEMS ---
    let pointsCloud = null;
    function createPointsCloud(excludeIdx = null) {
      if (pointsCloud) {
        scene.remove(pointsCloud);
        pointsCloud.geometry.dispose();
        pointsCloud.material.dispose();
        pointsCloud = null;
      }
      const positions = [];
      const colors = [];
      for (let i = 0; i < solarSystemPositions.length; i++) {
        if (i === excludeIdx) continue; // skip focused system
        const pos = solarSystemPositions[i];
        positions.push(pos.x, pos.y, pos.z);
        // Color: yellow for main system, blue for others
        const color = (i === mainSystemIndex) ? new THREE.Color(0xffcc33) : new THREE.Color(0xaaaaff);
        colors.push(color.r, color.g, color.b);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      // Use a soft round sprite for points
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 64;
      const ctx = sprite.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255,255,220,1)');
      gradient.addColorStop(0.5, 'rgba(255,255,220,0.5)');
      gradient.addColorStop(1, 'rgba(255,255,220,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      const pointTexture = new THREE.CanvasTexture(sprite);
      const material = new THREE.PointsMaterial({
        size: 32,
        map: pointTexture,
        vertexColors: true,
        transparent: true,
        alphaTest: 0.01,
        sizeAttenuation: true,
        depthWrite: false
      });
      pointsCloud = new THREE.Points(geometry, material);
      pointsCloud.renderOrder = 1;
      scene.add(pointsCloud);
    }

    // --- DETAILED SYSTEM HANDLING ---
    let detailedSystemGroup = null;
    function removeDetailedSystem() {
      if (detailedSystemGroup) {
        scene.remove(detailedSystemGroup);
        detailedSystemGroup = null;
      }
    }
    // --- GLOBAL UNIQUE USER POOL ---
    const usedHandlesGlobal = new Set();
    function createDetailedSystem(sysIdx) {
      removeDetailedSystem();
      if (simpleSystemGroups[sysIdx]) simpleSystemGroups[sysIdx].visible = false;
      const system = solarSystems[sysIdx];
      const { sun, planets } = system;
      const sysPos = solarSystemPositions[sysIdx];
      if (!sun || !isFinite(sysPos.x) || !isFinite(sysPos.y) || !isFinite(sysPos.z)) {
        console.warn('Skipping system due to invalid data', { sun, sysPos, sysIdx });
        return;
      }
      const systemGroup = new THREE.Object3D();
      systemGroup.position.set(sysPos.x, sysPos.y, sysPos.z);
      scene.add(systemGroup);
      detailedSystemGroup = systemGroup;
      const sunMaterial = new THREE.MeshStandardMaterial({
        map: sunTexture,
        emissive: new THREE.Color(0xffffaa),
        emissiveIntensity: 2
      });
      const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 64), sunMaterial);
      sunMesh.userData = { ...sun, isSun: true, systemIndex: sysIdx };
      sunMesh.position.set(0, 0, 0);
      sunMesh.castShadow = true;
      sunMesh.receiveShadow = true;
      systemGroup.add(sunMesh);
      const sunLight = new THREE.PointLight(0xffffff, 2, 800);
      sunLight.position.set(0, 0, 0);
      sunLight.castShadow = true;
      sunMesh.add(sunLight);
      const planetOrbitGroups = [];
      const maxFollowers = sun.followers > 0 ? sun.followers : 1;
      // --- Unique moon user pool (global) ---
      usedHandlesGlobal.add(sun.handle);
      planets.forEach(p => usedHandlesGlobal.add(p.handle));
      let globalUserIdx = 0;
      planets.forEach((u, i) => {
        if (!u || !u.handle) return;
        const orbitRadius = 80 + i * 60;
        let size = 5 + 10 * ((u.followers || 1) / maxFollowers);
        size = !isFinite(size) || size <= 0 ? 2 : size;
        const speed = 0.005 * (1 / (size + 1));
        const orbitGroup = new THREE.Object3D();
        orbitGroup.rotation.y = Math.random() * Math.PI * 2;
        systemGroup.add(orbitGroup);
        planetOrbitGroups.push({ group: orbitGroup, speed });
        const textureKey = planetNames[i % planetNames.length];
        const texture = planetTextures[textureKey];
        let metalness = 0.3, roughness = 0.8;
        if (["mercury","mars","ceres"].includes(textureKey)) {
          metalness = 0.2; roughness = 0.95;
        } else {
          metalness = 0.5; roughness = 0.6;
        }
        let material;
        if (texture) {
          material = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xffffff,
            metalness,
            roughness
          });
        } else {
          material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        }
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(size, 32, 32),
          material
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { ...u, isSun: false, systemIndex: sysIdx };
        mesh.position.set(orbitRadius, 0, 0);
        orbitGroup.add(mesh);
        const glow = new THREE.Sprite(sharedPlanetGlowMaterial);
        glow.scale.set(size * 1.1, size * 1.1, 1);
        mesh.add(glow);
        // Add moons with Z elevation
        const moonCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < moonCount; j++) {
          const moonDist = 20 + j * 4 + Math.random() * 3;
          let moonSize = size * 0.2;
          moonSize = !isFinite(moonSize) || moonSize <= 0 ? 0.5 : moonSize;
          const moonSpeed = 0.005 + 0.015 * (1 / moonSize);
          const moonOrbitGroup = new THREE.Object3D();
          moonOrbitGroup.rotation.x = Math.random() * Math.PI * 0.5;
          moonOrbitGroup.rotation.y = Math.random() * Math.PI * 2;
          moonOrbitGroup.rotation.z = Math.random() * Math.PI * 0.5;
          mesh.add(moonOrbitGroup);
          moonOrbitGroups.push({ group: moonOrbitGroup, speed: moonSpeed });
          // --- Assign a unique user to each moon (global, must have fewer followers than planet) ---
          let moonUser = null;
          let foundMoonUser = false;
          while (globalUserIdx < users.length) {
            const candidate = users[globalUserIdx];
            globalUserIdx++;
            if (!usedHandlesGlobal.has(candidate.handle) && candidate.followers < u.followers) {
              moonUser = candidate;
              usedHandlesGlobal.add(moonUser.handle);
              foundMoonUser = true;
              break;
            }
          }
          if (!foundMoonUser) break; // No valid moon user left for this planet
          const moonMesh = new THREE.Mesh(
            new THREE.SphereGeometry(moonSize, 16, 16),
            new THREE.MeshStandardMaterial({
              map: moonTexture,
              metalness: 0.1,
              roughness: 0.9
            })
          );
          moonMesh.castShadow = true;
          moonMesh.receiveShadow = true;
          moonMesh.userData = { ...moonUser, isSun: false, isMoon: true, systemIndex: sysIdx };
          const elevationAngle = (j / moonCount) * Math.PI * 2;
          let mx = moonDist * Math.cos(elevationAngle);
          let my = moonDist * Math.sin(elevationAngle) * 0.3;
          let mz = moonDist * Math.sin(elevationAngle);
          mx = !isFinite(mx) ? 0 : mx;
          my = !isFinite(my) ? 0 : my;
          mz = !isFinite(mz) ? 0 : mz;
          moonMesh.position.set(mx, my, mz);
          moonOrbitGroup.add(moonMesh);
          const moonGlow = new THREE.Sprite(sharedMoonGlowMaterial);
          moonGlow.scale.set(moonSize * 1.1, moonSize * 1.1, 1);
          moonMesh.add(moonGlow);
        }
      });
      systemGroup.userData.planetOrbitGroups = planetOrbitGroups;
      renderMinimap();
    }
    // When focus changes, restore the simple system group visibility
    function restoreSimpleSystem(sysIdx) {
      if (simpleSystemGroups[sysIdx]) simpleSystemGroups[sysIdx].visible = true;
    }
    // When minimap or focus changes, call restoreSimpleSystem(previousIdx) and createDetailedSystem(newIdx)

    // --- INTRO ANIMATION: ZOOM ON GALAXY, THEN FOCUS ON MAIN SYSTEM ---
    let introPhase = 0; // 0: pause, 1: galaxy zoom, 2: system focus, 3: done
    let introProgress = 0;
    let lockedMesh = null;
    const galaxyStart = { x: 0, y: galaxyRadius * 1.5, z: galaxyRadius * 2.2 };
    let focusAnim = null;
    let mouseEvent = null;

    const galaxyEnd = {
      x: solarSystemPositions[mainSystemIndex].x,
      y: solarSystemPositions[mainSystemIndex].y,
      z: solarSystemPositions[mainSystemIndex].z
    };

    // Tooltip DOM setup
    const tooltip = document.createElement('div');
    tooltip.style.position = 'absolute';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '3001';
    tooltip.style.transform = 'translateY(-50%)';
    tooltip.style.display = 'flex';
    tooltip.style.flexDirection = 'column';
    tooltip.style.alignItems = 'center';
    tooltip.style.justifyContent = 'center';
    tooltip.style.padding = '8px';
    tooltip.style.background = 'rgba(28,28,30,0.9)';
    tooltip.style.borderRadius = '12px';
    tooltip.style.backdropFilter = 'blur(6px)';
    tooltip.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
    tooltip.style.gap = '10px';

    const tooltipImageContainer = document.createElement('div');
    tooltipImageContainer.style.display = 'flex';
    tooltipImageContainer.style.justifyContent = 'center';
    tooltipImageContainer.style.alignItems = 'center';
    tooltipImageContainer.style.width = '100%';
    tooltipImageContainer.style.marginBottom = '8px';

    const tooltipImage = document.createElement('img');
    tooltipImage.style.width = '48px';
    tooltipImage.style.height = '48px';
    tooltipImage.style.objectFit = 'cover';
    tooltipImage.style.borderRadius = '50%';
    tooltipImage.style.boxShadow = '0 0 8px rgba(0,0,0,0.5)';
    tooltipImage.style.display = 'block';
    tooltipImage.style.margin = '0 auto';
    tooltipImageContainer.appendChild(tooltipImage);

    const tooltipText = document.createElement('div');
    tooltipText.style.color = '#fff';
    tooltipText.style.fontFamily = 'Inter, sans-serif';
    tooltipText.style.fontSize = '14px';
    tooltipText.style.display = 'flex';
    tooltipText.style.flexDirection = 'column';
    tooltipText.style.alignItems = 'center';
    tooltipText.style.justifyContent = 'center';
    tooltipText.style.textAlign = 'center';

    tooltip.appendChild(tooltipImageContainer);
    tooltip.appendChild(tooltipText);
    document.body.appendChild(tooltip);

    // Mouse event for raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    window.addEventListener('mousemove', event => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      mouseEvent = event;
    });

    // Add this function after camera/controls are defined
    function smoothFocusCamera(camera, controls, sunPos) {
      gsap.to(camera.position, {
        duration: 2,
        x: sunPos.x + 600,
        y: sunPos.y + 300,
        z: sunPos.z + 1000,
        ease: 'power2.inOut'
      });
      gsap.to(controls.target, {
        duration: 2,
        x: sunPos.x,
        y: sunPos.y,
        z: sunPos.z,
        ease: 'power2.inOut',
        onUpdate: () => controls.update()
      });
    }

    // Smoothly focus camera on a mesh
    function focusCameraOnMesh(mesh) {
      const pos = mesh.getWorldPosition(new THREE.Vector3());
      smoothFocusCamera(camera, controls, pos);
    }

    // --- FIND ME GUI RESTORE & AUTOCOMPLETE ---
    const findMeContainer = document.createElement('div');
    findMeContainer.style.position = 'fixed';
    findMeContainer.style.top = '32px';
    findMeContainer.style.left = '50%';
    findMeContainer.style.transform = 'translateX(-50%)';
    findMeContainer.style.zIndex = '3002';
    findMeContainer.style.background = 'rgba(40,40,60,0.95)';
    findMeContainer.style.color = '#fff';
    findMeContainer.style.fontFamily = 'Inter, sans-serif';
    findMeContainer.style.fontSize = '18px';
    findMeContainer.style.padding = '12px 24px';
    findMeContainer.style.borderRadius = '16px';
    findMeContainer.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)';
    findMeContainer.style.display = 'flex';
    findMeContainer.style.flexDirection = 'column';
    findMeContainer.style.alignItems = 'center';
    findMeContainer.style.gap = '8px';
    // Title
    const findMeTitle = document.createElement('div');
    findMeTitle.innerText = 'Find Me!';
    findMeTitle.style.fontWeight = 'bold';
    findMeTitle.style.marginBottom = '2px';
    findMeContainer.appendChild(findMeTitle);
    // Input
    const findMeInput = document.createElement('input');
    findMeInput.type = 'text';
    findMeInput.placeholder = 'Search username...';
    findMeInput.style.fontSize = '16px';
    findMeInput.style.padding = '6px 12px';
    findMeInput.style.borderRadius = '8px';
    findMeInput.style.border = 'none';
    findMeInput.style.outline = 'none';
    findMeInput.style.width = '220px';
    findMeInput.style.marginBottom = '0px';
    findMeContainer.appendChild(findMeInput);
    // Dropdown
    const findMeDropdown = document.createElement('div');
    findMeDropdown.style.position = 'absolute';
    findMeDropdown.style.top = '60px';
    findMeDropdown.style.left = '50%';
    findMeDropdown.style.transform = 'translateX(-50%)';
    findMeDropdown.style.background = 'rgba(28,28,30,0.98)';
    findMeDropdown.style.borderRadius = '12px';
    findMeDropdown.style.boxShadow = '0 4px 20px rgba(0,0,0,0.25)';
    findMeDropdown.style.padding = '4px 0';
    findMeDropdown.style.zIndex = '3003';
    findMeDropdown.style.minWidth = '220px';
    findMeDropdown.style.display = 'none';
    findMeContainer.appendChild(findMeDropdown);
    document.body.appendChild(findMeContainer);
    // Autocomplete logic
    let findMeResults = [];
    let findMeSelected = -1;
    findMeInput.addEventListener('input', () => {
      const val = findMeInput.value.trim().toLowerCase();
      if (!val) {
        findMeDropdown.style.display = 'none';
        findMeDropdown.innerHTML = '';
        findMeResults = [];
        findMeSelected = -1;
        return;
      }
      // Search users by handle (partial, case-insensitive)
      findMeResults = users.filter(u => u.handle && u.handle.toLowerCase().includes(val)).slice(0, 4);
      findMeDropdown.innerHTML = '';
      findMeResults.forEach((u, idx) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.padding = '6px 12px';
        row.style.cursor = 'pointer';
        row.style.background = idx === findMeSelected ? 'rgba(80,80,120,0.25)' : 'none';
        row.addEventListener('mouseenter', () => {
          findMeSelected = idx;
          Array.from(findMeDropdown.children).forEach((c, i) => c.style.background = i === idx ? 'rgba(80,80,120,0.25)' : 'none');
        });
        row.addEventListener('mouseleave', () => {
          findMeSelected = -1;
          Array.from(findMeDropdown.children).forEach((c) => c.style.background = 'none');
        });
        row.addEventListener('mousedown', (e) => {
          e.preventDefault();
          focusOnUser(u);
        });
        const img = document.createElement('img');
        img.src = `/pfp/${u.handle}.jpg`;
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.borderRadius = '50%';
        img.style.objectFit = 'cover';
        img.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)';
        row.appendChild(img);
        const handle = document.createElement('span');
        handle.innerText = '@' + u.handle;
        handle.style.fontSize = '15px';
        row.appendChild(handle);
        findMeDropdown.appendChild(row);
      });
      findMeDropdown.style.display = findMeResults.length ? 'block' : 'none';
      findMeSelected = -1;
    });
    findMeInput.addEventListener('keydown', (e) => {
      if (!findMeResults.length) return;
      if (e.key === 'ArrowDown') {
        findMeSelected = (findMeSelected + 1) % findMeResults.length;
        Array.from(findMeDropdown.children).forEach((c, i) => c.style.background = i === findMeSelected ? 'rgba(80,80,120,0.25)' : 'none');
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        findMeSelected = (findMeSelected - 1 + findMeResults.length) % findMeResults.length;
        Array.from(findMeDropdown.children).forEach((c, i) => c.style.background = i === findMeSelected ? 'rgba(80,80,120,0.25)' : 'none');
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (findMeSelected >= 0 && findMeSelected < findMeResults.length) {
          focusOnUser(findMeResults[findMeSelected]);
        } else if (findMeResults.length) {
          focusOnUser(findMeResults[0]);
        }
        e.preventDefault();
      }
    });
    function focusOnUser(user) {
      // Find which system this user is in
      let sysIdx = -1, planetIdx = -1;
      for (let i = 0; i < solarSystems.length; i++) {
        const sys = solarSystems[i];
        if (sys.sun.handle === user.handle) { sysIdx = i; planetIdx = -1; break; }
        const pIdx = sys.planets.findIndex(p => p.handle === user.handle);
        if (pIdx !== -1) { sysIdx = i; planetIdx = pIdx; break; }
      }
      if (sysIdx === -1) return;
      restoreSimpleSystem(focusedSystemIndex);
      createPointsCloud(sysIdx);
      createDetailedSystem(sysIdx);
      focusedSystemIndex = sysIdx;
      // Animate camera to sun or planet
      let targetPos = solarSystemPositions[sysIdx];
      if (planetIdx >= 0 && detailedSystemGroup) {
        // Find the planet mesh in the detailed system
        let found = null;
        detailedSystemGroup.traverse(obj => {
          if (obj.isMesh && obj.userData && obj.userData.handle === user.handle) found = obj;
        });
        if (found) {
          targetPos = found.getWorldPosition(new THREE.Vector3());
        }
      }
      smoothFocusCamera(camera, controls, targetPos);
      findMeDropdown.style.display = 'none';
      findMeInput.value = '';
    }

    // --- MINIMAP: YAW+PITCH ROTATION (NO ROLL, STABLE) ---
    function getCameraYawPitch() {
      // Get camera yaw (Y) and pitch (X) from its quaternion
      const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
      return { yaw: euler.y, pitch: euler.x };
    }
    function renderMinimap() {
      minimapCtx.clearRect(0, 0, minimapWidth, minimapHeight);
      const { yaw, pitch } = getCameraYawPitch();
      for (let i = 0; i < solarSystemPositions.length; i++) {
        const pos = solarSystemPositions[i];
        // Center on galaxyCenter
        let x0 = pos.x - galaxyCenter.x;
        let y0 = pos.y - galaxyCenter.y;
        let z0 = pos.z - galaxyCenter.z;
        // Apply pitch (X axis) then yaw (Y axis)
        // Pitch rotation (around X)
        let y1 = y0 * Math.cos(-pitch) - z0 * Math.sin(-pitch);
        let z1 = y0 * Math.sin(-pitch) + z0 * Math.cos(-pitch);
        // Yaw rotation (around Y)
        let x2 = x0 * Math.cos(-yaw) - z1 * Math.sin(-yaw);
        let z2 = x0 * Math.sin(-yaw) + z1 * Math.cos(-yaw);
        const scale = 0.45 * minimapWidth / (galaxyRadius * 2);
        const x = minimapWidth / 2 + x2 * scale;
        const y = minimapHeight / 2 - y1 * scale;
        minimapCtx.beginPath();
        minimapCtx.arc(x, y, (i === focusedSystemIndex ? 10 : 6), 0, Math.PI * 2);
        minimapCtx.fillStyle = (i === focusedSystemIndex) ? '#ffcc33' : '#aaaaff';
        minimapCtx.globalAlpha = (i === focusedSystemIndex) ? 1 : 0.7;
        minimapCtx.fill();
        minimapCtx.globalAlpha = 1;
        // Draw outline if hovered
        if (i === minimapHoveredIndex) {
          minimapCtx.save();
          minimapCtx.beginPath();
          minimapCtx.arc(x, y, (i === focusedSystemIndex ? 14 : 10), 0, Math.PI * 2);
          minimapCtx.strokeStyle = '#fff';
          minimapCtx.lineWidth = 3;
          minimapCtx.shadowColor = '#fff';
          minimapCtx.shadowBlur = 8;
          minimapCtx.stroke();
          minimapCtx.restore();
        }
      }
    }

    // --- MINIMAP HOVER LOGIC: YAW+PITCH ROTATION ---
    minimapCanvas.addEventListener('mousemove', (e) => {
      const rect = minimapCanvas.getBoundingClientRect();
      minimapMouse.x = e.clientX - rect.left;
      minimapMouse.y = e.clientY - rect.top;
      const { yaw, pitch } = getCameraYawPitch();
      let closestIdx = null;
      let closestDist = 1e9;
      for (let i = 0; i < solarSystemPositions.length; i++) {
        const pos = solarSystemPositions[i];
        let x0 = pos.x - galaxyCenter.x;
        let y0 = pos.y - galaxyCenter.y;
        let z0 = pos.z - galaxyCenter.z;
        // Pitch rotation (around X)
        let y1 = y0 * Math.cos(-pitch) - z0 * Math.sin(-pitch);
        let z1 = y0 * Math.sin(-pitch) + z0 * Math.cos(-pitch);
        // Yaw rotation (around Y)
        let x2 = x0 * Math.cos(-yaw) - z1 * Math.sin(-yaw);
        let z2 = x0 * Math.sin(-yaw) + z1 * Math.cos(-yaw);
        const scale = 0.45 * minimapWidth / (galaxyRadius * 2);
        const x = minimapWidth / 2 + x2 * scale;
        const y = minimapHeight / 2 - y1 * scale;
        const d = Math.hypot(x - minimapMouse.x, y - minimapMouse.y);
        if (d < 18 && d < closestDist) {
          closestDist = d;
          closestIdx = i;
        }
      }
      minimapHoveredIndex = closestIdx;
      if (closestIdx !== null) {
        // Show tooltip with sun info, ensure it's above minimap
        const sun = solarSystems[closestIdx].sun;
        tooltipImage.src = `/pfp/${sun.handle}.jpg`;
        tooltipText.innerHTML = `<strong>${sun.name || ''}</strong><br/>@${sun.handle}<br/>${sun.bio ? `<em>${sun.bio}</em><br/>` : ''}Followers: ${sun.followers || 0}`;
        tooltip.style.display = 'block';
        tooltip.style.left = `${e.clientX + 16}px`;
        tooltip.style.top = `${e.clientY - 8}px`;
        tooltip.style.zIndex = '3005';
      } else {
        tooltip.style.display = 'none';
      }
    });

    function animate() {
      requestAnimationFrame(animate);

      // --- Intro Animation Sequence ---
      if (introPhase < 3) {
        if (introPhase === 0) {
          // Initial pause
          introProgress += 1 / 60; // 1 second pause
          if (introProgress >= 1) {
            introProgress = 0;
            introPhase = 1;
            console.log('Starting galaxy zoom');
          }
        } else if (introPhase === 1) {
          // Zoom in on galaxy to main system
          introProgress += 1 / 180; // 3 second zoom
          const t = Math.min(introProgress, 1);
          // Use easing function for smoother animation
          const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          
          camera.position.x = galaxyStart.x + (galaxyEnd.x - galaxyStart.x) * ease;
          camera.position.y = galaxyStart.y + (galaxyEnd.y - galaxyStart.y) * ease;
          camera.position.z = galaxyStart.z + (galaxyEnd.z - galaxyStart.z) * ease;
          
          // Gradually look at target system
          const lookAtX = ease * galaxyEnd.x;
          const lookAtY = ease * galaxyEnd.y;
          const lookAtZ = ease * galaxyEnd.z;
          camera.lookAt(lookAtX, lookAtY, lookAtZ);

          if (t >= 1) {
            introProgress = 0;
            introPhase = 2;
            console.log('Galaxy zoom complete, creating system');
          }
        } else if (introPhase === 2) {
          // Create detailed system and finish intro
          createPointsCloud(mainSystemIndex); // Hide the focused system's point
          createDetailedSystem(mainSystemIndex);
          focusedSystemIndex = mainSystemIndex;
          renderMinimap();
          // Smoothly focus camera on the sun of the focused system
          const sunPos = solarSystemPositions[mainSystemIndex];
          smoothFocusCamera(camera, controls, sunPos);
          introPhase = 3;
          controls.enabled = true;
          fadeInFindMe();
          console.log('System creation complete, intro finished');
        }
      }

      // Rest of animation code...
      controls.update();
      
      if (detailedSystemGroup && detailedSystemGroup.userData && detailedSystemGroup.userData.planetOrbitGroups) {
        detailedSystemGroup.userData.planetOrbitGroups.forEach(({ group, speed }) => {
          group.rotation.y += speed;
        });
      }
      
      moonOrbitGroups.forEach(({ group, speed }) => {
        group.rotation.y += speed;
      });

      // Keep locked entity at center if set
      if (lockedMesh) {
        const pos = lockedMesh.getWorldPosition(new THREE.Vector3());
        controls.target.copy(pos);
        controls.update();
      }
      
      if (focusAnim) focusAnim();

      // Update raycasting and tooltips
      if (mouseEvent) {
        raycaster.setFromCamera(mouse, camera);
        // Only check detailed system meshes for hover
        let intersectMeshes = [];
        if (detailedSystemGroup) {
          detailedSystemGroup.traverse(obj => {
            if (obj.isMesh && obj.userData && obj.userData.handle) {
              intersectMeshes.push(obj);
            }
          });
        }
        const intersects = raycaster.intersectObjects(intersectMeshes, true);
        const first = intersects.find(i => i.object.userData && i.object.userData.handle);
        if (first) {
          const u = first.object.userData;
          tooltipImage.src = `/pfp/${u.handle}.jpg`;
          tooltipText.innerHTML = `<strong>${u.name || ''}</strong><br/>@${u.handle}<br/><em>${u.bio || ''}</em><br/>Followers: ${u.followers || 0}`;
          tooltip.style.display = 'block';
          tooltip.style.left = `${mouseEvent.clientX + 12}px`;
          tooltip.style.top = `${mouseEvent.clientY + 12}px`;
        } else {
          tooltip.style.display = 'none';
        }
      }

      // Make the starfield always surround the camera
      stars.position.copy(camera.position);

      // Update minimap orientation to match camera
      renderMinimap();

      composer.render();
    }
    animate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });

    // Comment out or fix broken calls
    // Comment out document.body.appendChild(findMeContainer); // Add findMeContainer to the DOM

    // Add double-click to zoom in on any entity
    renderer.domElement.addEventListener('dblclick', event => {
      // Calculate mouse position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      const mouseVec = new THREE.Vector2(mouseX, mouseY);
      raycaster.setFromCamera(mouseVec, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      const first = intersects.find(i => i.object.userData && i.object.userData.handle);
      if (first) {
        const mesh = first.object;
        focusCameraOnMesh(mesh);
        lockedMesh = mesh;
        resetButton.style.display = 'block';
      }
    });

    // 1. Add minimap click handler
    minimapCanvas.addEventListener('click', () => {
      if (minimapHoveredIndex !== null) {
        restoreSimpleSystem(focusedSystemIndex);
        createPointsCloud(minimapHoveredIndex);
        createDetailedSystem(minimapHoveredIndex);
        focusedSystemIndex = minimapHoveredIndex;
        const sunPos = solarSystemPositions[minimapHoveredIndex];
        smoothFocusCamera(camera, controls, sunPos);
      }
    });

    // 2. Set Inter font globally
    document.body.style.fontFamily = "'Inter', sans-serif";
    tooltip.style.fontFamily = "'Inter', sans-serif";
    findMeContainer.style.fontFamily = "'Inter', sans-serif";
    minimapLabel.style.fontFamily = "'Inter', sans-serif";
    minimapInstr.style.fontFamily = "'Inter', sans-serif";
    findMeInput.style.fontFamily = "'Inter', sans-serif";
    findMeDropdown.style.fontFamily = "'Inter', sans-serif";

    // 3. Animate tooltip appearance with gsap
    function showTooltip() {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'scale(0.95)';
      tooltip.style.display = 'block';
      gsap.to(tooltip, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
    }
    function hideTooltip() {
      gsap.to(tooltip, { opacity: 0, scale: 0.95, duration: 0.18, ease: 'power2.in', onComplete: () => { tooltip.style.display = 'none'; } });
    }
    // Replace tooltip.style.display = 'block' with showTooltip(), and 'none' with hideTooltip() in minimap and 3D hover logic

    // 4. Fade in Find Me UI after intro zoom
    findMeContainer.style.opacity = '0';
    function fadeInFindMe() {
      gsap.to(findMeContainer, { opacity: 1, duration: 0.7, ease: 'power2.out' });
    }
    // Call fadeInFindMe() at the end of the intro zoom (after controls.enabled = true)

    // 5. Standardize border radii and box shadows
    const borderRadius = '14px';
    const boxShadow = '0 4px 20px rgba(0,0,0,0.22)';
    tooltip.style.borderRadius = borderRadius;
    tooltip.style.boxShadow = boxShadow;
    findMeContainer.style.borderRadius = borderRadius;
    findMeContainer.style.boxShadow = boxShadow;
    findMeDropdown.style.borderRadius = borderRadius;
    findMeDropdown.style.boxShadow = boxShadow;
    minimapCanvas.style.borderRadius = borderRadius;
    minimapCanvas.style.boxShadow = boxShadow;

    // 6. Align all spacing to a fixed scale
    tooltip.style.padding = '12px';
    tooltip.style.gap = '8px';
    findMeContainer.style.padding = '12px 24px';
    findMeDropdown.style.padding = '6px 0';
    minimapLabel.style.marginBottom = '4px';
    minimapInstr.style.marginBottom = '8px';

    // 7. Fade/shrink non-focused systems
    simpleSystemGroups.forEach((group, idx) => {
      if (idx !== focusedSystemIndex) {
        group.traverse(obj => {
          if (obj.material && obj.material.opacity !== undefined) {
            obj.material.transparent = true;
            obj.material.opacity = 0.25;
            obj.scale.set(0.7, 0.7, 0.7);
          }
        });
      } else {
        group.traverse(obj => {
          if (obj.material && obj.material.opacity !== undefined) {
            obj.material.opacity = 1;
            obj.scale.set(1, 1, 1);
          }
        });
      }
    });

    // 8. Blur galaxy background during focus zoom
    let blurAmount = 0;
    function setGalaxyBlur(amount) {
      renderer.domElement.style.filter = `blur(${amount}px)`;
    }
    // During introPhase 1 and 2, animate blur in/out
    // In animate():
    // if (introPhase === 1 || introPhase === 2) { blurAmount = Math.min(8, blurAmount + 0.2); } else { blurAmount = Math.max(0, blurAmount - 0.2); }
    // setGalaxyBlur(blurAmount);
  });
