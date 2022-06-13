<template>
  <div id="rootElement">
    <v-list>
      <v-list-item>
        <v-list-item-content>

          <!-- list of label type facets -->
          <v-list dense>
            <v-list-item
                v-for="labelFacet in facets.labelType"
                :key="labelFacet.title"
            >
              <v-list-item-content>
                <v-list-item-title class="facetTitle">{{ labelFacet.title }}</v-list-item-title>
                <!-- list of labelFacet's labels -->
                <v-list>
                  <v-list-item
                      v-for="label in labelFacet.labels"
                      v-bind:key="label"
                  >
                    <v-list-item-content>
                      <!-- label's checkbox for user to choose labels -->
                      <v-checkbox
                          dense
                          v-model="labelFacet.selectedLabels"
                          :label="label"
                          :value="label"
                      ></v-checkbox>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <!-- list of numeric type facets -->
          <v-list>
            <v-list-item
                v-for="numericFacet in facets.numericType"
                v-bind:key="numericFacet.title"
            >
              <v-list-item-content>
                <v-list-item-title
                    class="facetTitle"
                >{{ numericFacet.title }}
                </v-list-item-title>
                <!-- slider for user to choose interval -->
                <v-range-slider
                    v-model="numericFacet.selectedRange"
                    :min="numericFacet.minPossible"
                    :max="numericFacet.maxPossible"
                >
                  <template v-slot:prepend>
                    <v-layout class="sliderInput">
                      <v-text-field
                          :value="numericFacet.selectedRange[0]"
                          type="number"
                          style="width: 60px"
                          @change="$set(numericFacet.selectedRange, 0, $event)"
                      ></v-text-field>
                    </v-layout>
                  </template>

                  <template v-slot:append>
                    <v-layout class="sliderInput">
                      <v-text-field
                          :value="numericFacet.selectedRange[1]"
                          type="number"
                          style="width: 60px"
                          @change="$set(numericFacet.selectedRange, 1, $event)"
                      ></v-text-field>
                    </v-layout>
                  </template>
                </v-range-slider>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <!-- list of numberOfEdges type facets -->
          <v-list>
            <v-list-item
                v-for="numOfEdgesFacet in facets.numberOfEdgesType"
                v-bind:key="numOfEdgesFacet.title"
            >
              <v-list-item-content>
                <v-list-item-title
                    class="facetTitle"
                >{{ numOfEdgesFacet.title }}
                </v-list-item-title>
                <!-- slider for user to choose interval -->
                <v-range-slider
                    v-model="numOfEdgesFacet.selectedRange"
                    :min="numOfEdgesFacet.minPossible"
                    :max="numOfEdgesFacet.maxPossible"
                >
                  <template v-slot:prepend>
                    <v-layout class="sliderInput">
                      <v-text-field
                          :value="numOfEdgesFacet.selectedRange[0]"
                          type="number"
                          style="width: 60px"
                          @change="$set(numOfEdgesFacet.selectedRange, 0, $event)"
                      ></v-text-field>
                    </v-layout>
                  </template>

                  <template v-slot:append>
                    <v-layout class="sliderInput">
                      <v-text-field
                          :value="numOfEdgesFacet.selectedRange[1]"
                          type="number"
                          style="width: 60px"
                          @change="$set(numOfEdgesFacet.selectedRange, 1, $event)"
                      ></v-text-field>
                    </v-layout>
                  </template>
                </v-range-slider>
              </v-list-item-content>
            </v-list-item>
          </v-list>

          <v-btn @click="loadFacets" block>Load facets</v-btn>
          <v-btn @click="filterBtnPressed" block>Filter</v-btn>

          <v-btn @click="resetFiltering" block>Reset filtering</v-btn>

        </v-list-item-content>
      </v-list-item>
    </v-list>
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

  facets = {
    labelType: [{
      facetIRI: "",
      title: "",
      description: "",
      labels: [],
      selectedLabels: []
    }],
    numericType: [],
    numberOfEdgesType: [],
  };

  async created() {
    this.remoteServer = new RemoteServer();
    this.remoteServer.remoteUrl = ApplicationConfiguration.api;
  }

  async loadFacets(event) {
    let getFacetsResponse = await this.remoteServer.getFacets(this.configuration.iri);
    let facetsIRIs = getFacetsResponse.facetsIRIs;

    let currentNodesIRIs: string[] = Object.keys(this.graph.nodes);
    this.facets = await this.remoteServer.getFacetsItems(facetsIRIs, currentNodesIRIs);
  }

  async filterBtnPressed(event) {
    let currentNodesIRIs: string[] = Object.keys(this.graph.nodes);

    // Get current input values and tie them to their facet's IRI
    let facetParams = {
      facetParams: []
    };

    for (let labelFacet of this.facets.labelType) {
      let facetParam = {
        facetIRI: labelFacet.facetIRI,
        chosenLabels: labelFacet.selectedLabels
      };

      facetParams.facetParams.push(facetParam)
    }

    // Get IRIs of nodes that should be left visible in the current graph
    let nodesThatPassedFiltering = await this.remoteServer.filterByFacets(facetParams, currentNodesIRIs);

    let filteredNodesIRIs = nodesThatPassedFiltering.nodesIRIs;

    // Apply filter
    for (const nodeIRI in this.graph.nodes) {
      if (!filteredNodesIRIs.includes(nodeIRI)) {
        this.graph.nodes[nodeIRI].visible = false;
      }
    }
  }

  resetFiltering(event) {
    if (event) {
      // Set all nodes' visibility property to true
      for (const nodeIRI in this.graph.nodes) {
        this.graph.nodes[nodeIRI].visible = true;
      }

      // Clear facet filters' values
      for (const labelFacet of this.facets.labelType) {
        labelFacet.selectedLabels = []
      }

      for (const numericFacet of this.facets.numericType) {
        Vue.set(numericFacet.selectedRange, 0, numericFacet.minPossible)
        Vue.set(numericFacet.selectedRange, 1, numericFacet.maxPossible)
      }

      for (const numOfEdgesFacet of this.facets.numberOfEdgesType) {
        Vue.set(numOfEdgesFacet.selectedRange, 0, numOfEdgesFacet.minPossible)
        Vue.set(numOfEdgesFacet.selectedRange, 1, numOfEdgesFacet.maxPossible)
      }
    }
  }
}
</script>

<style>
.sliderInput {
  margin-top: -18px !important;
}
</style>