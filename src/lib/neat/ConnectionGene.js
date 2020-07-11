export default class ConnectionGene {
  constructor(inNode, outNode, weight, expressed, innovationNumber) {
    this.inNode = inNode;
    this.outNode = outNode;
    this.weight = weight;
    this.expressed = expressed;
    this.innovationNumber = innovationNumber;
  }

  isDisabled() {
    return this.expressed === false;
  }

  getInNode() {
    return this.inNode;
  }

  getOutNode() {
    return this.outNode;
  }

  getWeight() {
    return this.weight;
  }

  getInovationNumber() {
    return this.innovationNumber;
  }

  setWeight(weight) {
    this.weight = weight;
  }

  setRandomWeight() {
    this.weight += Math.random() * 2.0 - 1.0;
  }

  enable() {
    this.expressed = true;
  }

  disable() {
    this.expressed = false;
  }
}
