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

@Component
export default class FacetFilteringArea extends Vue {
  @Prop() graph: Graph;
  @Prop() configuration: Configuration;
  @Prop() remoteServer: RemoteServer;
  @Prop() manipulator: GraphManipulator;

  facets = [];

  mounted() {
    // Add loading facets when mounted
  }

  // Decide what "nodes" should actually be - source and all added nodes?
  static findOrUpdateAllFacetsAfterExpansion(nodes) {
    this.loadFacetValuesFromConfiguration(nodes);
  }

  static loadFacetValuesFromConfiguration(nodes: string[]) {
    console.log(nodes)
  }

  async loadFacets() {
    // let currentNodesIRIs: string[] = Object.keys(this.graph.nodes);
    // let response = await this.remoteServer.getFacetsItems(this.configuration.iri, currentNodesIRIs);
    //
    // const transformedFacets = this.transformFacets(response.facetsItems);
    //
    // for (const facet of transformedFacets) {
    //   this.facets.push(facet);
    // }


    // this.dynamicallyGeneratedFacets.loadDynamicFacets();
  }

  reloadFacets() {
    // Remove edges from nodes in this.graph
    // for (const nodeIRI in this.graph.nodes) {
    //   this.graph.nodes[nodeIRI].connectedEdges = [];
    // }
    //
    // // Remove all facets
    // this.facets.splice(0);

    this.loadFacets();
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
  // can be displayed, also create indexes for filtering
  transformFacets(backendFacets) {
    let transformedFacets = []

    for (const oldFacet of backendFacets) {
      switch (oldFacet.type) {
        case "label":
          var newLabelFacet = {
            title: oldFacet.title,
            type: oldFacet.type,
            description: oldFacet.description,
            values: {
              displayLabels: [],
              selectedLabels: []
            },
            index: new Map()
          };

          for (const item of oldFacet.items) {
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
            title: oldFacet.title,
            type: oldFacet.type,
            description: oldFacet.description,
            values: {
              minPossible: Number.NaN,
              maxPossible: Number.NaN,
              selectedRange: [Number.NaN, Number.NaN]
            },
            index: []
          };

          var localMin = Number.MAX_VALUE;
          var localMax = Number.MIN_VALUE;

          for (const item of oldFacet.items) {
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

          newNumericFacet.index = oldFacet.items;

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