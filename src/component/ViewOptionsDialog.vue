<template>
    <v-dialog v-model="dialog" max-width="500">
        <v-card>
            <v-toolbar flat color="secondary" dark>
                <v-toolbar-title>{{ $t("view_options.title") }}</v-toolbar-title>
            </v-toolbar>

            <v-card flat>
                <v-list-item>
                    <v-list-item-content>
                        <v-list-item-title>{{ $t("view_options.nodes.title") }}</v-list-item-title>
                        <v-btn-toggle v-model="options.node" tile group mandatory>
                            <v-btn value="full">{{ $t("view_options.nodes.full") }}</v-btn>
                            <v-btn value="hide">{{ $t("view_options.nodes.hide") }}</v-btn>
                            <v-btn value="dot">{{ $t("view_options.nodes.dot") }}</v-btn>
                        </v-btn-toggle>
                    </v-list-item-content>
                </v-list-item>

                <v-list-item>
                    <v-list-item-content>
                        <v-list-item-title>{{ $t("view_options.edges.title") }}</v-list-item-title>
                        <v-btn-toggle v-model="options.edge" tile group mandatory>
                            <v-btn value="full">{{ $t("view_options.edges.full") }}</v-btn>
                            <v-btn value="hide_text">{{ $t("view_options.edges.hide_text") }}</v-btn>
                            <v-btn value="hide">{{ $t("view_options.edges.hide") }}</v-btn>
                        </v-btn-toggle>
                    </v-list-item-content>
                </v-list-item>
            </v-card>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component, Prop} from 'vue-property-decorator';
import ViewOptions from "../graph/ViewOptions";
@Component export default class ViewOptionsDialog extends Vue {
    @Prop() options !: ViewOptions;

    dialog: boolean = false;
    toggle_one: any = null;

    show() {
        this.dialog = true;
    }

}
</script>