import ConnectionGene from './ConnectionGene';
import {
  NodeGene,
  TYPE_INPUT,
  TYPE_OUTPUT,
  TYPE_HIDDEN,
} from './NodeGene';

export default class Genom {
  constructor(inputs, outputs) {
    this.connectionGenes = [];
    this.connectionGenesMap = {};
    this.nodeGenes = [];

    this.inputs = inputs;
    this.outputs = outputs;

    for (let i = 0; i < inputs; i += 1) {
      this.nodeGenes.push(new NodeGene(this.nodeGenes.length, TYPE_INPUT));
    }
    for (let i = 0; i < outputs; i += 1) {
      this.nodeGenes.push(new NodeGene(this.nodeGenes.length, TYPE_OUTPUT));
    }
  }

  getNumberOfConnectionGenes() {
    return this.connectionGenes.length;
  }

  getNumberOfNodeGenes() {
    return this.nodeGenes.length;
  }

  addWeightMutation() {
    if (this.connectionGenes.length === 0) {
      return false;
    }

    const connectionGene = this.connectionGenes[
      Math.round(Math.random() * (this.connectionGenes.length - 1))];
    if (connectionGene.isDisabled() === true) {
      return false;
    }
    connectionGene.setRandomWeight();
    return true;
  }

  addNodeMutation() {
    if (this.connectionGenes.length === 0) {
      return false;
    }

    const index = Math.round((this.connectionGenes.length - 1));
    const connection = this.connectionGenes[index];

    if (connection.isDisabled() === true) {
      return false;
    }
    connection.disable();

    const newNodeGene = new NodeGene(this.nodeGenes.length, TYPE_HIDDEN);
    const inNode = this.nodeGenes[connection.getInNode()];
    const outNode = this.nodeGenes[connection.getOutNode()];

    const newConnection1 = new ConnectionGene(
      inNode.getID(),
      newNodeGene.getID(),
      1,
      true,
      this.connectionGenes.length,
    );
    const newConnection2 = new ConnectionGene(
      newNodeGene.getID(),
      outNode.getID(),
      connection.getWeight(),
      true,
      this.connectionGenes.length,
    );

    this.connectionGenes.push(newConnection1);
    this.connectionGenes.push(newConnection2);
    this.nodeGenes.push(newNodeGene);

    if (this.connectionGenesMap[newNodeGene.getID()]) {
      this.connectionGenesMap[newNodeGene.getID()].push(newConnection1);
    } else {
      this.connectionGenesMap[newNodeGene.getID()] = [newConnection1];
    }

    if (this.connectionGenesMap[outNode.getID()]) {
      this.connectionGenesMap[outNode.getID()].push(newConnection2);
    } else {
      this.connectionGenesMap[outNode.getID()] = [newConnection2];
    }

    return true;
  }

  addConnectionMutation() {
    const index1 = Math.floor(this.nodeGenes.length * Math.random());
    const index2 = Math.floor(this.nodeGenes.length * Math.random());

    if (index1 === index2) {
      return false;
    }

    const node1 = this.nodeGenes[index1];
    const node2 = this.nodeGenes[index2];

    //
    // Do not connect input to input nor output to output.
    //
    if (node1.type === TYPE_INPUT && node2.type === TYPE_INPUT) {
      return false;
    }
    if (node1.type === TYPE_OUTPUT && node2.type === TYPE_OUTPUT) {
      return false;
    }

    //
    // Check if connection exists.
    //
    let exists = false;
    let foundConnectionGene;

    this.connectionGenes.forEach((connectionGene) => {
      if (
        node1.getID() === connectionGene.getInNode()
        && node2.getID() === connectionGene.getOutNode()
      ) {
        exists = true;
        foundConnectionGene = connectionGene;
      }
      if (
        node1.getID() === connectionGene.getOutNode()
        && node2.getID() === connectionGene.getInNode()
      ) {
        exists = true;
        foundConnectionGene = connectionGene;
      }
    });

    //
    // Check if connection should be reversed.
    //
    let reverse = false;
    if (node1.getType() === TYPE_HIDDEN && node2.getType() === TYPE_INPUT) {
      reverse = true;
    } else if (node1.getType() === TYPE_OUTPUT && node2.getType() === TYPE_HIDDEN) {
      reverse = true;
    } else if (node1.getType() === TYPE_OUTPUT && node2.getType() === TYPE_INPUT) {
      reverse = true;
    }

    //
    // Add connection gene.
    //
    let newConnectionGene;

    if (reverse) {
      newConnectionGene = new ConnectionGene(
        node2.getID(),
        node1.getID(),
        Math.random() * 10.0 - 5.0,
        true,
        this.connectionGenes.length,
      );
    } else {
      newConnectionGene = new ConnectionGene(
        node1.id,
        node2.id,
        Math.random() * 10.0 - 5.0,
        true,
        this.connectionGenes.length,
      );
    }

    //
    // Check if connection causes a loop.
    //

    const newTarget = newConnectionGene.getOutNode();
    const newSource = newConnectionGene.getInNode();

    const stack = [newSource];
    const visited = {};
    let loopFound = false;

    visited[newTarget] = true;

    while (stack.length > 0) {
      const target = stack.shift();
      const sourceConnections = this.connectionGenesMap[target];

      if (sourceConnections) {
        const sources = sourceConnections
          .filter((d) => (d.isDisabled() === false))
          .map((d) => d.getInNode());
        for (let i = 0; i < sources.length; i += 1) {
          if (sources[i] >= this.inputs) {
            if (visited[sources[i]] !== true) {
              visited[sources[i]] = true;
              stack.push(sources[i]);
            } else {
              loopFound = true;
            }
          }
        }
      }

      if (loopFound) {
        return false;
      }
    }

    //
    // Enable connection if it exists.
    //

    if (exists && foundConnectionGene.isDisabled()) {
      foundConnectionGene.setRandomWeight();
      foundConnectionGene.enable();
      return true;
    }
    if (exists) {
      return false;
    }

    //
    // Add gene to pool.
    //

    this.connectionGenes.push(newConnectionGene);
    if (this.connectionGenesMap[newConnectionGene.getOutNode()]) {
      this.connectionGenesMap[newConnectionGene.getOutNode()].push(newConnectionGene);
    } else {
      this.connectionGenesMap[newConnectionGene.getOutNode()] = [newConnectionGene];
    }

    return true;
  }

  copy() {
    const copy = new Genom(this.inputs, this.outputs);

    copy.addNodeGenes(this.nodeGenes.length - this.inputs - this.outputs);
    copy.addConnectionGenes(this.connectionGenes);

    return copy;
  }

  addNodeGenes(count) {
    for (let i = 0; i < count; i += 1) {
      this.nodeGenes.push(new NodeGene(this.nodeGenes.length, TYPE_HIDDEN));
    }
  }

  addConnectionGenes(connectionGenes) {
    connectionGenes.forEach((connectionGene) => {
      const newConnectionGene = new ConnectionGene(
        connectionGene.getInNode(),
        connectionGene.getOutNode(),
        connectionGene.getWeight(),
        !connectionGene.isDisabled(),
        connectionGene.getInovationNumber(),
      );
      this.connectionGenes.push(newConnectionGene);

      if (this.connectionGenesMap[newConnectionGene.getOutNode()]) {
        this.connectionGenesMap[newConnectionGene.getOutNode()].push(newConnectionGene);
      } else {
        this.connectionGenesMap[newConnectionGene.getOutNode()] = [newConnectionGene];
      }
    });
  }

  log() {
    console.log(this.connectionGenes);
    console.log(this.connectionGenesMap);
    console.log(this.nodeGenes);
  }

  calculate = (values) => {
    const out = [];
    let tmp;

    for (let i = 0; i < this.outputs; i += 1) {
      tmp = this.calculateOutput(values, this.inputs + i);
      out.push(tmp);
    }

    return out;
  }

  calculateOutput = (values, index) => {
    const connectionGenes = this.connectionGenesMap[index];
    let out = 0.0;

    if (connectionGenes) {
      connectionGenes.forEach((connectionGene) => {
        if (connectionGene.isDisabled() === false) {
          if (connectionGene.getInNode() < this.inputs) {
            out += connectionGene.getWeight()
              * values[connectionGene.getInNode()];
          } else {
            out += connectionGene.getWeight()
              * this.calculateOutput(values, connectionGene.getInNode());
          }
        }
      });
    }

    out = 1.0 / (1.0 + Math.exp(-out));

    return out;
  }
}
