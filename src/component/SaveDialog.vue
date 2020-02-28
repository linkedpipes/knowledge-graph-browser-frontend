<template>
    <v-dialog v-model="dialog" max-width="1000">
      <v-card>
        <v-card-title><span class="headline">{{ $t("save_dialog.title") }}</span></v-card-title>

        <v-card-text>
            <v-radio-group v-model="type">
                <v-radio value="minimal" :label="$t('save_dialog.minimal')" />
                <p>{{ $t("save_dialog.minimal_description") }}</p>
                <v-radio value="complete" :label="$t('save_dialog.complete')" />
                <p>{{ $t("save_dialog.complete_description") }}</p>
            </v-radio-group>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <div class="flex-grow-1"></div>

          <v-btn color="primary" text>{{ $t("save_dialog.cancel") }}</v-btn>
          <v-btn color="primary" text v-if="not_save_option">{{ $t("save_dialog.not_save") }}</v-btn>
          <v-btn color="primary" text :loading="loading">{{ $t("save_dialog.save") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class SaveDialog extends Vue {
    loading: boolean = false;
    dialog: boolean = false;

    /**
     * If is possible to click to not save.
     */
    not_save_option: boolean = true;
    type: string = "minimal";

    show() {
        this.dialog = true;
    }
}
</script>
