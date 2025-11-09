/**
 * Get shareable URL for a project
 * @param {Object} project - Project object
 * @returns {string} - Full URL with project hash
 */
function getProjectShareUrl(project) {
  if (!project || !project.id) {
    return window.location.origin + window.location.pathname;
  }
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#project/${project.id}`;
}

/**
 * Get share text for a project
 * @param {Object} project - Project object
 * @returns {string} - Share text
 */
function getProjectShareText(project) {
  if (!project) {
    return 'Check out the Arizona-Sonora Borderlands Research Map';
  }
  const name = project.ProjectName || 'this project';
  const location = project.Location ? ` in ${project.Location}` : '';
  return `Check out "${name}"${location} on the Arizona-Sonora Borderlands Research Map`;
}

/**
 * Share a project using native Web Share API or fallback
 * @param {Object} project - Project to share
 * @returns {Promise<boolean>} - True if shared successfully
 */
async function shareProject(project) {
  const url = getProjectShareUrl(project);
  const title = project?.ProjectName || 'Arizona-Sonora Borderlands';
  const text = getProjectShareText(project);

  // Try native Web Share API first (mobile-friendly)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url
      });
      console.log('Shared via Web Share API');
      return true;
    } catch (error) {
      // User cancelled or error occurred
      if (error.name !== 'AbortError') {
        console.log('Web Share API failed, falling back to clipboard:', error);
      }
    }
  }

  // Fallback: Copy to clipboard
  return copyToClipboard(url, text);
}

/**
 * Copy URL to clipboard
 * @param {string} url - URL to copy
 * @param {string} text - Optional text to show in notification
 * @returns {Promise<boolean>} - True if copied successfully
 */
async function copyToClipboard(url, text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      console.log('Copied to clipboard:', url);
      // TODO: Show toast notification
      alert('Link copied to clipboard!');
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (success) {
        console.log('Copied to clipboard (fallback):', url);
        alert('Link copied to clipboard!');
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    alert('Failed to copy link. Please copy manually: ' + url);
  }
  return false;
}

/**
 * Share to specific social media platform
 * @param {string} platform - 'twitter', 'facebook', 'linkedin', 'email'
 * @param {Object} project - Project to share
 */
function shareToSocial(platform, project) {
  const url = getProjectShareUrl(project);
  const text = getProjectShareText(project);
  const title = project?.ProjectName || 'Arizona-Sonora Borderlands';

  let shareUrl;

  switch (platform.toLowerCase()) {
    case 'twitter':
    case 'x':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      break;

    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      break;

    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
      break;

    case 'email':
      const subject = encodeURIComponent(title);
      const body = encodeURIComponent(`${text}\n\n${url}`);
      shareUrl = `mailto:?subject=${subject}&body=${body}`;
      break;

    default:
      console.error('Unknown platform:', platform);
      return;
  }

  // Open in new window (except email)
  if (platform.toLowerCase() !== 'email') {
    window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
  } else {
    window.location.href = shareUrl;
  }

  console.log(`Shared to ${platform}`);
}

/**
 * Share the entire map/page
 */
async function sharePage() {
  const url = window.location.origin + window.location.pathname;
  const title = 'Arizona-Sonora Borderlands Research Map';
  const text = 'Explore research projects across the Arizona-Sonora borderlands';

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.log('Web Share API failed:', error);
      }
    }
  }

  return copyToClipboard(url, text);
}

/**
 * Check if Web Share API is available
 * @returns {boolean}
 */
function canUseNativeShare() {
  return !!(navigator.share);
}

// Share utilities
window.MapAppUtils = window.MapAppUtils || {};
window.MapAppUtils.Share = {
  shareProject,
  sharePage,
  shareToSocial,
  getProjectShareUrl,
  getProjectShareText,
  copyToClipboard,
  canUseNativeShare
};
