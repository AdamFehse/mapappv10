# Share Feature Documentation

## Overview
Added comprehensive share functionality throughout the app to make it easy for users to share projects and the map itself.

## What's New

### 🎯 Share Functionality Added

1. **Share Individual Projects**
   - Share button on every project detail view
   - Creates direct links to specific projects (`#project/PROJECT_ID`)
   - Works with browser routing

2. **Share the Entire Map**
   - Share button in globe toolbar
   - Shares the main map page

3. **Multiple Share Methods**
   - **Native Web Share API** (mobile-friendly) - shares to installed apps
   - **Clipboard Copy** - fallback for desktop browsers
   - **Social Media** - ready for Twitter, Facebook, LinkedIn, Email

## Files Added/Modified

| File | Status | Purpose |
|------|--------|---------|
| `utils/share.js` | ✅ NEW | Share utility functions |
| `index.html` | ✅ Updated | Added share.js script |
| `components/RightPanel.js` | ✅ Updated | Added share button to project details |
| `components/GlobeContainer.js` | ✅ Updated | Added share button to toolbar |
| `styles/explorer-bar.css` | ✅ Updated | Share button styles for project detail |
| `styles/globe.css` | ✅ Updated | Share button styles for toolbar |

## How It Works

### Share a Project
```javascript
// User clicks "Share Project" button in detail view
window.MapAppUtils.Share.shareProject(project);

// Tries native share first (mobile)
// Falls back to clipboard copy (desktop)
// Generates URL like: https://yoursite.com/#project/proj-001
```

### Share the Map
```javascript
// User clicks "Share Map" button in toolbar
window.MapAppUtils.Share.sharePage();

// Shares: https://yoursite.com/
```

### Share to Social Media (Ready for Future)
```javascript
// Twitter/X
window.MapAppUtils.Share.shareToSocial('twitter', project);

// Facebook
window.MapAppUtils.Share.shareToSocial('facebook', project);

// LinkedIn
window.MapAppUtils.Share.shareToSocial('linkedin', project);

// Email
window.MapAppUtils.Share.shareToSocial('email', project);
```

## User Experience

### Mobile (iOS/Android)
1. User clicks "Share Project" or "Share Map"
2. Native share sheet appears
3. User can share to any installed app (Messages, WhatsApp, Email, etc.)

### Desktop
1. User clicks "Share Project" or "Share Map"
2. Link is copied to clipboard automatically
3. Alert confirms: "Link copied to clipboard!"
4. User can paste the link anywhere

## Share URLs

### Project Share URL Format
```
https://yoursite.com/#project/PROJECT_ID
```

Example:
```
https://yoursite.com/#project/proj-001
```

### Map Share URL Format
```
https://yoursite.com/
```

## Share Text Examples

### Project Share
```
Check out "Border Wall Impacts on Wildlife" in Arizona on the Arizona-Sonora Borderlands Research Map
```

### Map Share
```
Explore research projects across the Arizona-Sonora borderlands
```

## Browser Support

| Feature | Support |
|---------|---------|
| Native Web Share | ✅ Safari (iOS/macOS), Chrome (Android), Edge |
| Clipboard Copy | ✅ All modern browsers |
| Social Media Links | ✅ All browsers |

## Future Enhancements (TODO)

### Phase 1 (Current) ✅
- [x] Basic share functionality
- [x] Project detail share button
- [x] Toolbar share button
- [x] Native share + clipboard fallback

### Phase 2 (Future) 🔮
- [ ] Add social media buttons to project detail view
- [ ] QR code generation for easy mobile sharing
- [ ] Share analytics (track what gets shared most)
- [ ] Custom share messages per project type
- [ ] Share preview cards (Open Graph meta tags)
- [ ] Toast notifications instead of alerts

### Phase 3 (Future) 🚀
- [ ] Share to specific collections/playlists
- [ ] Embed code for projects (iframe)
- [ ] Print-friendly project cards
- [ ] Download project as PDF
- [ ] Share multiple projects at once

## Testing

### Test on Mobile (iOS/Android)
1. Open site on mobile device
2. Navigate to any project detail
3. Click "Share Project" button
4. Native share sheet should appear
5. Share to Messages/WhatsApp to test

### Test on Desktop
1. Open site on desktop browser
2. Navigate to any project detail
3. Click "Share Project" button
4. Should see "Link copied to clipboard!" alert
5. Paste in another app to verify URL

### Test Deep Linking
1. Share a project (copy URL)
2. Open URL in new tab/window
3. Should navigate directly to that project detail view
4. Project should be selected and detail view open

## API Reference

### `Share.shareProject(project)`
Share a specific project
- **Params:** `project` - Project object with `id` and `ProjectName`
- **Returns:** `Promise<boolean>` - True if shared successfully

### `Share.sharePage()`
Share the entire map page
- **Returns:** `Promise<boolean>` - True if shared successfully

### `Share.shareToSocial(platform, project)`
Share to specific social media platform
- **Params:** 
  - `platform` - 'twitter', 'facebook', 'linkedin', 'email'
  - `project` - Project object (optional for page share)
- **Returns:** `void`

### `Share.getProjectShareUrl(project)`
Get shareable URL for a project
- **Params:** `project` - Project object
- **Returns:** `string` - Full URL with hash

### `Share.canUseNativeShare()`
Check if native Web Share API is available
- **Returns:** `boolean`

## Styling

### Share Buttons
- Gradient background (primary → primary-hover)
- Rounded pill shape (border-radius: 999px)
- Subtle shadow and hover lift effect
- Emoji icon (🔗) for visual recognition

### Colors
- Uses existing theme variables
- Respects dark/light mode
- Primary brand colors for consistency

## Accessibility

- ✅ Proper ARIA labels
- ✅ Keyboard accessible
- ✅ Clear focus states
- ✅ Screen reader friendly
- ✅ Semantic button elements

## Notes

- Share URLs use hash routing (`#project/id`) for SPA compatibility
- No backend required - pure frontend sharing
- Works with existing routing system
- Alert fallback is temporary (TODO: replace with toast notifications)

## Questions?

If you want to:
- Add social media buttons → Uncomment sections in `share.js`
- Customize share text → Edit `getProjectShareText()` function
- Add share analytics → Hook into share functions
- Change share button design → Edit `.detail-share-btn` in CSS files
