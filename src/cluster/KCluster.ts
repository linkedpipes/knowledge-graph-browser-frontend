import { Graph } from "@/graph/Graph";
import GraphManipulator from "@/graph/GraphManipulator";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import Cytoscape from "cytoscape";
import NodeGroup from "../graph/NodeGroup";
import { Node } from "../graph/Node";
import NodeCommon from "../graph/NodeCommon";


/**
 * Clustering and grouping nodes. Actually supported only KMeans and KMedoids clustering techniques. \
 * wiki: \
 *      - https://en.wikipedia.org/wiki/K-means_clustering \
 *      - https://en.wikipedia.org/wiki/K-medoids \
 * \
 * github documentation: \
 *      - https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#kclusterts
 */
export default class KCluster extends Vue {
        
    @Prop() manipulator: GraphManipulator;

    /** Number of clusters to return in one call */
    private k: number;

    /**
     * Makes clusters of nodes and then groups them into a single node;
     * @param method method used to cluster nodes \
     *              range of "method" argument: {'kmeans', 'kmedoids'};
     * @param nodesToCluster a set of nodes to be clustered
     */
    groupingOfClusters(method: string, nodesToCluster: any[]) {

        /** maximum number of iterations of the clustering algorithm to run */ 
        let numIterations = 10; 
        /** array of clusters to be grouped */
        let clusters = []; 
        /** cost of the configuration */
        let newCost;
        
        this.k = nodesToCluster.length;
        let changedCost = new Array(this.k + 1);

        /** Nodes are clustered based on its positions. \
         * Must be numeric. 
         * @returns x and y coordinates of a node
        */ 
        const attributes = node => {
            return { 0: node.element.element.position()['x'], 1: node.element.element.position()['y'] }
        }

        // Number of cluster to return; might be a constant or some decreasing value
        // (e.g. k can be half the number of input nodes)
        this.k = (Math.floor(this.k / 2) <= 0) ? 1 : Math.floor(this.k / 2);
        
        if (nodesToCluster.length != 0) {

            let nDimensions = attributes.length;
            let assignments = {};
            let centroids;
            let isConverged = false;
            let iterations = 0;
            
            if (method === "kmeans") {
                centroids = this.getRandomCentroids(nodesToCluster, nDimensions); 
            } else if (method === "kmedoids") {
                centroids = this.getMedoids(nodesToCluster);
                centroids.forEach(centroid => {
                    nodesToCluster.splice(
                        nodesToCluster.indexOf(centroid), 1
                      );
                }); 
            }
            
            // make/update clusters while the cost decreases or number of iterations is reached
            while (!isConverged && iterations < numIterations) {
                // Assign nodes to the nearest cluster
                for (let node of nodesToCluster) {
                    let asset_id = (node instanceof NodeGroup) ? node.id : node.IRI;
                    assignments[asset_id] = this.classify(node, centroids, attributes, method);
                }
                
                clusters = new Array(this.k)
                                .fill(false)
                                .map(() => 
                                new Array().fill(false)
                                );
                
                // make clusters
                for (let node of nodesToCluster) {
                    let asset_id = (node instanceof NodeGroup) ? node.id : node.IRI;
                    let clusterID = assignments[asset_id];
                    clusters[clusterID].push(node);
                }
                
                // add medoids to clusters
                for (let i = 0; i < centroids.length; i++) {
                    clusters[i].push(centroids[i]);
                }

                // Update centroids of each cluster if cost decreases
                isConverged = true;
                for (let centroidID = 0; centroidID < this.k; centroidID++) {

                    if (clusters[centroidID] === undefined) { continue; }

                    if (method === "kmedoids") {
                        /* Update centroids, select nodes with the lowest cost as a new centroid (medoid) */

                        // current cost
                        changedCost[centroidID] = this.getCost(centroids[centroidID], clusters[centroidID], attributes);

                        for (let nodeID; nodeID < clusters[centroidID].length; nodeID++) {
                            newCost = this.getCost(clusters[centroidID][nodeID], clusters[centroidID], attributes);

                            if (newCost < changedCost[centroidID]) {
                                changedCost[centroidID] = newCost;
                                centroids[centroidID] = clusters[centroidID][nodeID];
                                isConverged = false;
                            }
                        }

                    } else if (method === "kmeans") {
                        
                        /* Update cluster centroids by calculating average position of all nodes within cluster */

                        let centroid = centroids[centroidID];
                        let newCentroid = new Array(nDimensions);

                        for (let dimension = 0; dimension < nDimensions; dimension++) {
                            let sum = 0.0;
                            for (let node of clusters[centroidID]) {
                                sum += attributes(node)[dimension];
                            }
                            newCentroid[dimension] = sum / clusters[centroidID].length;

                            if (!(this.convergenceFactor(centroid[dimension]) === this.convergenceFactor(newCentroid[dimension]))) {
                                isConverged = false; 
                            }
                        }

                        centroids[centroidID] = newCentroid;
                    }
                    
                }
                iterations++;
            }
        }

        // make a group from each generated cluster
        for (let cluster of clusters) {
            if (cluster.length > 1) {
                this.manipulator.groupExistingNodes(cluster);
            }
        }
    }

    /** 
     * Assigns a node to a nearest cluster (centroid/medoid) 
     * @param node node to be classified
     * @param centroids list of possible centroids to which a node can be assigned
     * @param attributes attributes to use for classifying
     * @param method either "kmeans" or "kmedoids"
    */ 
    private classify(node: NodeCommon, centroids: any[], attributes: any, method: string): number {
        let minimum = Infinity;
        let adjustedCentroidID;

        for (let centroidID = 0; centroidID < centroids.length; centroidID++) {
            let distance = 0.0; 
            for (let dimension = 0; dimension < attributes.length; dimension++) {
                if (method === "kmeans") {
                    distance += Math.pow(attributes(node)[dimension] - centroids[centroidID][dimension], 2);
                } else if (method === "kmedoids") {
                    distance += Math.pow(attributes(node)[dimension] - attributes(centroids[centroidID])[dimension], 2);
                }
            }
            distance = Math.sqrt(distance); // Euclidean distance
            if (distance < minimum) {
                minimum = distance;
                adjustedCentroidID = centroidID;
            }
        }
        return adjustedCentroidID; // best centroid with minimum distance
    }
    
    /** 
     * Chooses medoids for kMedoids method 
     * @param nodes list of nodes from which medoids can be selected
    */
    private getMedoids(nodes: NodeCommon[]): NodeCommon[] { 
        let medoids = new Array(this.k);
        let i = 0;

        // skip a node if already medoid
        const isMedoid = node => medoids.some( ({medoid}) => medoid == node);
        
        // randomly choose k new medoids
        while (i !== this.k) {
            let node = nodes[Math.floor( Math.random() * nodes.length )];
            if (!isMedoid(node)) {
                medoids[i++] = node;
            }
        }
        
        return medoids;
    }

    /** 
     * Generates random centroids for kMeans method 
     * @param nodes list of nodes from which medoids can be selected
     * @param nDimensions number of dimensions (in our case it is 2)
    */ 
    private getRandomCentroids(nodes: NodeCommon[], nDimensions: number = 2): number[] {

        let minimum = new Array(nDimensions);
        let maximum = new Array(nDimensions);
        let centroids = new Array(this.k);
        let centroid;

        for (let dimension = 0; dimension < nDimensions; dimension++) {
            minimum[dimension] = this.getMin(nodes, dimension);
            maximum[dimension] = this.getMax(nodes, dimension);
        }

        for ( let centroidID = 0; centroidID < this.k; centroidID++ ) {

            centroid = [];
            for (let dimension = 0; dimension < nDimensions; dimension++ ) {
              centroid[dimension] = Math.random() * (maximum[dimension] - minimum[dimension]) + minimum[dimension]; // random initial value
            }

            centroids[centroidID] = centroid;
          }
      
          return centroids;
    }

    /** 
     * Returns minimum position
     * @param nodes list of nodes
     * @param dimension 0: x, 1: y
     */
    private getMin(nodes: NodeCommon[], dimension: number): number {
        let minNode = nodes[0];

        let coordinate = ( dimension === 0 ) ? "x" : "y";
        for (let node of nodes) {
            
            if (minNode.element.element.position()[coordinate] > node.element.element.position()[coordinate]) {
                minNode = node;
            }
        }
        return minNode.element.element.position()[coordinate];
    }

    /** 
     * Returns maximum position
     * @param nodes list of nodes
     * @param dimension 0: x, 1: y
     */
    private getMax(nodes: NodeCommon[], dimension: number): number {
        let maxNode = nodes[0];

        let coordinate = ( dimension === 0 ) ? "x" : "y";
        for (let node of nodes) {

            if (maxNode.element.element.position()[coordinate] < node.element.element.position()[coordinate]) {
                maxNode = node;
            }
        }
        return maxNode.element.element.position()[coordinate];
    }

    /** 
     * Computes a new cost of the configuration (for kmedoids) 
     * @param newMedoid new possible medoid
     * @param cluster list of nodes
     * @param attributes attributes used to compute a cost
     */ 
    private getCost(newMedoid: NodeCommon, cluster: NodeCommon[], attributes: any): number {
        let cost = 0;
        for (let centroidID = 0; centroidID < cluster.length; centroidID++) {
            for (let dimension = 0; dimension < attributes.length; dimension++) {
                cost += Math.pow(attributes(cluster[centroidID])[dimension] - attributes(newMedoid)[dimension], 2);
            }
        }
        return cost;
    }

    private convergenceFactor(value: number): number {
        return Math.round(value * Math.pow(10, 4)) / Math.pow(10, 4);
    }
}