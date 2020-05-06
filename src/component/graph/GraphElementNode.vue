<template>
    <div class="lock" ref="lockIconWrapper">
        <v-icon ref="lockIcon" color="secondary" small>{{lockIconIcon}}</v-icon>
    </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import {Prop, Ref, Watch} from 'vue-property-decorator';
import { Node } from '../../graph/Node';
import Cytoscape, {CollectionAnimation} from "cytoscape";
import Vue from 'vue';
import {NodePreview, NodeView} from '../../graph/NodeView';
import clone from "clone";
import { mdiPinOutline } from '@mdi/js';
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import {VIcon} from "vuetify/lib";

/**
 * This is Vue component representing single node in graph. When a new node is loaded,
 * the Vuex automatically creates a new instance of this class which registers node
 * in the Cytoscape instance. Also any changes of the Node's data are automatically
 * updated in the Cytoscape instance.
 *
 * This component, except the node registration, also renders some HTML. For now, it
 * renders lock icon used for marking node as locked.
 */
@Component
export default class GraphElementNode extends Vue {
    /**
     * Node's data passed by parent
     */
    @Prop({type: Object as () => Node}) node: Node;

    @Prop() areaManipulator !: GraphAreaManipulator;

    @Prop(Boolean) private nodeLockingSupported !: boolean;

    /**
     * Cytoscape instance passed by parent where the node should be rendered
     */
    cy !: Cytoscape.Core;

    /**
     * Reference to this node in the Cytoscape container
     */
    element: Cytoscape.NodeSingular;

    /**
     * Vue method called after the creation of the object.
     * Registers node in the Cytoscape instance
     * @vue
     */
    mounted() {
        // @ts-ignore
        this.cy = this.$parent.cy;
        let position = this.node.onMountPosition ? {x: this.node.onMountPosition[0], y: this.node.onMountPosition[1]} : {x: 0, y: 0};

        // @ts-ignore
        let id = this.cy.data("id_counter");
        // @ts-ignore
        this.cy.data("id_counter", id + 1);

        // All parameters here must correspond to functions trigger by watchers
        // The objects are considered owned by Cytoscape therefore are copied to remove Vue observers
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            // label: Fixes Cytoscape bug when there is no clickable bounding box when node has [width: label] and previous label was empty
            data: { label: "-", ...clone(this.node.currentView?.preview), id: this.node.IRI },
            // @ts-ignore bad types
            classes: clone(this.node.currentView?.preview?.classes),
            position,
        });

        this.element.scratch("_component", this);

        this.element.on("select", () => this.node.selected = true);
        this.element.on("unselect", () => this.node.selected = false);

        this.nodeLockingSupportedChanged();

        this.node.element = this;

        // For hidden nodes, disable animations
        this.visibilityChanged(this.node.isVisible, undefined);
        this.selectedChanged();
        this.lockedForLayoutsChanged();
    };

    //#region Methods for Popper manipulation and lock icon

    @Ref() private readonly lockIconWrapper !: HTMLDivElement;
    @Ref() private readonly lockIcon !: Vue;

    private lockIconIcon = mdiPinOutline;

    private lockIconPopper: any = null;
    private readonly minZoomToShowLockIcon = 0.35;

    private changeLocked = () => this.areaManipulator.setLockedForLayouts([this.node], !this.node.lockedForLayouts); // Trigger layout
    private lock = () =>  this.node.lockedForLayouts = true; // Do not trigger layout

    @Watch('nodeLockingSupported')
    private nodeLockingSupportedChanged() {
        if (this.nodeLockingSupported) {
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

    private lockIconUpdatePopper() {
        if (!this.lockIcon) return;
        (<HTMLDivElement>this.lockIcon.$el).style.zoom = String(this.element.cy().zoom() * 100) + '%';
    }
    private lockIconPositionUpdater() {
        if (!this.lockIconPopper) return;
        this.lockIconUpdatePopper();
        this.lockIconPopper.scheduleUpdate();
    };
    private lockIconCreatePopper() {
        if (!this.element || !this.lockIconWrapper) return;

        // @ts-ignore no types
        this.lockIconPopper = this.element.popper({
            content: () => this.$refs.lockIconWrapper,
            popper: {
                placement: 'right-end',
                modifiers: {
                    preventOverflow: { enabled: false },
                    hide: { enabled: false },
                    flip: { enabled: false },
                }
            }
        });
        this.lockIconUpdatePopper();
        this.lockIconWrapper.style.display = "block";

        this.element.on('position', this.lockIconPositionUpdater);
        this.element.cy().on('pan zoom resize', this.lockIconPositionUpdater);
    }

    private lockIconDestroyPopper() {
        if (!this.element || !this.lockIconWrapper) return;

        this.lockIconWrapper.style.display = "none";
        if (this.lockIconPopper) {
            // @ts-ignore bad types
            this.element.off('position', this.lockIconPositionUpdater);
            // @ts-ignore bad types
            this.element.cy().off('pan zoom resize', this.lockIconPositionUpdater);
        }
        this.lockIconPopper?.destroy();
        this.lockIconPopper = null;
    }

    private lockIconZoomChanged() {
        let expected = this.element.cy().zoom() > this.minZoomToShowLockIcon;
        let actual = this.lockIconPopper !== null;

        if (expected !== actual) {
            if (expected) {
                this.lockIconCreatePopper();
            } else {
                this.lockIconDestroyPopper();
            }
        }
    }

    @Watch('lockedForLayoutsActive')
    private lockedForLayoutsChanged() {
        if (!this.element) return;

        if (this.lockedForLayoutsActive) {
            this.element.cy().on('zoom', this.lockIconZoomChanged);
            this.lockIconZoomChanged();
        } else {
            // @ts-ignore bad types
            this.element.cy().off('zoom', this.lockIconZoomChanged);
            this.lockIconDestroyPopper();
        }
    }

    /**
     * Whether the pin icon should be 'active' or hidden
     * */
    private get lockedForLayoutsActive(): boolean {
        return this.node.lockedForLayouts && this.nodeLockingSupported && this.node.isVisible;
    }

    //#endregion Methods for Popper manipulation and lock icon

    /**
     * Method called by ancestor component GraphArea when doubleclick is registered
     */
    async onDoubleClicked() {
        let view: NodeView;

        if (!this.node?.currentView.IRI) {
            // Currently nodes obtained by expansion have view, but it does not contain IRI
            view = await this.node.getDefaultView();
        } else {
            view = this.node.currentView;
        }

        await this.areaManipulator.expandNode(view);
    }

    @Watch('node.selected')
    private selectedChanged() {
        if (this.node.selected) {
            this.element.select();
        } else {
            this.element.unselect();
        }
    }

    visibilityAnimation: CollectionAnimation;

    @Watch('node.isVisible')
    private visibilityChanged(visible: boolean, old: boolean | undefined) {
        if (this.visibilityAnimation) this.visibilityAnimation.stop(true, false);

        if (visible) {
            if (old === undefined) {
                this.element.style({
                    opacity: 1,
                    display: "element",
                });
            } else {
                this.visibilityAnimation = this.element.style("display", "element").animate({
                    style: {opacity: 1}
                }, {
                    duration: 300
                });
            }
        } else {
            if (old === undefined) {
                this.element.style({
                    opacity: 0,
                    display: "none",
                });
            } else {
                this.visibilityAnimation = this.element.animate({
                    style: { opacity: 0 }
                }, {
                    duration: 300
                }).animate({style: {display: "none"}});
            }
        }
    }

    get previewData(): NodePreview {
        return this.node.currentView?.preview;
    }

    /**
     * When node changes the current view and preview is not fetched yet,
     * this function is called with empty preview and therefore the old
     * values saved in Cy instance are not overwritten.
     */
    @Watch('previewData', { deep: true })
    private updatePreview() {
        // By doing this we achieve that the current preview remains if there is no other
        if (this.previewData !== null) {
            // Reset all data

            // The reason why this.element.removeData() is not used is because of a bug in Cytoscape library.
            // The data field label must not be empty otherwise the node become un clickable when [width: label] style
            // is used
            let emptyData: any = {};
            if (this.element) {
                for (let id in this.element.data()) {
                    emptyData[id] = undefined;
                }
            }
            this.element?.data({
                ...emptyData,
                label: "-",
                ...clone(this.previewData),
                id: this.node.IRI
            });

            // Function .classes() sets whole new class list (removes the previous one)
            // @ts-ignore bad types
            this.element?.classes(clone(this.previewData?.classes));
        }
        this.element?.toggleClass("_preview_loading", this.previewData === null);
    }

    beforeDestroy() {
        this.cy.remove(this.element);
    };
}
</script>
<style scoped lang="scss">
    .lock {
        display: none;
        pointer-events: none;
        width: 0;
        height: 0;

        ::v-deep .v-icon {
            position: absolute !important;
            left: 2px;
            top: -8px;
        }
    }
</style>