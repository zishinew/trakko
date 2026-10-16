'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

// Original Trakko shader. Material inspiration: Componentry WebGL Liquid / Liquid Chrome.
// https://componentry.dev/docs/components/webgl-liquid
// A small, dependency-free interference field: no third-party shader code is copied.
const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
const fragment = `
precision mediump float;
uniform vec2 resolution;
uniform float time;
void main(){
  vec2 uv=gl_FragCoord.xy/resolution;
  vec2 p=(uv-.5)*vec2(resolution.x/resolution.y,1.);
  float t=time*.13;
  float bend=sin(p.y*4.5+t)*.21+sin(p.y*9.-t*.7)*.06;
  float field=sin((p.x+bend)*7.+sin(p.y*5.+t))* .5+.5;
  float ribbon=pow(field,7.);
  float sheen=pow(field,28.);
  float bloom=exp(-length((p-vec2(.45,.02))*vec2(.9,1.6))*2.);
  vec3 color=mix(vec3(.035),vec3(.12),ribbon*bloom);
  color+=vec3(.24)*sheen*bloom*.75;
  color+=vec3(.015)*sin(p.y*2.+t)*sin(p.x*3.-t);
  float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
  color+=(grain-.5)*.008;
  gl_FragColor=vec4(color,1.);
}`;

export function StudioAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'low-power',
    });
    if (!gl) return; // The CSS field remains visible when graphics are unavailable.
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    const release = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (program) gl.deleteProgram(program);
    };
    if (!vs || !fs || !program) {
      release();
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      release();
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const size = gl.getUniformLocation(program, 'resolution');
    const clock = gl.getUniformLocation(program, 'time');
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let visible = true;
    let lost = false;
    const draw = () => {
      gl.uniform1f(clock, reduced.matches ? 0 : elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const render = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || pausedRef.current || reduced.matches || lost) return;
      // Cap shader work to 30fps and freeze time when paused or out of view.
      if (now - previous >= 33) {
        elapsed += Math.min((now - previous) / 1000, 0.05);
        previous = now;
        draw();
      }
      frame = requestAnimationFrame(render);
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      previous = performance.now();
      if (!lost) draw();
      if (visible && !document.hidden && !pausedRef.current && !reduced.matches && !lost)
        frame = requestAnimationFrame(render);
    };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, rect.width < 600 ? 0.8 : 1.25);
      canvas.width = Math.max(1, Math.min(1440, Math.round(rect.width * ratio)));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(size, canvas.width, canvas.height);
      resume();
    };
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
      canvas.style.opacity = '0';
    };
    const onRestored = () => {
      // Fall back until remount rather than use invalid GPU handles.
      canvas.style.opacity = '0';
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('offgrid-motion-change', resume);
    reduced.addEventListener('change', resume);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('offgrid-motion-change', resume);
      reduced.removeEventListener('change', resume);
      gl.deleteBuffer(buffer);
      release();
    };
  }, []);
  return (
    <>
      <div className="studio-field" aria-hidden="true">
        <canvas ref={canvasRef} />
        <div className="studio-shade" />
      </div>
      <button
        type="button"
        className="motion-toggle"
        aria-pressed={paused}
        onClick={() => {
          pausedRef.current = !paused;
          setPaused(!paused);
          window.dispatchEvent(new Event('offgrid-motion-change'));
        }}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
        {paused ? 'Resume background' : 'Pause background'}
      </button>
    </>
  );
}
