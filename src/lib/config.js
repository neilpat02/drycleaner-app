export const STORE_CONFIG = {
    coordinates: [
      parseFloat(import.meta.env.VITE_STORE_LAT),
      parseFloat(import.meta.env.VITE_STORE_LNG)
    ],
    serviceRadius: 25 // miles
  };