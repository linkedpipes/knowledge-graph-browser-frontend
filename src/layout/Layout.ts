/**
 * Layout handles node positioning in the graph.
 */
import ObjectSave from "../file-save/ObjectSave";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import {Expansion} from "../graph/Expansion";
import {Node} from "../graph/Node";
import {Edge} from "../graph/Edge";

export default abstract class Layout implements ObjectSave {
    /**
     * @internal
     * @non-reactive Must not be set until Vue inits its reactivity (even null is forbidden)
     */
    public areaManipulator: GraphAreaManipulator;

    /**
     * This is a way how layout can tell that it supports or don't node locking. Node locking means, that if user moves
     * node, it's position became locked, small icon is shown next to it and layout should not move with it. If is
     * switched to layout which does not support locking, all icons and buttons will be hidden.
     */
    public readonly supportsNodeLocking: boolean = false;

    /**
     * When layout became active, that means it starts receiving events.
     */
    activate(): void {};

    /**
     * Some other layout became active and therefore this must turn off all animations and disable additional event
     * handlers to not interact with anything.
     *
     * Functions like onDrag or onExpansion won't be called anymore (no need to handle this)
     */
    deactivate(): void {};

    onAddedNodes(): void {};

    /**
     * This method is called when expansion succeeds.
     * Newly created nodes are not mounted yet, therefore this function can treat them differently.
     * To mount the nodes, set node.mount to true and wait until next animation frame.
     * @param expansion
     */
    onExpansion(expansion: Expansion): void {};

    onDrag(isStartNotEnd: boolean) {};

    /**
     * When user turns on a compact mode this function is called with nodes and edges which figures in the mode. Turning
     * the mode off is represented by null arrays.
     * Layout should terminate all animations started before the mode has changed.
     * Layout should not manipulate with viewport, because is is not its job.
     * @param nodes List of nodes presented in the compact mode
     * @param edges List of edges presented in the compact mode
     */
    onCompactMode(nodes: Node[] | null, edges: Edge[] | null) {}

    /**
     * When some node changed its lockedForLayout property
     */
    onLockedChanged(): void {};

    abstract restoreFromObject(object: any): void;

    abstract saveToObject(): object;
}