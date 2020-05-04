/**
 * Layout handles node positioning in the graph.
 */
import ObjectSave from "../file-save/ObjectSave";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";

export default abstract class Layout implements ObjectSave {
    /**
     * @internal
     * @non-reactive Must not be set until Vue inits its reactivity (even null is forbidden)
     */
    public areaManipulator: GraphAreaManipulator;

    /**
     * When layout became active, that means it starts receiving events.
     */
    abstract activate(): void;

    /**
     * Some other layout became active and therefore this must turn off all animations and disable additional event
     * handlers to not interact with anything.
     *
     * Functions like onDrag or onExpansion won't be called anymore (no need to handle this)
     */
    abstract deactivate(): void;

    onAddedNodes(): void {};

    onExpansion(): void {};

    onDrag(isStartNotEnd: boolean) {};

    /**
     * When some node changed its lockedForLayout property
     */
    onLockedChanged(): void {};

    abstract restoreFromObject(object: any): void;

    abstract saveToObject(): object;
}