import { Graph } from "@/graph/Graph";
import GraphManipulator from "@/graph/GraphManipulator";
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import Cytoscape from "cytoscape";
import NodeGroup from "../../../graph/NodeGroup";
import { Node } from "../../../graph/Node";
import NodeCommon from "../../../graph/NodeCommon";

export default class KMeans extends Vue {
        
    @Prop() manipulator: GraphManipulator;

    private k: number;

    kClustering(method: string, nodesToCluster: any[]) {
        let nodes = [];
        let numIterations = 10;
        let clusters = [];

        let currentCost;
        
        this.k = nodesToCluster.length;
        let changedCost = new Array(this.k + 1);

        const attributes = node => {
            return { 0: node.element.element.position()['x'], 1: node.element.element.position()['y'] }
        }

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
                centroids = this.getMedoids(nodesToCluster, nDimensions);
                centroids.forEach(centroid => {
                    nodesToCluster.splice(
                        nodesToCluster.indexOf(centroid), 1
                      );
                }); 
            }
            
            
            while (!isConverged && iterations < numIterations) {
                // Assign nodes to the nearest cluster
                for (let node of nodesToCluster) {
                    // node = this.graph.getNodeByIRI(IRI);
                    let asset_id = (node instanceof NodeGroup) ? node.id : node.IRI;
                    assignments[asset_id] = this.classify(node, centroids, attributes, method);
                }
                
                clusters = new Array(this.k)
                                .fill(false)
                                .map(() => 
                                new Array().fill(false)
                                );

                for (let node of nodesToCluster) {
                    let asset_id = (node instanceof NodeGroup) ? node.id : node.IRI;
                    let clusterID = assignments[asset_id];
                    clusters[clusterID].push(node);
                }

                for (let i = 0; i < centroids.length; i++) {
                    clusters[i].push(centroids[i]);
                }

                // Update centroids of each cluster
                isConverged = true;
                for (let centroidID = 0; centroidID < this.k; centroidID++) {

                    if (clusters[centroidID] === undefined) { continue; }

                    if (method === "kmedoids") {
                        changedCost[centroidID] = this.getCost(centroids[centroidID], clusters[centroidID], attributes);

                        for (let nodeID; nodeID < clusters[centroidID].length; nodeID++) {
                            currentCost = this.getCost(clusters[centroidID][nodeID], clusters[centroidID], attributes);

                            if (currentCost < changedCost[centroidID]) {
                                changedCost[centroidID] = currentCost;
                                centroids[centroidID] = clusters[centroidID][nodeID];
                                isConverged = false;
                            }
                        }

                    } else if (method === "kmeans") {
                        // Update cluster centroids by calculating average of all nodes within cluster
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

        for (let cluster of clusters) {
            if (cluster.length > 1) {
                this.manipulator.groupExistingNodes(cluster);
            }
        }
    }

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
            distance = Math.sqrt(distance);
            if (distance < minimum) {
                minimum = distance;
                adjustedCentroidID = centroidID;
            }
        }
        return adjustedCentroidID;
    }
    
    private getMedoids(nodes: NodeCommon[], nDimensions: number): NodeCommon[] { 
        let medoids = new Array(this.k);
        let i = 0;

        const isMedoid = node => medoids.some( ({medoid}) => medoid == node);
        
        while (i !== this.k) {
            let node = nodes[Math.floor( Math.random() * nodes.length )];
            if (!isMedoid(node)) {
                medoids[i++] = node;
            }
        }
        
        return medoids;
    }

    private getRandomCentroids(nodes: NodeCommon[], nDimensions: number): number[] {

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