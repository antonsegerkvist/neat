import Genom from './Genom';

export default class Simulation {
  constructor(numberOfGenoms, inputs, outputs) {
    this.numberOfGenoms = numberOfGenoms;
    this.inputs = inputs;
    this.outputs = outputs;
    this.genoms = [];

    for (let i = 0; i < numberOfGenoms; i += 1) {
      this.genoms.push(new Genom(inputs, outputs));
    }
  }

  getNumberOfGenoms() {
    return this.numberOfGenoms;
  }

  getInputs() {
    return this.inputs;
  }

  getOutputs() {
    return this.outputs;
  }

  evolve(survivors) {
    const newGenoms = [];
    survivors.forEach((survivor) => {
      newGenoms.push(this.genoms[survivor]);
    });

    this.genoms = newGenoms;
    while (newGenoms.length < this.numberOfGenoms) {
      const index = Math.floor(Math.random() * survivors.length);
      newGenoms.push(newGenoms[index].copy());
    }

    this.genoms.forEach((genom) => {
      if (genom.getNumberOfConnectionGenes() === 0) {
        genom.addConnectionMutation();
        return;
      }

      const mutationIndex = Math.floor(Math.random() * 2.5);

      switch (mutationIndex) {
        case 0:
          while (genom.addConnectionMutation() === false);
          break;

        case 1:
          while (genom.addNodeMutation() === false);
          break;

        case 2:
          while (genom.addWeightMutation() === false);
          break;

        default:
      }
    });
  }

  calculateGenomOutput(index, values) {
    return this.genoms[index].calculate(values);
  }
}
