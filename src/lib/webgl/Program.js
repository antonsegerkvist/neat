export default class Program {
  static load(gl, vsSource, fsSource) {
    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
      return null;
    }

    return shaderProgram;
  }

  static loadShader(gl, type, source) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }
}
