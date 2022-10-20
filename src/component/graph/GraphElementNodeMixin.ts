import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import Cytoscape, {Position} from "cytoscape";
import clone from "clone";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeCommon from "../../graph/NodeCommon";
import {mdiPinOutline} from "@mdi/js";

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
            // make parent node selectable
            if (this.areaManipulator.childParentLayoutConstraints.length > 0) {
                let node = this.node;
                while (node.parent) {
                    node = node.parent;
                    node.element.element.selectify();
                }
            }
        } else {
            this.element.unselect();
        }
    }

    /** Set up parent for all children in case expanded node is a parent node */ 
    private setParent(): void {
        let cy = this.areaManipulator.cy;
        if (this.node.children?.length > 0) {
            for (let child of this.node.children) {
                if (child.mounted) {
                    let parent = cy.getElementById(this.node.identifier).id();
                    cy.getElementById(child.identifier).move({
                        parent: parent
                    });
                    child.element.element.data().parent = this.node.identifier;
                }
            }
        }
        this.areaManipulator.cy = cy;
    }

    /**
     * Method for registering cytoscape element
     * @abstract method which should be implemented in children
     */
    protected registerElement(): void {};

    /** Set up hierarchical data for a node */
    protected setHierarchicalInfo(): void {};

    /**
     * Function used for saving to file purposes. It generates the nodes position where it should be mounted.
     */
    public getSavePosition(): [number, number] | null {
        if (this.compactModeUnlocked) {
            return [this.originalPositionBeforeCompact.x, this.originalPositionBeforeCompact.y];
        } else if (this.element) {
            return [this.element.position().x, this.element.position().y];
        } else {
            return null;
        }
    }

    mounted() {
        // This can't be passed as property because Vuex would set watchers onto it
        // @ts-ignore
        this.cy = this.$parent.cy;

        this.registerElement();

        if (this.areaManipulator.childParentLayoutConstraints.length > 0) this.setParent();

        this.element.scratch("_component", this);

        this.element.on("select", () => {
            if (this.areaManipulator.childParentLayoutConstraints.length > 0) {
                if (this.node.element.element.selectable()) this.node.selected = true;
                // set parent node unselectable when selecting only a child, because when selecting a child node, parent node is selected as well
                let node = this.node;
                while (node.parent) {
                    node = node.parent;
                    node.element.element.unselectify();
                }
            } else {
                this.node.selected = true;
            }
        });
        
        this.element.on("unselect", () => this.node.selected = false);

        this.showPopperChanged();
        this.nodeLockingSupportedChanged();

        // @ts-ignore
        this.node.element = this;

        this.visibilityChanged(this.node.isVisible);

        this.selectedChanged();

        this.lockedForLayoutsChanged();
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

    //#region Popper
    protected popperIsActive: boolean = false;

    private iconsPopper: any = null;
    private readonly minZoomToShowIcons = 0.35;
    protected readonly icons !: HTMLDivElement;
    protected readonly iconsWrapper !: HTMLDivElement;

    /**
     * Decides if the popper should be shown
     */
    private get showPopper() {
        return this.elementExistsWithRespectToAnimation && this.popperIsActive;
    }

    @Watch('showPopper')
    showPopperChanged() {
        if (!this.element) return;

        if (this.showPopper) {
            this.element.cy().on('zoom', this.iconsZoomChanged);
            this.iconsZoomChanged();
        } else {
            // @ts-ignore bad types
            this.element.cy().off('zoom', this.iconsZoomChanged);
            this.iconsDestroyPopper();
        }
    }

    /**
     * Set classes for Popper icons
     */
    protected get iconsClasses(): string[] {
        let classes = this._getClassList();
        let result: string[] = [];
        if (classes.includes("__active")) result.push("__active");
        if (classes.includes("__compact_inactive")) result.push("__compact_inactive");
        if (classes.includes("__hidden_opacity")) result.push("__hidden_opacity");
        return result;
    }

    private updateIconsZoom() {
        if (!this.icons) return;
        this.icons.style.transform = "scale(" + String(this.element.cy().zoom()) + ')';
    }
    private updateIconsPosition() {
        if (!this.iconsPopper) return;
        this.updateIconsZoom();
        this.iconsPopper.scheduleUpdate();
    };
    private iconsCreatePopper() {
        if (!this.element || !this.iconsWrapper) return;

        // @ts-ignore no types
        this.iconsPopper = this.element.popper({
            content: () => this.iconsWrapper,
            popper: {
                placement: 'right-end',
                modifiers: {
                    preventOverflow: { enabled: false },
                    hide: { enabled: false },
                    flip: { enabled: false },
                }
            }
        });
        this.updateIconsZoom();
        this.iconsWrapper.style.display = "block";

        this.element.on('position', this.updateIconsPosition);
        this.element.cy().on('pan zoom resize', this.updateIconsPosition);
    }

    private iconsDestroyPopper() {
        if (!this.element || !this.iconsWrapper) return;

        this.iconsWrapper.style.display = "none";
        if (this.iconsPopper) {
            // @ts-ignore bad types
            this.element.off('position', this.updateIconsPosition);
            // @ts-ignore bad types
            this.element.cy().off('pan zoom resize', this.updateIconsPosition);
        }
        this.iconsPopper?.destroy();
        this.iconsPopper = null;
    }

    private iconsZoomChanged() {
        let expected = this.element.cy().zoom() > this.minZoomToShowIcons;
        let actual = this.iconsPopper !== null;

        if (expected !== actual) {
            if (expected) {
                this.iconsCreatePopper();
            } else {
                this.iconsDestroyPopper();
            }
        }
    }
    //#endregion Popper

    //#region Locked for layouts manipulation
    protected lockIconIcon = mdiPinOutline;
    protected readonly lockIcon !: Vue;

    private changeLocked = () => this.areaManipulator.setLockedForLayouts([this.node], !this.node.lockedForLayouts); // Trigger layout
    private lock = () =>  this.node.lockedForLayouts = true; // Do not trigger layout

    @Watch('nodeLockingSupported')
    @Watch('modeCompact')
    private nodeLockingSupportedChanged() {
        if (this.nodeLockingSupported && !this.modeCompact) {
            // Right-click
            this.element?.on("cxttap", this.changeLocked);
            // On moving end, lock the node
            this.element?.on("drag", this.lock);
        } else {
            // @ts-ignore
            this.element?.off("cxttap", this.changeLocked);
            // @ts-ignore
            this.element?.off("drag", this.lock);
        }

    }

    /**
     * Whether the pin icon should be 'active' or hidden
     * */
    protected get lockedForLayoutsActive(): boolean {
        return this.node.lockedForLayouts && this.nodeLockingSupported;
    }

    @Watch('lockedForLayoutsActive')
    private lockedForLayoutsChanged() {
        // @ts-ignore bad types
        this.lockIcon.$el.style.display = this.lockedForLayoutsActive ? null : "none";
    }
    //#endregion Locked for layouts manipulation

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

    /**
     * Because the element visibility is animated, element exists even after tis visibility was turned off.
     */
    get elementExistsWithRespectToAnimation(): boolean {
        return this.node.isVisible || !!this.hiddenDisplayAnimation;
    }

    //#endregion Class list manipulation
}
