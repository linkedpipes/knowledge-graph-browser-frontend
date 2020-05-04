<template>
    <v-dialog v-model="dialog" max-width="700">

        <v-card>
            <v-toolbar flat color="secondary" dark>
                <v-toolbar-title>{{ $t("layout_dialog.title") }}</v-toolbar-title>
            </v-toolbar>

            <v-tabs v-model="tab" vertical>
                <v-tab v-for="layout of layouts.list" :key="layout.name">{{ $t("layouts." + layout.name + ".name") }}</v-tab>

                <v-tab-item v-for="layout of layouts.list" :key="layout.name">
                    <v-card flat>
                        <v-card-text>
                            <component :is="layout.settingsComponent" :layout="layout.layout" />
                        </v-card-text>
                    </v-card>
                </v-tab-item>
            </v-tabs>

            <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn v-if="tab !== startTab" color="primary" text @click="close(false)">{{ $t("layout_dialog.keep_old_layout") }}</v-btn>
                <v-btn color="primary" text @click="close(true)">{{ $t(tab !== startTab ? "layout_dialog.change_layout" : "layout_dialog.close") }}</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    import {Component, Prop} from "vue-property-decorator";
import Vue from "vue";
import ColaLayoutSettingsComponent from "../layouts/cola/ColaLayoutSettingsComponent.vue";
import {ColaLayoutOptions} from "../layouts/cola/ColaLayout";
    import {LayoutManager} from "../layouts/LayoutManager";
@Component({
    components: {ColaLayoutSettingsComponent}
})
export default class LayoutDialog extends Vue {
    @Prop() layouts !: LayoutManager;

    private dialog: boolean = false;

    // Which tab is currently opened
    private tab: number = 0;

    // Which layout is active (as tab number)
    private startTab: number = 0;

    colaTranslate = "dd";

    colaData: ColaLayoutOptions = {
        edgeLength: 100,
        nodeSpacing: 10,
        expansionOnlyThose: false,
        doLayoutAfterReposition: true,
    }

    show() {
        this.tab = Math.max(0, this.layouts.list.indexOf(this.layouts.currentLayoutData));
        this.startTab = this.tab;
        this.dialog = true;
    }

    close(confirmed: boolean) {
        if (confirmed) {
            this.layouts.switchToLayout(this.layouts.list[this.tab].name);
        }
        this.dialog = false;
    }
}
</script>

<style scoped>

</style>