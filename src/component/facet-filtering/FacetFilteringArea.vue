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
                  <!-- label's checkbox -->
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
        </v-list-item-content>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <v-btn @click="loadFacets" block>Load facets</v-btn>
    <v-btn @click="filterBtnPressed" block>Filter</v-btn>
    <v-btn @click="resetFiltering" block>Reset filtering</v-btn>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import {Prop} from "vue-property-decorator";
import {Graph} from "../../graph/Graph";
import {RemoteServer} from "@/remote-server/RemoteServer";
import ApplicationConfiguration from "@/conf";
import Configuration from "@/configurations/Configuration";

@Component
export default class FacetFilteringArea extends Vue {
  @Prop() graph: Graph;
  @Prop() configuration: Configuration;
  remoteServer: RemoteServer = null;

  facets = [];

  async created() {
    this.remoteServer = new RemoteServer();
    this.remoteServer.remoteUrl = ApplicationConfiguration.api;
  }

  async loadFacets() {
    let currentNodesIRIs: string[] = Object.keys(this.graph.nodes);
    let response = await this.remoteServer.getFacetsItems(this.configuration.iri, currentNodesIRIs);
    this.facets = this.transformFacets(response.facetsItems);
  }

  async filterBtnPressed() {
    // let currentNodesIRIs: string[] = Object.keys(this.graph.nodes);
    //
    // // Get current input values and tie them to their facet's IRI
    // let facetParams = {
    //   facetParams: []
    // };
    //
    // for (let labelFacet of this.facets.labelType) {
    //   let facetParam = {
    //     facetIRI: labelFacet.facetIRI,
    //     chosenLabels: labelFacet.selectedLabels
    //   };
    //
    //   facetParams.facetParams.push(facetParam)
    // }
    //
    // // Get IRIs of nodes that should be left visible in the current graph
    // let nodesThatPassedFiltering = await this.remoteServer.filterByFacets(facetParams, currentNodesIRIs);
    //
    // let filteredNodesIRIs = nodesThatPassedFiltering.nodesIRIs;
    //
    // // Apply filter
    // for (const nodeIRI in this.graph.nodes) {
    //   if (!filteredNodesIRIs.includes(nodeIRI)) {
    //     this.graph.nodes[nodeIRI].visible = false;
    //   }
    // }
  }

  resetFiltering() {

      // Set all nodes' visibility property to true
      // for (const nodeIRI in this.graph.nodes) {
      //   this.graph.nodes[nodeIRI].visible = true;
      // }
      //
      // // Clear facet filters' values
      // for (const labelFacet of this.facets.labelType) {
      //   labelFacet.selectedLabels = []
      // }
      //
      // for (const numericFacet of this.facets.numericType) {
      //   Vue.set(numericFacet.selectedRange, 0, numericFacet.minPossible)
      //   Vue.set(numericFacet.selectedRange, 1, numericFacet.maxPossible)
      // }

  }

  // Transforms facets received from the server so they
  // can be displayed, also create indexes for filtering
  // in future
  transformFacets(backendFacets) {
    let transformedFacets = []

    for (const oldFacet of backendFacets) {
      switch (oldFacet.type) {
        case "label":
          var newLabelFacet = {
            iri: oldFacet.iri,
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
            iri: oldFacet.iri,
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
            if (item.value < localMin) {
              localMin = item.value;
            }

            if (item.value > localMax) {
              localMax = item.value;
            }
          }

          newNumericFacet.values.minPossible = localMin;
          newNumericFacet.values.maxPossible = localMax;
          newNumericFacet.values.selectedRange = [localMin, localMax];

          newNumericFacet.index = oldFacet.items.sort((a, b) => a.value - b.value);

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