export const TYPE_INPUT = 0;
export const TYPE_OUTPUT = 1;
export const TYPE_HIDDEN = 2;

export class NodeGene {
  constructor(id, type) {
    this.id = id;
    this.type = type;
  }

  getID() {
    return this.id;
  }

  getType() {
    return this.type;
  }
}
