// universe.js - Solar System optimized for clarity: 10 planets, visibly orbiting dispersed moons with Z elevation
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { Header } from './header.js';

// Initialize texture loader
const loader = new THREE.TextureLoader();

// Error tracking
const initializationErrors = [];
let hasShownError = false;

// Device detection
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const isMobile = /Mobi|Android/i.test(navigator.userAgent);

// Global state variables
let introStarted = false;
let musicFadedIn = false;
let audio = null;
let blurAmount = 8;
let minimapHoveredIndex = null;
const minimapMouse = { x: 0, y: 0 };

// Enhanced error logging
function logError(phase, error, data = {}) {
  try {
    const errorInfo = {
      phase,
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isIOS,
      isSafari,
      isMobile,
      ...data
    };
    
    console.error(`[${phase}]`, errorInfo);
    
    if (!window.universeErrors) {
      window.universeErrors = [];
    }
    window.universeErrors.push(errorInfo);
    
    showError(`Error during ${phase}: ${errorInfo.message}`);
  } catch (e) {
    console.error('Error in error logging:', e);
  }
}

// Enhanced error display
function showError(message) {
  try {
    // Skip error display on mobile
    if (isMobile) {
      console.error('Error (mobile):', message);
      return;
    }

    const existingError = document.getElementById('universeError');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.id = 'universeError';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '50%';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translate(-50%, -50%)';
    errorDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
    errorDiv.style.color = '#fff';
    errorDiv.style.padding = '20px';
    errorDiv.style.borderRadius = '10px';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    errorDiv.style.fontSize = '16px';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.maxWidth = '90%';
    errorDiv.style.width = '400px';
    errorDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    
    errorDiv.textContent = `Error: ${message}`;
    
    document.body.appendChild(errorDiv);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const errorElement = document.getElementById('universeError');
          if (errorElement && !document.body.contains(errorElement)) {
            document.body.appendChild(errorElement);
          }
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } catch (e) {
    console.error('Error in error display:', e);
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  try {
    // Skip error handling on mobile
    if (isMobile) {
      console.error('Runtime error (mobile):', event.error || event.message);
      return;
    }

    logError('runtime', event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
    event.preventDefault();
  } catch (e) {
    console.error('Error in error handler:', e);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  try {
    // Skip error handling on mobile
    if (isMobile) {
      console.error('Promise rejection (mobile):', event.reason);
      return;
    }

    logError('promise', event.reason || new Error('Unhandled Promise Rejection'));
    event.preventDefault();
  } catch (e) {
    console.error('Error in unhandledrejection handler:', e);
  }
});

// Safe initialization wrapper
function safeInitialize() {
  try {
    console.log('Starting initialization...');
    
    if (isMobile) {
      console.log('Mobile device detected, initializing simplified view...');
      initializeMobileView();
    } else {
      console.log('Desktop device detected, initializing full view...');
      initializeDesktopView();
    }
  } catch (error) {
    logError('safe_initialize', error);
  }
}

// New function for mobile-specific initialization
function initializeMobileView() {
  try {
    console.log('Initializing mobile message view...');
    
    // Create container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.background = '#000000';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);

    // Create message element
    const message = document.createElement('div');
    message.style.color = '#ffffff';
    message.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    message.style.fontSize = '18px';
    message.style.textAlign = 'center';
    message.style.padding = '20px';
    message.style.maxWidth = '80%';
    message.style.lineHeight = '1.5';
    message.textContent = 'This is a graphically intense universe simulation. Please return on desktop.';
    container.appendChild(message);

  } catch (initError) {
    console.error('Mobile initialization error:', initError);
    // Show error state
    const errorElement = document.createElement('div');
    errorElement.style.position = 'fixed';
    errorElement.style.top = '50%';
    errorElement.style.left = '50%';
    errorElement.style.transform = 'translate(-50%, -50%)';
    errorElement.style.color = '#ff4444';
    errorElement.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    errorElement.textContent = 'Unable to initialize view';
    document.body.appendChild(errorElement);
  }
}

// Desktop initialization
function initializeDesktopView() {
  try {
    // Initialize audio and UI elements
    function initializeAudioAndUI() {
      try {
        console.log('Initializing audio and UI...');
        
        // Initialize audio
        audio = new Audio('/universe/music/1.mp3');
        audio.loop = true;
        audio.volume = 0;
        audio.preload = 'none';
        document.body.appendChild(audio);

        // Create overlay only for non-mobile devices
        if (!isMobile) {
          console.log('Creating non-mobile overlay...');
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100vw';
          overlay.style.height = '100vh';
          overlay.style.background = 'transparent';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          overlay.style.zIndex = '9999';
          overlay.style.transition = 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)';
          overlay.style.opacity = '1';
          overlay.style.visibility = 'visible';
          overlay.style.pointerEvents = 'auto';
          overlay.innerHTML = `<button id="startUniverseBtn" type="button" class="pulse-hover cosmic-gradient" style="display:inline-block;height:40px;line-height:40px;padding:0 22px;border-radius:100px;color:#fff;font-weight:600;font-size:14px;letter-spacing:0.5px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(6px);text-decoration:none;box-shadow:0 0 10px rgba(255,110,196,0.3);transition:transform 0.2s, box-shadow 0.2s;overflow:visible;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;">Enter Universe</button>`;
          document.body.appendChild(overlay);

          const startBtn = document.getElementById('startUniverseBtn');
          
          function startUniverseHandler(e) {
            try {
              if (e) {
                e.preventDefault();
                e.stopPropagation();
              }
              
              if (introStarted) return;
              
              startBtn.style.pointerEvents = 'auto';
              startBtn.style.opacity = '1';
              
              overlay.style.opacity = '0';
              setTimeout(() => {
                overlay.remove();
                fadeInAudio(1, 3000);
                musicFadedIn = true;
                introStarted = true;
              }, 700);
            } catch (e) {
              logError('start_universe', e);
            }
          }

          if (startBtn) {
            startBtn.addEventListener('click', startUniverseHandler, { passive: false });
            startBtn.addEventListener('touchend', startUniverseHandler, { passive: false });
            startBtn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
          }
        }
      } catch (e) {
        logError('audio_ui_init', e);
      }
    }

    // Start initialization
    console.log('Calling initializeAudioAndUI...');
    initializeAudioAndUI();
    
  } catch (error) {
    logError('desktop_initialization', error);
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
  safeInitialize();
}

function trackError(phase, error) {
  const errorInfo = {
    phase,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    timestamp: new Date().toISOString()
  };
  initializationErrors.push(errorInfo);
  
  // Only show the first error to avoid multiple popups
  if (!hasShownError) {
    hasShownError = true;
    showError(`Error during ${phase}: ${errorInfo.message}`);
  }
}

function fadeInAudio(targetVolume = 1, duration = 3000) {
  if (isMobile || !audio) {
    // Skip audio on mobile
    return;
  }

  const step = 0.02;
  let vol = 0;
  audio.volume = 0;
  audio.loop = true;
  audio.play().catch(e => {
    console.warn('Audio play failed:', e);
  });
  const interval = setInterval(() => {
    vol += step;
    if (vol >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(interval);
    } else {
      audio.volume = vol;
    }
  }, duration * step);
}

// Use 2k textures for both mobile and desktop, but with mobile optimizations
const texturePromises = [
  loader.loadAsync('/universe/textures/planets/2k_sun.jpg').catch(e => trackError('sun texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_mercury.jpg').catch(e => trackError('mercury texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_mars.jpg').catch(e => trackError('mars texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_jupiter.jpg').catch(e => trackError('jupiter texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_saturn.jpg').catch(e => trackError('saturn texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_uranus.jpg').catch(e => trackError('uranus texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_neptune.jpg').catch(e => trackError('neptune texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_ceres_fictional.jpg').catch(e => trackError('ceres texture loading', e)),
  loader.loadAsync('/universe/textures/moons/2k_moon.jpg').catch(e => trackError('moon texture loading', e)),
  loader.loadAsync('/universe/textures/planets/2k_saturn_ring_alpha.png').catch(e => trackError('ring texture loading', e))
];

// Add error handling for texture loading
texturePromises.forEach(promise => {
  promise.catch(error => {
    trackError('texture loading', error);
  });
});

// Wait for all textures to load before starting
Promise.all([
  fetch('/universe/universe.json')
    .then(res => {
      if (!res.ok) {
        throw new Error(`Failed to load universe.json: ${res.status} ${res.statusText}`);
      }
      return res.json();
    })
    .catch(e => trackError('universe.json loading', e)),
  ...texturePromises
])
.then(([users, ...textures]) => {
  try {
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

    // Validate textures
    textures.forEach((texture, index) => {
      if (!texture) {
        trackError('texture validation', new Error(`Missing texture at index ${index}`));
      }
    });

    // Set texture properties with mobile optimizations
    textures.forEach(texture => {
      if (texture) {
        try {
          texture.encoding = THREE.sRGBEncoding;
          if (isMobile) {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
          }
          texture.needsUpdate = true;
        } catch (e) {
          trackError('texture optimization', e);
        }
      }
    });

    // Add validation for users array
    if (!Array.isArray(users) || users.length === 0) {
      trackError('user data validation', new Error('No users loaded or malformed data'));
      return;
    }

    // Filter out users with 0 or null followers first
    users = users.filter(user => user && typeof user.followers === 'number' && user.followers > 0);
    if (users.length === 0) {
      trackError('user filtering', new Error('No valid users after filtering'));
      return;
    }

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

    const renderer = new THREE.WebGLRenderer({ 
      antialias: !isMobile, // Disable antialiasing on mobile
      powerPreference: 'high-performance',
      failIfMajorPerformanceCaveat: false // Allow fallback on mobile
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMappingExposure = isMobile ? 1.2 : 1.5; // Reduce exposure on mobile
    renderer.shadowMap.enabled = !isMobile; // Disable shadows on mobile
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
    // Ensure stars always render in the background
    stars.material.depthTest = false;
    stars.material.depthWrite = false;
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

    // 1. Lighting: SSAO, fill light, rim light, sun bloom
    // Add a subtle directional fill light
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.18);
    fillLight.position.set(1, 2, 2);
    scene.add(fillLight);
    // Add rim light (back light) for planets
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.12);
    rimLight.position.set(-2, 3, -2);
    scene.add(rimLight);
    // SSAO pass (disable on mobile)
    if (!isMobile) {
      const ssaoPass = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
      ssaoPass.kernelRadius = 8;
      ssaoPass.minDistance = 0.005;
      ssaoPass.maxDistance = 0.2;
      composer.addPass(ssaoPass);
    }
    // Feather the sun's glow (bloom gradient)
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.8;
    bloomPass.threshold = 0.2;

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
    // Create minimapCanvas before label/instr/container
    const minimapCanvas = document.createElement('canvas');
    minimapCanvas.width = minimapWidth;
    minimapCanvas.height = minimapHeight;
    minimapCanvas.style.background = 'transparent';
    minimapCanvas.style.borderRadius = '18px';
    minimapCanvas.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)';
    minimapCanvas.style.pointerEvents = 'auto';
    const minimapCtx = minimapCanvas.getContext('2d');
    let focusedSystemIndex = null;
    // --- Minimap label and instructions ---
    const minimapLabel = document.createElement('div');
    minimapLabel.innerText = 'Minimap';
    minimapLabel.style.fontWeight = 'bold';
    minimapLabel.style.fontSize = '18px';
    minimapLabel.style.color = '#fff';
    minimapLabel.style.zIndex = '2002';
    minimapLabel.style.pointerEvents = 'none';
    minimapLabel.style.textShadow = '0 2px 8px #000';
    minimapLabel.style.width = '120px';
    minimapLabel.style.textAlign = 'center';
    minimapLabel.style.marginBottom = '0';
    
    const minimapInstr = document.createElement('div');
    minimapInstr.innerText = 'click a star system to visit it';
    minimapInstr.style.fontSize = '13px';
    minimapInstr.style.color = '#fff';
    minimapInstr.style.zIndex = '2002';
    minimapInstr.style.pointerEvents = 'none';
    minimapInstr.style.textShadow = '0 2px 8px #000';
    minimapInstr.style.width = '200px';
    minimapInstr.style.textAlign = 'center';
    minimapInstr.style.marginBottom = '0';

    const minimapContainer = document.createElement('div');
    minimapContainer.style.position = 'fixed';
    minimapContainer.style.top = '88px';
    minimapContainer.style.right = '24px';
    minimapContainer.style.display = 'flex';
    minimapContainer.style.flexDirection = 'column';
    minimapContainer.style.alignItems = 'center';
    minimapContainer.style.zIndex = '2000';
    minimapContainer.style.opacity = '0'; // Start hidden
    minimapContainer.style.transition = 'opacity 0.7s cubic-bezier(0.4,0,0.2,1)';
    minimapCanvas.style.position = '';
    minimapCanvas.style.top = '';
    minimapCanvas.style.right = '';
    minimapContainer.appendChild(minimapLabel);
    minimapContainer.appendChild(minimapInstr);
    minimapContainer.appendChild(minimapCanvas);
    document.body.appendChild(minimapContainer);

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
          material = new THREE.MeshPhysicalMaterial({
            map: texture,
            color: 0xffffff,
            metalness,
            roughness,
            clearcoat: 0.3,
            reflectivity: 0.1
          });
        } else {
          material = new THREE.MeshPhysicalMaterial({ color: 0xff0000, clearcoat: 0.3, reflectivity: 0.1 });
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
        glow.raycast = () => null;
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
          moonGlow.raycast = () => null;
        }
        // 3. Add faint orbit rings for each planet
        const ringGeom = new THREE.RingGeometry(orbitRadius - 0.5, orbitRadius + 0.5, 64);
        ringGeom.rotateX(-Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x444455, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
        const orbitRing = new THREE.Mesh(ringGeom, ringMat);
        systemGroup.add(orbitRing);
      });
      systemGroup.userData.planetOrbitGroups = planetOrbitGroups;
      renderMinimap();
    }
    // When focus changes, restore the simple system group visibility
    function restoreSimpleSystem(sysIdx) {
      if (simpleSystemGroups[sysIdx]) simpleSystemGroups[sysIdx].visible = true;
    }
    // When minimap or focus changes, call restoreSimpleSystem(previousIdx) and createDetailedSystem(newIdx)

    // --- MUSIC FADE-IN ON LOAD & START OVERLAY ---
    const audio = new Audio('/universe/music/1.mp3');
    audio.loop = true;
    audio.volume = 0;
    audio.preload = 'none'; // Don't preload audio on mobile
    document.body.appendChild(audio);

    // Add error handling for asset loading
    window.addEventListener('error', function(event) {
      try {
        // Skip error handling on mobile
        if (isMobile) {
          console.error('Asset loading error (mobile):', event.error || event.message);
          return;
        }

        const errorMsg = event.error ? event.error.message : 'An error occurred';
        logError('runtime', new Error(errorMsg));
        // If there's an error loading assets, try to continue with basic functionality
        if (!introStarted) {
          console.log('Asset loading error, attempting to continue with basic functionality...');
          introStarted = true;
          musicFadedIn = true;
        }
      } catch (e) {
        console.error('Error in asset loading handler:', e);
      }
    });

    // Add error handling for WebGL context
    try {
      const gl = renderer.getContext();
      if (!gl) {
        throw new Error('WebGL not supported');
      }
    } catch (error) {
      // Skip error display on mobile
      if (!isMobile) {
        showError('WebGL not supported on this device');
      }
      // Try to reinitialize with lower settings
      renderer.dispose();
      renderer = new THREE.WebGLRenderer({ 
        antialias: false,
        powerPreference: 'low-power',
        failIfMajorPerformanceCaveat: false
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);
    }

    // Add visible error display function with more details
    function showError(message) {
      // Skip error display on mobile
      if (isMobile) {
        console.error('Error (mobile):', message);
        return;
      }

      // Remove any existing error message
      const existingError = document.getElementById('universeError');
      if (existingError) {
        existingError.remove();
      }

      // Create error container
      const errorDiv = document.createElement('div');
      errorDiv.id = 'universeError';
      errorDiv.style.position = 'absolute';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.right = '0';
      errorDiv.style.backgroundColor = '#ff4444';
      errorDiv.style.color = '#fff';
      errorDiv.style.padding = '10px';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
      errorDiv.style.fontSize = '14px';
      errorDiv.style.zIndex = '9999';
      
      // Add error message
      errorDiv.textContent = `Error: ${message}`;
      
      // Add to the renderer's container instead of body
      renderer.domElement.parentElement.insertBefore(errorDiv, renderer.domElement);

      // Prevent the error from being pushed out of view
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const errorElement = document.getElementById('universeError');
            if (errorElement && !renderer.domElement.parentElement.contains(errorElement)) {
              renderer.domElement.parentElement.insertBefore(errorElement, renderer.domElement);
            }
          }
        });
      });

      observer.observe(renderer.domElement.parentElement, { childList: true, subtree: true });
    }

    // Add iOS-specific error handling
    if (isMobile) {
      window.addEventListener('error', function(event) {
        event.preventDefault();
        console.error('Runtime error (mobile):', event.error || event.message);
      }, true);

      window.addEventListener('unhandledrejection', function(event) {
        event.preventDefault();
        console.error('Promise rejection (mobile):', event.reason);
      }, true);
    }

    // Add global error handler
    window.onerror = function(message, source, lineno, colno, error) {
      // Skip error display on mobile
      if (!isMobile) {
        showError(message);
      }
    };

    // Add mobile-specific error handling
    window.addEventListener('error', function(event) {
      if (isMobile) {
        console.error('Mobile error:', event.error || event.message);
        // Attempt to recover from error
        if (event.error && event.error.message && event.error.message.includes('WebGL')) {
          // Try to reinitialize with lower settings
          renderer.dispose();
          renderer = new THREE.WebGLRenderer({ 
            antialias: false,
            powerPreference: 'low-power'
          });
          renderer.setSize(window.innerWidth, window.innerHeight);
          document.body.appendChild(renderer.domElement);
        }
      }
    });

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
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
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
    const header = new Header(users, (user) => {
      focusOnUser(user);
    });

    // Function to focus camera on a specific user
    function focusOnUser(user) {
      // Find which system the user belongs to
      const systemIndex = solarSystems.findIndex(system =>
        system.sun.handle === user.handle ||
        system.planets.some(p => p.handle === user.handle)
      );

      if (systemIndex === -1) {
        console.warn("User not found in any system:", user.handle);
        return;
      }

      // Only change if it's a different system
      if (systemIndex !== focusedSystemIndex) {
        restoreSimpleSystem(focusedSystemIndex);
        createPointsCloud(systemIndex);
        createDetailedSystem(systemIndex);
        focusedSystemIndex = systemIndex;
        renderMinimap();
      }

      // Find the user's mesh in the scene
      let targetMesh = null;
      scene.traverse((object) => {
        if (object.userData && object.userData.handle === user.handle) {
          targetMesh = object;
        }
      });

      if (targetMesh) {
        const pos = targetMesh.getWorldPosition(new THREE.Vector3());
        smoothFocusCamera(camera, controls, pos);
        showSystemName(user.name || user.handle);
      }
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

    // Track the currently hovered user for tooltip stability (3D and minimap)
    let currentlyHoveredUser = null;
    let currentlyHoveredMinimapIndex = null;

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
        // Only update tooltip if hovered minimap index changes
        if (currentlyHoveredMinimapIndex !== closestIdx) {
          const sun = solarSystems[closestIdx].sun;
          tooltipImage.src = `/pfp/${sun.handle}.jpg`;
          tooltipText.innerHTML = `<strong>${sun.name || ''}</strong><br/>@${sun.handle}<br/>${sun.bio ? `<em>${sun.bio}</em><br/>` : ''}Followers: ${sun.followers || 0}`;
          tooltip.style.left = `${e.clientX + 16}px`;
          tooltip.style.top = `${e.clientY - 8}px`;
          tooltip.style.zIndex = '3005';
          showTooltip();
        } else {
          // Update position if still hovering same
          tooltip.style.left = `${e.clientX + 16}px`;
          tooltip.style.top = `${e.clientY - 8}px`;
        }
        currentlyHoveredMinimapIndex = closestIdx;
        currentlyHoveredUser = null; // Clear 3D hover
      } else {
        if (currentlyHoveredMinimapIndex !== null) {
          hideTooltip();
          currentlyHoveredMinimapIndex = null;
        }
      }
    });

    // --- 3D RAYCAST HOVER LOGIC (in animate loop) ---
    function safeAnimate() {
      try {
        requestAnimationFrame(safeAnimate);
        
        // --- Intro Animation Sequence ---
        if (!introStarted) {
          try {
            controls.enabled = false;
            stars.position.copy(camera.position);
            setGalaxyBlur(blurAmount);
            composer.render();
            return;
          } catch (e) {
            logError('intro_animation', e);
            introStarted = true; // Force continue if intro fails
          }
        }

        try {
          controls.enabled = true;
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
              try {
                // Create detailed system and finish intro
                createPointsCloud(mainSystemIndex); // Hide the focused system's point
                createDetailedSystem(mainSystemIndex);
                focusedSystemIndex = mainSystemIndex;
                renderMinimap();
                // Smoothly focus camera on the sun of the focused system
                const sunPos = solarSystemPositions[mainSystemIndex];
                smoothFocusCamera(camera, controls, sunPos);
                introPhase = 3;
                fadeInFindMe();
                console.log('System creation complete, intro finished');
              } catch (e) {
                logError('system_creation', e);
                introPhase = 3; // Force continue if system creation fails
              }
            }
          } else {
            // Fade in minimap when intro is done
            if (minimapContainer.style.opacity !== '1') {
              minimapContainer.style.opacity = '1';
            }
          }

          // Rest of animation code...
          try {
            controls.update();
            
            if (detailedSystemGroup && detailedSystemGroup.userData && detailedSystemGroup.userData.planetOrbitGroups) {
              detailedSystemGroup.userData.planetOrbitGroups.forEach(({ group, speed }, idx) => {
                // Easing: use a sine wave for speed variation
                const t = performance.now() * 0.0001 + idx;
                group.rotation.y += speed * (0.7 + 0.3 * Math.sin(t));
                // Rotate planet mesh
                group.children.forEach(child => {
                  if (child.isMesh) child.rotation.y += 0.002 + 0.001 * Math.sin(t);
                });
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
              // Only update tooltip if hovered user changes
              if (!currentlyHoveredUser || currentlyHoveredUser.handle !== u.handle) {
                tooltipImage.src = `/pfp/${u.handle}.jpg`;
                tooltipText.innerHTML = `<strong>${u.name || ''}</strong><br/>@${u.handle}<br/><em>${u.bio || ''}</em><br/>Followers: ${u.followers || 0}`;
                const x = mouseEvent ? mouseEvent.clientX : window.innerWidth / 2;
                const y = mouseEvent ? mouseEvent.clientY : window.innerHeight / 2;
                tooltip.style.left = `${x + 12}px`;
                tooltip.style.top = `${y + 12}px`;
                showTooltip();
              } else {
                // Update position if still hovering same
                const x = mouseEvent ? mouseEvent.clientX : window.innerWidth / 2;
                const y = mouseEvent ? mouseEvent.clientY : window.innerHeight / 2;
                tooltip.style.left = `${x + 12}px`;
                tooltip.style.top = `${y + 12}px`;
              }
              currentlyHoveredUser = u;
              currentlyHoveredMinimapIndex = null; // Clear minimap hover
            } else {
              if (currentlyHoveredUser) {
                hideTooltip();
                currentlyHoveredUser = null;
              }
            }

            // Make the starfield always surround the camera
            stars.position.copy(camera.position);

            // Update minimap orientation to match camera
            renderMinimap();

            // Blur galaxy background during focus zoom
            if (introPhase === 1 || introPhase === 2) { 
              blurAmount = Math.min(8, blurAmount + 0.2); 
            } else { 
              blurAmount = Math.max(0, blurAmount - 0.2); 
            }
            setGalaxyBlur(blurAmount);

            composer.render();
          } catch (e) {
            logError('animation_update', e);
          }
        } catch (e) {
          logError('animation_loop', e);
        }
      } catch (e) {
        logError('animation_frame', e);
      }
    }

    // Replace the original animate() call with safeAnimate()
    safeAnimate();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    });

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
        // Assuming resetButton is defined elsewhere or remove this line if not
        // resetButton.style.display = 'block'; 
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
        if (solarSystems[focusedSystemIndex] && solarSystems[focusedSystemIndex].sun) {
            showSystemName(solarSystems[focusedSystemIndex].sun.name || 'Unnamed System');
        } else {
            hideSystemName();
        }
      }
    });

    // 2. Set Inter font globally
    document.body.style.fontFamily = "'Inter', sans-serif";
    tooltip.style.fontFamily = "'Inter', sans-serif";
    minimapLabel.style.fontFamily = "'Inter', sans-serif";
    minimapInstr.style.fontFamily = "'Inter', sans-serif";

    // 3. Animate tooltip appearance with gsap
    function showTooltip() {
      gsap.killTweensOf(tooltip); // Cancel any ongoing hide animation
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'scale(0.95)';
      tooltip.style.display = 'block'; // Keep this for initial display before gsap
      gsap.to(tooltip, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' });
    }
    function hideTooltip() {
      gsap.killTweensOf(tooltip); // Cancel any ongoing show animation
      gsap.to(tooltip, { 
        opacity: 0, 
        scale: 0.95, 
        duration: 0.18, 
        ease: 'power2.in', 
        onComplete: () => { 
          tooltip.style.display = 'none'; 
        } 
      });
    }

    // 4. Fade in Find Me UI after intro zoom
    function fadeInFindMe() {
      header.show();
    }

    // 5. Standardize border radii and box shadows
    const borderRadius = '14px';
    const boxShadow = '0 4px 20px rgba(0,0,0,0.22)';
    tooltip.style.borderRadius = borderRadius;
    tooltip.style.boxShadow = boxShadow;
    minimapCanvas.style.borderRadius = borderRadius;
    minimapCanvas.style.boxShadow = boxShadow;

    // 6. Align all spacing to a fixed scale
    tooltip.style.padding = '12px'; // Already set earlier, ensuring consistency
    tooltip.style.gap = '8px'; // Already set earlier
    minimapLabel.style.marginBottom = '0';
    minimapInstr.style.marginBottom = '0';
    minimapCanvas.style.marginTop = '0';
    minimapCanvas.style.marginBottom = '0';
    minimapCanvas.style.display = 'block';
    minimapContainer.style.gap = '4px';
    minimapContainer.style.alignItems = 'center';

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
    function setGalaxyBlur(amount) {
      renderer.domElement.style.filter = `blur(${amount}px)`;
    }

    // UI: backdrop-filter, shadows, hover animation, system name
    minimapLabel.style.backdropFilter = 'blur(6px)';
    minimapLabel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';

    minimapLabel.addEventListener('mouseenter', () => { 
      gsap.to(minimapLabel, { scale: 1.05, opacity: 1, duration: 0.2 });
    });
    minimapLabel.addEventListener('mouseleave', () => { 
      gsap.to(minimapLabel, { scale: 1, opacity: 0.85, duration: 0.2 });
    });
    
    // System name heading near sun
    let systemNameLabel = document.getElementById('systemNameLabel'); // DECLARED HERE ONCE
    if (!systemNameLabel) {
      systemNameLabel = document.createElement('div');
      systemNameLabel.id = 'systemNameLabel';
      systemNameLabel.style.position = 'fixed';
      systemNameLabel.style.top = '80px'; // Adjusted from original multiple definitions
      systemNameLabel.style.left = '50%';
      systemNameLabel.style.transform = 'translateX(-50%)';
      systemNameLabel.style.fontSize = '22px';
      systemNameLabel.style.fontWeight = 'bold';
      systemNameLabel.style.color = '#fff';
      systemNameLabel.style.textShadow = '0 2px 8px #000';
      systemNameLabel.style.zIndex = '3004';
      systemNameLabel.style.pointerEvents = 'none';
      document.body.appendChild(systemNameLabel);
    }

    function showSystemName(name) {
      if (systemNameLabel) {
        systemNameLabel.innerText = name;
        systemNameLabel.style.display = 'block';
        gsap.fromTo(systemNameLabel, 
          { opacity: 0, y: -10 }, 
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.2,
            onComplete: () => {
              // Start fade out after a short delay
              setTimeout(() => {
                hideSystemName();
              }, 1000); // Show for 1 second before fading
            }
          }
        );
      }
    }
    function hideSystemName() {
      if (systemNameLabel) {
        gsap.to(systemNameLabel, { 
          opacity: 0, 
          y: -10, 
          duration: 0.2, 
          onComplete: () => {
            if (systemNameLabel) systemNameLabel.style.display = 'none';
          } 
        });
      }
    }
    // Initial state for system name (hidden)
    hideSystemName();

    // Show system name when focusing on main system
    if (solarSystems[mainSystemIndex] && solarSystems[mainSystemIndex].sun) {
        showSystemName(solarSystems[mainSystemIndex].sun.name || 'Unnamed System');
    }

  } catch (error) {
    trackError('initialization', error);
  }
})
.catch(error => {
  trackError('promise chain', error);
});

// Mobile optimization function
function optimizeForMobile() {
  console.log('Applying mobile optimizations...');
  
  // Disable all heavy features
  window.ENABLE_SSAO = false;
  window.ENABLE_BLOOM = false;
  window.ENABLE_SHADOWS = false;
  window.ENABLE_POST_PROCESSING = false;
  window.ENABLE_HDR = false;
  window.ENABLE_PARTICLES = false;
  window.ENABLE_GLOW = false;
  
  // Reduce texture quality
  window.TEXTURE_QUALITY = 'low';
  window.MAX_TEXTURE_SIZE = 1024;
  window.USE_MIPMAPS = false;
  
  // Reduce geometry complexity
  window.SPHERE_SEGMENTS = 16;
  window.RING_SEGMENTS = 32;
  window.STAR_COUNT = 1000;
  
  // Reduce animation complexity
  window.ANIMATION_FRAMERATE = 30;
  window.USE_EASING = false;
  
  // Disable effects
  window.USE_BLUR = false;
  window.USE_FOG = false;
  window.USE_AMBIENT_OCCLUSION = false;
  
  // Memory optimizations
  window.ENABLE_TEXTURE_CACHING = false;
  window.ENABLE_GEOMETRY_CACHING = false;
  
  // Performance settings
  window.USE_LOW_POWER_MODE = true;
  window.USE_HARDWARE_ACCELERATION = false;
  
  return {
    renderer: {
      antialias: false,
      powerPreference: 'low-power',
      precision: 'lowp',
      alpha: false,
      stencil: false,
      depth: true,
      failIfMajorPerformanceCaveat: false
    },
    composer: {
      enabled: false
    },
    scene: {
      fog: null,
      background: new THREE.Color(0x000000)
    },
    camera: {
      fov: 45,
      near: 1,
      far: 2000
    },
    controls: {
      enableDamping: false,
      dampingFactor: 0,
      rotateSpeed: 0.5,
      zoomSpeed: 0.5
    }
  };
}

// Modify createSafeRenderer to use mobile optimizations
function createSafeRenderer() {
  try {
    const mobileSettings = isMobile ? optimizeForMobile() : null;
    const renderer = new THREE.WebGLRenderer(mobileSettings?.renderer || { 
      antialias: !isIOS,
      powerPreference: isIOS ? 'low-power' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
      precision: isIOS ? 'mediump' : 'highp'
    });
    
    // iOS-specific optimizations
    if (isIOS) {
      renderer.setPixelRatio(1); // Force 1:1 pixel ratio
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      renderer.info.autoReset = false;
      renderer.domElement.style.filter = 'none';
    }
    
    // Mobile-specific optimizations
    if (isMobile) {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      renderer.shadowMap.type = THREE.BasicShadowMap;
      renderer.info.autoReset = false;
      renderer.domElement.style.filter = 'none';
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }
    
    return renderer;
  } catch (error) {
    logError('renderer_creation', error);
    return new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: false
    });
  }
}

// Modify createSafeComposer to disable post-processing on mobile
function createSafeComposer(renderer, scene, camera) {
  try {
    if (isMobile) {
      // Skip post-processing entirely on mobile
      return {
        render: () => renderer.render(scene, camera),
        setSize: (w, h) => renderer.setSize(w, h, false)
      };
    }
    
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    
    // Only add heavy effects on non-mobile devices
    if (!isMobile && !isIOS) {
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // Reduced strength
        0.1,  // Reduced radius
        0.3   // Reduced threshold
      );
      composer.addPass(bloomPass);
    }
    
    return composer;
  } catch (error) {
    logError('composer_creation', error);
    return {
      render: () => renderer.render(scene, camera),
      setSize: (w, h) => renderer.setSize(w, h, false)
    };
  }
}

// Modify loadSafeHDR to skip HDR on mobile
function loadSafeHDR(scene, renderer) {
  if (isMobile) {
    // Skip HDR on mobile, use simple lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    return;
  }
  
  try {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    new RGBELoader()
      .setPath('/universe/HDRI/')
      .load('1.hdr', texture => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
      });
  } catch (error) {
    logError('hdr_loading', error);
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
  }
}

// Modify setSafeBlur to disable blur on mobile
function setSafeBlur(amount) {
  if (isMobile) {
    // Disable blur on mobile
    return;
  }
  
  try {
    // Clamp blur amount
    const safeAmount = Math.max(0, Math.min(5, amount));
    renderer.domElement.style.filter = `blur(${safeAmount}px)`;
  } catch (error) {
    logError('blur_setting', error);
  }
}

// Global error handler with iOS fallback
window.addEventListener('error', (e) => {
  if (isIOS && !hasShownError) {
    hasShownError = true;
    logError('ios-fallback', e.error || new Error('Unknown iOS error'));
    
    // Show user-friendly message
    const message = document.createElement('div');
    message.style.position = 'fixed';
    message.style.top = '50%';
    message.style.left = '50%';
    message.style.transform = 'translate(-50%, -50%)';
    message.style.color = 'white';
    message.style.textAlign = 'center';
    message.style.padding = '20px';
    message.style.background = 'rgba(0,0,0,0.8)';
    message.style.borderRadius = '10px';
    message.style.zIndex = '9999';
    message.innerHTML = `
      <h2>Mobile Device Detected</h2>
      <p>This experience doesn't work on mobile devices.</p>
      <p>Please return on desktop for the full experience.</p>
    `;
    document.body.appendChild(message);
  }
});