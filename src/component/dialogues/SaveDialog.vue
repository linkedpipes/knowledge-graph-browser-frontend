<template>
    <v-dialog v-model="dialog" max-width="290">
        <v-card>
            <v-card-title class="headline">{{ $t('save_dialog.title') }}</v-card-title>
            <v-card-text>{{ $t('save_dialog.text') }}</v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="action('yes')">{{ $t('save_dialog.yes') }}</v-btn>
                <v-btn color="secondary" v-if="modal" text @click="action('no')">{{ $t('save_dialog.no') }}</v-btn>
                <v-btn color="secondary" text @click="action('back')">{{ $t('save_dialog.back') }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script lang="ts">
import Vue from 'vue';
import {Component, Prop, Watch} from 'vue-property-decorator';

@Component
export default class SaveDialog extends Vue {
    private dialog: boolean = false;
    private modal: boolean = false;
    private resolver: (value: 'yes'|'no'|'back') => void = () => null;

    private action(value: 'yes'|'no'|'back') {
        this.resolver(value);
        this.dialog = false;
    }

    @Watch('dialog')
    private onDialogChanged(value: boolean) {
        if (!value) {
            this.action("back");
        }
    }

    show(modal: boolean): Promise<'yes'|'no'|'back'> {
        this.dialog = true;
        this.modal = modal;

        return new Promise((resolve) => {
            this.resolver = resolve;
        });
    }
}
</script>
