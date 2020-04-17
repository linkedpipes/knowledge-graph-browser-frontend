/**
 * This class contains helper methods for manipulating with Graph
 */
import {Graph} from "./Graph";
import {Node} from "./Node";

export default class GraphManipulator {
    private readonly graph: Graph;

    constructor(graph: Graph) {
        this.graph = graph;
    }

    selectOnly(node: Node) {
        Object.values(this.graph.nodes).forEach(node => {node.selected = false});
        node.selected = true;
    }

    /**
     * Based on node IRI it tries to create or find specific node, selects it and focus on it.
     * @param IRI
     */
    async blockAddrFindNode(IRI: string): Promise<boolean> {
        let node = this.graph.getNodeByIRI(IRI);

        if (!node) {
            try {
                node = await this.graph.fetchNode(IRI);
            } catch (error) {
                console.warn("Error occurred while fetching a node. Probably the wrong IRI specified or there is a problem on server side.", error);
                return false;
            }
        }

        if (!node.viewSets) {
            node.useDefaultView().then((view) => view.fetchPreview());
        }

        this.selectOnly(node);

        if (node.shownByFilters) {
            node.visible = true;
            this.graph.manipulator.fit(node);
        }
    }
}