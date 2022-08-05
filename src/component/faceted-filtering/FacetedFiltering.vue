<template>
  <div id="rootElement">
    <v-list dense>
      <v-list-item v-for="(facet, index) in facets" :key="index">
        <v-list-item-content v-if="facet != undefined">
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
    DynamicallyGeneratedFacets.setFacets(this.facets);

    DynamicallyGeneratedFacets.setFacetsIndexes(this.facetsIndexes);

    await this.loadAndFindInitialFacets();

    this.$root.$on('facetExpansion', data => {
      this.findOrUpdateFacetsAfterExpansion(data[0], data[1]);
    });

    this.$root.$on('facetDeletion', deletedNode => {
      this.updateFacetsUponDeletion(deletedNode);
    });
  }

  async loadAndFindInitialFacets() {
    await this.loadOrUpdateConfigurationFacets(Object.keys(this.graph.nodes));

    const nodesArray = [];

    for (const nodeIRI in this.graph.nodes) {
      nodesArray.push(this.graph.nodes[nodeIRI]);
    }

    DynamicallyGeneratedFacets.findOrUpdateInitialDynamicFacets(nodesArray);
  }

  findOrUpdateFacetsAfterExpansion(sourceNode, addedNodes) {
    let addedNodesIRIs = [];

    for (const addedNode of addedNodes) {
      addedNodesIRIs.push(addedNode.IRI);
    }

    this.loadOrUpdateConfigurationFacets(addedNodesIRIs);

    DynamicallyGeneratedFacets.findOrUpdateDynamicFacetsAfterExpansion(sourceNode, addedNodes);
  }

  async loadOrUpdateConfigurationFacets(nodesIRIs: string[]) {
    let serverResponse = await this.remoteServer.getFacetsItems(this.configuration.iri, nodesIRIs);

    for (const backendFacet of serverResponse.facetsItems) {
      // Check whether the facet needs to be created
      if (this.facetsIndexes.get(backendFacet.iri) === undefined) {
        // Create a new facet
        switch (backendFacet.type) {
          case "label":
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
            break;

          case "numeric":
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
      } else {
        // Update facet
        let existingFacet = this.facets[this.facetsIndexes.get(backendFacet.iri)];

        switch (existingFacet.type) {
          case "label":
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
            break;

          case "numeric":
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
      }
    }
  }

  updateFacetsUponDeletion(deletedNode) {
    // Remove deleted node from facets' indexes
    for (const facet of this.facets) {
      // Skip a facet which is marked as deleted
      if (facet === undefined) {
        continue;
      }

      switch (facet.type) {
        case "label":
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
          }

          break;

        case "numeric":
          const newIndexArray = [];

          for (const indexItem of facet.index) {
            if (indexItem.nodeIRI != deletedNode.IRI) {
              newIndexArray.push(indexItem);
            }
          }

          facet.index = newIndexArray;

          DynamicallyGeneratedFacets.updateDynamicFacetsUponDeletion(deletedNode);

          // Find possibly new facet extrema
          let newMin = Number.MAX_VALUE;

          for (const indexItem of facet.index) {
            if (indexItem.value < newMin) {
              newMin = indexItem.value;
            }
          }

          facet.values.minPossible = newMin;

          if (facet.values.selectedRange[0] < newMin) {
            Vue.set(facet.values.selectedRange, 0, newMin);
          }

          let newMax = Number.MIN_VALUE;

          for (const indexItem of facet.index) {
            if (indexItem.value > newMax) {
              newMax = indexItem.value;
            }
          }

          facet.values.maxPossible = newMax;

          if (facet.values.selectedRange[1] > newMax) {
            Vue.set(facet.values.selectedRange, 1, newMax)
          }


          if (facet.index.length == 0) {
            // Mark empty facet
            this.facets[this.facetsIndexes.get(facet.id)] = undefined;
          }
      }
    }
  }

  // Filter currently loaded nodes based on facet values
  filterBtnPressed() {
    // Make all nodes visible first
    this.makeAllNodesVisible();

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

        if (this.graph.nodes[nodeIRI].belongsToGroup != null) {
          this.manipulator.leaveGroup([this.graph.nodes[nodeIRI]], this.graph.nodes[nodeIRI].belongsToGroup)
        }
      }
    }
  }

  settingsClicked() {}

  makeAllNodesVisible() {
    // Set all nodes' visibility property to true
    for (const nodeIRI in this.graph.nodes) {
      this.graph.nodes[nodeIRI].visible = true;
    }
  }

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
</style>