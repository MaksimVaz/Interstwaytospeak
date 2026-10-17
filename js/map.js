// Leaflet map with preset places; a click anywhere else picks a custom spot.
// `L` comes from the Leaflet script tag in index.html.

const leafIcon = (selected) =>
  L.divIcon({
    className: '',
    html: `<span class="leaf-marker${selected ? ' is-selected' : ''}">🍁</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const customIcon = () =>
  L.divIcon({ className: '', html: '<span class="leaf-marker is-selected">💗</span>', iconSize: [32, 32], iconAnchor: [16, 16] });

export function createPlaceMap(element, { center, zoom, places }, onPick) {
  const map = L.map(element, { scrollWheelZoom: false }).setView(center, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(map);

  const markers = [];
  let customMarker = null;

  const select = (marker, place) => {
    markers.forEach((m) => m.setIcon(leafIcon(m === marker)));
    onPick(place);
  };

  places.forEach((place) => {
    const marker = L.marker(place.coords, { icon: leafIcon(false), title: place.name, keyboard: true })
      .addTo(map)
      .bindTooltip(`<strong>${place.name}</strong><br>${place.note}`, { direction: 'top', offset: [0, -14] });
    marker.on('click', () => {
      customMarker?.remove();
      customMarker = null;
      select(marker, place);
    });
    markers.push(marker);
  });

  map.on('click', ({ latlng }) => {
    const coords = [Number(latlng.lat.toFixed(5)), Number(latlng.lng.toFixed(5))];
    customMarker?.remove();
    customMarker = L.marker(coords, { icon: customIcon() }).addTo(map);
    select(null, { name: 'Твоє місце на карті', coords, custom: true });
  });

  return map;
}
