// Device configurations
window.Gardener = window.Gardener || {};

window.Gardener.devices = {
  iphone17: {
    label: 'iPhone 17 (393×852)',
    width: 393,
    height: 852,
    cornerRadius: 55,
    dynamicIsland: {
      width: 126,
      height: 37,
      top: 11,
      borderRadius: 20,
    },
    safeArea: {
      statusBarHeight: 59,
      homeIndicatorHeight: 34,
    },
  },
  desktop: {
    label: 'Desktop (1440×900)',
    width: 1440,
    height: 900,
    cornerRadius: 0,
    dynamicIsland: null,
    safeArea: null,
  },
};
