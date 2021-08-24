<template>
    <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
        <v-card tile>
            <v-toolbar dark color="secondary">
                <v-btn icon dark @click="dialog = false">
                    <v-icon>{{ icons.close }}</v-icon>
                </v-btn>
                <v-toolbar-title>{{ $t("settings.title") }}</v-toolbar-title>
            </v-toolbar>

            <v-list three-line subheader>
                <v-list-item>
                    <v-list-item-content>
                        <v-list-item-title>{{ $t("settings.permanent.title") }}</v-list-item-title>
                        <v-list-item-subtitle>{{ $t("settings.permanent.content") }}</v-list-item-subtitle>
                    </v-list-item-content>
                </v-list-item>
            </v-list>
            <v-divider></v-divider>
            <v-list>

                <v-list-item>
                    <v-row>
                        <v-col cols="3">
                            <v-subheader>{{ $t("settings.language") }}</v-subheader>
                        </v-col>
                        <v-col cols="9">
                            <v-select v-model="$root.$i18n.locale" :items="languageList" menu-props="auto" hide-details :prepend-icon="icons.translate" single-line>
                                <template v-slot:item="item">{{item.item.text}} &nbsp; <span class="text--disabled">({{item.item.textEn}})</span></template>
                                <template v-slot:selection="item">{{item.item.text}} &nbsp; <span class="text--disabled">({{item.item.textEn}})</span></template>
                            </v-select>
                        </v-col>
                    </v-row>
                </v-list-item>

                <v-list-item>
                    <v-row>
                        <v-col cols="3">
                            <v-subheader>{{ $t("settings.remote_url") }}</v-subheader>
                        </v-col>
                        <v-col cols="9">
                            <v-text-field hide-details single-line v-model="propRemoteURL"></v-text-field>
                        </v-col>
                    </v-row>
                </v-list-item>

                <v-list-item>
                    <v-row>
                        <v-col cols="3">
                            <v-subheader>{{ $t("settings.metaconfiguration") }}</v-subheader>
                        </v-col>
                        <v-col cols="9">
                            <v-text-field hide-details single-line v-model="propMetaconfiguration"></v-text-field>
                        </v-col>
                    </v-row>
                </v-list-item>

            </v-list>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component, PropSync} from 'vue-property-decorator';
import {mdiClose, mdiTranslate} from "@mdi/js";

@Component export default class SettingsDialog extends Vue {

    @PropSync('remoteUrl', { type: String }) propRemoteURL!: string;
    @PropSync('metaconfiguration', { type: String }) propMetaconfiguration!: string;

    // If the whole window is opened
    dialog: boolean = false;

    icons = {
        translate: mdiTranslate,
        close: mdiClose,
    };

    /**
     * Open the setting window
     */
    public show() {
        this.dialog = true;
    }

    /**
     * Returns list of available languages for select picker
     */
    private get languageList(): {text: string, textEn: string, value: string}[] {
        let result: {text: string, textEn: string, value: string}[] = [];
        for (let code in this.$root.$i18n.messages) {
            result.push({
                text: this.$root.$i18n.messages[code]['_lang_local'] as string,
                textEn: this.$root.$i18n.messages[code]['_lang_english'] as string,
                value: code,
            });
        }
        return result;
    }
}
</script>
