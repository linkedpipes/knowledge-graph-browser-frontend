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

    let cyMap = cy.mapboxgl({
        accessToken: 'pk.eyJ1IjoibWlyb3BpciIsImEiOiJja2xmZGtobDAyOXFnMnJuMGR4cnZvZTA5In0.TPg2_40hpE5k5v65NmdP5A',
        style: {
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
        }
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

    ///////////////////////// TODO: blok nize smazat

    cyMap.cy.on("tap", function (e) { // TODO: smazat
        //let canvas = $("#graph").find("canvas").get(0); // TODO: smazat
        var x = e.originalEvent.pageX// - $(canvas).offset().left; // TODO: smazat
        var y = e.originalEvent.pageY// - $(canvas).offset().top; // TODO: smazat
        console.warn("Klikos do mistos totos: x: " + x + "; y: " + y + '\n'); // TODO: smazat
    }); 

    cyMap.map.on('move', function () { console.warn(forWatches()); })
    cyMap.map.on('resize', function () { console.warn(forWatches()); })

    function _interopDefaultLegacy(e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _arrayWithHoles(arr) {
        if (Array.isArray(arr)) return arr;
    }

    var arrayWithHoles = _arrayWithHoles;

    function _iterableToArrayLimit(arr, i) {
        if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
        var _arr = [];
        var _n = true;
        var _d = false;
        var _e = undefined;

        try {
            for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
                _arr.push(_s.value);

                if (i && _arr.length === i) break;
            }
        } catch (err) {
            _d = true;
            _e = err;
        } finally {
            try {
                if (!_n && _i["return"] != null) _i["return"]();
            } finally {
                if (_d) throw _e;
            }
        }

        return _arr;
    }

    var iterableToArrayLimit = _iterableToArrayLimit;

    function _arrayLikeToArray(arr, len) {
        if (len == null || len > arr.length) len = arr.length;

        for (var i = 0, arr2 = new Array(len); i < len; i++) {
            arr2[i] = arr[i];
        }

        return arr2;
    }

    var arrayLikeToArray = _arrayLikeToArray;

    function _unsupportedIterableToArray(o, minLen) {
        if (!o) return;
        if (typeof o === "string") return arrayLikeToArray(o, minLen);
        var n = Object.prototype.toString.call(o).slice(8, -1);
        if (n === "Object" && o.constructor) n = o.constructor.name;
        if (n === "Map" || n === "Set") return Array.from(o);
        if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return arrayLikeToArray(o, minLen);
    }

    var unsupportedIterableToArray = _unsupportedIterableToArray;

    function _nonIterableRest() {
        throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var nonIterableRest = _nonIterableRest;

    function _slicedToArray(arr, i) {
        return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || unsupportedIterableToArray(arr, i) || nonIterableRest();
    }

    var slicedToArray = _slicedToArray;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var classCallCheck = _classCallCheck;

    function _defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
        }
    }

    function _createClass(Constructor, protoProps, staticProps) {
        if (protoProps) _defineProperties(Constructor.prototype, protoProps);
        if (staticProps) _defineProperties(Constructor, staticProps);
        return Constructor;
    }

    var createClass = _createClass;

    function _defineProperty(obj, key, value) {
        if (key in obj) {
            Object.defineProperty(obj, key, {
                value: value,
                enumerable: true,
                configurable: true,
                writable: true
            });
        } else {
            obj[key] = value;
        }

        return obj;
    }

    var defineProperty = _defineProperty;


    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }
    function _objectSpread(target, nodes) {
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i] != null ? arguments[i] : {};
            if (i % 2) {
                ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); });
            } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source), true).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); }
        } return target;
    }

    function getGeographicPosition(node) {
        var lngLat = cyMap.getNodeLngLat(node);

        if (!lngLat) {
            return;
        }

        var position = cyMap.map.project(lngLat);
        return position;
    }

    var a = true;

    function fromEntries<T>(entries: [keyof T, T[keyof T]][]): T {
        return entries.reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value }),
            <T>{}
        );
    }

    function forWatches() {
        var nodes = cy.nodes();
        var originalPositions = fromEntries(nodes.map(function (node) {
            return [node.id(), _objectSpread({}, node.position())];
        }));
        var positions = fromEntries(nodes.map(function (node) {
            let node_id = node.id();
            let geo_pos = getGeographicPosition(node);
            return [node_id, geo_pos];
        }).filter(function (_ref) {
            var _ref2 = slicedToArray(_ref, 2),
                _id = _ref2[0],
                position = _ref2[1];

            return !!position;
        }));

        let test = positions["http://www.wikidata.org/entity/Q3490671"];
        let test_x = test.x;

        if (a) {
            a = false;
            return "OrigoPos: " + originalPositions["http://www.wikidata.org/entity/Q3490671"].x + " " + originalPositions["http://www.wikidata.org/entity/Q3490671"].y
                + " ; NewPos: " + positions["http://www.wikidata.org/entity/Q3490671"].x + " " + positions["http://www.wikidata.org/entity/Q3490671"].y;

        } else {
            return "NewPos: " + positions["http://www.wikidata.org/entity/Q3490671"].x + " " + positions["http://www.wikidata.org/entity/Q3490671"].y;

        }
    }

    return cyMap.map;
}