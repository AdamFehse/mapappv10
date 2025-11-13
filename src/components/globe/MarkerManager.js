/**
 * MarkerManager.js - Simple default Cesium markers
 */

export const MarkerManager = {
  buildMarkerVisual: () => null,
  updateMarkerGraphics: (entity, markerOptions) => {
    if (!entity || !entity.billboard) return;

    // Use Cesium's built-in point visualization
    entity.billboard.show = true;
    entity.billboard.scale = 1.0;
    entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
  },
  clearCache: () => {}
};
