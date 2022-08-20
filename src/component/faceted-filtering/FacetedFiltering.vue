<template>
  <div id="rootElement">
    <template v-if="!loadingFacets">
      <v-list dense>
        <v-list-item v-for="(facet, index) in facets" :key="index" v-if="facet != undefined">
          <v-list-item-content>
            <v-list-item-title class="facetTitle">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                      v-bind="attrs"
                      v-on="on"
                  >
                    {{ icons.info }}
                  </v-icon>
                </template>
                <span>{{ facet.description }}</span>
              </v-tooltip>
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
    </template>

    <template v-else>
      <div class="loading">
        Loading...
      </div>
    </template>
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
import {
  mdiInformationOutline
} from "@mdi/js";

@Component
export default class FacetedFiltering extends Vue {
  @Prop() graph: Graph;
  @Prop() configuration: Configuration;
  @Prop() remoteServer: RemoteServer;
  @Prop() manipulator: GraphManipulator;

  icons = {
    info: mdiInformationOutline
  };

  facets = [];

  facetsIndexes = new Map<String, number>();

  loadingFacets: boolean = false;

  /**
   * Loads facets for nodes and registers events that get triggered on actions which change facets' values.
   */
  async mounted() {
    DynamicallyGeneratedFacets.setFacets(this.facets);

    DynamicallyGeneratedFacets.setFacetsIndexes(this.facetsIndexes);

    this.loadingFacets = true;

    await this.loadAndFindInitialFacets();

    this.loadingFacets = false;

    this.$root.$on('expansion', async data => {
      this.loadingFacets = true;

      await this.findOrUpdateFacetsAfterExpansion(data[0], data[1]);

      this.loadingFacets = false;
    });

    this.$root.$on('deletion', deletedNode => {
      this.loadingFacets = true;

      this.updateFacetsUponDeletion(deletedNode);

      this.loadingFacets = false;
    });

    this.$root.$on('addNode', async nodesIRIs => {
      this.loadingFacets = true;

      await this.loadOrUpdateConfigurationFacets(nodesIRIs);

      for (const nodeIRI of nodesIRIs) {
        const node = this.graph.nodes[nodeIRI];

        DynamicallyGeneratedFacets.updateTypeFacet(node);

        DynamicallyGeneratedFacets.updateEdgesFacets(node);
      }

      this.loadingFacets = false;
    });
  }

  /**
   * Loads facets from configuration and computes facets from current graph's state.
   */
  async loadAndFindInitialFacets() {
    await this.loadOrUpdateConfigurationFacets(Object.keys(this.graph.nodes));

    const nodesArray = [];

    for (const nodeIRI in this.graph.nodes) {
      nodesArray.push(this.graph.nodes[nodeIRI]);
    }

    DynamicallyGeneratedFacets.updateInitialDynamicFacets(nodesArray);
  }

  /**
   * Loads facets from configuration for added nodes and re-computes
   * local graph facets for nodes affected by the expansion.
   */
  async findOrUpdateFacetsAfterExpansion(sourceNode, addedNodes) {
    let addedNodesIRIs = [];

    for (const addedNode of addedNodes) {
      addedNodesIRIs.push(addedNode.IRI);
    }

    await this.loadOrUpdateConfigurationFacets(addedNodesIRIs);

    DynamicallyGeneratedFacets.updateDynamicFacetsAfterExpansion(sourceNode, addedNodes);
  }

  /**
   * Sends requests to the server to get facet values for nodes and
   * processes its responses.
   */
  async loadOrUpdateConfigurationFacets(nodesIRIs: string[]) {
    // Send multiple requests to the server with fewer IRIs in headers
    let smallerIRIsArray = [];

    const maxNumOfIRIs = 100;

    let serverResponse = null;

    let counter = 0;

    for (const nodeIRI of nodesIRIs) {
      if (counter == maxNumOfIRIs) {
        // Send a request and process the response
        serverResponse = await this.remoteServer.getFacetsItems(this.configuration.iri, smallerIRIsArray);

        this.processConfigurationFacetsResponse(serverResponse);

        smallerIRIsArray.splice(0);

        smallerIRIsArray.push(nodeIRI);

        counter = 1;
      } else {
        smallerIRIsArray.push(nodeIRI)

        counter += 1;
      }
    }

    // Send the rest of IRIs
    if (smallerIRIsArray.length > 0) {
      serverResponse = await this.remoteServer.getFacetsItems(this.configuration.iri, smallerIRIsArray);
    }

    if (serverResponse != null) {
      this.processConfigurationFacetsResponse(serverResponse);
    }
  }

  /**
   * Creates or updates facets loaded from configuration.
   */
  processConfigurationFacetsResponse(serverResponse) {
    for (const backendFacet of serverResponse.facetsItems) {
      // Check whether the facet needs to be created
      if (this.facetsIndexes.get(backendFacet.iri) === undefined) {
        // Create a new facet
        switch (backendFacet.type) {
          case "label":
            this.createNewLabelFacet(backendFacet);
            break;

          case "numeric":
            this.createNewNumericFacet(backendFacet);
        }
      } else {
        // Update facet
        let existingFacet = this.facets[this.facetsIndexes.get(backendFacet.iri)];

        switch (existingFacet.type) {
          case "label":
            this.updateLabelFacet(existingFacet, backendFacet);
            break;

          case "numeric":
            this.updateNumericFacet(existingFacet, backendFacet);
        }
      }
    }
  }

  /**
   * Creates a new label facet with values returned by the server.
   */
  createNewLabelFacet(backendFacet) {
    var newLabelFacet = {
      id: backendFacet.iri,
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

    this.facetsIndexes.set(newLabelFacet.id, this.facets.length);

    this.facets.push(newLabelFacet);
  }

  /**
   * Creates a new numeric facet with values returned by the server.
   */
  createNewNumericFacet(backendFacet) {
    const newNumericFacet = {
      id: backendFacet.iri,
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

    this.facetsIndexes.set(newNumericFacet.id, this.facets.length);

    this.facets.push(newNumericFacet);
  }

  /**
   * Updates an existing label facet with a facet returned by the server.
   */
  updateLabelFacet(existingFacet, backendFacet) {
    for (const item of backendFacet.items) {
      if (existingFacet.index.get(item.value) === undefined) {
        existingFacet.index.set(item.value, [item.nodeIRI]);

        existingFacet.values.displayLabels.push(item.value);
      } else {
        if (!existingFacet.index.get(item.value).includes(item.nodeIRI)) {
          existingFacet.index.get(item.value).push(item.nodeIRI);
        }
      }
    }
  }

  /**
   * Updates an existing numeric facet with a facet returned by the server.
   */
  updateNumericFacet(existingFacet, backendFacet) {
    for (const item of backendFacet.items) {
      if (Number(item.value) < existingFacet.values.minPossible) {
        if (existingFacet.values.selectedRange[0] == existingFacet.values.minPossible) {
          existingFacet.values.minPossible = item.value;

          Vue.set(existingFacet.values.selectedRange, 0, item.value);
        } else {
          existingFacet.values.minPossible = item.value;
        }
      }

      if (Number(item.value) > existingFacet.values.maxPossible) {
        if (existingFacet.values.selectedRange[1] == existingFacet.values.maxPossible) {
          existingFacet.values.maxPossible = item.value;

          Vue.set(existingFacet.values.selectedRange, 1, item.value);
        } else {
          existingFacet.values.maxPossible = item.value;
        }
      }

      var itemAlreadyPresent = false;

      for (const indexItem of existingFacet.index) {
        if (indexItem.nodeIRI == item.nodeIRI) {
          itemAlreadyPresent = true;
        }
      }

      if (!itemAlreadyPresent) {
        existingFacet.index.push(item);
      }
    }
  }

  /**
   * Removes deleted node's IRI from facets' indexes and re-computes local graph
   * based facets for affected nodes by the deletion.
   */
  updateFacetsUponDeletion(deletedNode) {
    // Remove deleted node from facets' indexes
    for (const facet of this.facets) {
      // Skip a facet which is marked as deleted
      if (facet === undefined) {
        continue;
      }

      switch (facet.type) {
        case "label":
          this.removeNodeFromLabelFacetIndex(deletedNode, facet);
          break;

        case "numeric":
          this.removeNodeFromNumericFacetIndex(deletedNode, facet);
      }
    }

    DynamicallyGeneratedFacets.updateDynamicFacetsUponDeletion(deletedNode);
  }

  /**
   * Removes all occurrences of deleted node's IRI from a label facet's index.
   * Also marks the facet as undefined if the index becomes empty.
   */
  removeNodeFromLabelFacetIndex(deletedNode, facet) {
    for (const label of facet.index.keys()) {
      const filteredIRIs = facet.index.get(label).filter(iri => iri != deletedNode.IRI);

      facet.index.set(label, filteredIRIs);

      if (filteredIRIs.length == 0) {
        const filteredDisplayLabels = facet.values.displayLabels.filter(displayLabel => displayLabel != label);
        facet.values.displayLabels = filteredDisplayLabels;

        const filteredSelectedLabels = facet.values.selectedLabels.filter(selectedLabel => selectedLabel != label);
        facet.values.selectedLabels = filteredSelectedLabels;

        facet.index.delete(label);
      }
    }

    if (facet.index.size == 0) {
      // Mark empty facet
      this.facets[this.facetsIndexes.get(facet.id)] = undefined;

      this.facetsIndexes.delete(facet.id);
    }
  }

  /**
   * Removes deleted node's IRI from a numeric facet's index.
   * Also marks the facet as undefined if the index becomes empty.
   */
  removeNodeFromNumericFacetIndex(deletedNode, facet) {
    const newIndexArray = [];

    for (const indexItem of facet.index) {
      if (indexItem.nodeIRI != deletedNode.IRI) {
        newIndexArray.push(indexItem);
      }
    }

    facet.index = newIndexArray;

    if (facet.index.length == 0) {
      // Mark empty facet
      this.facets[this.facetsIndexes.get(facet.id)] = undefined;

      this.facetsIndexes.delete(facet.id);
    }
  }

  /**
   * Filters currently loaded nodes based on chosen facet values.
   */
  filterBtnPressed() {
    // Make all nodes visible first
    this.makeAllNodesVisible();

    const filteredNodesSet = this.getFilteredNodesSet();

    // Apply filter
    for (const nodeIRI in this.graph.nodes) {
      if (!filteredNodesSet.has(nodeIRI)) {
        this.graph.nodes[nodeIRI].visible = false;

        // Remove filtered node from its group if it is a member of one
        if (this.graph.nodes[nodeIRI].belongsToGroup != null) {
          this.manipulator.leaveGroup([this.graph.nodes[nodeIRI]], this.graph.nodes[nodeIRI].belongsToGroup)
        }
      }
    }
  }

  /**
   * Does intersection of all filtering sets and returns
   * the final filtering set
   */
  getFilteredNodesSet() {
    let filteringSets = this.createFilteringSets();

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

    return filteringSets[filteringSets.length - 1];
  }

  /**
   * For each facet create a filtering set with IRIs of nodes
   * which passed selected filtering criteria
   */
  createFilteringSets() {
    // Sets of nodes' IRIs calculated by each facet
    let filteringSets = [];

    for (const facet of this.facets) {
      // Skip a facet which is marked as deleted
      if (facet === undefined) {
        continue;
      }

      // Skip an unused label facet
      if (facet.type == "label" && facet.values.selectedLabels.length == 0) {
        continue;
      }

      // Skip a numeric facet that has its extrema selected because
      // it wouldn't filter anything
      if (facet.type == "numeric" && (facet.values.selectedRange[0] == facet.values.minPossible && facet.values.selectedRange[1] == facet.values.maxPossible)) {
        continue;
      }

      let filteringSet = new Set<string>();

      if (facet.type == "label") {
        // For each selected label put contents of its mapped array in index to the filteringSet
        for (const label of facet.values.selectedLabels) {
          facet.index.get(label).forEach(nodeIRI => filteringSet.add(nodeIRI));
        }
      } else {
        // Numeric type facet
        const selectedMin = facet.values.selectedRange[0];
        const selectedMax = facet.values.selectedRange[1];

        const filteredItems = facet.index.filter(nodeItem => nodeItem.value >= selectedMin && nodeItem.value <= selectedMax);

        // Add IRIs of filtered nodes to the filteringSet
        filteredItems.forEach(item => filteringSet.add(item.nodeIRI));
      }

      filteringSets.push(filteringSet);
    }

    return filteringSets;
  }

  /**
   * Removes all facets and loads and computes them again.
   */
  async reloadFacets() {
    this.loadingFacets = true;

    // Remove all facets
    this.facets.splice(0);

    this.facetsIndexes.clear();

    await this.loadAndFindInitialFacets()

    this.loadingFacets = false;
  }

  /**
   * Sets all nodes' visibility property to true.
   */
  makeAllNodesVisible() {
    for (const nodeIRI in this.graph.nodes) {
      this.graph.nodes[nodeIRI].visible = true;
    }
  }

  /**
   * Resets chosen facets values to their initial state
   * and shows all hidden nodes.
   */
  resetFiltering() {
    // Uncheck checkboxes and reset sliders' selected ranges
    for (const facet of this.facets) {
      // Skip a facet which is marked as deleted
      if (facet === undefined) {
        continue;
      }

      if (facet.type == "label") {
        facet.values.selectedLabels.splice(0);
      } else {
        facet.values.selectedRange = [facet.values.minPossible, facet.values.maxPossible];
      }
    }

    this.makeAllNodesVisible();
  }
}
</script>

<style>
.sliderInput {
  margin-top: -18px !important;
}

.loading {
  margin-top: 80%;
  margin-left: 115px;
  font-size: 15pt;
}
</style>