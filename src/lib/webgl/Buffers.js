export default class Buffers {
  static loadSquareBuffers(gl) {
    const buffers = {};

    //
    // Cube data.
    //

    const squareVertecies = [
      0.0, 0.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 0.0, 0.0,
      0.0, 0.0, 0.0,
      0.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
    ];

    const cubeYellowColors = [
      1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
      1.0, 1.0, 0.0,
    ];

    const cubePurpleColors = [
      1.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
      1.0, 0.0, 1.0,
    ];

    //
    // Cube buffer.
    //

    buffers.vertex = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(squareVertecies), gl.STATIC_DRAW);

    buffers.colorYellow = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorYellow);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeYellowColors), gl.STATIC_DRAW);

    buffers.colorPurple = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.colorPurple);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubePurpleColors), gl.STATIC_DRAW);

    return buffers;
  }

  static loadWorldBuffers(gl, grid) {
    const buffers = {};
    const coordinates = [];
    const colors = [];

    for (let i = 0; i < grid.length; i += 1) {
      for (let j = 0; j < grid[i].length; j += 1) {
        coordinates.push(i);
        coordinates.push(j);
        coordinates.push(-10.0);

        coordinates.push(i + 1.0);
        coordinates.push(j + 1.0);
        coordinates.push(-10.0);

        coordinates.push(i + 1.0);
        coordinates.push(j);
        coordinates.push(-10.0);

        coordinates.push(i);
        coordinates.push(j);
        coordinates.push(-10.0);

        coordinates.push(i);
        coordinates.push(j + 1.0);
        coordinates.push(-10.0);

        coordinates.push(i + 1.0);
        coordinates.push(j + 1.0);
        coordinates.push(-10.0);

        if (grid[i][j].type === 0) {
          for (let k = 0; k < 6; k += 1) {
            colors.push(0.0);
            colors.push(0.0);
            colors.push(1.0);
          }
        } else {
          for (let k = 0; k < 6; k += 1) {
            colors.push(0.0);
            colors.push(1.0);
            colors.push(0.0);
          }
        }
      }
    }

    buffers.count = coordinates.length / 3.0;

    buffers.vertex = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.vertex);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(coordinates), gl.STATIC_DRAW);

    buffers.color = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return buffers;
  }
}
