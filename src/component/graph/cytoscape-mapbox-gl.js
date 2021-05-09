(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('mapbox-gl')) :
  typeof define === 'function' && define.amd ? define(['mapbox-gl'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.CytoscapeMapbox = factory(global.mapboxgl));
}(this, (function (mapboxgl) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var mapboxgl__default = /*#__PURE__*/_interopDefaultLegacy(mapboxgl);

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

  function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
  /** @typedef {import('cytoscape')} cytoscape */

  /** @typedef {import('./mapbox-gl-handler').MapboxglHandlerOptions} MapboxglHandlerOptions */

  /**
   * @param {MouseEvent} event
   * @see https://github.com/cytoscape/cytoscape.js/blob/master/src/extensions/renderer/base/load-listeners.js
   */

  function isMultSelKeyDown(event) {
    return event.shiftKey || event.metaKey || event.ctrlKey; // maybe event.altKey
  }

  var DEFAULT_FIT_PADDING = 50;
  var DEFAULT_ANIMATION_DURATION = 500;
  var HIDDEN_CLASS = 'cytoscape-mapbox-gl__hidden';
  var MapboxglHandler = /*#__PURE__*/function () {
    /** @type cytoscape.Core */

    /** @type mapboxgl.MapboxOptions */

    /** @type MapboxglHandlerOptions */

    /** @type HTMLElement */

    /** @type mapboxgl.Map */

    /** @type boolean | undefined */

    /** @type boolean | undefined */

    /** @type boolean | undefined */

    /** @type cytoscape.NodePositionMap | undefined */

    /** @type number | undefined */

    /** @type cytoscape.Position | undefined */

    /** @type boolean */

    /**
     * @param {cytoscape.Core} cy
     * @param {mapboxgl.MapboxOptions} mapboxOptions
     * @param {MapboxglHandlerOptions} options
     */
    function MapboxglHandler(cy, mapboxOptions, options) {
      classCallCheck(this, MapboxglHandler);

      defineProperty(this, "cy", void 0);

      defineProperty(this, "mapboxOptions", void 0);

      defineProperty(this, "options", void 0);

      defineProperty(this, "mapContainer", void 0);

      defineProperty(this, "map", void 0);

      defineProperty(this, "originalAutoungrabify", void 0);

      defineProperty(this, "originalUserZoomingEnabled", void 0);

      defineProperty(this, "originalUserPanningEnabled", void 0);

      defineProperty(this, "originalPositions", void 0);

      defineProperty(this, "originalZoom", void 0);

      defineProperty(this, "originalPan", void 0);

      defineProperty(this, "panning", false);

      defineProperty(this, "onGraphContainerMouseDownBound", this.onGraphContainerMouseDown.bind(this));

      defineProperty(this, "onGraphContainerMouseMoveBound", this.onGraphContainerMouseMove.bind(this));

      defineProperty(this, "onGraphContainerWheelBound", this.onGraphContainerWheel.bind(this));

      defineProperty(this, "onMapMoveBound", this.onMapMove.bind(this));

      defineProperty(this, "onGraphAddBound", this.onGraphAdd.bind(this));

      defineProperty(this, "onGraphResizeBound", this.onGraphResize.bind(this));

      defineProperty(this, "onGraphDragFreeBound", this.onGraphDragFree.bind(this));

      this.cy = cy;
      this.mapboxOptions = mapboxOptions;
      this.options = options;

      if (!(this.options.getPosition instanceof Function)) {
        throw new Error('getPosition should be a function');
      }

      if (this.options.setPosition && !(this.options.setPosition instanceof Function)) {
        throw new Error('setPosition should be a function');
      } // Cytoscape config


      this.originalAutoungrabify = this.cy.autoungrabify();
      this.originalUserZoomingEnabled = this.cy.userZoomingEnabled();
      this.originalUserPanningEnabled = this.cy.userPanningEnabled();
      this.cy.userZoomingEnabled(false);
      this.cy.userPanningEnabled(false); // Cytoscape events

      var graphContainer =
      /** @type HTMLElement */
      this.cy.container();
      graphContainer.addEventListener('mousedown', this.onGraphContainerMouseDownBound);
      graphContainer.addEventListener('mousemove', this.onGraphContainerMouseMoveBound);
      graphContainer.addEventListener('wheel', this.onGraphContainerWheelBound);
      this.cy.on('add', this.onGraphAddBound);
      this.cy.on('resize', this.onGraphResizeBound);
      this.cy.on('dragfree', this.onGraphDragFreeBound); // Mapbox GL container

      this.mapContainer = document.createElement('div');
      this.mapContainer.style.position = 'absolute';
      this.mapContainer.style.top = '0px';
      this.mapContainer.style.left = '0px';
      this.mapContainer.style.width = '100%';
      this.mapContainer.style.height = '100%';
      graphContainer.insertBefore(this.mapContainer, this.cy.renderer().data.canvasContainer); // Mapbox GL instance

      this.map = new mapboxgl__default['default'].Map(_objectSpread(_objectSpread({}, this.mapboxOptions), {}, {
        container: this.mapContainer
      }));
      this.fit(undefined, {
        padding: DEFAULT_FIT_PADDING,
        animate: false
      }); // Mapbox GL events

      this.map.on('move', this.onMapMoveBound); // Cytoscape unit viewport

      this.originalZoom = this.cy.zoom();
      this.originalPan = _objectSpread({}, this.cy.pan());
      var zoom = 1;
      var pan = {
        x: 0,
        y: 0
      };

      if (this.options.animate) {
        var _this$options$animati;

        this.cy.animate({
          zoom: zoom,
          pan: pan
        }, {
          duration: (_this$options$animati = this.options.animationDuration) !== null && _this$options$animati !== void 0 ? _this$options$animati : DEFAULT_ANIMATION_DURATION,
          easing: 'linear'
        });
      } else {
        this.cy.viewport(zoom, pan);
      } // Cytoscape positions


      this.enableGeographicPositions();
    }

    createClass(MapboxglHandler, [{
      key: "destroy",
      value: function destroy() {
        // Cytoscape events
        var graphContainer =
        /** @type HTMLElement */
        this.cy.container();
        graphContainer.removeEventListener('mousedown', this.onGraphContainerMouseDownBound);
        graphContainer.removeEventListener('mousemove', this.onGraphContainerMouseMoveBound);
        graphContainer.removeEventListener('wheel', this.onGraphContainerWheelBound);
        this.cy.off('add', this.onGraphAddBound);
        this.cy.off('resize', this.onGraphResizeBound);
        this.cy.off('dragfree', this.onGraphDragFreeBound); // Cytoscape config

        this.cy.autoungrabify(this.originalAutoungrabify);
        this.cy.userZoomingEnabled(this.originalUserZoomingEnabled);
        this.cy.userPanningEnabled(this.originalUserPanningEnabled);
        this.originalAutoungrabify = undefined;
        this.originalUserZoomingEnabled = undefined;
        this.originalUserPanningEnabled = undefined; // Mapbox GL events

        this.map.off('move', this.onMapMoveBound); // Mapbox GL instance

        this.map.remove();
        this.map = undefined; // Mapbox GL container

        this.mapContainer.remove();
        this.mapContainer = undefined; // Cytoscape unit viewport

        if (this.options.animate) {
          var _this$options$animati2;

          this.cy.animate({
            zoom: this.originalZoom,
            pan: this.originalPan
          }, {
            duration: (_this$options$animati2 = this.options.animationDuration) !== null && _this$options$animati2 !== void 0 ? _this$options$animati2 : DEFAULT_ANIMATION_DURATION,
            easing: 'linear'
          });
        } else {
          this.cy.viewport(this.originalZoom, this.originalPan);
        }

        this.originalZoom = undefined;
        this.originalPan = undefined; // Cytoscape positions

        this.disableGeographicPositions();
        this.cy = undefined;
        this.options = undefined;
      }
      /**
       * @param {cytoscape.NodeCollection} nodes
       * @param {mapboxgl.FitBoundsOptions} options
       */

    }, {
      key: "fit",
      value: function fit() {
        var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.cy.nodes();
        var options = arguments.length > 1 ? arguments[1] : undefined;
        var bounds = this.getNodeLngLatBounds(nodes);

        if (bounds.isEmpty()) {
          return;
        }

        this.map.fitBounds(bounds, options);
      }
      /**
       * @private
       */

    }, {
      key: "enableGeographicPositions",
      value: function enableGeographicPositions() {
        var _this = this,
            _this$options$animati3;

        var nodes = this.cy.nodes();
        this.originalPositions = Object.fromEntries(nodes.map(function (node) {
          return [node.id(), _objectSpread({}, node.position())];
        }));
        var positions =
        /** @type cytoscape.NodePositionMap */
        Object.fromEntries(
        /** @type [string, cytoscape.Position | undefined][] */
        nodes.map(function (node) {
          return [node.id(), _this.getGeographicPosition(node)];
        }).filter(function (_ref) {
          var _ref2 = slicedToArray(_ref, 2),
              _id = _ref2[0],
              position = _ref2[1];

          return !!position;
        })); // hide nodes without position

        var nodesWithoutPosition = nodes.filter(function (node) {
          return !positions[node.id()];
        });
        nodesWithoutPosition.addClass(HIDDEN_CLASS).style('display', 'none');
        this.cy.layout({
          name: 'preset',
          positions: positions,
          fit: false,
          animate: this.options.animate,
          animationDuration: (_this$options$animati3 = this.options.animationDuration) !== null && _this$options$animati3 !== void 0 ? _this$options$animati3 : DEFAULT_ANIMATION_DURATION,
          animationEasing: 'ease-out-cubic'
        }).run();
      }
      /**
       * @private
       * @param {cytoscape.NodeCollection} nodes
       */

    }, {
      key: "updateGeographicPositions",
      value: function updateGeographicPositions() {
        var _this2 = this;

        var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.cy.nodes();
        var positions =
        /** @type cytoscape.NodePositionMap */
        Object.fromEntries(
        /** @type [string, cytoscape.Position | undefined][] */
        nodes.map(function (node) {
          return [node.id(), _this2.getGeographicPosition(node)];
        }).filter(function (_ref3) {
          var _ref4 = slicedToArray(_ref3, 2),
              _id = _ref4[0],
              position = _ref4[1];

          return !!position;
        })); // update only positions which have changed, for cytoscape-edgehandles compatibility

        var currentPositions =
        /** @type cytoscape.NodePositionMap */
        Object.fromEntries(nodes.map(function (node) {
          return [node.id(), _objectSpread({}, node.position())];
        }));
        var updatedPositions =
        /** @type cytoscape.NodePositionMap */
        Object.fromEntries(Object.entries(positions).filter(function (_ref5) {
          var _ref6 = slicedToArray(_ref5, 2),
              id = _ref6[0],
              position = _ref6[1];

          var currentPosition = currentPositions[id];
          return !_this2.arePositionsEqual(currentPosition, position);
        })); // hide nodes without position

        var nodesWithoutPosition = nodes.filter(function (node) {
          return !positions[node.id()];
        });
        nodesWithoutPosition.addClass(HIDDEN_CLASS).style('display', 'none');
        this.cy.layout({
          name: 'preset',
          positions: updatedPositions,
          fit: false
        }).run();
      }
      /**
       * @private
       */

    }, {
      key: "disableGeographicPositions",
      value: function disableGeographicPositions() {
        var _this$options$animati4;

        var nodes = this.cy.nodes();
        this.cy.layout({
          name: 'preset',
          positions: this.originalPositions,
          fit: false,
          animate: this.options.animate,
          animationDuration: (_this$options$animati4 = this.options.animationDuration) !== null && _this$options$animati4 !== void 0 ? _this$options$animati4 : DEFAULT_ANIMATION_DURATION,
          animationEasing: 'ease-in-cubic',
          stop: function stop() {
            // show nodes without position
            var nodesWithoutPosition = nodes.filter(function (node) {
              return node.hasClass(HIDDEN_CLASS);
            });
            nodesWithoutPosition.removeClass(HIDDEN_CLASS).style('display', null);
          }
        }).run();
        this.originalPositions = undefined;
      }
      /**
       * @private
       * @param {MouseEvent} event
       */

    }, {
      key: "onGraphContainerMouseDown",
      value: function onGraphContainerMouseDown(event) {
        var _this3 = this;

        if (event.buttons === 1 && !isMultSelKeyDown(event) && !this.cy.renderer().hoverData.down) {
          this.cy.renderer().hoverData.dragging = true; // cytoscape-lasso compatibility

          this.dispatchMapEvent(event);
          document.addEventListener('mouseup', function () {
            if (!_this3.panning) {
              return;
            }

            _this3.panning = false; // prevent unselecting in Cytoscape mouseup

            _this3.cy.renderer().hoverData.dragged = true;
          }, {
            once: true
          });
        }
      }
      /**
       * @private
       * @param {MouseEvent} event
       */

    }, {
      key: "onGraphContainerMouseMove",
      value: function onGraphContainerMouseMove(event) {
        if (event.buttons === 1 && !isMultSelKeyDown(event) && !this.cy.renderer().hoverData.down) {
          this.panning = true;
          this.dispatchMapEvent(event);
        }
      }
      /**
       * @private
       * @param {MouseEvent} event
       */

    }, {
      key: "onGraphContainerWheel",
      value: function onGraphContainerWheel(event) {
        this.dispatchMapEvent(event);
      }
      /**
       * @private
       */

    }, {
      key: "onMapMove",
      value: function onMapMove() {
        this.updateGeographicPositions();
      }
      /**
       * @private
       * @param {cytoscape.EventObject} event
       */

    }, {
      key: "onGraphAdd",
      value: function onGraphAdd(event) {
        if (!event.target.isNode()) {
          return;
        }

        var node =
        /** @type cytoscape.NodeSingular */
        event.target;
        this.originalPositions[node.id()] = _objectSpread({}, node.position());
        var nodes = this.cy.collection().merge(node);
        this.updateGeographicPositions(nodes);
      }
      /**
       * @private
       */

    }, {
      key: "onGraphResize",
      value: function onGraphResize() {
        this.map.resize();
      }
      /**
       * @private
       * @param {cytoscape.EventObject} event
       */

    }, {
      key: "onGraphDragFree",
      value: function onGraphDragFree(event) {
        var node =
        /** @type cytoscape.NodeSingular */
        event.target;

          // TODO: Moje uprava proti ukladani novych pozic pri pretazeni mysi!!!
        /*  if (this.options.setPosition) { 
          var lngLat = this.map.unproject(node.position());
          this.options.setPosition(node, lngLat);
        }*/

        var nodes = this.cy.collection().merge(node);
        this.updateGeographicPositions(nodes);
      }
      /**
       * @private
       * @param {MouseEvent} event
       */

    }, {
      key: "dispatchMapEvent",
      value: function dispatchMapEvent(event) {
        if (event.target === this.mapContainer || this.mapContainer.contains(event.target)) {
          return;
        }

        var clonedEvent = new event.constructor(event.type, event);
        this.map.getCanvas().dispatchEvent(clonedEvent);
      }
      /**
       * @private
       * @param {cytoscape.NodeSingular} node
       * @return {mapboxgl.LngLat | undefined}
       */

    }, {
      key: "getNodeLngLat",
      value: function getNodeLngLat(node) {
        var lngLatLike = this.options.getPosition(node);

        if (!lngLatLike) {
          return;
        }

        var lngLat;

        try {
          lngLat = mapboxgl__default['default'].LngLat.convert(lngLatLike);
        } catch (e) {
          return;
        }

        return lngLat;
      }
      /**
       * @private
       * @param {cytoscape.NodeCollection} nodes
       * @return {mapboxgl.LngLatBounds}
       */

    }, {
      key: "getNodeLngLatBounds",
      value: function getNodeLngLatBounds() {
        var _this4 = this;

        var nodes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.cy.nodes();
        var bounds = nodes.reduce(function (bounds, node) {
          var lngLat = _this4.getNodeLngLat(node);

          if (!lngLat) {
            return bounds;
          }

          return bounds.extend(lngLat);
        }, new mapboxgl__default['default'].LngLatBounds());
        return bounds;
      }
      /**
       * @private
       * @param {cytoscape.NodeSingular} node
       * @return {cytoscape.Position | undefined}
       */

    }, {
      key: "getGeographicPosition",
      value: function getGeographicPosition(node) {
        var lngLat = this.getNodeLngLat(node);

        if (!lngLat) {
          return;
        }

        var position = this.map.project(lngLat);
        return position;
      }
      /**
       * @private
       * @param {cytoscape.Position} position1
       * @param {cytoscape.Position} position2
       * @return {boolean}
       */

    }, {
      key: "arePositionsEqual",
      value: function arePositionsEqual(position1, position2) {
        return position1.x === position2.x && position1.y === position2.y;
      }
    }]);

    return MapboxglHandler;
  }();

  function register(cytoscape) {
    if (!cytoscape) {
      return;
    }

    cytoscape('core', 'mapboxgl', function (mapboxglConfig, config) {
      return new MapboxglHandler(this, mapboxglConfig, config);
    });
  }

  if (typeof window.cytoscape !== 'undefined') {
    register(window.cytoscape);
  }

  return register;

})));
//# sourceMappingURL=cytoscape-mapbox-gl.js.map
