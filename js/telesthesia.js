// Create a new Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidGhlYm95ZGF2aWQiLCJhIjoiY2twM3MzcWdxMGVibzJ1bGV6bnp5NHpjZiJ9.OcASP9pRFCNQEAeBzKEtxA';
const map = new mapboxgl.Map({
container: 'map', // The ID of the div element to hold the map
style: 'mapbox://styles/theboydavid/ckp4183ve7x8f18k8ftffl277',
//    style: 'mapbox://styles/mapbox/streets-v11', // The Mapbox style to use
center: [-0.0738,51.5041], // The center point of the map
zoom: 12 // The zoom level of the map
});

// zoom
const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-left');

// Add a click listener to the map
map.on('click', function(e) {
// Get the latitude and longitude of the click event
var lat = e.lngLat.lat;
var lng = e.lngLat.lng;

// create the mark div element
var mark = document.createElement('div');
mark.className = 'marker';

// add the mark div to the map at the click location
new mapboxgl.Marker(mark)
.setLngLat(e.lngLat)
.addTo(map);

// Send the latitude and longitude to the checklocation function
checklocation(lat, lng);
});

async function checklocation(lat, lng) {
// Replace this with your own Netlify function URL
const functionUrl = 'https://telesthesia-app.netlify.app/.netlify/functions/checklocation';

// Round the lat and lng values to three decimal places
const roundedLat = lat.toFixed(3);
const roundedLng = lng.toFixed(3);

// Send the rounded latitude and longitude as parameters to the function
const response = await fetch(functionUrl, {
method: 'POST',
headers: {
  'Content-Type': 'application/x-www-form-urlencoded',
  'Origin': 'https://telesthesia-app.netlify.app.netlify.app',
  'Accept': 'application/json'
},
body: JSON.stringify({ lat: roundedLat, lng: roundedLng }) // Stringify the body data as JSON
});

// Check for a successful response
if (response.ok) {
// Get the response data
const data = await response.json();
const logDiv = document.getElementById('log'); 
const consoleContainer = document.getElementById('console');

// Remove any existing elements from the console__image and console__text elements
document.getElementById('console__image').innerHTML = '';
document.getElementById('console__text').innerHTML = '';

// If success add a success class to the div
if (data.success === true) {
consoleContainer.classList.add("success");
}
else {
consoleContainer.classList.remove("success");
}

// Check for image in the response data
if (data.image) {
// Create an image element and set its src attribute to the image field from the response data
const imageElement = document.createElement('img');
imageElement.src = data.image;

// Add the image element to the console__image div
document.getElementById('console__image').appendChild(imageElement);
}

// Check for text in the response data
if (data.text) {

// Create a text node with the text field from the response data
const textNode = document.createTextNode(data.text);
console.log(data.text);
console.log(textNode);

var termynal = new Termynal('#console__text',
{
    lineData: [
        { type: 'input', value: data.lat + ', ' + data.lng + ':'} , 
        {type: 'input', value: data.text }
    ]
}
)

}

if (data.success === true) {
logDiv.innerHTML += `<p>${data.lat} , ${data.lng} : Data found</p>`;
}
else {
logDiv.innerHTML += `<p>${data.lat} , ${data.lng} : No data found</p>`;

}

}
}