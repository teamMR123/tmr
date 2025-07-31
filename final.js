document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const statusText = document.getElementById('status-text');
    const findSafePlaceBtn = document.getElementById('find-safe-place-btn');
    const shareLocationBtn = document.getElementById('share-location-btn');
    const sosBtn = document.getElementById('sos-btn');
    const sosModal = document.getElementById('sos-modal');
    const closeModalBtn = sosModal.querySelector('.close-btn');

    // --- State & Map Variables ---
    let userLocation = null;
    let map = null;
    let userMarker = null;
    let routingControl = null;

    // --- Data: Safe Places near Marwadi University, Rajkot ---
    const safePlaces = [
        { name: "Sterling Hospital", type: "Hospital", lat: 22.2910, lng: 70.7780 },
        { name: "Gandhigram Police Station", type: "Police Station", lat: 22.2965, lng: 70.7719 },
        { name: "Wockhardt Hospital", type: "Hospital", lat: 22.2745, lng: 70.7699 },
        { name: "University Police Station", type: "Police Station", lat: 22.2858, lng: 70.7697 },
        { name: "24x7 Pharmacy (Near Wockhardt)", type: "Pharmacy", lat: 22.2750, lng: 70.7700 }
    ];

    // --- Core Functions (These remain the same) ---

    function initializeMap(center) {
        map = L.map('map').setView(center, 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        }).addTo(map);
        safePlaces.forEach(place => {
            L.marker([place.lat, place.lng]).addTo(map).bindPopup(`<b>${place.name}</b><br>${place.type}`);
        });
    }

    function updateUserLocation(position) {
        userLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        statusText.textContent = "Your location is being tracked live.";
        if (!map) { initializeMap([userLocation.lat, userLocation.lng]); }
        const userIcon = L.divIcon({ className: 'user-location-pulse' });
        if (!userMarker) {
            userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
            map.setView([userLocation.lat, userLocation.lng], 16);
        } else {
            userMarker.setLatLng([userLocation.lat, userLocation.lng]);
        }
    }

    function handleLocationError() {
        statusText.textContent = "Could not access location. Please enable it.";
    }

    function findNearestSafePlace() {
        if (!userLocation) { alert("Your location is not available yet. Please wait."); return; }
        let closestPlace = null;
        let minDistance = Infinity;
        safePlaces.forEach(place => {
            const distance = map.distance(L.latLng(userLocation.lat, userLocation.lng), L.latLng(place.lat, place.lng));
            if (distance < minDistance) { minDistance = distance; closestPlace = place; }
        });
        if (closestPlace) {
            statusText.innerHTML = `Nearest Safe Place: <b>${closestPlace.name}</b>. Routing you now.`;
            if (routingControl) { map.removeControl(routingControl); }
            routingControl = L.Routing.control({
                waypoints: [L.latLng(userLocation.lat, userLocation.lng), L.latLng(closestPlace.lat, closestPlace.lng)],
                createMarker: () => null,
                lineOptions: { styles: [{ color: '#50E3C2', opacity: 1, weight: 6 }] }
            }).addTo(map);
            map.setView([closestPlace.lat, closestPlace.lng], 15);
        }
    }

    async function shareLocation() {
        if (!userLocation) { alert("Your location is not available. Cannot share."); return; }
        const shareUrl = `https://www.google.com/maps?q=${userLocation.lat},${userLocation.lng}`;
        const shareData = {
            title: 'My Live Location',
            text: `I'm sharing my live location with you for my safety. Please track me here:`,
            url: shareUrl,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                statusText.textContent = "Location shared successfully!";
            } else {
                navigator.clipboard.writeText(shareUrl);
                alert(`Share link copied to clipboard: ${shareUrl}`);
            }
        } catch (err) {
            statusText.textContent = `Error sharing location: ${err}`;
        }
    }
    
    // --- NEW: Toggle function for SOS modal ---
    function toggleSosModal() {
        if (sosModal.style.display === 'flex') {
            sosModal.style.display = 'none';
        } else {
            sosModal.style.display = 'flex';
        }
    }


    // --- Initializations & Event Listeners ---
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateUserLocation, handleLocationError, {
            enableHighAccuracy: true
        });
    } else {
        statusText.textContent = "Geolocation is not supported by your browser.";
    }

    findSafePlaceBtn.addEventListener('click', findNearestSafePlace);
    shareLocationBtn.addEventListener('click', shareLocation);
    sosBtn.addEventListener('click', toggleSosModal); // Listener for the new SOS button
    closeModalBtn.addEventListener('click', toggleSosModal); // Listener for the modal's close button
});