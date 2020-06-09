import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import Cytoscape, {Position} from "cytoscape";
import clone from "clone";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeCommon from "../../graph/NodeCommon";

@Component
export default class GraphElementNodeMixin extends Vue {
    /**
     * Common ancestor for Node and NodeGroup
     */
    @Prop({type: Object as () => NodeCommon}) node: NodeCommon;

    @Prop() areaManipulator !: GraphAreaManipulator;

    @Prop(Boolean) protected nodeLockingSupported !: boolean;

    /**
     * .__active cy class makes element to be in full color. This happens when the element is selected or its
     * neighbour is selected or no node is selected.
     * */
    @Prop(Boolean) private explicitlyActive !: boolean;

    /**
     * Reference to this node in the Cytoscape container
     */
    element: Cytoscape.NodeSingular;

    /**
     * Cytoscape instance passed by parent where the node should be rendered
     */
    cy !: Cytoscape.Core;

    @Watch('node.selected')
    protected selectedChanged() {
        if (this.node.selected) {
            this.element.select();
        } else {
            this.element.unselect();
        }
    }

    /**
     * Method for registering cytoscape element
     * @abstract method which should be implemented in children
     */
    protected registerElement(): void {};

    mounted() {
        // This can't be passed as property because Vuex would set watchers onto it
        // @ts-ignore
        this.cy = this.$parent.cy;

        this.registerElement();

        this.element.scratch("_component", this);

        this.element.on("select", () => this.node.selected = true);
        this.element.on("unselect", () => this.node.selected = false);

        //this.nodeLockingSupportedChanged();

        // @ts-ignore
        this.node.element = this;

        this.visibilityChanged(this.node.isVisible);

        this.selectedChanged();
        //this.lockedForLayoutsChanged();
    }

    //#region Compact mode

    /**
     * Compact mode is a mode where selected nodes with all its neighbours are layouted independently of others
     * */
    @Prop(Boolean) protected modeCompact !: boolean;

    private originalPositionBeforeCompact: Position = null;

    private get compactModeLocked(): boolean {
        return this.modeCompact && (!this.node.selected && !this.node.neighbourSelected);
    }

    private get compactModeUnlocked(): boolean {
        return this.modeCompact && (this.node.selected || this.node.neighbourSelected);
    }

    @Watch('compactModeLocked')
    private compactModeLockedChanged() {
        this.element.toggleClass("__compact_inactive", this.compactModeLocked);
    }

    @Watch('compactModeUnlocked')
    private compactModeUnlockedChanged() {
        if (this.compactModeUnlocked) {
            // Mode compact started
            this.originalPositionBeforeCompact = clone(this.element.position());
        } else {
            this.element.position(this.originalPositionBeforeCompact);
        }
    }

    //#endregion Compact mode

    // noinspection JSUnusedGlobalSymbols Vue method
    beforeDestroy() {
        this.cy.remove(this.element);
        this.node.element = null;
    };

    //#region Class list manipulation

    hiddenDisplayAnimation: number | null = null;

    @Watch('node.isVisible')
    protected visibilityChanged(visible: boolean) {
        if (this.hiddenDisplayAnimation !== null) {
            clearTimeout(this.hiddenDisplayAnimation);
            this.hiddenDisplayAnimation = null;
        }

        if (visible) {
            this.element?.removeClass("__hidden_display")
        }
        this.element?.toggleClass("__hidden_opacity", !visible);
        if (!visible) {
            this.hiddenDisplayAnimation = window.setTimeout(() => {
                this.element?.addClass("__hidden_display");
                this.hiddenDisplayAnimation = null;
            }, 250);
        }
    }

    @Watch('node.neighbourSelected')
    @Watch('node.selected')
    @Watch('explicitlyActive')
    private neighbourSelectedChanged() {
        this.element?.toggleClass("__active", this.node.neighbourSelected || this.explicitlyActive || this.node.selected);
    }

    /**
     * Functions return ready class list which can be used to pass to cytoscape
     */
    protected _getClassList(): string[] {
        let cls = [];

        if (this.node.neighbourSelected || this.explicitlyActive || this.node.selected) {
            cls.push("__active");
        }

        if (!this.node.isVisible) {
            cls.push("__hidden_opacity");
            if (this.hiddenDisplayAnimation === null) cls.push("__hidden_display");
        }

        if (this.compactModeLocked) {
            cls.push("__compact_inactive");
        }

        return cls;
    }

    //#endregion Class list manipulation
}
