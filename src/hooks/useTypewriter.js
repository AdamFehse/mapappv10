/**
 * useTypewriter.js - Hook for typewriter text effect with progress tracking
 */

export function useTypewriter({
  isActive = false,
  passages = [],
  narrativeIndex = 0,
  characterInterval = 50,
  onDisplayedTextChange = () => {},
  onProgressChange = () => {},
  onNavigatePassage = () => {}
}) {
  const { useState, useEffect } = window.React;
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    if (!isActive || narrativeIndex >= passages.length || passages.length === 0) return;

    const passage = passages[narrativeIndex];
    let charIndex = 0;
    let timeoutId;

    const holdDuration = passage.holdDurationMs ?? 0;
    const typingDuration = passage.text.length * characterInterval;
    const totalDuration = typingDuration + holdDuration;

    const typeCharacter = () => {
      if (charIndex <= passage.text.length) {
        const text = passage.text.substring(0, charIndex);
        setDisplayedText(text);
        onDisplayedTextChange(text);

        const elapsedTime = charIndex * characterInterval;
        const progress = Math.min(1, elapsedTime / totalDuration);
        onProgressChange(progress);

        charIndex++;
        timeoutId = setTimeout(typeCharacter, characterInterval);
      } else {
        // Text finished typing, now in wait phase
        const startWaitTime = Date.now();
        const waitStart = typingDuration;

        const updateWaitProgress = () => {
          const elapsed = Date.now() - startWaitTime;
          const progress = Math.min(1, (waitStart + elapsed) / totalDuration);
          onProgressChange(progress);

          if (elapsed < holdDuration) {
            timeoutId = setTimeout(updateWaitProgress, 16); // ~60fps progress updates
          } else {
            // Wait phase complete, advance to next passage
            if (narrativeIndex < passages.length - 1) {
              onNavigatePassage(narrativeIndex + 1);
              setDisplayedText('');
              onProgressChange(0);
            }
          }
        };

        updateWaitProgress();
      }
    };

    // Start typing immediately
    typeCharacter();

    return () => clearTimeout(timeoutId);
  }, [isActive, narrativeIndex, passages, characterInterval, onDisplayedTextChange, onProgressChange, onNavigatePassage]);

  return { displayedText };
}
