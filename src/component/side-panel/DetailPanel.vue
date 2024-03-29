<template>
    <panel-template>
                <v-carousel hide-delimiters :show-arrows="detailImages.length > 1" cycle v-if="detailImages" height="300" class="mb-5">
                    <v-carousel-item v-for="detail in detailImages" :key="detail.IRI">
                        <v-img
                                :src="detail.value"
                                aspect-ratio="1"
                                max-height="100%"
                                contain
                        >
                            <v-row v-if="detail.type" class="fill-height flex-column-reverse pa-3">
                                <div class="image-title"><span>{{detail.type.label}}</span></div>
                            </v-row>
                        </v-img>
                    </v-carousel-item>
                </v-carousel>

                <!-- NODE NAME AND CLASSES -->
                <div class="mb-5">
                    <div v-if="node.lastPreview">
                        <h1 class="mb-2 d-inline">{{node.lastPreview.label}}</h1>
                        <v-chip label v-for="cls in previewClasses" :key="cls.label" :color="cls.color" style="vertical-align: super;" class="mx-2">{{cls.label}}</v-chip>
                        <div v-if="getHierarchicalClass">
                            <b>{{$tc('hierarchy.hierarchical_class', 1)}}: </b> 
                            <v-chip label :key="getHierarchicalClass.label" :color="getHierarchicalClass.color" style="vertical-align: super;" class="mx-2">{{getHierarchicalClass.label}}</v-chip>
                        </div>
                        <div v-if="getVisualGroupClass">
                            <b>{{$tc('visual_group.visual_group_class', 1)}}: </b> 
                            <v-chip label :key="getVisualGroupClass.label" :color="getVisualGroupClass.color" style="vertical-align: super;" class="mx-2">{{getVisualGroupClass.label}}</v-chip>
                        </div>
                    </div>
                    <h1 v-else-if="node.IRI.startsWith('pseudo_parent')">Visual group "{{ node.children[0].visualGroupClass }}"</h1>
                    <h1 v-else>{{ $t("side_panel.detail_panel.loading") }}</h1>
                </div>

                <v-alert v-if="!node.isVisible" type="info" color="secondary" dense text>{{ $t("side_panel.detail_panel.hidden.f" + (node.shownByFilters ? "t" : "f") + "u" + (node.visible ? "t" : "f")) }}</v-alert>
                <v-alert v-if="node.belongsToGroup" type="info" color="secondary" dense text>{{ $tc("side_panel.detail_panel.part_of_group", node.belongsToGroup.nodes.length) }} <v-btn small text color="primary" @click="node.belongsToGroup.selectExclusively()">{{ $tc("side_panel.detail_panel.go_to_group") }}</v-btn></v-alert>
                <v-alert v-if="node.viewSetsConfiguration && node.viewSetsConfiguration.iri !== node.graph.configuration.iri" type="info" color="secondary" dense text>
                     <v-row no-gutters align="center">
                        <v-col class="grow">
                            <i18n path="side_panel.detail_panel.different_configuration" tag="span">
                                <template v-slot:configuration-name>
                                    <b>{{ (node.viewSetsConfiguration.title ? $t_literal(node.viewSetsConfiguration.title) : node.viewSetsConfiguration.iri)}}</b>
                                </template>
                            </i18n>
                        </v-col>
                        <v-col class="shrink">
                            <v-btn small text color="secondary" @click="nodeRefresh">{{ $tc('side_panel.refresh', 1) }}</v-btn>
                        </v-col>
                    </v-row>
                </v-alert>

                <v-card v-if="isGroupCompactModeActive" outlined class="mb-5">
                    <v-card-text>{{ $tc('group_compact.enabled') }}</v-card-text>
                </v-card>
                
                <!-- DETAIL -->
                <v-card v-if="!node.IRI.startsWith('pseudo_parent')" outlined :disabled="!node.isDetailActual" :loading="!node.isDetailActual" class="mb-5 detail">
                    <v-card-title>{{ $t("side_panel.detail_panel.detail") }}</v-card-title>
                    <v-card-text v-if="!node.currentView">{{ $t("side_panel.detail_panel.please_select_view") }}</v-card-text>
                    <v-card-text v-else-if="!node.lastDetail">{{ $t("side_panel.detail_panel.fetching_detail") }}</v-card-text>
                    <v-simple-table v-else>
                        <tbody>
                        <tr v-for="detail in node.lastDetail" :key="detail.IRI">
                            <td>
                                <link-component :href="detail.IRI" /> &nbsp; <b v-if="detail.type">{{detail.type.label}}</b> &nbsp;
                                <any-data-value
                                    :value="detail.value"
                                    :graph="node.graph"
                                    @node-click="$event.selectExclusively()"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </v-simple-table>
                </v-card>

                <!-- EXPANSIONS AND VIEWS -->
                <v-card v-if="!node.IRI.startsWith('pseudo_parent') && !isGroupCompactModeActive" outlined :loading="viewSets === null" class="mb-5">
                    <v-card-title>{{ $t("side_panel.detail_panel.views") }}</v-card-title>
                    <template v-if="viewSets !== null">
                        <v-list v-if="viewSets.length">
                            <v-list-item-group v-model="currentViewIRI" mandatory color="secondary">
                                <template v-for="viewSet in viewSets">
                                    <v-list-item :key="viewSet.IRI" disabled>{{viewSet.label}}</v-list-item>
                                    <v-list-item v-for="view in viewSet.views" :key="view.IRI" :value="view.IRI" @click="view.use()">
                                        <v-list-item-content :title="view.viewDescription">
                                            <v-list-item-title style="flex-basis: auto;" class="flex-grow-1">{{view.label}}</v-list-item-title>
                                            <v-btn style="flex-basis: auto;" class="flex-grow-0" small color="secondary" :loading="view.expansionInProgress" @click.stop="expand(view)">{{ $t("side_panel.detail_panel.expand") }}</v-btn>
                                        </v-list-item-content>
                                    </v-list-item>
                                </template>
                            </v-list-item-group>
                        </v-list>
                        <div v-else style="padding-bottom: 1px;">
                            <v-alert dense outlined type="error" class="mx-5">
                                {{ $t("side_panel.detail_panel.no_views") }}
                            </v-alert>
                        </div>
                    </template>
                    <v-card-text v-else>
                        {{ $t("side_panel.detail_panel.fetching_views") }}
                    </v-card-text>
                </v-card>
                <v-card v-else-if="isGroupCompactModeActive" outlined class="mb-5">
                    <v-card-title>{{ $t("side_panel.detail_panel.views") }}</v-card-title>
                    <v-card-text>{{ $t("group_compact.view_availability") }}</v-card-text>
                </v-card>

                <!-- TYPE OF THE NODE -->
                <v-card v-if="!node.IRI.startsWith('pseudo_parent')" outlined class="mb-5">
                    <v-card-text>
                        <a :href="node.IRI" target="_blank" class="text--primary" style="text-decoration: none;">{{node.IRI}}</a>
                    </v-card-text>

                    <v-divider></v-divider>

                    <v-card-text v-if="node.lastPreview && node.lastPreview.type" class="text--primary">
                        <link-component :href="node.lastPreview.type.iri" /> &nbsp;
                        <b>{{node.lastPreview.type.label}}</b> &nbsp;
                        <span v-if="node.lastPreview.type.description">{{node.lastPreview.type.description}}</span>
                    </v-card-text>
                    <v-card-text v-else class="text--primary">
                        {{ $t("side_panel.detail_panel.no_type_info") }}
                    </v-card-text>
                </v-card>

                <v-expansion-panels accordion multiple v-if="areaManipulator.layoutManager.currentLayout.constraintRulesLoaded && areaManipulator.layoutManager.currentLayout.supportsHierarchicalView && !isGroupCompactModeActive && !isCompactModeActive">
                    <v-expansion-panel v-if="node.children.length > 0">
                        <v-expansion-panel-header>
                            <div><b v-if="!node.IRI.startsWith('pseudo_parent')">List of children</b> <b v-else>List of nodes</b> - {{ $tc('side_panel.node_grouped_list.number_items', node.children.length) }}</div>
                                
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>

                            <v-text-field v-model="searchValue" label="Search node" clearable color="silver">
                                <v-icon slot="prepend"> {{ icons.zoomIcon }}</v-icon>
                            </v-text-field>

                            <v-simple-table dense>
                                <template v-slot:default>
                                    <tbody>
                                    <tr v-for="childNode in filterNodes(node.children)" :key="childNode.identifier">
                                        
                                        <td>
                                            <div v-if="isNode(childNode)" class="table-node-actions">
                                                <link-component :href="childNode.identifier" />
                                            </div>
                                            <div v-else>
                                                <v-icon>{{ icons.group }}</v-icon>
                                            </div>
                                        </td>
                                        <td class="table-node-name" @click="childNode.selectExclusively()" :title="getLabel(childNode)">
                                            {{ getLabel(childNode) }}
                                        </td>
                                    </tr>
                                    </tbody>
                                </template>
                            </v-simple-table>

                        </v-expansion-panel-content>
                    </v-expansion-panel>
                </v-expansion-panels>

        <template v-if="!node.IRI.startsWith('pseudo_parent') && !isGroupCompactModeActive" v-slot:actions>
            <panel-action-button
                    @click="removeNode"
                    danger
                    :icon="icons.remove"
                    :text="$tc('side_panel.remove', 1)"
                    :help="$tc('side_panel.remove_desc', 1)"
            />
            <panel-action-button
                    @click="nodeRefresh"
                    :icon="icons.refresh"
                    :text="$tc('side_panel.refresh', 1)"
                    :help="$tc('side_panel.refresh_desc', 1)"
            />
            <panel-action-button
                    @click="areaManipulator.fit(node)"
                    :disabled="!node.isVisible"
                    :icon="icons.locate"
                    :text="$tc('side_panel.locate', 1)"
                    :help="$tc('side_panel.locate_desc', 1)"
            />
            <panel-action-button
                    @click="visibilityChanged"
                    :icon="icons.visibility[node.visible ? 1 : 0]"
                    :text="$tc('side_panel.' + (node.visible ? 'hide' : 'unhide'), 1)"
                    :help="$tc('side_panel.' + (node.visible ? 'hide' : 'unhide') + '_desc', 1)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    @click="areaManipulator.setLockedForLayouts([node], !node.lockedForLayouts)"
                    :icon="icons.lockedForLayouts[node.lockedForLayouts ? 0 : 1]"
                    :text="$tc('side_panel.' + (node.lockedForLayouts ? 'unlock' : 'lock') + '_for_layouts', 1)"
                    :help="$tc('side_panel.' + (node.lockedForLayouts ? 'unlock' : 'lock') + '_for_layouts_desc', 1)"
            />
            <panel-action-button
                    v-if="node.belongsToGroup"
                    @click="manipulator.leaveGroup([node], node.belongsToGroup)"
                    :icon="icons.leave"
                    :text="$tc('side_panel.leave', 1)"
                    :help="$tc('side_panel.leave_desc', 1)"
            />
        </template>
    </panel-template>
</template>
<script lang="ts">
import {Component, Mixins, Prop, Watch} from 'vue-property-decorator';
import { Node } from '@/graph/Node';
import { NodeViewSet } from '@/graph/NodeViewSet';
import {DetailValue} from '@/graph/NodeView';
import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';
import {
    mdiTrashCanOutline,
    mdiRefresh,
    mdiCrosshairsGps,
    mdiEye,
    mdiEyeOff,
    mdiWeb,
    mdiPinOutline,
    mdiPinOffOutline,
    mdiApplicationExport,
    mdiMagnify,
    mdiGroup
} from '@mdi/js';
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import LinkComponent from "../helper/LinkComponent.vue";
import NodeCommonPanelMixin from "./NodeCommonPanelMixin";
import PanelTemplate from "./components/PanelTemplate.vue";
import PanelActionButton from "./components/PanelActionButton.vue";
import GraphManipulator from "../../graph/GraphManipulator";
import AnyDataValue from "@/component/helper/AnyDataValue.vue";
import NodeCommon from '@/graph/NodeCommon';
import NodeGroup from '@/graph/NodeGroup';
import FacetedFiltering from "@/component/faceted-filtering/FacetedFiltering.vue";

@Component({
    components: {AnyDataValue, PanelActionButton, PanelTemplate, LinkComponent, FacetedFiltering}
})
export default class DetailPanel extends Mixins(NodeCommonPanelMixin) {
    @Prop(Object) node !: Node;
    @Prop(Object) areaManipulator !: GraphAreaManipulator;
    @Prop(Object) manipulator !: GraphManipulator;
    @Prop(Boolean) nodeLockingSupported !: boolean;

    private readonly icons = {
        remove: mdiTrashCanOutline,
        refresh: mdiRefresh,
        locate: mdiCrosshairsGps,
        visibility: [mdiEyeOff, mdiEye],
        link: mdiWeb,
        lockedForLayouts: [mdiPinOffOutline, mdiPinOutline],
        leave: mdiApplicationExport,
        zoomIcon: mdiMagnify,
        group: mdiGroup,
    }

    currentViewIRI: string = null;

    /**
     * Returns classes list with deterministic color based on name.
     *
     * Uses lastFullPreview to prevent unnecessary blinking when switching the views
     */
    get previewClasses(): {label: string; color: string}[] {
        return this.getClassesColors(this.node.lastPreview?.classes);
    }

    /**
     * Returns hierarchical class \
     * See the github documentation for more information: \
     *      - https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#hierarchical-class
     */
    get getHierarchicalClass(): {label: string; color: string} {
        for (let cls of this.previewClasses) {
            if (cls.label === this.node.hierarchicalClass) {
                return cls;
            }
        }
    }

    get getVisualGroupClass(): {label: string; color: string} {
        for (let cls of this.previewClasses) {
            if (cls.label === this.node.visualGroupClass) {
                return cls;
            }
        }
    }

    /**
     * Converts viewSets to array
     */
    get viewSets(): NodeViewSet[]|null {
        if (this.node.viewSets === null) return null;
        let sets: NodeViewSet[] = [];
        for (let IRI in this.node.viewSets) {
            sets.push(this.node.viewSets[IRI]);
        }
        return sets;
    }

    /**
     * Extracts possible image URLs to show them as real images
     */
    get detailImages(): DetailValue[] {
        if (!this.node.lastDetail) {
            return null;
        }

        let result = this.node.lastDetail.filter(detail => ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.bmp', '.BMP'].includes(detail.value.substr(detail.value.length - 4)));

        return result.length ? result : null;
    }

    mounted() {
        this.nodeChanged();
    }

    async expand(view) {
        let expansion = await this.areaManipulator.expandNode(view);

        this.$root.$emit('expansion', [this.node, expansion.getNodes()]);
    }

    private searchValue: String = "";
    private filterNodes(nodes: NodeCommon[]) {
        // nodes = nodes.filter(node => node instanceof Node);

        nodes = nodes.slice().sort((n1,n2) => {
            let label1: string = "";
            let label2: string = "";


            if (n1 instanceof Node) label1 = n1.currentView?.preview?.label.toLowerCase();
            else if (n1 instanceof NodeGroup) label1 = n1.getName.toLowerCase();

            if (n2 instanceof Node) label2 = n2.currentView?.preview?.label.toLowerCase();
            else if (n2 instanceof NodeGroup) label2 = n2.getName.toLowerCase();

            if ( label1 > label2 ) {
                return 1;
            }

            if ( label1 < label2 ) {
                return -1;
            }

            return 0;
        });

        let filteredNodes = nodes;
        if (this.searchValue != "" && this.searchValue) {
            filteredNodes = nodes.filter(node => { 
                if (node instanceof Node) return node.currentView?.preview?.label.toLowerCase().includes(this.searchValue.toLowerCase());
                // else if (node instanceof NodeGroup) return node.mostFrequentType?.label.toLowerCase().includes(this.searchValue.toLowerCase());
                else if (node instanceof NodeGroup) return node.getName.toLowerCase().includes(this.searchValue.toLowerCase());
            })
        }

        return filteredNodes;
    }
    
    private isNode(node: NodeCommon) {
        return (node instanceof Node)
    }

    private getLabel(node: NodeCommon) {
        if (node instanceof Node) return node.currentView?.preview ? node.currentView.preview.label : "-";
        if (node instanceof NodeGroup) return node.getName;
    }

    public get isGroupCompactModeActive() {
        return this.areaManipulator.graphArea.modeGroupCompact;
    }

    public get isCompactModeActive() {
        return this.areaManipulator.graphArea.modeCompact;
    }

    visibilityChanged() {
        this.node.visible = !this.node.visible;
        if ((this.areaManipulator.visualGroups.length > 0) && this.node.parent?.identifier.startsWith("pseudo_parent")) {
            if (this.node.parent?.children?.every(childNode => childNode.visible === false)) this.node.parent.visible = false;
            else this.node.parent.visible = true;
        }
    }

    removeNode() {
        this.node.remove();

        this.$root.$emit('deletion', this.node);
    }

    /**
     * This functionality should remove all fetchable node information and download them again
     */
    nodeRefresh() {
        this.node.viewSets = null;
        this.node.viewSetsConfiguration = null;
        this.node.currentView = null;
        this.nodeChanged();
    }

    @Watch('node')
    async nodeChanged() {
        if (!this.node.viewSets) await this.node.fetchViewSets();
        if (!this.node.currentView?.IRI) await this.node.useDefaultView(); // Current view could have been obtained from expansion (in this case it won't contain IRI) and therefore it also needs to be replaced
        if (!this.node.currentView?.preview) await this.node.currentView?.fetchPreview();
        this.currentViewChanged();
    }

    @Watch('node.currentView')
    async currentViewChanged() {
        this.currentViewIRI = this.node.currentView?.IRI;
        if (this.node.currentView?.IRI) await this.node.currentView?.getDetail();
    }
}
</script>
<style scoped lang="scss">
    .detail ::v-deep td {
        padding-top: 6px;
        padding-bottom: 6px;
    }

    .panel-container {
        display: flex;
        flex-direction: column;
        height: 100%;

        .content-wrapper {
            flex-grow: 1;
            position: relative;

            .content {
                position: absolute;
                height: 100%;
                width: 100%;
                overflow-y: scroll;
            }
        }

        .actions {
            border-top: 1px solid rgba(0, 0, 0, 0.12);

            ::v-deep .v-btn-toggle {
                display: flex;
                flex-wrap: wrap;
            }

            ::v-deep .v-btn {
                width: 20%;
            }
        }
    }

    .table-node-name {
        cursor: pointer;

        /** Working solution from the Internet **/
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 1px;

        width: 100%;
    }
    .image-title {
        text-align: right;
        color: white;
        margin-right: 1em;

        span {
            background: black;
            padding: .2em 1em;
        }
    }
</style>
