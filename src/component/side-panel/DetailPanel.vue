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
                    </div>
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

                <!-- DETAIL -->
                <v-card outlined :disabled="!node.isDetailActual" :loading="!node.isDetailActual" class="mb-5 detail">
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
                <v-card outlined :loading="viewSets === null" class="mb-5">
                    <v-card-title>{{ $t("side_panel.detail_panel.views") }}</v-card-title>
                    <template v-if="viewSets !== null">
                        <v-list v-if="viewSets.length">
                            <v-list-item-group v-model="currentViewIRI" mandatory color="secondary">
                                <template v-for="viewSet in viewSets">
                                    <v-list-item :key="viewSet.IRI" disabled>{{viewSet.label}}</v-list-item>
                                    <v-list-item v-for="view in viewSet.views" :key="view.IRI" :value="view.IRI" @click="view.use()">
                                        <v-list-item-content>
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

                <!-- TYPE OF THE NODE -->
                <v-card outlined class="mb-5">
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

        <template v-slot:actions>
            <panel-action-button
                    @click="node.remove()"
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
                    @click="node.visible = !node.visible"
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
                    :width="1"
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
    mdiApplicationExport
} from '@mdi/js';
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import LinkComponent from "../helper/LinkComponent.vue";
import NodeCommonPanelMixin from "./NodeCommonPanelMixin";
import PanelTemplate from "./components/PanelTemplate.vue";
import PanelActionButton from "./components/PanelActionButton.vue";
import GraphManipulator from "../../graph/GraphManipulator";
import AnyDataValue from "@/component/helper/AnyDataValue.vue";
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
    }

    currentViewIRI: string = null;

    async expand(view) {
      let expansion = await this.areaManipulator.expandNode(view);

      FacetedFiltering.findOrUpdateAllFacetsAfterExpansion(expansion.getNodes());
    }

    /**
     * Returns classes list with deterministic color based on name.
     *
     * Uses lastFullPreview to prevent unnecessary blinking when switching the views
     */
    get previewClasses(): {label: string; color: string}[] {
        return this.getClassesColors(this.node.lastPreview?.classes);
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

        let result = this.node.lastDetail.filter(detail => ['.jpg', '.png', '.bmp'].includes(detail.value.substr(detail.value.length - 4)));

        return result.length ? result : null;
    }

    mounted() {
        this.nodeChanged();
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
        if (!this.node.currentView?.preview) await this.node.currentView.fetchPreview();
        this.currentViewChanged();
    }

    @Watch('node.currentView')
    async currentViewChanged() {
        this.currentViewIRI = this.node.currentView?.IRI;
        if (this.node.currentView?.IRI) await this.node.currentView.getDetail();
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
