<template>
    <div id="detail-panel">
        <div>
            <a :href="IRI"><h1 v-if="actualView.preview">{{actualView.preview.label}}</h1><h1 v-else>[loading]</h1></a>
            <a :href="IRI">{{IRI}}</a>
        </div>

        <div>
            <button @click="hidden = !hidden" v-text="hidden ? 'Show' : 'Hide'" />
            <button @click="remove">Remove node</button>
        </div>

        <div>
            <h2>Detail of <small><a :href="actualView.IRI">{{actualView.label}}</a></small></h2>
            <table>
                <thead>
                    <tr>
                        <td>Key</td>
                        <td>Value</td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(detail, key) in actualView.detail" :key="key">
                        <td><a :href="detail.key">{{key}}</a></td>
                        <td>{{detail}}</td>
                    </tr>
                </tbody>
            </table>
        </div>


        <h2>Avaiable views</h2>
        <table>
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
    </div>
</template>
<script lang="ts">
export interface ViewPanelData {
    IRI: string,
    preview: object,
    detail: {
        IRI: string,
        key: string,
        value: string
    }[],
    use: () => Promise<any>,
    expand: () => Promise<any>,
}

export interface DetailPanelData {
    IRI: string,
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
export default {
    data(): DetailPanelData {
        return {
            IRI: "",
            hidden: false,
            remove: () => console.log("Calling remove"),
            actualView: {
                preview: {
                    
                }
            },
            viewSets: [] 
            };
    },
    watch: {
        hidden: () => {console.log("Hidden value changed...")}
    },
    methods: {
        mountNode: function (node: Node) {
            console.log("calling mounting", this);
            if (node) {
                this.$data.IRI = node.IRI;

                this.$data.viewSets = [];

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
                            use: () => {
                                view.getDetail().then(detail => {viewData.detail = detail; console.log(detail);});
                                view.getPreview().then(preview => viewData.preview = preview);
                                this.$data.actualView = viewData;
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
                                expansion.parentNode.graph.CyInstance.layout({name: 'grid'}).run();
                            }),
                        }

                        viewsData.push(viewData);
                    }
                    this.$data.viewSets.push({
                        IRI: viewSet.IRI,
                        label: viewSet.label,
                        views: viewsData 
                    });
                }

                this.$data.viewSets[0].views[0].use();

            } else {

            }
        }
    }
}
</script>