export const DEFAULT_CONFIG = {
  fabrics: [
    { name: 'Standard', min: 0, max: 25 },
    { name: 'Plus', min: 25, max: 50 },
    { name: 'Premium', min: 50, max: 75 },
    { name: 'Luxury', min: 75, max: 200 },
  ],
  make: 45,
  lining: 20,
  install: { sheer: 75, drape: 94, shutter: 109, roller: 37 },
  wavefold: { fixed: 284, perMm: 0.096667, min: 900 },
  pinch: { fixed: 84, perMm: 0.043333, min: 900 },
  rollerSqm: 0,
  shutterBass: 656,
  shutterPvc: 328,
  buffer: 15,
}

export const PASSWORD = 'curtainideas'
