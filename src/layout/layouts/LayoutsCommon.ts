export interface LayoutsCommonGroupSettings {
    /**
     * Whether the expanded nodes should be grouped. Must satisfy expansionGroupLimit
     */
    groupExpansion: boolean;

    /**
     * When there is more than this number of nodes which are not mounted yet, group them. Must also satisfy
     * groupExpansion.
     */
    expansionGroupLimit: number;
}
