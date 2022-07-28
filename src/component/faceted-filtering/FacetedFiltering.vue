<template>
  <div id="rootElement">
    <v-list dense>
      <v-list-item v-for="(facet, index) in facets" :key="index">
        <v-list-item-content>
          <v-list-item-title class="facetTitle">
            {{ facet.title }}
          </v-list-item-title>

          <template v-if="facet.type === 'label'">
            <v-list>
              <v-list-item
                  v-for="(label, index) in facet.values.displayLabels"
                  :key="index"
              >
                <v-list-item-content>
                  <v-checkbox
                      dense
                      v-model="facet.values.selectedLabels"
                      :label="label"
                      :value="label"
                  ></v-checkbox>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </template>

          <template v-else>
            <v-range-slider
                v-model="facet.values.selectedRange"
                :min="facet.values.minPossible"
                :max="facet.values.maxPossible"
            >

              <template v-slot:prepend>
                <v-layout class="sliderInput">
                  <v-text-field
                      :value="facet.values.selectedRange[0]"
                      type="number"
                      style="width: 60px"
                      @change="$set(facet.values.selectedRange, 0, $event)"
                  ></v-text-field>
                </v-layout>
              </template>

              <template v-slot:append>
                <v-layout class="sliderInput">
                  <v-text-field
                      :value="facet.values.selectedRange[1]"
                      type="number"
                      style="width: 60px"
                      @change="$set(facet.values.selectedRange, 1, $event)"
                  ></v-text-field>
                </v-layout>
              </template>
            </v-range-slider>
          </template>

          <v-divider/>

        </v-list-item-content>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {Prop} from "vue-property-decorator";
import {Graph} from "../../graph/Graph";
import {RemoteServer} from "@/remote-server/RemoteServer";
import Configuration from "@/configurations/Configuration";
import GraphManipulator from "@/graph/GraphManipulator";
import {DynamicallyGeneratedFacets} from "@/component/faceted-filtering/DynamicallyGeneratedFacets";
import Component from "vue-class-component";
import {Node} from "@/graph/Node";

@Component
export default class FacetedFiltering extends Vue {
  @Prop() graph: Graph;
  @Prop() configuration: Configuration;
  @Prop() remoteServer: RemoteServer;
  @Prop() manipulator: GraphManipulator;

  facets = [];

  facetsIndexes = new Map<String, number>();

  async mounted() {
    await this.loadAndFindInitialFacets();

    this.$root.$on('expansion', data => {
      this.findOrUpdateFacetsAfterExpansion(data[0], data[1]);
    });
  }

  async loadAndFindInitialFacets() {
    await this.loadOrUpdateConfigurationFacets(Object.keys(this.graph.nodes));

    // DynamicallyGeneratedFacets.setFacets(this.facets);

    DynamicallyGeneratedFacets.findOrUpdateInitialDynamicFacets(this.graph.nodes, this.facets);
  }

  async loadOrUpdateConfigurationFacets(nodesIRIs: string[]) {
    console.log(nodesIRIs)
    let response = await this.remoteServer.getFacetsItems(this.configuration.iri, nodesIRIs);

    for (const backendFacet of response.facetsItems) {
      // Check whether the facet needs to be created
      if (this.facetsIndexes.get(backendFacet.iri) === undefined) {
        console.log("facet undefined")
        // Create a new facet
        switch (backendFacet.type) {
          case "label":
            var newLabelFacet = {
              iri: backendFacet.iri,
              title: backendFacet.title,
              type: backendFacet.type,
              description: backendFacet.description,
              values: {
                displayLabels: [],
                selectedLabels: []
              },
              index: new Map()
            };

            for (const item of backendFacet.items) {
              if (newLabelFacet.index.get(item.value) == undefined) {
                newLabelFacet.index.set(item.value, [item.nodeIRI]);
              } else {
                newLabelFacet.index.get(item.value).push(item.nodeIRI);
              }
            }

            newLabelFacet.values.displayLabels = Array.from(newLabelFacet.index.keys());

            this.facetsIndexes.set(newLabelFacet.iri, this.facets.length);

            this.facets.push(newLabelFacet);
            break;

          case "numeric":
            const newNumericFacet = {
              iri: backendFacet.iri,
              title: backendFacet.title,
              type: backendFacet.type,
              description: backendFacet.description,
              values: {
                minPossible: Number.NaN,
                maxPossible: Number.NaN,
                selectedRange: [Number.NaN, Number.NaN]
              },
              index: []
            };

            var localMin = Number.MAX_VALUE;
            var localMax = Number.MIN_VALUE;

            for (const item of backendFacet.items) {
              if (Number(item.value) < localMin) {
                localMin = item.value;
              }

              if (Number(item.value) > localMax) {
                localMax = item.value;
              }
            }

            newNumericFacet.values.minPossible = localMin;
            newNumericFacet.values.maxPossible = localMax;
            newNumericFacet.values.selectedRange = [localMin, localMax];

            newNumericFacet.index = backendFacet.items;

            this.facetsIndexes.set(newNumericFacet.iri, this.facets.length);

            this.facets.push(newNumericFacet);
            break;
        }
      } else {
        console.log("facet already defined")
      }
    }
  }

  findOrUpdateFacetsAfterExpansion(sourceNode, addedNodes) {
    let addedNodesIRIs = [];

    for (const addedNode of addedNodes) {
      addedNodesIRIs.push(addedNode.IRI);
    }

    this.loadOrUpdateConfigurationFacets(addedNodesIRIs);

    DynamicallyGeneratedFacets.findOrUpdateDynamicFacetsAfterExpansion(sourceNode, addedNodes, this.facets);
  }

  // Filter currently loaded nodes based on facet values
  filterBtnPressed() {
    // Make all nodes visible first
    this.makeAllNodesVisible();

    // Sets of nodes' IRIs calculated by each facet
    let filteringSets = [];

    for (const facet of this.facets) {
      // Skip an unused label facet
      if (facet.type == "label" && facet.values.selectedLabels.length == 0) {
        continue;
      }

      // Skip a numeric facet that wouldn't filter anything anyway
      if (facet.type == "numeric" && (facet.values.selectedRange[0] == facet.values.minPossible && facet.values.selectedRange[1] == facet.values.maxPossible)) {
        continue;
      }

      let filteringSet = new Set<string>();

      if (facet.type == "label") {
        // For each chosen label put contents of its mapped array in index to the filteringSet
        for (const label of facet.values.selectedLabels) {
          facet.index.get(label).forEach(nodeIRI => filteringSet.add(nodeIRI));
        }
      } else {
        // Numeric type facet
        const min = facet.values.selectedRange[0];
        const max = facet.values.selectedRange[1];

        const filteredItems = facet.index.filter(nodeItem => nodeItem.value >= min && nodeItem.value <= max);

        // Add IRIs of filtered nodes to the filteringSet
        filteredItems.forEach(item => filteringSet.add(item.nodeIRI));
      }

      filteringSets.push(filteringSet);
    }

    // If no facets are chosen to be used for filtering
    if (filteringSets.length == 0) {
      return;
    }

    // Do consecutive intersections on filteringSets to
    // obtain one final set of filtered nodes
    for (let i = 1; i < filteringSets.length; i++) {
      const setA = filteringSets[i];
      const setB = filteringSets[i - 1];

      // Intersection
      filteringSets[i] = new Set(
          Array.from(setA).filter(nodeIRI => setB.has(nodeIRI))
      );
    }

    // Apply filter
    for (const nodeIRI in this.graph.nodes) {
      if (!filteringSets[filteringSets.length - 1].has(nodeIRI)) {
        this.graph.nodes[nodeIRI].visible = false;

        if (this.graph.nodes[nodeIRI].belongsToGroup != null){
          this.manipulator.leaveGroup([this.graph.nodes[nodeIRI]], this.graph.nodes[nodeIRI].belongsToGroup)
        }
      }
    }
  }

  makeAllNodesVisible() {
    // Set all nodes' visibility property to true
    for (const nodeIRI in this.graph.nodes) {
      this.graph.nodes[nodeIRI].visible = true;
    }
  }

  resetFiltering() {
    // Uncheck checkboxes and reset sliders' selected ranges
    for (const facet of this.facets) {
      if (facet.type == "label") {
        facet.values.selectedLabels.splice(0);
      } else {
        facet.values.selectedRange = [facet.values.minPossible, facet.values.maxPossible];
      }
    }

    this.makeAllNodesVisible();
  }

  // Transforms facets received from the server so that they
  // can be displayed, and creates indexes for filtering
  transformConfigurationFacets(backendFacets) {
    let transformedFacets = []

    for (const backendFacet of backendFacets) {
      switch (backendFacet.type) {
        case "label":
          var newLabelFacet = {
            title: backendFacet.title,
            type: backendFacet.type,
            description: backendFacet.description,
            values: {
              displayLabels: [],
              selectedLabels: []
            },
            index: new Map()
          };

          for (const item of backendFacet.items) {
            if (newLabelFacet.index.get(item.value) == undefined) {
              newLabelFacet.index.set(item.value, [item.nodeIRI]);
            } else {
              newLabelFacet.index.get(item.value).push(item.nodeIRI);
            }
          }

          newLabelFacet.values.displayLabels = Array.from(newLabelFacet.index.keys());

          transformedFacets.push(newLabelFacet);
          break;

        case "numeric":
          const newNumericFacet = {
            title: backendFacet.title,
            type: backendFacet.type,
            description: backendFacet.description,
            values: {
              minPossible: Number.NaN,
              maxPossible: Number.NaN,
              selectedRange: [Number.NaN, Number.NaN]
            },
            index: []
          };

          var localMin = Number.MAX_VALUE;
          var localMax = Number.MIN_VALUE;

          for (const item of backendFacet.items) {
            if (Number(item.value) < localMin) {
              localMin = item.value;
            }

            if (Number(item.value) > localMax) {
              localMax = item.value;
            }
          }

          newNumericFacet.values.minPossible = localMin;
          newNumericFacet.values.maxPossible = localMax;
          newNumericFacet.values.selectedRange = [localMin, localMax];

          newNumericFacet.index = backendFacet.items;

          transformedFacets.push(newNumericFacet);
          break;
      }
    }
    return transformedFacets;
  }
}
</script>

<style>
.sliderInput {
  margin-top: -18px !important;
}
</style>