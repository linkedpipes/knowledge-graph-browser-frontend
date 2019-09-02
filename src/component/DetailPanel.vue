<template>
    <div id="detail-panel">
        <!-- Basic info -->
        <div>
            <a :href="IRI"><h1 v-if="actualPreview">{{actualPreview.label}}</h1><h1 v-else>[loading]</h1></a>
            <a :href="IRI">{{IRI}}</a>

            <!-- TODO: Does node type depends on view? -->
            <div v-if="actualPreview" class="node-type">
                <b>{{actualPreview.type.label}}</b> (<i>{{actualPreview.type.description}}</i>) <br>
                <a :href="actualPreview.type.iri">{{actualPreview.type.iri}}</a>
            </div>

            <ul v-if="actualPreview" class="class-list">
                <li v-for="cls in actualPreview.classes" :key="cls">{{cls}}</li>
            </ul>
        </div>

        <div>
            <button @click="hidden = !hidden" v-text="hidden ? 'Show' : 'Hide'" />
            <button @click="remove">Remove node</button>
        </div>

        <div>
            <h2>Avaiable views</h2>
            <table v-if="viewSets">
                <tbody>
                    <template v-for="viewSet in viewSets">
                        <tr :key="viewSet.IRI"><td colspan="2">{{viewSet.label}}</td></tr>
                        <tr v-for="view in viewSet.views" :key="view.IRI">
                            <td>{{view.label}}</td>
                            <td>
                                <button @click="view.expand">Expand</button>
                                <button @click="view.use">Switch to this view</button>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            <div v-else>
                Still fetching...
            </div>
        </div>

        <div v-if="actualView">
            <h2>Detail of <small><a :href="actualView.IRI">{{actualView.label}}</a></small></h2>
            <table>
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
                            <img v-if="['.jpg', '.png', '.bmp'].includes(detail.value.substr(detail.value.length - 4))" :src="detail.value" />
                            <span v-else>{{detail.value}}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

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
}

import { Node } from '../graph/Node';
import { NodePreview, DetailValue } from '../graph/NodeView';
export default {
    data(): DetailPanelData {
        return {
            IRI: "",
            hidden: false,
            remove: () => console.log("Calling remove"),
            // @ts-ignore
            actualView: {
                preview: {
                    
                }
            },
            actualPreview: null,
            viewSets: [] 
            };
    },
    watch: {
        hidden: () => {console.log("Hidden value changed...")}
    },
    methods: {
        mountNode: async function (node: Node) {
            console.log("calling mounting", this);
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
                                view.getDetail().then(detail => {viewData.detail = detail; console.log(detail);});
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

            } else {

            }
        }
    }
}
</script>

<style>

</style>