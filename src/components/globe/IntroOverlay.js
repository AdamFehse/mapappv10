/**
 * IntroOverlay.js - Narrative introduction overlay with staggered fade-in
 * Modern, accessible, CSS-animated presentation
 */

export function IntroOverlay({
  isActive = false,
  narrativeIndex = 0,
  passages = [],
  onNavigatePassage = () => {},
  onContinue = () => {},
  onSkip = () => {}
}) {
  if (!isActive || passages.length === 0) {
    return null;
  }

  const passage = passages[narrativeIndex];
  if (!passage) return null;

  return React.createElement('div', {
    className: 'globe-intro-overlay',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'Narrative Introduction'
  },
    // Gradient overlay
    React.createElement('div', { className: 'intro-gradient-bg' }),

    // Content container with staggered animations
    React.createElement('div', { className: 'intro-content-wrapper' },
      React.createElement('div', { className: 'intro-content' },
        // Narrative title - fades in first
        React.createElement('h2', {
          className: 'intro-title',
          style: {
            animation: 'fadeInDown 0.8s ease-out 0.2s both'
          }
        }, passage.title || ''),

        // Narrative description - fades in second
        React.createElement('p', {
          className: 'intro-narrative-text',
          style: {
            animation: 'fadeInUp 0.8s ease-out 0.5s both'
          }
        }, passage.text || ''),

        // Progress indicator dots - fade in third
        React.createElement('div', {
          className: 'intro-progress',
          style: {
            animation: 'fadeIn 0.6s ease-out 0.8s both'
          }
        },
          passages.map((_, idx) =>
            React.createElement('button', {
              key: idx,
              className: `progress-dot ${idx === narrativeIndex ? 'active' : ''} ${idx < narrativeIndex ? 'completed' : ''}`,
              'aria-label': `Go to narrative section ${idx + 1} of ${passages.length}`,
              onClick: () => onNavigatePassage(idx),
              type: 'button'
            })
          )
        )
      ),

      // Action buttons - fade in last
      React.createElement('div', {
        className: 'intro-actions',
        style: {
          animation: 'fadeInUp 0.8s ease-out 1s both'
        }
      },
        React.createElement('button', {
          className: 'intro-button',
          onClick: onContinue,
          'aria-label': narrativeIndex === passages.length - 1 ? 'Begin exploring' : 'Continue to next passage',
          type: 'button'
        }, narrativeIndex === passages.length - 1 ? 'Begin Journey' : 'Continue'),

        React.createElement('button', {
          className: 'intro-skip',
          onClick: onSkip,
          'aria-label': 'Skip introduction and go directly to map',
          type: 'button'
        }, 'Skip to Map')
      )
    )
  );
}
