'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePlayer } from './player';

const MotionContext = createContext({ reduced: false });
export const useSurfaceMotion = () => useContext(MotionContext);

export function DaylightMotion({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener('change', sync);
    const visibility = () => {
      if (root.current) root.current.dataset.pageHidden = String(document.hidden);
    };
    document.addEventListener('visibilitychange', visibility);
    visibility();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        (target as HTMLElement).dataset.inView = String(isIntersecting);
      });
    });
    root.current?.querySelectorAll('[data-motion-region]').forEach((el) => observer.observe(el));
    return () => {
      media.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', visibility);
      observer.disconnect();
    };
  }, []);
  return (
    <MotionContext.Provider value={{ reduced }}>
      <div ref={root} className="daylight-motion" data-effects-paused={reduced}>
        {children}
      </div>
    </MotionContext.Provider>
  );
}

const vertex = `attribute vec2 position; void main(){gl_Position=vec4(position,0.,1.);}`;
// Original GLSL: two fields share the sky palette, not image assets or textures.
const fragment = `
precision mediump float;
uniform vec2 resolution;
uniform vec2 pointer;
uniform float time;
uniform float energy;
uniform float variant;
void main(){
  vec2 uv=gl_FragCoord.xy/resolution;
  vec2 p=uv*2.-1.;
  p.x*=resolution.x/resolution.y;
  float t=time*.24;
  vec2 mouse=(pointer*2.-1.)*vec2(resolution.x/resolution.y,1.);
  float d=length(p-mouse);
  float ripple=sin(d*8.-t*3.)*exp(-d*1.4)*(.08+energy*.055);
  float flow=sin(p.x*1.5+t+sin(p.y*2.4-t)*.7);
  float ribbon=exp(-pow((p.y-flow*.48+ripple)*3.1,2.));
  float filament=pow(.5+.5*sin((p.y-flow*.48+ripple)*34.+p.x*1.5),12.)*ribbon;
  float orbit=sin(length(p-vec2(sin(t)*.5,cos(t*.7)*.3))*9.-t*2.);
  float rings=pow(.5+.5*orbit,6.);
  float field=mix(ribbon,rings*.55,variant);
  vec3 sky=mix(vec3(.922,.961,1.),vec3(.8,.906,1.),variant);
  vec3 blue=vec3(.64,.79,1.);
  vec3 lavender=vec3(.86,.76,.98);
  vec3 tint=mix(blue,lavender,.5+.5*sin(p.x*.8+t*.4));
  vec3 color=mix(sky,tint,field*.52);
  color=mix(color,vec3(.45,.68,.98),filament*(.10+energy*.06)*(1.-variant));
  float edge=smoothstep(0.,.18,uv.y)*smoothstep(0.,.18,1.-uv.y);
  edge*=smoothstep(0.,.1,uv.x)*smoothstep(0.,.1,1.-uv.x);
  gl_FragColor=vec4(mix(sky,color,edge),1.);
}`;

export function DaylightShader({ variant = 'flow' }: { variant?: 'flow' | 'ripple' }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { playing } = usePlayer();
  const controls = useRef({ playing });
  const sync = useRef<(() => void) | null>(null);
  useEffect(() => {
    controls.current = { playing };
    sync.current?.();
  }, [playing]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const gl = el.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
    });
    if (!gl) {
      el.dataset.renderState = 'fallback';
      return;
    }
    function compile(type: number, source: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }
    const vs = compile(gl.VERTEX_SHADER, vertex),
      fs = compile(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      if (program) gl.deleteProgram(program);
      el.dataset.renderState = 'fallback';
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
      el.dataset.renderState = 'fallback';
      return;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(
      ['resolution', 'pointer', 'time', 'energy', 'variant'].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    );
    let frame = 0,
      visible = false,
      elapsed = 0,
      previous = 0,
      lastPaint = 0,
      lost = false;
    const target = { x: 0.5, y: 0.5 },
      mouse = { x: 0.5, y: 0.5 };
    let energy = 0;
    function paint() {
      if (lost || gl!.isContextLost()) return;
      gl!.useProgram(program);
      gl!.uniform2f(uniforms.resolution, el!.width, el!.height);
      gl!.uniform2f(uniforms.pointer, mouse.x, mouse.y);
      gl!.uniform1f(uniforms.time, elapsed);
      gl!.uniform1f(uniforms.energy, energy);
      gl!.uniform1f(uniforms.variant, variant === 'ripple' ? 1 : 0);
      gl!.drawArrays(gl!.TRIANGLES, 0, 6);
    }
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (now - lastPaint < 1000 / 30) return;
      elapsed += previous ? Math.min((now - previous) / 1000, 0.1) : 0;
      previous = now;
      lastPaint = now;
      mouse.x += (target.x - mouse.x) * 0.08;
      mouse.y += (target.y - mouse.y) * 0.08;
      energy += ((controls.current.playing ? 1 : 0) - energy) * 0.06;
      paint();
    }
    function schedule() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      const state = lost
        ? 'fallback'
        : media.matches
          ? 'reduced'
          : document.hidden
            ? 'hidden'
            : !visible
              ? 'offscreen'
              : 'running';
      el!.dataset.renderState = state;
      if (state === 'running') frame = requestAnimationFrame(tick);
    }
    function resize() {
      const box = el!.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.25, 1280 / Math.max(box.width, 1));
      el!.width = Math.max(1, Math.round(box.width * ratio));
      el!.height = Math.max(1, Math.round(box.height * ratio));
      gl!.viewport(0, 0, el!.width, el!.height);
      paint();
    }
    function pointerMove(event: PointerEvent) {
      if (event.pointerType !== 'mouse' || media.matches || !matchMedia('(pointer: fine)').matches)
        return;
      const box = el!.getBoundingClientRect();
      target.x = (event.clientX - box.left) / box.width;
      target.y = 1 - (event.clientY - box.top) / box.height;
    }
    function contextLost(event: Event) {
      event.preventDefault();
      lost = true;
      schedule();
    }
    // Context loss keeps the static CSS field; a subsequent page visit reinitializes it.
    el.addEventListener('webglcontextlost', contextLost);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(el);
    const sizes = new ResizeObserver(resize);
    sizes.observe(el);
    const region = el.parentElement;
    region?.addEventListener('pointermove', pointerMove);
    document.addEventListener('visibilitychange', schedule);
    media.addEventListener('change', schedule);
    sync.current = schedule;
    resize();
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      sizes.disconnect();
      sync.current = null;
      region?.removeEventListener('pointermove', pointerMove);
      document.removeEventListener('visibilitychange', schedule);
      media.removeEventListener('change', schedule);
      el.removeEventListener('webglcontextlost', contextLost);
      gl.deleteBuffer(buffer);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteProgram(program);
    };
  }, [variant]);
  return (
    <canvas
      ref={canvas}
      className={`daylight-shader shader-${variant}`}
      aria-hidden="true"
      data-render-state="initial"
    />
  );
}
