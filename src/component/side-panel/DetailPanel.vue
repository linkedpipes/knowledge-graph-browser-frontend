<template>
    <div>
        <v-carousel hide-delimiters :show-arrows="detailImages.lenght > 1" cycle v-if="detailImages" height="300" class="mb-5">
            <v-carousel-item v-for="detail in detailImages" :key="detail.IRI">
                <v-img
                    :src="detail.value"
                    aspect-ratio="1"
                    class="grey lighten-2"
                    max-height="100%"
                >
                    <v-row v-if="detail.type" class="fill-height flex-column pa-3">
                    <v-card-text class="white--text">
                    <div class="text-right">{{detail.type.label}}</div>
                    </v-card-text>
                    </v-row>
                </v-img>
            </v-carousel-item>
        </v-carousel>

        <div class="v-btn-toggle float-right ml-3 mb-3">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" color="red" @click="node.remove()"><v-icon>{{ trash }}</v-icon></v-btn>
                </template>
                <span>{{ $t("side_panel.detail_panel.remove_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="nodeRefresh()"><v-icon>{{ refresh }}</v-icon></v-btn>
                </template>
                <span>{{ $t("side_panel.detail_panel.refresh_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="areaManipulator.fit(node)" :disabled="!node.isVisible"><v-icon>{{ locate }}</v-icon></v-btn>
                </template>
                <span>{{ $t("side_panel.detail_panel.locate_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="node.visible = !node.visible"><v-icon>{{ visibility[node.visible ? 1 : 0] }}</v-icon></v-btn>
                </template>
                <span>{{ $t("side_panel.detail_panel.visible_desc") }}</span>
            </v-tooltip>
        </div>

        <!-- NODE NAME AND CLASSES -->
        <div class="mb-5">
            <div v-if="lastFullPreview">
                <h1 class="mb-2">{{lastFullPreview.label}}</h1>
                <div><v-chip label v-for="cls in previewClasses" :key="cls.label" :color="cls.color" class="mx-2">{{cls.label}}</v-chip></div>
            </div>
            <h1 v-else>{{ $t("side_panel.detail_panel.loading") }}</h1>
        </div>

        <v-alert v-if="!node.isVisible" type="warning" dense text>{{ $t("side_panel.detail_panel.hidden.f" + (node.shownByFilters ? "t" : "f") + "u" + (node.visible ? "t" : "f")) }}</v-alert>

        <!-- TYPE OF THE NODE -->
        <v-card outlined class="mb-5">
            <v-card-text>
                <a :href="node.IRI" target="_blank" class="text--primary" style="text-decoration: none;">{{node.IRI}}</a>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-text v-if="lastFullPreview && lastFullPreview.type" class="text--primary">
                <link-component :href="lastFullPreview.type.iri" /> &nbsp;
                <b>{{lastFullPreview.type.label}}</b> &nbsp;
                <span v-if="lastFullPreview.type.description">{{lastFullPreview.type.description}}</span>
            </v-card-text>
            <v-card-text v-else class="text--primary">
                {{ $t("side_panel.detail_panel.no_type_info") }}
            </v-card-text>
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
                                    <v-btn style="flex-basis: auto;" class="flex-grow-0" small color="secondary" :loading="view.expansionInProgress" @click.stop="areaManipulator.expandNode(view)">{{ $t("side_panel.detail_panel.expand") }}</v-btn>
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

        <!-- DETAIL -->
        <v-card outlined :disabled="!node.currentView" :loading="node.currentView && !node.currentView.detail" class="mb-5 detail">
            <v-card-title>{{ $t("side_panel.detail_panel.detail") }}</v-card-title>
            <v-card-text v-if="!node.currentView">{{ $t("side_panel.detail_panel.please_select_view") }}</v-card-text>
            <v-card-text v-else-if="!node.currentView.detail">{{ $t("side_panel.detail_panel.fetching_detail") }}</v-card-text>
            <v-simple-table v-else>
                <tbody>
                    <tr v-for="detail in node.currentView.detail" :key="detail.IRI">
                        <td>
                            <link-component :href="detail.IRI" /> &nbsp; <b v-if="detail.type">{{detail.type.label}}</b> &nbsp; {{detail.value}}
                        </td>
                    </tr>
                </tbody>
            </v-simple-table>
        </v-card>
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Node } from '../../graph/Node';
import { NodeViewSet } from '../../graph/NodeViewSet';
import {DetailValue, NodePreview} from '../../graph/NodeView';
// Stylesheet
import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

import {mdiTrashCanOutline, mdiRefresh, mdiCrosshairsGps, mdiEye, mdiEyeOff, mdiWeb} from '@mdi/js';
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import LinkComponent from "../helper/LinkComponent.vue";
@Component({
    components: {LinkComponent}
})
export default class DetailPanel extends Vue {
    @Prop(Object) node: Node;
    @Prop(Object) areaManipulator: GraphAreaManipulator;

    private readonly icons = {
        link: mdiWeb,
    }

    trash = mdiTrashCanOutline;
    refresh = mdiRefresh;
    locate = mdiCrosshairsGps;
    visibility = [mdiEyeOff, mdiEye];

    currentViewIRI: string = null;

    // Contains preview which was used latest
    private _lastFullPreviewData: NodePreview | null = null;

    // Node to which the preview belongs
    private _lastFullPreviewBelongsTo: Node | null = null;

    /**
     * When user changes view, it takes some time to load preview, therefore lastFullPreview contains last preview
     * if actual hasn't been downloaded yet. Prevents unnecessary blinking.
     **/
    private get lastFullPreview(): NodePreview | null {
        if (this.node.currentView?.preview) {
            this._lastFullPreviewData = this.node.currentView.preview;
            this._lastFullPreviewBelongsTo = this.node;
            return this.node.currentView.preview;
        } else if (this._lastFullPreviewBelongsTo === this.node) {
            return this._lastFullPreviewData;
        } else {
            return null;
        }
    }

    /**
     * Returns classes list with deterministic color based on name.
     *
     * Uses lastFullPreview to prevent unnecessary blinking when switching the views
     * @todo take out the color logic somewhere else
     */
    get previewClasses(): {label: string; color: string}[] {
        if (!this.lastFullPreview) {
            return null;
        }

        let colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange'];

        return this.lastFullPreview.classes.map(cls => {
            return {
                label: cls,
                color: colors[Math.abs(cls.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)) % colors.length]
            }
        });
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
        if (!this.node.currentView?.detail) {
            return null;
        }

        let result = this.node.currentView.detail.filter(detail => ['.jpg', '.png', '.bmp'].includes(detail.value.substr(detail.value.length - 4)));

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
<style scoped>
    .detail >>> td {
        padding-top: 6px;
        padding-bottom: 6px;
    }
</style>
