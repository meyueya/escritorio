import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;
uniform float u_time;
uniform vec2 u_res;
uniform vec2 u_mouse;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;

  vec2 ctr1 = vec2(0.35 + sin(u_time * 0.02) * 0.08, 0.45 + cos(u_time * 0.025) * 0.06);
  float d1 = distance(vec2(uv.x * aspect, uv.y), vec2(ctr1.x * aspect, ctr1.y));

  vec2 ctr2 = vec2(0.7 + cos(u_time * 0.015) * 0.05, 0.6 + sin(u_time * 0.018) * 0.04);
  float d2 = distance(vec2(uv.x * aspect, uv.y), vec2(ctr2.x * aspect, ctr2.y));

  float t = smoothstep(0.0, 0.9, d1) * 0.7 + smoothstep(0.0, 0.7, d2) * 0.3;

  vec3 color1 = vec3(0.102, 0.212, 0.192); // #1A3631
  vec3 color2 = vec3(0.165, 0.290, 0.267); // #2A4A44

  float grain = (hash(gl_FragCoord.xy + fract(u_time * 0.1) * 100.0) - 0.5) * 0.02;

  gl_FragColor = vec4(mix(color1, color2, clamp(t, 0.0, 1.0)) + grain, 1.0);
}
`;

export default function BackgroundShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;

    // Compile shaders
    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Fullscreen quad
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_res');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    gl.uniform2f(uMouse, 0.5, 0.5);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
    }

    resize();
    window.addEventListener('resize', resize);

    function render() {
      const t = performance.now() * 0.001;
      gl!.uniform1f(uTime, t);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
