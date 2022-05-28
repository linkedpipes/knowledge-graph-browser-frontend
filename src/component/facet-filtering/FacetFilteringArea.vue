<template>
  <div id="rootElement">
<!--    <p>ahoj jiro</p>-->
    <v-btn @click="testFilter">filter</v-btn>
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

  async testFilter() {
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
}
</script>

<style>

</style>