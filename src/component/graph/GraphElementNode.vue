<template>
    <div class="lock" :class="lockClasses" ref="lockIconWrapper">
        <v-icon ref="lockIcon" color="secondary" small>{{lockIconIcon}}</v-icon>
    </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import {Mixins, Prop, Ref, Watch} from 'vue-property-decorator';
import { Node } from '../../graph/Node';
import Cytoscape, {ElementDefinition, NodeDataDefinition} from "cytoscape";
import Vue from 'vue';
import {NodePreview, NodeView} from '../../graph/NodeView';
import clone from "clone";
import { mdiPinOutline } from '@mdi/js';
import GraphElementNodeMixin from "./GraphElementNodeMixin";

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
export default class GraphElementNode extends Mixins(GraphElementNodeMixin) {
    /**
     * Node's data passed by parent
     */
    @Prop({type: Object as () => Node}) node: Node;

    /**
     * @inheritDoc
     */
    protected registerElement(): void {
        let position = this.node.onMountPosition ? {x: this.node.onMountPosition[0], y: this.node.onMountPosition[1]} : {x: 0, y: 0};

        // All parameters here must correspond to functions trigger by watchers
        // The objects are considered owned by Cytoscape therefore are copied to remove Vue observers
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            // label: Fixes Cytoscape bug when there is no clickable bounding box when node has [width: label] and previous label was empty
            data: { label: "-", ...clone(this.node.currentView?.preview), id: this.node.IRI } as NodeDataDefinition,
            classes: this.getClassList() as unknown as string,
            position,
        } as ElementDefinition);

        this.nodeLockingSupportedChanged();

        this.lockedForLayoutsChanged();
    }

    //#region Methods for Popper manipulation and lock icon

    @Ref() private readonly lockIconWrapper !: HTMLDivElement;
    @Ref() private readonly lockIcon !: Vue;

    private lockIconIcon = mdiPinOutline;

    private lockIconPopper: any = null;
    private readonly minZoomToShowLockIcon = 0.35;

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

    private get lockClasses(): string[] {
        let classes = this.getClassList();
        let result: string[] = [];
        if (classes.includes("__active")) result.push("__active");
        if (classes.includes("__compact_inactive")) result.push("__compact_inactive");
        return result;
    }

    private lockIconUpdatePopper() {
        if (!this.lockIcon) return;
        (<HTMLDivElement>this.lockIcon.$el).style.transform = "scale(" + String(this.element.cy().zoom()) + ')';
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

        if (!view) return;

        await this.areaManipulator.expandNode(view);
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
        }

        // @ts-ignore bad types
        this.element?.classes(this.getClassList());
    }

    /**
     * Functions return ready class list which can be used to pass to cytoscape
     */
    protected getClassList(): string[] {
        return ["__node", ...this._getClassList(), ...clone(this.previewData?.classes ?? [])];
    }

}
</script>
<style scoped lang="scss">
    .lock {
        display: none;
        pointer-events: none;
        width: 0;
        height: 0;
        opacity: 0.5;

        ::v-deep .v-icon {
            position: absolute !important;
            left: 2px;
            top: -8px;
            transform-origin: left center;
            transition: transfrm 0s ease 0s;
        }
    }

    .__active {opacity: 1;}
    .__compact_inactive {opacity: 0.05;}
</style>