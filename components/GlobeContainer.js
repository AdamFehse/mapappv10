// GlobeContainer.js - Cesium Split View (3D + 2D)
(function() {
  const { useEffect, useRef, useState } = React;
  window.MapApp = window.MapApp || {};

  const MARKER_PALETTE_FALLBACK = ['#4fc3f7', '#ff8a65', '#66bb6a', '#ffd54f', '#ba68c8'];

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
    if (!name) return '•';
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

  function buildMarkerVisual(project, markerOptions, isSelected) {
    if (!project) return null;
    const paletteColor = pickMarkerColor(project, markerOptions.palette, markerOptions.defaultColor);
    const baseColor = isSelected ? (markerOptions.selectedColor || paletteColor) : paletteColor;
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

    return {
      image: svgToDataUri(svgMarkup),
      width: markerOptions.size,
      height: Math.round(markerOptions.size * 1.25),
      scale: isSelected ? 1.08 : 1,
      labelText: getMarkerLabelText(project, markerOptions.labelMaxChars)
    };
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
    const clockViewModelRef = useRef(null);
    const [showIntro, setShowIntro] = useState(() => {
      const passages = window.MapAppConfig?.narrative?.passages;
      return Array.isArray(passages) && passages.length > 0;
    });
    const [markersRevealed, setMarkersRevealed] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [viewerReady, setViewerReady] = useState(false);
    const globeQualityRef = useRef(null);

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
        // Create shared clock for syncing
        const clockViewModel = new Cesium.ClockViewModel();
        clockViewModelRef.current = clockViewModel;

        // 3D Viewer options derived from CesiumConfig to avoid clashes
        const cfg = window.CesiumConfig && window.CesiumConfig.viewerOptions ? window.CesiumConfig.viewerOptions : {};
        // Map config strings to Cesium providers
        const terrainOpt = (cfg.terrainProvider === 'CESIUM_WORLD_TERRAIN')
          ? Cesium.Terrain.fromWorldTerrain()
          : undefined; // undefined => default flat terrain

        let imageryOpt;
        try {
          switch (cfg.imageryProvider) {
            case 'ION_ASSET': {
              const assetId = cfg.ionAssetId;
              if (typeof assetId === 'number') {
                imageryOpt = new Cesium.IonImageryProvider({ assetId });
              } else {
                console.warn('ION_ASSET selected but ionAssetId is not set. Falling back to Ion World Imagery (2).');
                imageryOpt = new Cesium.IonImageryProvider({ assetId: 2 });
              }
              break;
            }
            case 'ION_WORLD_IMAGERY':
            default:
              // Cesium Ion World Imagery (assetId: 2)
              imageryOpt = new Cesium.IonImageryProvider({ assetId: 2 });
              break;
          }
        } catch (e) {
          console.warn('Falling back to default imagery provider due to error:', e);
          imageryOpt = undefined; // Let Viewer choose default imagery
        }

        const options3D = {
          // Respect config flags; fall back to sensible defaults
          animation: cfg.animation ?? false,
          timeline: cfg.timeline ?? false,
          baseLayerPicker: cfg.baseLayerPicker ?? false,
          geocoder: cfg.geocoder ?? false,
          homeButton: cfg.homeButton ?? true,
          sceneModePicker: cfg.sceneModePicker ?? true,
          navigationHelpButton: cfg.navigationHelpButton ?? false,
          fullscreenButton: cfg.fullscreenButton ?? true,
          vrButton: cfg.vrButton ?? false,
          requestRenderMode: cfg.requestRenderMode ?? true,
          maximumRenderTimeChange: cfg.maximumRenderTimeChange ?? Infinity,
          imageryProvider: imageryOpt,
          terrain: terrainOpt,
          clockViewModel: clockViewModel
        };

        // Create 3D viewer
        const view3D = new Cesium.Viewer(container3DRef.current, options3D);
        view3DRef.current = view3D;
        setViewerReady(true);

        const scene = view3D.scene;
        if (scene && scene.globe) {
          globeQualityRef.current = scene.globe.maximumScreenSpaceError;
          if (performanceFlags.isLowPower) {
            scene.globe.maximumScreenSpaceError = Math.max(scene.globe.maximumScreenSpaceError, 6);
          }
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

        // Add Earth-at-Night (Black Marble) imagery as base or overlay
        try {
          const nightAssetId = typeof cfg.nightAssetId === 'number' ? cfg.nightAssetId : 3812; // 3812: Black Marble
          if (cfg.nightAsBase) {
            // Replace base layer with Black Marble
            if (Cesium.ImageryLayer && typeof Cesium.ImageryLayer.fromAssetId === 'function') {
              const bmLayer = Cesium.ImageryLayer.fromAssetId(nightAssetId);
              view3D.imageryLayers.removeAll();
              view3D.imageryLayers.add(bmLayer, 0);
            } else {
              const provider = new Cesium.IonImageryProvider({ assetId: nightAssetId });
              view3D.imageryLayers.removeAll();
              view3D.imageryLayers.addImageryProvider(provider, 0);
            }
          } else if (cfg.addNightOverlay) {
            // Add as an overlay with alpha blending
            const alpha = typeof cfg.nightOverlayAlpha === 'number' ? cfg.nightOverlayAlpha : 0.8;
            if (Cesium.ImageryLayer && typeof Cesium.ImageryLayer.fromAssetId === 'function') {
              const overlay = Cesium.ImageryLayer.fromAssetId(nightAssetId);
              overlay.alpha = alpha;
              view3D.imageryLayers.add(overlay);
            } else {
              const provider = new Cesium.IonImageryProvider({ assetId: nightAssetId });
              const overlay = view3D.imageryLayers.addImageryProvider(provider);
              if (overlay) overlay.alpha = alpha;
            }
          }
        } catch (e) {
          console.warn('Failed to configure Black Marble layer:', e);
        }

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
      if (!view3D || !projects) return;

      console.log('Updating project markers:', projects.length);

      // Clear existing markers
      Object.values(entitiesRef.current).forEach(entity => {
        view3D.entities.remove(entity);
      });
      entitiesRef.current = {};

      // Add new markers
      projects.forEach(project => {
        if (typeof project.Latitude !== 'number' || typeof project.Longitude !== 'number') return;

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

        entitiesRef.current[project.id] = entity;
        updateMarkerGraphics(entity, markerOptions, !!(selectedProject && project.id === selectedProject.id));
      });

      // If intro already completed, ensure markers are visible
      if (!showIntro && !markersRevealed) {
        revealMarkers();
      }

    }, [projects, showIntro]);

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
      Object.values(entitiesRef.current).forEach(entity => {
        if (!entity || !entity.projectData) return;
        const isSelected = !!(selectedProject && entity.projectData.id === selectedProject.id);
        updateMarkerGraphics(entity, markerOptions, isSelected);
      });
    }, [selectedProject]);

    // Reveal markers with a gentle stagger
    function revealMarkers() {
      const view3D = view3DRef.current;
      if (!view3D) return;
      const prefersReduced = performanceFlags.prefersReducedMotion;
      const entities = Object.values(entitiesRef.current);
      entities.forEach((entity, idx) => {
        const delay = (prefersReduced || performanceFlags.isLowPower) ? 0 : Math.min(idx * 50, 800); // cap total delay
        setTimeout(() => {
          if (!entity || entity.isDestroyed && entity.isDestroyed()) return;
          entity.billboard && (entity.billboard.show = true);
          entity.label && (entity.label.show = true);
        }, delay);
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

    // Camera animation to configured center
    function flyToBorderlands(onComplete, instantOverride) {
      const view3D = view3DRef.current;
      if (!view3D) return;
      const { lat, lon, alt } = window.CesiumConfig.camera.center;
      const prefersReduced = performanceFlags.prefersReducedMotion;
      const duration = instantOverride || prefersReduced || performanceFlags.isLowPower ? 0 : 5.0; // slower cinematic zoom

      const scene = view3D.scene;
      let restoreQuality;
      if (scene && scene.globe) {
        const globe = scene.globe;
        const original = globe.maximumScreenSpaceError;
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
    return React.createElement('div', {
      className: 'globe-container',
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
                  'aria-label': `Narrative section ${idx + 1} of ${narrativePassages.length}`
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
      React.createElement('div', { className: 'globe-toolbar' },
        React.createElement('h3', null, 'Arizona-Sonora Borderlands'),
        React.createElement('p', null, 'Explore borderlands research projects')
      )
    );
  };
})();
