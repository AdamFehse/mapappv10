// NarrativeBar.js - Displays typewriter text synced from GlobeContainer with progress bar
(function() {
  window.MapApp = window.MapApp || {};

  window.MapApp.NarrativeBar = function NarrativeBar({
    projects = [],
    onSelectProject = () => {},
    onNarrativeChange = () => {},
    isActive = true,
    narrativeIndex = 0,
    typewriterProgress = 0
  }) {

    // Get featured projects from narrative config
    const narrativeConfig = React.useMemo(() => {
      return window.MapAppConfig?.narrative || { passages: [] };
    }, []);
    const narrativePassages = narrativeConfig.passages || [];

    // Build featured projects list from narrative passage featuredProjectIds
    const passageProjects = React.useMemo(() => {
      return narrativePassages.map(passage => {
        if (!passage?.featuredProjectId) return null;
        return projects.find(p => p.id === passage.featuredProjectId) || null;
      });
    }, [projects, narrativePassages]);

    const totalPassages = narrativePassages.length;
    const safeIndex = totalPassages > 0
      ? Math.min(Math.max(narrativeIndex, 0), totalPassages - 1)
      : 0;
    const currentProject = passageProjects[safeIndex] || passageProjects.find(Boolean) || null;
    const progressPercent = Math.max(0, Math.min(100, (typewriterProgress || 0) * 100));

    const handleDotNavigate = (index, event) => {
      event.stopPropagation();
      if (typeof onNarrativeChange === 'function') {
        onNarrativeChange(index);
      }
    };

    const handleSelectProject = () => {
      if (currentProject && isActive) {
        onSelectProject(currentProject);
      }
    };

    if (!currentProject) {
      return React.createElement('section', {
        style: {
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer'
        },
        onClick: handleSelectProject
      },
        React.createElement('div', null,
          React.createElement('h1', {
            style: {
              fontSize: '3rem',
              fontWeight: 'bold',
              margin: 0,
              marginBottom: '20px'
            }
          }, 'Welcome'),
          React.createElement('p', {
            style: {
              fontSize: '1.1rem',
              margin: 0
            }
          }, 'Loading featured projects...')
        )
      );
    }

    return React.createElement('section', {
      style: {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        padding: '40px 30px',
        textAlign: 'center',
        cursor: 'pointer',
        overflow: 'hidden'
      },
      onClick: handleSelectProject
    },
      // Blurred background image
      currentProject.ImageUrl && React.createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${currentProject.ImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px) brightness(0.6)',
          zIndex: 0
        }
      }),

      // Dark overlay
      React.createElement('div', {
        style: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1
        }
      }),

      // Content - positioned above background
      React.createElement('div', {
        style: {
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          width: '100%'
        }
      },
        // Title - SYNCED with typewriter from left side (NO typewriter animation here)
        React.createElement('h1', {
          style: {
            fontSize: '2.8rem',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '20px',
            lineHeight: '1.2',
            minHeight: '140px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }, currentProject.ProjectName),

        // Location
        currentProject.Location && React.createElement('p', {
          style: {
            fontSize: '1rem',
            margin: '15px 0 0 0',
            opacity: 0.95,
            fontWeight: '500'
          }
        }, `📍 ${currentProject.Location}`),

        // Description
        (currentProject.DescriptionShort || currentProject.Description) && React.createElement('p', {
          style: {
            fontSize: '0.95rem',
            marginTop: '25px',
            marginBottom: 0,
            maxWidth: '400px',
            lineHeight: '1.6',
            opacity: 0.9,
            fontWeight: '400'
          }
        }, currentProject.DescriptionShort || currentProject.Description)
      ),

      // Progress dots - at bottom
      totalPassages > 0 && React.createElement('div', {
        style: {
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          gap: '10px',
          marginTop: 'auto',
          marginBottom: '30px',
          justifyContent: 'center'
        }
      },
        narrativePassages.map((_, idx) =>
          React.createElement('div', {
            key: idx,
            style: {
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: idx === safeIndex ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            },
            onClick: (event) => handleDotNavigate(idx, event)
          })
        )
      ),

      // Progress bar - shows typewriter completion
      React.createElement('div', {
        style: {
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.2)',
          marginBottom: 0,
          borderRadius: '2px',
          overflow: 'hidden'
        }
      },
        React.createElement('div', {
          style: {
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
            width: `${progressPercent}%`,
            transition: 'width 0.05s linear',
            borderRadius: '2px'
          }
        })
      )
    );
  };
})();
