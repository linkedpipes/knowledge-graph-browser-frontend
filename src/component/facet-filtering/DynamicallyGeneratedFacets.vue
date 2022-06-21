<template/>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from "vue";
import {Prop} from "vue-property-decorator";

@Component
export default class DynamicallyGeneratedFacets extends Vue {
  @Prop() facets;

  loadDynamicFacets() {
    this.facets.push({name: "newFacet"});
    console.log(this.facets);
  }
}
</script>

<style/>