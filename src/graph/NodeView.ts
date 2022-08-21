import { Node } from "./Node";
import { Expansion } from "./Expansion";
import { ResponseConstraints, ResponseElementType } from "../remote-server/ResponseInterfaces";
import { NodeType } from "./Node";
import { NodeViewSet } from "./NodeViewSet";
import ObjectSave from "../file-save/ObjectSave";
import clone from "clone";

/**
 * Information about the type of detail. Same as ResponseElementType
 */
export interface DetailType extends ResponseElementType {}

export interface DetailValue {
    type: DetailType,
    IRI: string,
    value: string,
}

export interface NodePreview {
    type: NodeType;
    iri: string;
    label: string;
    classes: string[];
}

export class NodeView implements ObjectSave {
    /**
     * IRI of the view
     */
    IRI: string;

    /**
     * View label
     */
    label: string;

    /**
     * Each view belongs to one Node
     */
    node: Node;

    /**
     * View is a member of NodeViewSet
     */
    viewSet: NodeViewSet;

    detail: DetailValue[] = null;
    preview: NodePreview = null;
    expansion: Expansion;

    private detailPromise: Promise<DetailValue[]> = null;
    private previewPromise: Promise<NodePreview> = null;
    //private expansionPromise: Promise<Expansion> = null;
    // expansionPromise is not used because the user can remove the nodes
    // and therefore the repeated expansion can actually change something

    // experimental
    expansionInProgress: boolean = false;

    /**
     * Toggle this view as active view
     */
    async use() {
        this.node.setView(this);
        await this.fetchPreview();
    }

    private static ExtractTypes(types: ResponseElementType[]): Map<string, ResponseElementType> {
        let result: Map<string, DetailType> = new Map();
        for (let type of types) {
            // ResponseElementType === DetailType
            result.set(type.iri, type);
        }
        return result;
    }

    /**
     * Fetches and returns Node detail - additional information about the Node
     */
    async getDetail(): Promise<DetailValue[]> {
        if (this.detailPromise) {
            return this.detailPromise;
        }

        if (!this.detail) {
            let result = await this.node.graph.server.getDetail(this.IRI, this.node.IRI);
            if (result) {
                let data = result.nodes.find(node => node.iri == this.node.IRI).data;

                let types = NodeView.ExtractTypes(result.types);

                this.detail = [];
                for (let IRI in data) {
                    this.detail.push({
                        type: types.get(IRI),
                        IRI: IRI,
                        value: data[IRI]
                    });
                }
            }
        }

        return this.detail;
    }

    /**
     * Fetches and returns Nodes preview - data how to visualize the Node
     */
    async fetchPreview(): Promise<NodePreview> {
        if (this.previewPromise) {
            return this.previewPromise;
        }

        if (!this.preview) {
            let result = await this.node.graph.server.getPreview(this.IRI, this.node.IRI);

            if (result) {
                let types = NodeView.ExtractTypes(result.types);

                let preview = result.nodes.find(node => node.iri == this.node.IRI);

                this.preview = {
                    ...preview,
                    type: types.get(preview.type)
                };
            }
        }

        return this.preview;
    }

    /**
     * Fetches expansion of the Node and returns it.
     */
     async expand(constraintRules?: ResponseConstraints | undefined): Promise<Expansion> {
        this.expansionInProgress = true;

        // Get the expansion
        let result = await this.node.graph.server.getExpansion(this.IRI, this.node.IRI);

        if (result) {
            this.expansion = new Expansion(this.node);

            let types = NodeView.ExtractTypes(result.types);

            // Create nodes
            for (let expansionNode of result.nodes) {
                let node = this.node.graph.getNodeByIRI(expansionNode.iri);
                if (!node) {
                    // We have to create a new one
                    node = this.node.graph.createNode(expansionNode.iri);
                    let view = node.createView(null);
                    view.preview = {
                        ...expansionNode,
                        type: types.get(expansionNode.type)
                    };
                    node.currentView = view;
                    node.hierarchyLevel = this.node.hierarchyLevel;
                }

                this.expansion.nodes.push(node);
            }

            let constraints = constraintRules?.constraints?.filter(constraint => constraint.type === "child-parent-relation");

            // Create edges
            for (let expansionEdge of result.edges) {
                let edge = this.node.graph.createEdge(
                    this.node.graph.getNodeByIRI(expansionEdge.source),
                    this.node.graph.getNodeByIRI(expansionEdge.target), types.get(expansionEdge.type));
                    if (constraints) {
                        let found = false;
                        let source = this.node.graph.getNodeByIRI(expansionEdge.source);
                        let target = this.node.graph.getNodeByIRI(expansionEdge.target);
                        for (let constraint of constraints) {
                            let childSelector = Array.isArray(constraint.properties["childSelector"]) ? constraint.properties["childSelector"][0] : constraint.properties["childSelector"];
                            let edgeSelector = Array.isArray(constraint.properties["edgeSelector"]) ? constraint.properties["edgeSelector"][0] : constraint.properties["edgeSelector"];
                            if (source.classes.includes(childSelector.slice(1))) {
                                found = expansionEdge.classes.includes(edgeSelector.slice(1));
                            }
                        }
                        if (found) {
                            let pseudoParent = this.node.graph.getNodeByIRI("pseudo_parent_" + this.node.hierarchyGroup);
                            if (pseudoParent && source.parent === pseudoParent) {
                                pseudoParent.children.splice(
                                    pseudoParent.children.indexOf(source), 1
                                );
                                target.parent = pseudoParent;
                                if (!pseudoParent.children.find(child => child.identifier === this.node.identifier)) {
                                    pseudoParent.children.push(this.node);
                                }
                            }
                            source.parent = target;
                            if (!target.children.find(child => child.identifier === expansionEdge.source)) {
                                target.children.push(source);
                            }
                        }
                    }
                edge.classes = expansionEdge.classes;
            }
        }

        this.expansionInProgress = false;
        return this.expansion;
    }

    saveToObject(): object {
        return {
            IRI: this.IRI,
            label: this.label,
            detail: clone(this.detail),
            preview: clone(this.preview),
            // todo this.expansion
        };
    }

    restoreFromObject(object: any): void {
        this.IRI = object.IRI;
        this.label = object.label;
        this.detail = object.detail;
        this.preview = object.preview;
        // todo expansion
    }
}
