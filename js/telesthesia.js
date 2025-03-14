// Create a new Mapbox map
mapboxgl.accessToken = 'pk.eyJ1IjoidGhlYm95ZGF2aWQiLCJhIjoiY2twM3MzcWdxMGVibzJ1bGV6bnp5NHpjZiJ9.OcASP9pRFCNQEAeBzKEtxA';
const map = new mapboxgl.Map({
container: 'map', // The ID of the div element to hold the map
style: 'mapbox://styles/theboydavid/ckp4183ve7x8f18k8ftffl277',
//    style: 'mapbox://styles/mapbox/streets-v11', // The Mapbox style to use
center: [0,40], // The center point of the map
zoom: 2 // The zoom level of the map
});

// zoom
const nav = new mapboxgl.NavigationControl({
    showCompass : false
});
map.addControl(nav, 'bottom-right');

// cursor
var cH = document.getElementById("crosshair-h");
var cV = document.getElementById("crosshair-v");

this.addEventListener("mousemove", function(e) {
  cH.style.top = e.pageY + "px";
  cV.style.left = e.pageX + "px";
  
  e.stopPropagation();
});

function handleClick(e) {
    var body = document.querySelector('body');
    body.classList.add('recharging');
    map.off('click');

    var lat = e.lngLat.lat;
    var lng = e.lngLat.lng;

    var mark = document.createElement('div');
    mark.className = 'marker';

    new mapboxgl.Marker(mark)
        .setLngLat(e.lngLat)
        .addTo(map);

    checklocation(lat, lng);
}

map.on('click', handleClick);

async function checklocation(lat, lng) {
    document.body.classList.add('btn-console--active');
    document.body.classList.remove('btn-viewings--active');
    document.getElementById('console__image').innerHTML = '';
    document.getElementById('console__text').innerHTML = '';

    const functionUrl = 'https://telesthesia-app.netlify.app/.netlify/functions/checklocation';
    const roundedLat = lat.toFixed(3);
    const roundedLng = lng.toFixed(3);

    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://telesthesia-app.netlify.app',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ lat: roundedLat, lng: roundedLng })
    });

    if (response.ok) {
        const data = await response.json();
        const consoleContainer = document.getElementById('console');

        if (data.success === true) {
            consoleContainer.classList.add("success");
        }

        if (data.image) {
            const imageElement = document.createElement('img');
            imageElement.src = data.image;
            document.getElementById('console__image').appendChild(imageElement);
        }

        if (data.text) {
            const lineData = [
                { type: 'input', value: data.lat + ', ' + data.lng + ':' },
                { type: 'input', value: data.text }
            ];
            var termynal = new Termynal('#console__text', { lineData });
        }
    }
}

/**
 * termynal.js
 * A lightweight, modern and extensible animated terminal window, using
 * async/await.
 *
 * @author Ines Montani <ines@ines.io>
 * @version 0.0.1
 * @license MIT
 */

'use strict';

/** Generate a terminal widget. */
class Termynal {
    /**
     * Construct the widget's settings.
     * @param {(string|Node)=} container - Query selector or container element.
     * @param {Object=} options - Custom settings.
     * @param {string} options.prefix - Prefix to use for data attributes.
     * @param {number} options.startDelay - Delay before animation, in ms.
     * @param {number} options.typeDelay - Delay between each typed character, in ms.
     * @param {number} options.lineDelay - Delay between each line, in ms.
     * @param {number} options.progressLength - Number of characters displayed as progress bar.
     * @param {string} options.progressChar – Character to use for progress bar, defaults to █.
     * @param {number} options.progressPercent - Max percent of progress.
     * @param {string} options.cursor – Character to use for cursor, defaults to ▋.
     * @param {Object[]} lineData - Dynamically loaded line data objects.
     * @param {boolean} options.noInit - Don't initialise the animation.
     */
    constructor(container = '#termynal', options = {}) {
        this.container = (typeof container === 'string') ? document.querySelector(container) : container;
        this.pfx = `data-${options.prefix || 'ty'}`;
        this.startDelay = options.startDelay
            || parseFloat(this.container.getAttribute(`${this.pfx}-startDelay`)) || 600;
        this.typeDelay = options.typeDelay
            || parseFloat(this.container.getAttribute(`${this.pfx}-typeDelay`)) || 90;
        this.lineDelay = options.lineDelay
            || parseFloat(this.container.getAttribute(`${this.pfx}-lineDelay`)) || 1500;
        this.progressLength = options.progressLength
            || parseFloat(this.container.getAttribute(`${this.pfx}-progressLength`)) || 40;
        this.progressChar = options.progressChar
            || this.container.getAttribute(`${this.pfx}-progressChar`) || '█';
        this.progressPercent = options.progressPercent
            || parseFloat(this.container.getAttribute(`${this.pfx}-progressPercent`)) || 100;
        this.cursor = options.cursor
            || this.container.getAttribute(`${this.pfx}-cursor`) || '▋';
        this.lineData = this.lineDataToElements(options.lineData || []);
        if (!options.noInit) this.init()
    }

    /**
     * Initialise the widget, get lines, clear container and start animation.
     */
    init() {
        // Appends dynamically loaded lines to existing line elements.
        this.lines = [...this.container.querySelectorAll(`[${this.pfx}]`)].concat(this.lineData);

        /** 
         * Calculates width and height of Termynal container.
         * If container is empty and lines are dynamically loaded, defaults to browser `auto` or CSS.
         */ 
        const containerStyle = getComputedStyle(this.container);
        this.container.style.width = containerStyle.width !== '0px' ? 
            containerStyle.width : undefined;
        this.container.style.minHeight = containerStyle.height !== '0px' ? 
            containerStyle.height : undefined;

        this.container.setAttribute('data-termynal', '');
        this.container.innerHTML = '';
        this.start();
    }

    /**
     * Start the animation and rener the lines depending on their data attributes.
     */
    async start() {
        await this._wait(this.startDelay);

        for (let line of this.lines) {
            const type = line.getAttribute(this.pfx);
            const delay = line.getAttribute(`${this.pfx}-delay`) || this.lineDelay;

            if (type == 'input') {
                line.setAttribute(`${this.pfx}-cursor`, this.cursor);
                await this.type(line);
                await this._wait(delay);
            }

            else if (type == 'progress') {
                await this.progress(line);
                await this._wait(delay);
            }

            else {
                this.container.appendChild(line);
                await this._wait(delay);
            }

            line.removeAttribute(`${this.pfx}-cursor`);
        }
    }

    /**
     * Animate a typed line.
     * @param {Node} line - The line element to render.
     */
    async type(line) {
        const chars = [...line.textContent];
        const delay = line.getAttribute(`${this.pfx}-typeDelay`) || this.typeDelay;
        line.textContent = '';
        this.container.appendChild(line);

        for (let char of chars) {
            await this._wait(delay);
            line.textContent += char;
        }
    }

    /**
     * Animate a progress bar.
     * @param {Node} line - The line element to render.
     */
    async progress(line) {
        const progressLength = line.getAttribute(`${this.pfx}-progressLength`)
            || this.progressLength;
        const progressChar = line.getAttribute(`${this.pfx}-progressChar`)
            || this.progressChar;
        const chars = progressChar.repeat(progressLength);
        const progressPercent = line.getAttribute(`${this.pfx}-progressPercent`)
            || this.progressPercent;
        line.textContent = '';
        this.container.appendChild(line);

        for (let i = 1; i < chars.length + 1; i++) {
            await this._wait(this.typeDelay);
            const percent = Math.round(i / chars.length * 100);
            line.textContent = `${chars.slice(0, i)} ${percent}%`;
            if (percent>progressPercent) {
                break;
            }
        }
    }

    /**
     * Helper function for animation delays, called with `await`.
     * @param {number} time - Timeout, in ms.
     */
    _wait(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }

    /**
     * Converts line data objects into line elements.
     * 
     * @param {Object[]} lineData - Dynamically loaded lines.
     * @param {Object} line - Line data object.
     * @returns {Element[]} - Array of line elements.
     */
    lineDataToElements(lineData) {
        return lineData.map(line => {
            let div = document.createElement('div');
            div.innerHTML = `<span ${this._attributes(line)}>${line.value || ''}</span>`;

            return div.firstElementChild;
        });
    }

    /**
     * Helper function for generating attributes string.
     * 
     * @param {Object} line - Line data object.
     * @returns {string} - String of attributes.
     */
    _attributes(line) {
        let attrs = '';
        for (let prop in line) {
            attrs += this.pfx;

            if (prop === 'type') {
                attrs += `="${line[prop]}" `
            } else if (prop !== 'value') {
                attrs += `-${prop}="${line[prop]}" `
            }
        }

        return attrs;
    }
}

/**
* HTML API: If current script has container(s) specified, initialise Termynal.
*/
if (document.currentScript.hasAttribute('data-termynal-container')) {
    const containers = document.currentScript.getAttribute('data-termynal-container');
    containers.split('|')
        .forEach(container => new Termynal(container))
}

  