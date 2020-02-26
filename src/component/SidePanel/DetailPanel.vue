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
                    <v-row class="fill-height flex-column pa-3">
                    <v-card-text class="white--text">
                    <div class="text-right">{{detail.type.label}}</div>
                    </v-card-text>
                    </v-row>
                </v-img>
            </v-carousel-item>
        </v-carousel>

        <div>
            <h1 v-if="node.currentView">{{node.currentView.label}}</h1><h1 v-else>{{ $t("side_panel.detail_panel.loading") }}</h1>
            <a :href="node.IRI">{{node.IRI}}</a>
        </div>

        <div v-if="previewClasses" class="class-list mb-5">
                <v-chip v-for="cls in previewClasses" :key="cls.label" :color="cls.color" class="mx-2">{{cls.label}}</v-chip>
        </div>

        <v-card v-if="node.currentView && node.currentView.preview" class="mb-5">
            <v-card-text>
                <div>
                    <b>{{node.currentView.preview.type.label}}</b> <span v-if="node.currentView.preview.type.description">(<i>{{node.currentView.preview.type.description}}</i>)</span>
                </div>
                <a :href="node.currentView.preview.type.iri">{{node.currentView.preview.type.iri}}</a>
            </v-card-text>
        </v-card>

        <v-card :loading="!viewSets" class="mb-5">
            <v-card-title>{{ $t("side_panel.detail_panel.views") }}</v-card-title>
            <template v-if="viewSets">
                <v-simple-table v-if="viewSets.length">
                    <tbody>
                        <template v-for="viewSet in viewSets">
                            <tr :key="viewSet.IRI"><th colspan="2">{{viewSet.label}}</th></tr>
                            <tr v-for="view in viewSet.views" :key="view.IRI">
                                <td>{{view.label}}</td>
                                <td>
                                    <v-btn color="red" @click="view.expand">{{ $t("side_panel.detail_panel.expand") }}</v-btn>
                                    <v-btn @click="view.use">{{ $t("side_panel.detail_panel.use") }}</v-btn>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </v-simple-table>
                <v-alert v-else dense outlined type="error" class="mx-5">
                    {{ $t("side_panel.detail_panel.no_views") }}
                </v-alert>
            </template>
            <v-card-text v-else>
                {{ $t("side_panel.detail_panel.fetching_views") }}
            </v-card-text>
        </v-card>

        <v-card :disabled="!node.currentView" :loading="node.currentView && !node.currentView.detail" class="mb-5">
            <v-card-title>{{ $t("side_panel.detail_panel.detail") }}</v-card-title>
            <v-card-text v-if="!node.currentView">{{ $t("side_panel.detail_panel.please_select_view") }}</v-card-text>
            <v-card-text v-else-if="!node.currentView.detail">{{ $t("side_panel.detail_panel.fetching_detail") }}</v-card-text>
            <template v-else>
                <v-card-text><a :href="actualView.IRI">{{node.currentView.label}}</a></v-card-text>
                <v-simple-table>
                    <thead>
                        <tr>
                            <td>{{ $t("side_panel.detail_panel.key") }}</td>
                            <td>{{ $t("side_panel.detail_panel.value") }}</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="detail in node.currentView.detail" :key="detail.IRI">
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
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node } from '../../graph/Node';
import { NodeViewSet } from '../../graph/NodeViewSet';
import { DetailValue } from '../../graph/NodeView';

@Component
export default class DetailPanel extends Vue {
    @Prop(Object) node: Node;

    /**
     * Returns classes list with deterministic color based on name
     * @todo take out the color logic somewhere else
     */
    get previewClasses(): {label: string; color: string}[] {
        if (!this.node.currentView?.preview) {
            return null;
        }

        let colors = ['red', 'pink', 'purple', 'deep-purple', 'indigo', 'blue', 'light-blue', 'cyan', 'teal', 'green', 'light-green', 'lime', 'yellow', 'amber', 'orange', 'deep-orange', 'brown', 'blueGrey'];

        return this.node.currentView.preview.classes.map(cls => {
            return {
                label: cls,
                color: colors[cls.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) % colors.length]
            }
        });
    }

    /**
     * Converts viewSets to array
     */
    get viewSets(): NodeViewSet[] {
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
}
</script>
