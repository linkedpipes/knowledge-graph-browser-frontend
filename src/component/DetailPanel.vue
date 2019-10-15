<template>
    <div class="detail-panel pa-5" v-if="panelActive">
        <!-- Basic info -->
       <!--  <v-img v-if="actualViewImageDetail" max-height="300" :src="actualViewImageDetail.value"></v-img> -->

        <v-carousel hide-delimiters :show-arrows="actualViewImageDetail.lenght > 1" cycle v-if="actualViewImageDetail" height="300" class="mb-5">
            <v-carousel-item v-for="detail in actualViewImageDetail" :key="detail.IRI">
                <v-img
                    :src="detail.value"
                    aspect-ratio="1"
                    class="grey lighten-2"
                    max-height="100%"
                >
                    <v-row class="fill-height flex-column pa-3">
                    <v-card-text class="white--text">
                    <div class="text-right">{{detail.type.label}}</div>
                    </v-card-text>
                    </v-row>            
                </v-img>
            </v-carousel-item>
        </v-carousel>        

        <div class="mb-5">
            <h1 v-if="actualPreview">{{actualPreview.label}}</h1><h1 v-else>[loading]</h1>
            <a :href="IRI">{{IRI}}</a>

            <!-- TODO: Does node type depends on view? -->
        </div>

        <v-btn @click="experimental_switch_visibility">Change visibility</v-btn>

        <div v-if="actualPreviewClasses" class="class-list mb-5">
                <v-chip v-for="cls in actualPreviewClasses" :key="cls.label" :color="cls.color" class="mx-2">{{cls.label}}</v-chip>
        </div>

        <v-card v-if="actualPreview" class="mb-5">
            <v-card-text>
                <div>
                    <b>{{actualPreview.type.label}}</b> <span v-if="actualPreview.type.description">(<i>{{actualPreview.type.description}}</i>)</span>
                </div>
                <a :href="actualPreview.type.iri">{{actualPreview.type.iri}}</a>
            </v-card-text>
        </v-card>
<!-- 
        <div class="mb-5">
            <v-btn @click="hidden = !hidden" v-text="hidden ? 'Show' : 'Hide'" />
            <v-btn @click="remove">Remove node</v-btn>
            <v-btn color="primary">Button</v-btn>
        </div> -->

        <v-card :loading="!viewSets" class="mb-5">
            <v-card-title>Avaiable views</v-card-title>
            <template v-if="viewSets">
                <v-simple-table v-if="viewSets.length">
                    <tbody>
                        <template v-for="viewSet in viewSets">
                            <tr :key="viewSet.IRI"><th colspan="2">{{viewSet.label}}</th></tr>
                            <tr v-for="view in viewSet.views" :key="view.IRI">
                                <td>{{view.label}}</td>
                                <td>
                                    <v-btn color="red" @click="view.expand">Expand</v-btn>
                                    <v-btn @click="view.use">View</v-btn>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </v-simple-table>
                <v-alert v-else dense outlined type="error" class="mx-5">
                    Server responded with no views. You should check your configuration. 
                </v-alert>                
            </template>
            <v-card-text v-else>
                Fetching views...
            </v-card-text>
        </v-card>

        <v-card :disabled="!actualView" :loading="actualView && !actualView.detail" class="mb-5">
            <v-card-title>Detail</v-card-title>
            <v-card-text v-if="!actualView">Select the view first to show detailed information.</v-card-text>
            <v-card-text v-else-if="!actualView.detail">Fetching detailed information...</v-card-text>
            <template v-else>
                <v-card-text><a :href="actualView.IRI">{{actualView.label}}</a></v-card-text>
                <v-simple-table>
                    <thead>
                        <tr>
                            <td>Key</td>
                            <td>Value</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="detail in actualView.detail" :key="detail.IRI">
                            <td><a :href="detail.IRI">{{detail.type.label}}</a></td>
                            <td>
<!--                                 <v-img v-if="['.jpg', '.png', '.bmp'].includes(detail.value.substr(detail.value.length - 4))" :src="detail.value" /> -->
                                <span>{{detail.value}}</span>
                            </td>
                        </tr>
                    </tbody>
                </v-simple-table>
            </template>
        </v-card>
    </div>
</template>
<script lang="ts">

export interface ViewPanelData {
    IRI: string,
    preview: NodePreview,
    detail: DetailValue[],
    use: () => Promise<any>,
    expand: () => Promise<any>,
}

export interface DetailPanelData {
    IRI: string,
    actualPreview: NodePreview,
    actualView: ViewPanelData,
    viewSets: {
        IRI: string,
        label: string,
        views: ViewPanelData[]
    }[],
    visible: boolean,
    remove: () => void,
    hidden: boolean,
    panelActive: boolean,
    experimental_switch_visibility: () => void,
}

import { Node } from '../graph/Node';
import { NodePreview, DetailValue } from '../graph/NodeView';
import colors from 'vuetify/lib/util/colors';
export default {
    data(): DetailPanelData {
        return {
            IRI: "",
            hidden: false,
            remove: () => console.log("Calling remove"),
            // @ts-ignore
            actualView: {
            // @ts-ignore
                preview: {
                    
                }
            } as ViewPanelData,
            actualPreview: null,
            viewSets: [] ,

            panelActive: false,
            visible: false,
            experimental_switch_visibility: null,
            };
    },
    computed: {
        /**
         * Computed property for active view that has image in detail
         */
        actualViewImageDetail: function(): DetailValue[] {
            if (!this.actualView || !this.actualView.detail) {
                return null;
            }

            let result = (<ViewPanelData>this.actualView).detail.filter(detail => ['.jpg', '.png', '.bmp'].includes(detail.value.substr(detail.value.length - 4)));

            return result.length ? result : null;
        },

        actualPreviewClasses: function(): {label: string; color: string}[] {
            if (!this.actualView || !this.actualView.preview) {
                return null;
            }
            let colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown', 'blueGrey'];

            return (<ViewPanelData>this.actualView).preview.classes.map(cls => {
                return {
                    label: cls,
                    color: colors[cls.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) % colors.length]
                }
            });
        }
    },
    watch: {
        hidden: () => {console.log("Hidden value changed...")}
    },
    methods: {
        mountNode: async function (node: Node) {
            this.panelActive = true;
            if (node) {
                let data: DetailPanelData = this.$data;

                data.IRI = node.IRI;
                data.actualPreview = node.activePreview;
                data.actualView = null;
                data.viewSets = null;

                await node.getViewSets();
                //await node.viewSets[Object.keys(node.viewSets)[0]].defaultView.use();

                data.viewSets = [];
                for (let x in node.viewSets) {
                    let viewSet = node.viewSets[x];

                    let viewsData: ViewPanelData[] = [];
                    for (let y in viewSet.views) {
                        let view = viewSet.views[y];

                        let viewData: ViewPanelData = {
                            IRI: view.IRI,
                            label: view.label,
                            preview: null,
                            detail: null,
                            // @ts-ignore
                            use: () => {
                                // @ts-ignore
                                view.getDetail().then(detail => {viewData.detail = detail;});
                                view.getPreview().then(preview => {
                                    viewData.preview = preview;
                                    data.actualPreview = preview;
                                    view.use();
                                });
                                data.actualView = viewData;
                                },
                            expand: () => view.expand().then(expansion => {
                                let counter = 0;

                                expansion.nodes.forEach(n => {n.cyInstance.removeStyle("display").style("opacity", '0').delay(counter).animate({
                                    style: { opacity: 1 }
                                }, {
                                    duration: 500
                                });
                                counter += 500/expansion.nodes.length;
                                });
                                
                                expansion.edges.forEach(n => n.show());

                                let collection = expansion.nodes[0].cyInstance;
                                expansion.nodes.forEach(n => collection = collection.union(n.cyInstance));

                                expansion.parentNode.graph.CyInstance.layout({name: 'grid'}).run();
                                //collection.layout({name: 'grid'}).run();
                            }),
                        }

                        if (node.activeNodeView === view) {
                            viewData.use();
                        }

                        viewsData.push(viewData);
                    }
                    data.viewSets.push({
                        IRI: viewSet.IRI,
                        label: viewSet.label,
                        views: viewsData 
                    });
                }

                // Visibility
                data.experimental_switch_visibility = () => {
                    node.userHidden = !node.userHidden;
                }

            } else {

            }
        },
        unmount: function() {
            this.panelActive = false;
        }
    }
}
</script>

<style scoped>
.detail-panel {
    padding: .5cm;
}
</style>