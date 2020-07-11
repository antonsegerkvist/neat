import { mat4 } from 'gl-matrix';

import Buffers from './Buffers';
import Program from './Program';

import vsSource from './glsl/VertexShaderSource';
import fsSource from './glsl/FragmentShaderSource';

import Simulation from '../neat/Simulation';

export default class WebGL {
  constructor(props) {
    this.dom = {
      element: props.element,
      statistics: undefined,
    };

    this.listeners = {
      resize: () => {
        this.height = this.dom.element.clientHeight;
        this.width = this.dom.element.clientWidth;

        this.canvas.setAttribute('height', this.height);
        this.canvas.setAttribute('width', this.width);

        this.render.bind(this)();
      },
    };
  }

  init() {
    window.addEventListener('resize', this.listeners.resize);

    this.height = this.dom.element.clientHeight;
    this.width = this.dom.element.clientWidth;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('height', this.height);
    this.canvas.setAttribute('width', this.width);
    this.dom.element.appendChild(this.canvas);

    this.dom.statistics = document.createElement('div');
    this.dom.statistics.classList.add('statistics');
    this.dom.element.appendChild(this.dom.statistics);

    this.gl = this.canvas.getContext('webgl');

    this.setup.bind(this)();
  }

  setup() {
    //
    // Steup statistics.
    //

    this.statistics = {
      prevTime: 0,
      genNumber: 0,
      fittness: 0,
      step: 0,
      dead: 0,
    };

    //
    // Simulation config.
    //

    this.xSize = 100;
    this.ySize = 100;
    this.population = 15;
    this.numOfInputs = 18;
    this.numOfOutputs = 5;
    this.survivors = 3;

    //
    // Simulation setup.
    //

    this.simulation = new Simulation(
      this.population,
      this.numOfInputs,
      this.numOfOutputs,
    );

    this.grid = [];
    for (let i = 0; i < this.xSize; i += 1) {
      this.grid.push([]);
      for (let j = 0; j < this.ySize; j += 1) {
        const type = Math.floor(Math.random() * 80);
        const food = Math.floor(Math.random() * 20);
        this.grid[i].push({
          type: type > 0 ? 1 : 0,
          food: (food === 0 && type > 0) ? 1 : 0,
        });
      }
    }

    this.entities = [];
    for (let i = 0; i < this.population; i += 1) {
      this.entities.push({
        xi: Math.floor(Math.random() * this.xSize),
        yi: Math.floor(Math.random() * this.ySize),
        food: 10,
        water: 10,
        fittness: 0,
        dead: false,
      });
    }

    //
    // WebGL setup.
    //

    this.gl.enable(this.gl.DEPTH_TEST);

    this.buffers = {
      square: Buffers.loadSquareBuffers(this.gl),
      world: Buffers.loadWorldBuffers(this.gl, this.grid),
    };

    this.program = Program.load(this.gl, vsSource, fsSource);

    this.programInfo = {
      attribLocations: {
        vertexPosition: this.gl.getAttribLocation(this.program, 'aVertexPosition'),
        vertexColor: this.gl.getAttribLocation(this.program, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: this.gl.getUniformLocation(this.program, 'uProjectionMatrix'),
        modelMatrix: this.gl.getUniformLocation(this.program, 'uModelMatrix'),
        modelViewMatrix: this.gl.getUniformLocation(this.program, 'uModelViewMatrix'),
      },
    };

    const stepFunction = (time) => {
      this.render(time);
      requestAnimationFrame(stepFunction);
    };
    requestAnimationFrame(stepFunction);
  }

  render(time) {
    //
    // Update statistics.
    //

    if (time) {
      this.statistics.fps = 1000.0 / (time - this.statistics.prevTime);
      this.statistics.prevTime = time;
      this.statistics.step += 1;
    }

    //
    // Initialize.
    //

    this.gl.viewport(0, 0, this.width, this.height);

    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.clear(this.gl.DEPTH_BUFFER_BIT);

    //
    // Transformations.
    //

    const projectionMatrix = mat4.create();
    mat4.ortho(
      projectionMatrix,
      -this.width / 2.0,
      +this.width / 2.0,
      -this.height / 2.0,
      +this.height / 2.0,
      0, 1000,
    );

    const modelViewMatrix = mat4.create();
    mat4.scale(
      modelViewMatrix,
      modelViewMatrix,
      [8, 8, 1],
    );
    mat4.translate(
      modelViewMatrix,
      modelViewMatrix,
      [
        -this.xSize / 2.0,
        -this.ySize / 2.0,
        -10,
      ],
    );

    //
    // Specify program.
    //

    this.gl.useProgram(this.program);

    //
    // Bind perspective uniforms.
    //

    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix,
    );
    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix,
    );

    this.renderWorld();
    this.renderEntities();
    this.updateUI();

    this.updateSimulation();
    this.createNewGeneration();
  }

  renderWorld() {
    //
    // Bind attributes.
    //

    const modelMatrix = mat4.create();

    this.gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.world.vertex);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexPosition,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(
      this.programInfo.attribLocations.vertexPosition,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.world.color);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexColor,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(
      this.programInfo.attribLocations.vertexColor,
    );

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.buffers.world.count);
  }

  renderEntities() {
    //
    // Bind attributes.
    //

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.square.vertex);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexPosition,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(
      this.programInfo.attribLocations.vertexPosition,
    );

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.square.colorPurple);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexColor,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(
      this.programInfo.attribLocations.vertexColor,
    );

    //
    // Draw population.
    //
    for (let i = 0; i < this.population; i += 1) {
      const modelMatrix = mat4.create();
      mat4.translate(
        modelMatrix,
        modelMatrix,
        [
          this.entities[i].xi,
          this.entities[i].yi,
          -1,
        ],
      );
      mat4.scale(
        modelMatrix,
        modelMatrix,
        [0.8, 0.8, 1],
      );

      this.gl.uniformMatrix4fv(
        this.programInfo.uniformLocations.modelMatrix,
        false,
        modelMatrix,
      );

      this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    //
    // Draw food.
    //

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.square.colorYellow);
    this.gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexColor,
      3,
      this.gl.FLOAT,
      false,
      0,
      0,
    );
    this.gl.enableVertexAttribArray(
      this.programInfo.attribLocations.vertexColor,
    );

    for (let i = 0; i < this.xSize; i += 1) {
      for (let j = 0; j < this.ySize; j += 1) {
        if (this.grid[i][j].food > 0) {
          const modelMatrix = mat4.create();
          mat4.translate(
            modelMatrix,
            modelMatrix,
            [i, j, -1],
          );
          mat4.scale(
            modelMatrix,
            modelMatrix,
            [0.8, 0.8, 1],
          );

          this.gl.uniformMatrix4fv(
            this.programInfo.uniformLocations.modelMatrix,
            false,
            modelMatrix,
          );

          this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
      }
    }
  }

  updateUI() {
    this.dom.statistics.innerText = `FPS: ${this.statistics.fps.toFixed(2)}
    Generation: ${this.statistics.genNumber}
    Fittness: ${this.statistics.fittness}
    Step: ${this.statistics.step}`;
  }

  updateSimulation() {
    for (let i = 0; i < this.population; i += 1) {
      const inputs = [];
      const entity = this.entities[i];

      if (entity.dead === false) {
        // Lower left type.
        if (entity.xi > 0 && entity.yi > 0) {
          inputs.push(this.grid[entity.xi - 1][entity.yi - 1].type);
          if (this.grid[entity.xi - 1][entity.yi - 1].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Lower type.
        if (entity.yi > 0) {
          inputs.push(this.grid[entity.xi][entity.yi - 1].type);
          if (this.grid[entity.xi][entity.yi - 1].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Lower right type.
        if ((entity.xi + 1) < this.xSize && entity.yi > 0) {
          inputs.push(this.grid[entity.xi + 1][entity.yi - 1].type);
          if (this.grid[entity.xi + 1][entity.yi - 1].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Left type.
        if (entity.xi > 0) {
          inputs.push(this.grid[entity.xi - 1][entity.yi].type);
          if (this.grid[entity.xi - 1][entity.yi].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Center type.
        inputs.push(this.grid[entity.xi][entity.yi].type);
        inputs.push(0);

        // Right type.
        if ((entity.xi + 1) < this.xSize) {
          inputs.push(this.grid[entity.xi + 1][entity.yi].type);
          if (this.grid[entity.xi + 1][entity.yi].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Top left.
        if (entity.xi > 0 && (entity.yi + 1) < this.ySize) {
          inputs.push(this.grid[entity.xi - 1][entity.yi + 1].type);
          if (this.grid[entity.xi - 1][entity.yi + 1].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Top.
        if ((entity.yi + 1) < this.ySize) {
          inputs.push(this.grid[entity.xi][entity.yi + 1].type);
          if (this.grid[entity.xi][entity.yi + 1].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Top right.
        if ((entity.xi + 1) < this.xSize && (entity.yi + 1) < this.ySize) {
          inputs.push(this.grid[entity.xi + 1][entity.yi + 1].type);
          if (this.grid[entity.xi + 1][entity.yi + 1].food > 0) {
            inputs.push(1);
          } else {
            inputs.push(0);
          }
        } else {
          inputs.push(-1);
          inputs.push(0);
        }

        // Calculate output.
        const outputs = this.simulation.calculateGenomOutput(i, inputs);
        let max = outputs[0];
        let index = 0;

        for (let j = 1; j < outputs.length; j += 1) {
          if (max < outputs[j]) {
            index = j;
            max = outputs[j];
          }
        }

        // Transform index to action.
        switch (index) {
          case 1: // Move up.
            if (entity.yi + 1 < this.ySize) entity.yi += 1;
            else entity.yi = 0;
            break;

          case 2: // Move right.
            if (entity.xi + 1 < this.xSize) entity.xi += 1;
            else entity.xi = 0;
            break;

          case 3: // Move down.
            if (entity.yi > 0) entity.yi -= 1;
            else entity.yi = this.ySize - 1;
            break;

          case 4: // Move left.
            if (entity.xi > 0) entity.xi -= 1;
            else entity.xi = this.xSize - 1;
            break;

          default:
            break;
        }

        // Absorb food.
        if (this.grid[entity.xi][entity.yi].food > 0) {
          let consumedFood = this.grid[entity.xi][entity.yi].food;
          entity.food += consumedFood;
          this.grid[entity.xi][entity.yi].food = 0;

          while (consumedFood > 0) {
            const rxi = Math.floor(Math.random() * this.xSize);
            const ryi = Math.floor(Math.random() * this.ySize);
            this.grid[rxi][ryi].food += 1;
            consumedFood -= 1;
          }
        }

        // Absorb water.
        if (this.grid[entity.xi][entity.yi].type === 0) {
          entity.water += 10;
        }

        // Reduce food and water and check if dead.
        entity.food -= 0.1;
        entity.water -= 0.1;
        if (entity.food <= 0 || entity.water <= 0) {
          entity.dead = true;
          this.statistics.dead += 1;
        } else {
          entity.fittness += 1;
        }
      }
    }
  }

  createNewGeneration() {
    if (this.statistics.dead === this.population) {
      this.statistics.genNumber += 1;
      this.statistics.step = 0;
      this.statistics.dead = 0;

      const fittnessArray = this.entities
        .map((d, i) => ({ fittness: d.fittness, index: i }))
        .sort((a, b) => {
          if (a.fittness > b.fittness) {
            return -1;
          }
          if (a.fittness < b.fittness) {
            return 1;
          }
          return 0;
        })
        .slice(0, this.survivors + 1);

      for (let i = 0; i < this.population; i += 1) {
        this.entities[i].xi = Math.floor(Math.random() * this.xSize);
        this.entities[i].yi = Math.floor(Math.random() * this.ySize);
        this.entities[i].food = 10;
        this.entities[i].water = 10;
        this.entities[i].fittness = 0;
        this.entities[i].dead = false;
      }

      this.statistics.fittness = fittnessArray[0].fittness;
      this.simulation.evolve(fittnessArray.map((d) => d.index));
    }
  }

  destroy() {
    window.removeEventListener('resize', this.listeners.resize);
  }
}
