import mapboxgl from "mapbox-gl";
import MapConfiguration from "./MapConfiguration";

function findNode(nodes, cynode) {
    let iri = cynode.id();
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (node.IRI == iri) {
            return node;
        }
    }
    return null;
}

function getLonLng(nodes, cynode, pointPosition, geoIRI) {
    let node = findNode(nodes, cynode);
    
    let currentViewDetail;
    for (let viewSet in node['viewSets']) {
        let views = node['viewSets'][viewSet]['views'];
        for (let view in views) {
            if (views[view]['IRI'] === node['currentView']['IRI']) {
                currentViewDetail = views[view]['detail'];
            }
        }
    }
    if (currentViewDetail) {
        let detailGeoIRI = currentViewDetail.find(detail => detail.IRI === geoIRI);
        if (detailGeoIRI) {
            return detailGeoIRI['value'].replace(/[^-. 0-9]/g, '').split(' ')[pointPosition];
        }
        else {
            return null; // Has currentView, but not geoIRI in it
        }
    }
    else {
        return null; // No currentView detail at all
    }
}

function findGeoIRIs(nodes, regex) {
    let geoIRIs = new Set();
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        let viewSets = node['viewSets'];
        for (let viewSet in viewSets) {
            let views = node['viewSets'][viewSet]['views'];
            for (let view in views) {
                let details = views[view]['detail'];
                if (details) {
                    for (let l = 0; l < details.length; l++) {
                        let detail = details[l];
                        if (regex.test(detail['value'])) {
                            geoIRIs.add(detail['IRI']);
                        }
                    }
                }
            }
        }
    }
    return geoIRIs;
}

function copyWithout(stylesheet, name, value) {
    let filteredStylesheet = stylesheet.filter(function (style) {
        return style[name] !== value;
    });
    return filteredStylesheet;
}

function RemoveEdgeStyle(stylesheet) {
    return copyWithout(stylesheet, 'selector', 'edge');
}

let cyMap;

var layerStyles = {
    openStreetMap: {
        'version': 8,
        'sources': {
            'raster-tiles': {
                'type': 'raster',
                'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                'tileSize': 256,
                'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
        },
        'layers': [
            {
                'id': 'raster-tiles',
                'type': 'raster',
                'source': 'raster-tiles',
                'minzoom': 0,
                'maxzoom': 19
      }
        ]
    },
    mapbox: 'mapbox://styles/mapbox/satellite-streets-v11'
};

export function disableEdgeStyle(cy) {
    let stylesheet = cy.style().json();
    //const stylesheet = [...stylesheet_prop.map(obj => ({ style: obj["properties"], selector: obj["selector"] }))]; //bere styl z kgvb a prejmenovava properties na style
    const stylesheetWithoutEdges = RemoveEdgeStyle(stylesheet);
    cy.style().fromJson(stylesheetWithoutEdges).update();
}

export function setMapLayer(mapConfiguration: MapConfiguration) {
    cyMap.map.setStyle(mapConfiguration.currentConfiguration.baseMap.style);
}

export function destroyCyMap() {
    cyMap.destroy();
    cyMap = undefined;
}

export function toMap(graph, cy) {
    const nodes = Object.values(graph.nodes);
    const edges = Object.values(graph.edges); // Not used yet

    // To find IRI of nodes coordinates Point(...)
    const regex = new RegExp(/^Point\s*\(([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\)$/); // Point(XX.XXX Y.YYYYY)
    let geoIRIs = findGeoIRIs(nodes, regex); // Array of IRIs with value Point. For example "http://www.wikidata.org/prop/direct/P19"
    let geoIRI;
    for (let item of geoIRIs) {
        geoIRI = item; // TODO: zatim beru pouze posledni IRI o poloze. Pozdeji prepinat
    }

    cyMap = cy.mapboxgl({
        accessToken: 'pk.eyJ1IjoibWlyb3BpciIsImEiOiJja2xmZGtobDAyOXFnMnJuMGR4cnZvZTA5In0.TPg2_40hpE5k5v65NmdP5A',
        attributionControl: false,
        style: layerStyles.openStreetMap,
    }, {
            getPosition: (node) => {
                let nodeLat = getLonLng(nodes, node, 1, geoIRI);
                let nodeLng = getLonLng(nodes, node, 0, geoIRI);
                return [nodeLng, nodeLat];
            },
            setPosition: (node, lngLat) => {
                node.data('lng', lngLat.lng);
                node.data('lat', lngLat.lat);
            },
            animate: true,
            animationDuration: 1000,
        });
    
    cyMap.map.addControl(new mapboxgl.AttributionControl(), 'bottom-left');

    return cyMap.map;
}