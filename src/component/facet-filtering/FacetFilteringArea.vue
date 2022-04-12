<template>
  <div id="rootElement">
    <p>ahoj jiro</p>
    <v-btn @click="testFilter">filter</v-btn>
  </div>

</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import {Prop} from "vue-property-decorator";
import {Graph} from "../../graph/Graph";

@Component
export default class FacetFilteringArea extends Vue {
  @Prop() graph: Graph;

  testFilter() {
    for (const nodeIRI in this.graph.nodes) {
      // this.graph.nodes[node].visible = false;
      // Filter Charles Darwin
      if (nodeIRI === "http://www.wikidata.org/entity/Q1035") {
        this.graph.nodes[nodeIRI].visible = false;
      }
    }
  }
}
</script>

<style>

</style>