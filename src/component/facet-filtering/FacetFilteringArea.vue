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

@Component
export default class FacetFilteringArea extends Vue {
  @Prop() graph: Graph;
  public remoteServer: RemoteServer = new RemoteServer();

  facets = {
    labelType: [{
      title: 'Born in country label',
      labels: ['Germany', 'Poland', 'France'],
      // selected labels for each facet
      selectedLabels: []
    },
      {
        title: 'Label facet 2',
        labels: ['opt1', 'opt2', 'opt3'],
        selectedLabels: []
      }],
    numericType: [{
      title: 'Born in country population',
      minPossible: 10000000,
      maxPossible: 200000000,
      selectedRange: [10000000, 200000000]
    },
      {
        title: 'numeric facet 2',
        minPossible: 10000000,
        maxPossible: 200000000,
        selectedRange: [10000000, 200000000]
      }],
    numberOfEdgesType: [{
      title: 'Number of siblings',
      minPossible: 2,
      maxPossible: 5,
      selectedRange: [2, 5]
    },
      {
        title: 'numberOfEdges facet 2',
        minPossible: 2,
        maxPossible: 5,
        selectedRange: [2, 5]
      }],
  }

  async filterBtnPressed(event) {
    // for (const nodeIRI in this.graph.nodes) {
    //   // this.graph.nodes[node].visible = false;
    //   // Filter Charles Darwin
    //   if (nodeIRI === "http://www.wikidata.org/entity/Q1035") {
    //     this.graph.nodes[nodeIRI].visible = false;
    //   }
    // }

    let promise = await this.graph.server.callTest("no message");

    console.log(promise.m)

  }

  resetFiltering(event) {
    if (event) {
      // reset filtering ...

      // clear facet filters' values
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