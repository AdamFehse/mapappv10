// GlobeContainer.js - Cesium Split View (3D + 2D)
(function() {
  const { useEffect, useRef, useState } = React;
  window.MapApp = window.MapApp || {};

  const MARKER_PALETTE_FALLBACK = ['#4fc3f7', '#ff8a65', '#66bb6a', '#ffd54f', '#ba68c8'];
  const markerVisualCache = new Map();

  function hashString(str) {
    if (!str) return 0;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickMarkerColor(project, palette, fallbackColor) {
    const basis = project?.ProjectCategory || project?.Theme || project?.id || 'marker';
    if (!Array.isArray(palette) || palette.length === 0) {
      return fallbackColor;
    }
    const idx = hashString(basis) % palette.length;
    return palette[idx] || fallbackColor;
  }

  function normalizeHex(hex) {
    if (!hex) return null;
    let clean = hex.trim().replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(ch => ch + ch).join('');
    }
    return clean.length === 6 ? clean : null;
  }

  function lightenHex(hex, amount = 0.2) {
    const clean = normalizeHex(hex);
    if (!clean) return hex;
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const lighten = (channel) => Math.min(255, Math.round(channel + (255 - channel) * amount));
    const next = (lighten(r) << 16) | (lighten(g) << 8) | lighten(b);
    return `#${next.toString(16).padStart(6, '0')}`;
  }

  function getMarkerBadgeText(project) {
    const explicit = (project?.MarkerLabel || project?.Abbreviation || '').trim();
    if (explicit) {
      return explicit.slice(0, 3).toUpperCase();
    }
    const name = (project?.ProjectName || '').trim();
    if (!name) return 'NA';
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 3).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function getMarkerLabelText(project, maxChars) {
    const name = (project?.ProjectName || '').trim();
    if (!name || typeof maxChars !== 'number' || maxChars <= 0) return name;
    return name.length <= maxChars ? name : `${name.slice(0, Math.max(0, maxChars - 3))}...`;
  }

  function svgToDataUri(svgString) {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgString)));
    }
    return 'data:image/svg+xml;base64,' + btoa(svgString);
  }

  function createMarkerSvg({ text, baseColor, accentColor, strokeColor, fontSize, isSelected }) {
    const glow = isSelected ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)';
    return `
      <svg width="64" height="80" viewBox="0 0 64 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="markerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${accentColor}"/>
            <stop offset="100%" stop-color="${baseColor}"/>
          </linearGradient>
          <filter id="markerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="${glow}" flood-opacity="0.8"/>
          </filter>
        </defs>
        <path d="M32 2C19 2 9 12.6 9 26.3c0 19.8 23 45.9 23 45.9s23-25.6 23-45.9C55 12.6 45 2 32 2z"
          fill="url(#markerGrad)" stroke="${strokeColor}" stroke-width="2" filter="url(#markerShadow)" />
        <circle cx="32" cy="27" r="15" fill="rgba(255,255,255,0.12)"/>
        <text x="32" y="32" text-anchor="middle" font-family="Inter, Arial, sans-serif"
          font-size="${fontSize}" font-weight="700" fill="#ffffff" letter-spacing="0.5">${text}</text>
      </svg>
    `.trim();
  }

  function createMarkerVisualCacheKey(project, markerOptions, baseColor, isSelected) {
    const paletteKey = Array.isArray(markerOptions?.palette)
      ? markerOptions.palette.join(',')
      : 'none';

    return [
      project?.id ?? '',
      project?.ProjectName ?? '',
      project?.MarkerLabel ?? '',
      project?.Abbreviation ?? '',
      project?.ProjectCategory ?? '',
      project?.Theme ?? '',
      baseColor || '',
      markerOptions?.defaultColor || '',
      markerOptions?.selectedColor || '',
      markerOptions?.size || '',
      markerOptions?.labelMaxChars || '',
      paletteKey,
      isSelected ? 'selected' : 'default'
    ].join('|');
  }

  function buildMarkerVisual(project, markerOptions, isSelected) {
    if (!project) return null;
    const paletteColor = pickMarkerColor(project, markerOptions.palette, markerOptions.defaultColor);
    const baseColor = isSelected ? (markerOptions.selectedColor || paletteColor) : paletteColor;
    const cacheKey = createMarkerVisualCacheKey(project, markerOptions, baseColor, isSelected);
    if (markerVisualCache.has(cacheKey)) {
      return markerVisualCache.get(cacheKey);
    }

    const accentColor = lightenHex(baseColor, 0.25);
    const strokeColor = isSelected ? lightenHex(baseColor, 0.35) : 'rgba(13, 27, 42, 0.45)';
    const badgeText = getMarkerBadgeText(project);
    const fontSize = badgeText.length === 1 ? 22 : badgeText.length === 2 ? 18 : 14;
    const svgMarkup = createMarkerSvg({
      text: badgeText,
      baseColor,
      accentColor,
      strokeColor,
      fontSize,
      isSelected
    });

    const visual = {
      image: svgToDataUri(svgMarkup),
      width: markerOptions.size,
      height: Math.round(markerOptions.size * 1.25),
      scale: isSelected ? 1.08 : 1,
      labelText: getMarkerLabelText(project, markerOptions.labelMaxChars)
    };

    markerVisualCache.set(cacheKey, visual);
    return visual;
  }

  function updateMarkerGraphics(entity, markerOptions, isSelected) {
    if (!entity || !entity.projectData || !entity.billboard) return;
    const visual = buildMarkerVisual(entity.projectData, markerOptions, isSelected);
    if (!visual) return;
    entity.billboard.image = visual.image;
    entity.billboard.width = visual.width;
    entity.billboard.height = visual.height;
    entity.billboard.scale = visual.scale;
    entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
    entity.billboard.pixelOffset = new Cesium.Cartesian2(0, -8);
    entity.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;

    if (entity.label) {
      entity.label.text = visual.labelText;
      entity.label.show = !!markerOptions.showLabels;
      entity.label.pixelOffset = new Cesium.Cartesian2(0, 14);
      entity.label.font = '600 12px "Inter", sans-serif';
    }
  }

  /**
   * GlobeContainer Component
   *
   * RESPONSIBILITY:
   * - Initialize and manage Cesium 3D viewer
   * - Render project markers
   * - Handle camera movements
   * - Dispatch click events to parent
   *
   * PROPS:
   * - projects: Array of project objects to display
   * - selectedProject: Currently selected project
   * - onProjectClick: Callback when marker is clicked
   * - onGlobeReady: Callback when viewer is initialized
   */
  window.MapApp.GlobeContainer = function GlobeContainer({
    projects = [],
    selectedProject = null,
    onProjectClick,
    onGlobeReady,
    narrativeIndex = 0,
    onNarrativeChange,
    onTypewriterProgress,
    onIntroComplete
  }) {
    const container3DRef = useRef(null);
    const view3DRef = useRef(null);
    const entitiesRef = useRef({}); // Map of project.id -> Cesium.Entity
    const [showIntro, setShowIntro] = useState(() => {
      const passages = window.MapAppConfig?.narrative?.passages;
      return Array.isArray(passages) && passages.length > 0;
    });
    const [markersRevealed, setMarkersRevealed] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [viewerReady, setViewerReady] = useState(false);
    const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
    const [qualityOverride, setQualityOverrideState] = useState(() => {
      try {
        return typeof window !== 'undefined'
          ? localStorage.getItem('mapapp-quality-override')
          : null;
      } catch (error) {
        console.warn('Unable to read quality override from storage:', error);
        return null;
      }
    });
    const qualityLabel = qualityOverride || window.MapAppPerf?.qualityTier || 'auto';
    const revealTimeoutsRef = useRef([]);

    useEffect(() => {
      if (showIntro && qualityMenuOpen) {
        setQualityMenuOpen(false);
      }
    }, [showIntro, qualityMenuOpen]);

    useEffect(() => {
      if (!showIntro || !selectedProject) {
        return;
      }

      setShowIntro(false);
      onTypewriterProgress && onTypewriterProgress(0);
      onIntroComplete && onIntroComplete(false);
      revealMarkers();
    }, [showIntro, selectedProject, onTypewriterProgress, onIntroComplete]);

    const markerOptions = React.useMemo(() => {
      const config = window.CesiumConfig?.markers || {};
      const defaults = {
        defaultColor: '#2196F3',
        selectedColor: '#FF5722',
        hoverColor: '#1976D2',
        size: 36,
        palette: MARKER_PALETTE_FALLBACK,
        showLabels: false,
        labelMaxChars: 18
      };
      return {
        ...defaults,
        ...config,
        palette: Array.isArray(config.palette) && config.palette.length ? config.palette : defaults.palette
      };
    }, []);

    // PERFORMANCE FLAGS RE-ENABLED
    const performanceFlags = React.useMemo(() => {
      return {
        isLowPower: !!window.MapAppPerf?.isLowPower,
        prefersReducedMotion: !!window.MapAppPerf?.prefersReducedMotion
      };
    }, []);

    const narrativeConfig = React.useMemo(() => {
      return window.MapAppConfig?.narrative || { passages: [], characterIntervalMs: 50 };
    }, []);
    const narrativePassages = narrativeConfig.passages || [];
    const characterInterval = narrativeConfig.characterIntervalMs ?? 50;

    // Initialize 3D viewer
    useEffect(() => {
      if (!container3DRef.current) return;
      if (view3DRef.current) return;

      console.log('Initializing Cesium 3D viewer');

      try {
        // Get quality settings based on device capabilities
        const qualitySettings = window.MapAppPerf ? window.MapAppPerf.getQualitySettings() : {
          resolutionScale: 0.9,
          maximumScreenSpaceError: 3,
          msaaSamples: 2,
          antialias: true,
          maximumAnisotropy: 8,
          tileCacheSize: 100
        };

        console.log('Using quality preset:', window.MapAppPerf?.qualityTier || 'unknown', qualitySettings);

        // 3D Viewer options derived from CesiumConfig to avoid clashes
        const cfg = window.CesiumConfig && window.CesiumConfig.viewerOptions ? window.CesiumConfig.viewerOptions : {};
        // Map config strings to Cesium providers
        const terrainOpt = (cfg.terrainProvider === 'CESIUM_WORLD_TERRAIN')
          ? Cesium.Terrain.fromWorldTerrain()
          : undefined; // undefined => default flat terrain

        // Create free imagery provider view models for the base layer picker
        const imageryViewModels = [];
        
        // OpenStreetMap
        imageryViewModels.push(new Cesium.ProviderViewModel({
          name: 'OpenStreetMap',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
          tooltip: 'OpenStreetMap - Free, collaborative street map',
          creationFunction: function() {
            return new Cesium.UrlTemplateImageryProvider({
              url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              subdomains: ['a', 'b', 'c'],
              credit: new Cesium.Credit(' OpenStreetMap contributors')
            });
          }
        }));

        // CartoDB Dark Matter
        imageryViewModels.push(new Cesium.ProviderViewModel({
          name: 'CartoDB Dark',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/mapboxSatellite.png'),
          tooltip: 'CartoDB Dark Matter - Beautiful dark theme',
          creationFunction: function() {
            return new Cesium.UrlTemplateImageryProvider({
              url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              subdomains: ['a', 'b', 'c', 'd'],
              credit: new Cesium.Credit(' CartoDB  OpenStreetMap contributors')
            });
          }
        }));

        // CartoDB Voyager
        imageryViewModels.push(new Cesium.ProviderViewModel({
          name: 'CartoDB Voyager',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/openStreetMap.png'),
          tooltip: 'CartoDB Voyager - Clean, modern design',
          creationFunction: function() {
            return new Cesium.UrlTemplateImageryProvider({
              url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
              subdomains: ['a', 'b', 'c', 'd'],
              credit: new Cesium.Credit(' CartoDB  OpenStreetMap contributors')
            });
          }
        }));

        // ESRI World Imagery (Satellite) - needs async
        imageryViewModels.push(new Cesium.ProviderViewModel({
          name: 'ESRI Satellite',
          iconUrl: Cesium.buildModuleUrl('Widgets/Images/ImageryProviders/esriWorldImagery.png'),
          tooltip: 'ESRI World Imagery - Free satellite view',
          creationFunction: async function() {
            return await Cesium.ArcGisMapServerImageryProvider.fromUrl(
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
              {
                credit: new Cesium.Credit(' Esri, Maxar, Earthstar Geographics')
              }
            );
          }
        }));

        const options3D = {
          animation: false,
          timeline: false,
          baseLayerPicker: true,  //  ENABLED - dropdown to switch maps!
          imageryProviderViewModels: imageryViewModels,  // Use our free providers
          selectedImageryProviderViewModel: imageryViewModels[2],  // Start with CartoDB Voyager (has labels)
          geocoder: false,
          homeButton: true,
          sceneModePicker: true,
          navigationHelpButton: true,  //  ENABLED - shows mouse controls!
          fullscreenButton: true,
          vrButton: false,

          // DYNAMIC PERFORMANCE SETTINGS (based on device capabilities)
          requestRenderMode: true,  // Only render when needed (HUGE perf boost)
          maximumRenderTimeChange: Infinity,

          // Terrain and clock
          terrain: terrainOpt,

          // Disable ALL shadows
          shadows: false,

          // No terrain exaggeration
          terrainExaggeration: 1.0,

          // Dynamic anti-aliasing based on device tier
          msaaSamples: qualitySettings.msaaSamples,

          // Use simple rendering mode
          orderIndependentTranslucency: false,

          // Dynamic WebGL context quality
          contextOptions: {
            webgl: {
              alpha: false,
              depth: true,
              stencil: false,
              antialias: qualitySettings.antialias,
              powerPreference: 'high-performance'
            }
          }
        };

        // Create 3D viewer
        const view3D = new Cesium.Viewer(container3DRef.current, options3D);
        view3DRef.current = view3D;
        setViewerReady(true);
        applyQualitySettings(view3D, qualitySettings);

        const scene = view3D.scene;
        if (scene && scene.globe) {
          // Ensure globe is visible
          scene.globe.show = true;
          console.log('Globe visibility:', scene.globe.show);

          // DYNAMIC QUALITY OPTIMIZATIONS (based on device tier)
          const globe = scene.globe;

          // Disable depth testing for better occlusion
          globe.depthTestAgainstTerrain = false;

          // Disable ALL lighting
          globe.enableLighting = false;

          // Disable water effects
          globe.showWaterEffect = false;

          // Disable atmosphere (saves GPU cycles)
          scene.skyAtmosphere.show = false;

          // Disable fog
          scene.fog.enabled = false;

          // Disable ground atmosphere
          scene.globe.showGroundAtmosphere = false;

          // Disable scene lighting
          scene.sun.show = false;
          scene.moon.show = false;

          // Target 60 FPS by skipping frames if needed
          view3D.targetFrameRate = 60;

          // Reduce LOD (Level of Detail) aggressiveness
          scene.screenSpaceCameraController.minimumZoomDistance = 100;

          console.log('Dynamic quality settings applied:', {
            tier: qualityOverride || window.MapAppPerf?.qualityTier || 'unknown',
            maximumScreenSpaceError: globe.maximumScreenSpaceError,
            resolutionScale: view3D.resolutionScale,
            tileCacheSize: globe.tileCacheSize,
            msaaSamples: typeof scene.msaaSamples === 'number' ? scene.msaaSamples : 'n/a',
            antialias: 'fxaa' in scene ? scene.fxaa : 'n/a',
            maximumAnisotropy: globe.maximumAnisotropy
          });
        }

        // baseLayerPicker now handles imagery - all FREE providers set up above!
        console.log(' Base layer picker enabled with 4 FREE map options!');
        console.log('No Cesium Ion subscription needed - using open-source tiles');
        
        // Remove old CartoDB labels - we'll use 3D floating labels instead
        // This is an overlay that stays on all basemaps
        
        // Add 3D floating labels for major cities/regions (Cesium entities)
        // These stay upright and rotate with the camera for better readability
        const geoLabels = [
          { name: 'Arizona', lon: -111.5, lat: 34.5 },
          { name: 'Sonora', lon: -110.5, lat: 29.5 },
          { name: 'Phoenix', lon: -112.07, lat: 33.45 },
          { name: 'Tucson', lon: -110.97, lat: 32.22 },
          { name: 'Hermosillo', lon: -110.97, lat: 29.10 },
          { name: 'Nogales', lon: -110.94, lat: 31.34 },
          { name: 'Bisbee', lon: -109.90, lat: 31.45 }
        ];

        geoLabels.forEach(label => {
          view3D.entities.add({
            position: Cesium.Cartesian3.fromDegrees(label.lon, label.lat, 0),
            label: {
              text: label.name,
              font: 'bold 18px Arial',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -10),
              translucencyByDistance: new Cesium.NearFarScalar(1000000, 1.0, 3000000, 0.0),
              scale: 1.0,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });
        });
        console.log(' 3D floating location labels added - visible on all maps!');
        
        // Remove terrain options from the picker (to avoid Cesium Ion terrain)
        if (view3D.baseLayerPicker) {
          view3D.baseLayerPicker.viewModel.terrainProviderViewModels.removeAll();
          console.log('Terrain picker cleared (using flat terrain)');
        }

        // Optional globe lighting (for day/night shading) from config
        if (typeof cfg.enableLighting === 'boolean') {
          view3D.scene.globe.enableLighting = cfg.enableLighting;
        }
        if (cfg.initialTimeIso) {
          try {
            const t = Cesium.JulianDate.fromIso8601(cfg.initialTimeIso);
            view3D.clock.currentTime = t;
          } catch (e) {
            console.warn('Invalid initialTimeIso in config:', cfg.initialTimeIso);
          }
        }

        // Black Marble overlay removed - using Sentinel-2 + Google Labels instead

        // Set initial camera position far out in space (no borders)
        // Respect reduced motion by skipping animation entirely on start
        const prefersReduced = !!(window.CesiumConfig && window.CesiumConfig.accessibility && window.CesiumConfig.accessibility.reducedMotion);
        const spaceAltitude = 3.0e7; // 30,000 km
        const startLon = -110.0; // Center roughly over Americas
        const startLat = 10.0;
        view3D.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(startLon, startLat, spaceAltitude),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-25),
            roll: Cesium.Math.toRadians(0)
          }
        });

        // Setup click handler for 3D view
        const handler = new Cesium.ScreenSpaceEventHandler(view3D.scene.canvas);
        handler.setInputAction((click) => {
          const pickedObject = view3D.scene.pick(click.position);
          if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.projectData) {
            onProjectClick && onProjectClick(pickedObject.id.projectData);
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        if (typeof onGlobeReady === 'function') {
          onGlobeReady();
        }

      } catch (error) {
        console.error('Failed to initialize Cesium 3D viewer:', error);
      }

      // Cleanup
      return () => {
        clearRevealTimeouts();
        if (view3DRef.current) {
          view3DRef.current.destroy();
          view3DRef.current = null;
        }
        setViewerReady(false);
      };
    }, []);

    // Update markers when projects change
    useEffect(() => {
      const view3D = view3DRef.current;
      if (!view3D || !Array.isArray(projects)) return;

      console.log('Syncing project markers:', projects.length);

      const existingEntities = entitiesRef.current;
      const nextIds = new Set();
      const validProjects = [];

      projects.forEach(project => {
        if (!project) return;
        if (typeof project.Latitude !== 'number' || typeof project.Longitude !== 'number') return;
        const projectId = project.id;
        if (projectId === null || projectId === undefined) return;
        const entityId = String(projectId);
        nextIds.add(entityId);
        validProjects.push({ project, entityId });
      });

      Object.entries(existingEntities).forEach(([entityId, entity]) => {
        if (!nextIds.has(entityId)) {
          if (entity) {
            view3D.entities.remove(entity);
          }
          delete existingEntities[entityId];
        } else if (entity) {
          if (entity.billboard) {
            entity.billboard.show = !showIntro;
            entity.billboard.width = markerOptions.size;
            entity.billboard.height = Math.round(markerOptions.size * 1.25);
          }
          if (entity.label) {
            entity.label.show = !!(markerOptions.showLabels && !showIntro);
            entity.label.text = getMarkerLabelText(entity.projectData, markerOptions.labelMaxChars);
          }
        }
      });

      const newlyCreated = [];
      const selectedId = selectedProject && selectedProject.id !== undefined && selectedProject.id !== null
        ? String(selectedProject.id)
        : null;

      validProjects.forEach(({ project, entityId }) => {
        const existing = existingEntities[entityId];
        if (existing) {
          existing.projectData = project;
          if (existing.label) {
            existing.label.text = getMarkerLabelText(project, markerOptions.labelMaxChars);
            existing.label.show = !!(markerOptions.showLabels && !showIntro);
          }
          if (existing.billboard) {
            existing.billboard.width = markerOptions.size;
            existing.billboard.height = Math.round(markerOptions.size * 1.25);
            existing.billboard.show = !showIntro;
          }
          updateMarkerGraphics(existing, markerOptions, !!(selectedId && entityId === selectedId));
          return;
        }

        const entity = view3D.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            project.Longitude,
            project.Latitude
          ),
          billboard: {
            image: '',
            width: markerOptions.size,
            height: Math.round(markerOptions.size * 1.25),
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            show: !showIntro,
            disableDepthTestDistance: Number.POSITIVE_INFINITY
          },
          label: markerOptions.showLabels ? {
            text: getMarkerLabelText(project, markerOptions.labelMaxChars),
            font: '600 12px "Inter", sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.fromAlpha(Cesium.Color.BLACK, 0.6),
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 12),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            translucencyByDistance: new Cesium.NearFarScalar(100000.0, 1.0, 600000.0, 0.0),
            show: !showIntro
          } : undefined,
          projectData: project
        });

        existingEntities[entityId] = entity;
        newlyCreated.push(entity);
        updateMarkerGraphics(entity, markerOptions, !!(selectedId && entityId === selectedId));
      });

      if (!showIntro) {
        if (!markersRevealed) {
          revealMarkers();
        } else if (newlyCreated.length > 0) {
          revealMarkers(newlyCreated);
        }
      } else if (markersRevealed) {
        setMarkersRevealed(false);
      }
    }, [projects, showIntro, markerOptions, selectedProject]);

    // Typewriter effect for narrative text with progress tracking
    useEffect(() => {
      if (!showIntro || narrativeIndex >= narrativePassages.length || narrativePassages.length === 0) return;

      const passage = narrativePassages[narrativeIndex];
      let charIndex = 0;
      let timeoutId;
      const holdDuration = passage.holdDurationMs ?? 0;
      const typingDuration = passage.text.length * characterInterval;
      const totalDuration = typingDuration + holdDuration;

      const typeCharacter = () => {
        if (charIndex <= passage.text.length) {
          setDisplayedText(passage.text.substring(0, charIndex));
          const elapsedTime = charIndex * characterInterval;
          const progress = Math.min(1, elapsedTime / totalDuration);
          onTypewriterProgress && onTypewriterProgress(progress);
          charIndex++;
          timeoutId = setTimeout(typeCharacter, characterInterval); // configurable delay between characters
        } else {
          // Text finished typing, now in wait phase
          const startWaitTime = Date.now();
          const waitStart = typingDuration;

          const updateWaitProgress = () => {
            const elapsed = Date.now() - startWaitTime;
            const progress = Math.min(1, (waitStart + elapsed) / totalDuration);
            onTypewriterProgress && onTypewriterProgress(progress);

            if (elapsed < holdDuration) {
              timeoutId = setTimeout(updateWaitProgress, 16); // ~60fps progress updates
            } else {
              // Wait phase complete, advance to next passage
              if (narrativeIndex < narrativePassages.length - 1) {
                const nextIndex = narrativeIndex + 1;
                onNarrativeChange && onNarrativeChange(nextIndex);
                setDisplayedText('');
                onTypewriterProgress && onTypewriterProgress(0);
              }
            }
          };

          updateWaitProgress();
        }
      };

      // Start typing immediately
      typeCharacter();

      return () => clearTimeout(timeoutId);
    }, [showIntro, narrativeIndex, narrativePassages, onTypewriterProgress, characterInterval]);

    // Fly to selected project
    useEffect(() => {
      const view3D = view3DRef.current;
      if (!view3D || !selectedProject) return;

      console.log('Flying camera to project:', selectedProject.id);

      view3D.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          selectedProject.Longitude,
          selectedProject.Latitude,
          50000
        ),
        duration: 2.0,
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: Cesium.Math.toRadians(0)
        }
      });

    }, [selectedProject]);

    useEffect(() => {
      const view3D = view3DRef.current;
      Object.values(entitiesRef.current).forEach(entity => {
        if (!entity || !entity.projectData) return;
        const isSelected = !!(selectedProject && entity.projectData.id === selectedProject.id);
        updateMarkerGraphics(entity, markerOptions, isSelected);

        // Update Cesium's selected entity for the green bracket highlight
        if (isSelected && view3D) {
          view3D.selectedEntity = entity;
        }
      });

      // Clear selection if no project is selected
      if (!selectedProject && view3D) {
        view3D.selectedEntity = undefined;
      }
    }, [selectedProject, markerOptions]);

    function clearRevealTimeouts() {
      if (!Array.isArray(revealTimeoutsRef.current)) {
        revealTimeoutsRef.current = [];
        return;
      }
      revealTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
      revealTimeoutsRef.current = [];
    }

    function applyQualitySettings(viewer, settings) {
      if (!viewer || !settings) return;
      try {
        if (typeof settings.resolutionScale === 'number') {
          viewer.resolutionScale = settings.resolutionScale;
        }

        const scene = viewer.scene;
        if (scene) {
          if (typeof settings.msaaSamples === 'number' && 'msaaSamples' in scene) {
            scene.msaaSamples = settings.msaaSamples;
          }
          if (typeof settings.antialias === 'boolean') {
            if ('fxaa' in scene) {
              scene.fxaa = settings.antialias;
            }
            if (scene.postProcessStages && scene.postProcessStages.fxaa) {
              scene.postProcessStages.fxaa.enabled = settings.antialias;
            }
          }
          if (scene.globe) {
            if (typeof settings.maximumScreenSpaceError === 'number') {
              scene.globe.maximumScreenSpaceError = settings.maximumScreenSpaceError;
            }
            if (typeof settings.tileCacheSize === 'number') {
              scene.globe.tileCacheSize = settings.tileCacheSize;
            }
            if (typeof settings.maximumAnisotropy === 'number' &&
                scene.globe.maximumAnisotropy !== undefined) {
              scene.globe.maximumAnisotropy = settings.maximumAnisotropy;
            }
          }
          if (typeof scene.requestRender === 'function') {
            scene.requestRender();
          }
        }
      } catch (error) {
        console.warn('Failed to apply quality settings dynamically:', error);
      }
    }

    // Reveal markers with a gentle stagger
    function revealMarkers(targetEntities) {
      const view3D = view3DRef.current;
      if (!view3D) return;
      const prefersReduced = performanceFlags.prefersReducedMotion;
      const entities = Array.isArray(targetEntities) && targetEntities.length > 0
        ? targetEntities
        : Object.values(entitiesRef.current);
      if (!entities.length) return;

      clearRevealTimeouts();

      entities.forEach((entity, idx) => {
        const delay = (prefersReduced || performanceFlags.isLowPower) ? 0 : Math.min(idx * 50, 800);
        const reveal = () => {
          if (!entity || (typeof entity.isDestroyed === 'function' && entity.isDestroyed())) return;
          if (entity.billboard) {
            entity.billboard.show = true;
          }
          if (entity.label) {
            entity.label.show = !!markerOptions.showLabels;
          }
        };

        if (delay > 0) {
          const timeoutId = setTimeout(reveal, delay);
          revealTimeoutsRef.current.push(timeoutId);
        } else {
          reveal();
        }
      });
      setMarkersRevealed(true);
    }

    // Handle continue: advance to next narrative passage (or begin journey if on last passage)
    function continueNarrative() {
      if (narrativeIndex < narrativePassages.length - 1) {
        // Advance to next passage
        const nextIndex = narrativeIndex + 1;
        onNarrativeChange && onNarrativeChange(nextIndex);
        setDisplayedText('');
      } else {
        // Last passage - begin the journey
        beginJourney();
      }
    }

    // Handle intro begin: fly to Arizona-Sonora and then reveal markers
    function beginJourney() {
      setShowIntro(false);
      onTypewriterProgress && onTypewriterProgress(0);
      onIntroComplete && onIntroComplete(false);
      flyToBorderlands(() => {
        revealMarkers();
      }, performanceFlags.isLowPower);
    }

    // Handle skip: jump to region immediately and reveal markers
    function skipIntro() {
      setShowIntro(false);
      onTypewriterProgress && onTypewriterProgress(0);
      onIntroComplete && onIntroComplete(false);
      flyToBorderlands(() => {
        revealMarkers();
      }, true);
    }

    // Handle quality tier change
    function handleQualityChange(tier) {
      if (!window.MapAppPerf) {
        setQualityMenuOpen(false);
        return;
      }

      const applied = window.MapAppPerf.setQualityOverride(tier);
      if (applied) {
        setQualityOverrideState(tier || null);
        const view3D = view3DRef.current;
        const nextSettings = window.MapAppPerf.getQualitySettings();
        if (view3D && nextSettings) {
          applyQualitySettings(view3D, nextSettings);
          console.log('Quality settings applied:', {
            tier: tier || window.MapAppPerf.qualityTier || 'auto',
            settings: nextSettings
          });
        }
      } else {
        console.warn('Quality override not applied:', tier);
      }

      setQualityMenuOpen(false);
    }

    // Camera animation to configured center
    function flyToBorderlands(onComplete, instantOverride) {
      const view3D = view3DRef.current;
      if (!view3D) return;
      const { lat, lon, alt } = window.CesiumConfig.camera.center;
      const prefersReduced = performanceFlags.prefersReducedMotion;
      const duration = instantOverride || prefersReduced || performanceFlags.isLowPower ? 0 : 5.0;

      const scene = view3D.scene;
      let restoreQuality;
      if (scene && scene.globe) {
        const globe = scene.globe;
        const original = globe.maximumScreenSpaceError;
        // Temporarily reduce quality during camera movement for smoother animation
        const boosted = performanceFlags.isLowPower ? Math.max(original, 12) : Math.max(original * 1.5, original + 2);
        globe.maximumScreenSpaceError = boosted;
        restoreQuality = () => {
          globe.maximumScreenSpaceError = original;
          scene.requestRender();
        };
      }

      view3D.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt),
        orientation: {
          heading: Cesium.Math.toRadians(window.CesiumConfig.camera.heading || 0),
          // Look straight down for a clean, map-like view on arrival
          pitch: Cesium.Math.toRadians(-90),
          roll: Cesium.Math.toRadians(window.CesiumConfig.camera.roll || 0)
        },
        duration,
        complete: () => {
          if (typeof restoreQuality === 'function') restoreQuality();
          if (typeof onComplete === 'function') onComplete();
        }
      });
    }

    useEffect(() => {
      if (!viewerReady) return;
      const view3D = view3DRef.current;
      const borderConfig = window.MapAppData && window.MapAppData.borderWall;
      if (!view3D || !borderConfig || !Array.isArray(borderConfig.positions)) return;

      const coordinates = [];
      const minHeights = [];
      const maxHeights = [];
      const capHeights = [];
      const baseHeight = borderConfig.baseHeightMeters ?? 0;
      const wallHeight = borderConfig.heightMeters ?? 1400;
      const widthMeters = borderConfig.widthMeters ?? 5000;

      borderConfig.positions.forEach(point => {
        if (typeof point.lon !== 'number' || typeof point.lat !== 'number') return;
        coordinates.push(point.lon, point.lat);
        const pointBase = point.baseHeight ?? baseHeight;
        const pointTop = point.height ?? (baseHeight + wallHeight);
        minHeights.push(pointBase);
        maxHeights.push(pointTop);
        capHeights.push(point.lon, point.lat, pointTop + (borderConfig.capHeightOffset ?? 0));
      });

      if (coordinates.length < 4) return;

      const createdEntities = [];
      const registerEntity = (options) => {
        const entity = view3D.entities.add(options);
        createdEntities.push(entity);
        return entity;
      };

      const faceColor = Cesium.Color.fromCssColorString(borderConfig.material?.face || borderConfig.material?.color || '#f97316').withAlpha(0.9);
      const outerColor = Cesium.Color.fromCssColorString(borderConfig.material?.color || '#f97316').withAlpha(0.7);
      const outlineColor = Cesium.Color.fromCssColorString(borderConfig.material?.outline || '#7a3f00').withAlpha(0.6);
      const glowColor = Cesium.Color.fromCssColorString(borderConfig.material?.glow || '#ffd166').withAlpha(0.95);

      registerEntity({
        name: borderConfig.name || 'Border Wall - Face',
        wall: {
          positions: Cesium.Cartesian3.fromDegreesArray(coordinates),
          minimumHeights: minHeights,
          maximumHeights: maxHeights,
          material: outerColor,
          outline: true,
          outlineColor: outlineColor
        }
      });

      registerEntity({
        name: borderConfig.name || 'Border Wall - Volume',
        corridor: {
          positions: Cesium.Cartesian3.fromDegreesArray(coordinates),
          width: widthMeters,
          height: baseHeight,
          extrudedHeight: baseHeight + wallHeight,
          material: faceColor,
          outline: true,
          outlineColor: outlineColor,
          cornerType: Cesium.CornerType.BEVELED
        }
      });

      registerEntity({
        name: borderConfig.name || 'Border Wall - Spine',
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArrayHeights(capHeights),
          width: borderConfig.capWidth || 6,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: glowColor
          })
        }
      });

      return () => {
        createdEntities.forEach(entity => {
          if (entity && !entity.isDestroyed()) {
            view3D.entities.remove(entity);
          }
        });
      };
    }, [viewerReady]);

    // Render 3D globe
    const containerClasses = ['globe-container'];
    if (performanceFlags.isLowPower || performanceFlags.prefersReducedMotion) {
      containerClasses.push('low-power');
    }
    if (showIntro) {
      containerClasses.push('narrative-active');
    }

    return React.createElement('div', {
      className: containerClasses.join(' '),
      role: 'application',
      'aria-label': '3D Globe Map'
    },
      React.createElement('div', {
        ref: container3DRef,
        className: 'globe-viewer',
        'aria-label': '3D Map View'
      }),

      // Narrative intro overlay with typewriter effect
      showIntro && React.createElement('div', {
        className: 'globe-intro-overlay',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': 'Narrative Introduction'
      },
        // Gradient overlay
        React.createElement('div', { className: 'intro-gradient-bg' }),

        // Content container
        React.createElement('div', { className: 'intro-content-wrapper' },
          React.createElement('div', { className: 'intro-content' },
            // Narrative title
            React.createElement('h2', {
              className: 'intro-title fade-in',
              key: narrativeIndex
            }, narrativePassages[narrativeIndex]?.title || ''),

            // Typewriter text
            React.createElement('p', {
              className: 'intro-narrative-text',
              key: `text-${narrativeIndex}`
            }, displayedText),

            // Progress indicator
            React.createElement('div', { className: 'intro-progress' },
              narrativePassages.map((_, idx) =>
                React.createElement('div', {
                  key: idx,
                  className: `progress-dot ${idx === narrativeIndex ? 'active' : ''} ${idx < narrativeIndex ? 'completed' : ''}`,
                  'aria-label': `Narrative section ${idx + 1} of ${narrativePassages.length}`,
                  onClick: () => {
                    if (typeof onNarrativeChange === 'function') {
                      onNarrativeChange(idx);
                    }
                    setDisplayedText('');
                    onTypewriterProgress && onTypewriterProgress(0);
                  },
                  title: `Go to section ${idx + 1}`
                })
              )
            )
          ),

          // Action buttons
          React.createElement('div', { className: 'intro-actions' },
            React.createElement('button', {
              className: 'intro-button',
              onClick: continueNarrative,
              'aria-label': narrativeIndex === narrativePassages.length - 1 ? 'Begin exploring' : 'Continue to next passage'
            }, narrativeIndex === narrativePassages.length - 1 ? 'Begin Journey' : 'Continue'),
            React.createElement('button', {
              className: 'intro-skip',
              onClick: skipIntro,
              'aria-label': 'Skip introduction and go directly to map'
            }, 'Skip to Map')
          )
        )
      ),

      // Floating toolbar
      !showIntro && React.createElement('div', { className: 'globe-toolbar' },
        React.createElement('h3', null, 'Arizona-Sonora Borderlands'),
        React.createElement('p', null, 'Explore borderlands research projects'),

        // Share button
        React.createElement('button', {
          className: 'toolbar-share-btn',
          onClick: () => {
            if (window.MapAppUtils && window.MapAppUtils.Share) {
              window.MapAppUtils.Share.sharePage();
            }
          },
          'aria-label': 'Share this map',
          title: 'Share this map',
          style: { marginTop: '0.5rem', width: '100%' }
        }, 'Share Map'),

        // Quality selector dropdown
        React.createElement('div', { className: 'quality-selector', style: { marginTop: '0.5rem' } },
          React.createElement('button', {
            className: 'quality-button',
            onClick: () => setQualityMenuOpen(!qualityMenuOpen),
            'aria-label': 'Change quality settings',
            'aria-expanded': qualityMenuOpen
          }, `Quality: ${qualityLabel}`),

          qualityMenuOpen && React.createElement('div', { className: 'quality-menu' },
            React.createElement('button', {
              onClick: () => handleQualityChange(null),
              className: !qualityOverride ? 'active' : ''
            }, 'Auto (detect)'),
            React.createElement('button', {
              onClick: () => handleQualityChange('low'),
              className: qualityOverride === 'low' ? 'active' : ''
            }, 'Low (fast)'),
            React.createElement('button', {
              onClick: () => handleQualityChange('medium'),
              className: qualityOverride === 'medium' ? 'active' : ''
            }, 'Medium (balanced)'),
            React.createElement('button', {
              onClick: () => handleQualityChange('high'),
              className: qualityOverride === 'high' ? 'active' : ''
            }, 'High (quality)')
          )
        ),

        React.createElement('p', { className: 'toolbar-homage' }, 'Herons keep watch for our lead dev.')
      )
    );
  };
})();
