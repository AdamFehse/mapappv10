// GlobeContainer.js - Cesium Split View (3D + 2D)
(function() {
  const { useEffect, useRef, useState } = React;
  window.MapApp = window.MapApp || {};

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

        // Optional: Add Earth-at-Night (Black Marble) imagery as base or overlay
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
        if (!project.Latitude || !project.Longitude) return;

        const entity = view3D.entities.add({
          position: Cesium.Cartesian3.fromDegrees(
            project.Longitude,
            project.Latitude
          ),
          billboard: {
            image: 'data:image/svg+xml;base64,' + btoa(`
              <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="8" fill="#2196F3" stroke="white" stroke-width="2"/>
              </svg>
            `),
            width: 32,
            height: 32,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            show: !showIntro // keep hidden until intro completes
          },
          label: {
            text: project.ProjectName,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.TOP,
            pixelOffset: new Cesium.Cartesian2(0, 10),
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: !showIntro
          },
          projectData: project
        });

        entitiesRef.current[project.id] = entity;
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

    // Reveal markers with a gentle stagger
    function revealMarkers() {
      const view3D = view3DRef.current;
      if (!view3D) return;
      const prefersReduced = !!(window.CesiumConfig && window.CesiumConfig.accessibility && window.CesiumConfig.accessibility.reducedMotion);
      const entities = Object.values(entitiesRef.current);
      entities.forEach((entity, idx) => {
        const delay = prefersReduced ? 0 : Math.min(idx * 50, 800); // cap total delay
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
      });
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
      const prefersReduced = !!(window.CesiumConfig && window.CesiumConfig.accessibility && window.CesiumConfig.accessibility.reducedMotion);
      const duration = instantOverride || prefersReduced ? 0 : 5.0; // slower cinematic zoom

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
          if (typeof onComplete === 'function') onComplete();
        }
      });
    }

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
