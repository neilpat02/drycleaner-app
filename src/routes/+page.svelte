<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
  import { calculateDistance } from '$lib/distanceCalculator';
  import { STORE_CONFIG } from '$lib/config';

  let map;
  let firstName = '';
  let lastName = '';
  let phone = '';
  let email = '';
  let address = '';
  let distance = null;
  let error = '';
  let userCoords = null;

  // Initialize map on component mount
  onMount(() => {
    initializeMap();
  });

  async function checkEligibility() {
    try {
      // Geocode address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`
      );
      const data = await response.json();
      if (!data.features.length) throw new Error('Address not found');
      
      userCoords = data.features[0].geometry.coordinates; // [lng, lat]
      
      // Calculate distance (STORE_CONFIG.coordinates is assumed [lat, lng])
      distance = calculateDistance(
        [STORE_CONFIG.coordinates[0], STORE_CONFIG.coordinates[1]],
        [userCoords[1], userCoords[0]] // Flip to [lat, lng]
      );

      // Update map with user's location
      updateMap(userCoords);
      error = '';
    } catch (err) {
      error = 'Could not validate address. Please try again.';
      distance = null;
    }
  }

  function initializeMap() {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;
    
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [STORE_CONFIG.coordinates[1], STORE_CONFIG.coordinates[0]],
      zoom: 10
    });

    // Add store marker with a custom element
    new mapboxgl.Marker({ 
      color: '#3B82F6',
      element: createMarkerElement()
    })
      .setLngLat([STORE_CONFIG.coordinates[1], STORE_CONFIG.coordinates[0]])
      .addTo(map);

    function createMarkerElement() {
      const element = document.createElement('div');
      element.className = 'store-marker';
      element.innerHTML = `
        <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
        </svg>
      `;
      return element;
    }

    // Add radius circle around the store
    map.on('load', () => {
      map.addSource('radius', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [createRadiusCircle()]
          }
        }
      });

      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius',
        paint: {
          'fill-color': '#3B82F6',
          'fill-opacity': 0.2
        }
      });
    });
  }

  function updateMap(userCoords) {
    // Remove existing user marker if present
    if (map.getLayer('user-marker')) map.removeLayer('user-marker');
    if (map.getSource('user-marker')) map.removeSource('user-marker');

    // Add new user marker
    map.addSource('user-marker', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: userCoords
        }
      }
    });

    map.addLayer({
      id: 'user-marker',
      type: 'circle',
      source: 'user-marker',
      paint: {
        'circle-radius': 8,
        'circle-color': '#EF4444'
      }
    });

    // Adjust map bounds to include both the store and the user's location
    const bounds = new mapboxgl.LngLatBounds()
      .extend([STORE_CONFIG.coordinates[1], STORE_CONFIG.coordinates[0]])
      .extend(userCoords);
    
    map.fitBounds(bounds, { padding: 50 });
  }

  // Helper to create circle coordinates for the service radius
  function createRadiusCircle() {
    const points = [];
    const center = [STORE_CONFIG.coordinates[1], STORE_CONFIG.coordinates[0]];
    const radius = STORE_CONFIG.serviceRadius / 69; // Convert miles to approximate degrees

    for (let i = 0; i < 360; i += 5) {
      const radians = (i * Math.PI) / 180;
      points.push([
        center[0] + radius * Math.cos(radians),
        center[1] + radius * Math.sin(radians)
      ]);
    }
    
    return points;
  }
</script>

<!-- Page Container with a Vibrant Gradient Background -->
<div class="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 p-6">
  <div class="max-w-6xl mx-auto space-y-8">
    <!-- Header -->
    <header class="text-center">
      <h1 class="text-5xl font-extrabold text-white drop-shadow-lg">Fabricare Cleaners</h1>
      <h2 class="text-2xl font-semibold text-indigo-100 mt-2">Canton, GA - Macedonia</h2>
    </header>

    <!-- Flex Container for Form and Map -->
    <div class="flex flex-col md:flex-row gap-8">
      <!-- Form Card -->
      <div class="bg-gradient-to-br from-white to-blue-50 p-8 rounded-lg shadow-lg md:w-1/2">
        <form on:submit|preventDefault={checkEligibility} class="space-y-6">
          <div>
            <label for="first-name" class="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              id="first-name"
              bind:value={firstName}
              type="text"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your first name"
            />
          </div>
          
          <div>
            <label for="last-name" class="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              id="last-name"
              bind:value={lastName}
              type="text"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your last name"
            />
          </div>
          
          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              bind:value={phone}
              type="tel"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(555) 123-4567"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              bind:value={email}
              type="email"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label for="address-input" class="block text-sm font-medium text-gray-700 mb-2">
              Enter Your Address
            </label>
            <input
              id="address-input"
              bind:value={address}
              type="text"
              required
              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123 Main St, City, State ZIP"
            />
          </div>
          
          <button
            type="submit"
            class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Check Service Availability
          </button>
        </form>

        {#if error}
          <div class="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        {:else if distance !== null}
          <div class="mt-6 p-4 {distance <= 25 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'} rounded-lg">
            {#if distance <= 25}
              <p class="font-semibold">🎉 We service your area!</p>
              <p>{distance.toFixed(1)} miles from our store</p>
            {:else}
              <p class="font-semibold">⚠️ Currently outside service area</p>
              <p>{distance.toFixed(1)} miles from our store (25 mile radius)</p>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Map Container -->
      <div id="map" class="h-96 w-full md:w-1/2 rounded-lg shadow-lg border relative overflow-hidden"></div>
    </div>
  </div>
</div>

<style global>
  /* Customize Mapbox controls if needed */
  .mapboxgl-ctrl {
    @apply rounded-lg shadow-sm;
  }
  .mapboxgl-popup-content {
    @apply rounded-lg shadow-md p-3;
  }
</style>
