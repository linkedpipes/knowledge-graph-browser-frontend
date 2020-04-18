<template>
    <v-card flat>
        <v-card-text>
            <v-card outlined class="mb-3">
                <v-card-text>
                    <v-switch v-model="value.active" color="red" class="title">
                        <template v-slot:label>
                            <v-card-title :class="{'text--primary': value.active}"><slot name="title"></slot></v-card-title>
                        </template>
                    </v-switch>

                    <slot></slot>
                    <v-checkbox :disabled="!value.active" v-model="value.modeListed" color="red" class="black--label" :label="$t('filter_dialog.only_selected')" :messages="$t('filter_dialog.only_selected_description')"></v-checkbox>
                    <v-list max-height="400" style="overflow-y: scroll;">
                        <v-list-item-group v-model="selectedItems" multiple>
                            <v-list-item :disabled="!value.active" v-for="(item, i) in availableItems" :key="`item-${i}`" :value="i" class="item-invert" active-class="item-invert-selected">
                                <template v-slot:default="{ active, toggle }">
                                    <v-list-item-content>
                                        <v-list-item-title>
                                            <slot name="item" v-bind:item="item"></slot>
                                        </v-list-item-title>
                                    </v-list-item-content>

                                    <v-list-item-action>
                                        <v-checkbox
                                        :input-value="active"
                                        :true-value="item"
                                        @click="toggle"
                                        :disabled="!value.active"
                                        ></v-checkbox>
                                    </v-list-item-action>
                                </template>
                            </v-list-item>
                        </v-list-item-group>
                    </v-list>
                </v-card-text>
            </v-card>
        </v-card-text>
    </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component, Prop, Watch} from 'vue-property-decorator';
import FilterDataEnum from "../../filter/FilterDataEnum";

@Component
export default class PropertyEnumTab<T> extends Vue {
    @Prop() availableItems: T[];
    @Prop() equalityComparator: (a: T, b: T) => boolean;

    /**
     * Current filter
     */
    @Prop() value: FilterDataEnum<T>;

    @Watch('value.modeListed') modeListedChanged(val: boolean, oldVal: boolean) {
        if (val == oldVal) return;

        // We need to negate the array
        let newArray: number[] = [];
        for (let itemId in this.availableItems) {
            if (!this.selectedItems.includes(Number(itemId))) {
                newArray.push(Number(itemId));
            }
        }
        this.selectedItems = newArray;
    }

    /**
     * Returns list of items that should be selected. It depends on modeListed.
     */
    get selectedItems(): number[] {
        let items: number[] = [];
        for (let itemId in this.availableItems) {
            let found = false;
            for (let selectedItem of this.value.items) {
                if (this.equalityComparator(this.availableItems[itemId], selectedItem)) {
                    found = true;
                    if (this.value.modeListed) {
                        items.push(Number(itemId));
                        break;
                    }
                }
            }
            if (!found && !this.value.modeListed) {
                items.push(Number(itemId));
            }
        }

        return items;
    }

    /**
     * Properly sets the data structure
     * @param itemsIds
     */
    set selectedItems(itemsIds: number[]) {
        console.log("set selectedItems()", itemsIds);

        let items = [];
        for (let itemId in this.availableItems) {
            if (itemsIds.includes(Number(itemId)) ? this.value.modeListed : !this.value.modeListed) {
                items.push(this.availableItems[itemId]);
            }
        }

        // Prevent Vuex going into a loop
        if (!this.checkEqualArrays(this.value.items, items)) {
            this.value.items = items;
        }
    }

    checkEqualArrays(a: T[], b: T[]): boolean {
        if (a.length != b.length) return false;

        for (let ai of a) {
            let found = false;
            for (let bi of b) {
                if (this.equalityComparator(ai, bi)) {
                    found = true;
                    break;
                }
            }
            if (!found) return false;
        }

        return true;
    }
}
</script>
<style scoped>
.title {
    margin: 0;
    padding: 0;
}

.title >>> .v-messages {
    min-height: 0;
}

.item-invert:before {
    opacity: 0 !important;
}
.item-invert:not(.item-invert-selected) .v-list-item__content {
    text-decoration: line-through;
}
.black--label /deep/ label {
    color: black;
}
</style>