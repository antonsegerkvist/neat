export default `
  attribute vec3 aVertexPosition;
  attribute vec3 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uModelMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec3 vColor;

  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
    vColor = aVertexColor;
  }
`;
