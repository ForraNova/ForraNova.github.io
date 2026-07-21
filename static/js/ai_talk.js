
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

const AI_CHARS = "01アイエタ∑∫∂∇λψΩ◈⬡⬢▲△▽▷".split("");
const NODE_COLORS = [
  "#00d4ff",
  "#7b5ea7",
  "#00ff88",
  "#ff6b35",
  "#4fc3f7",
  "#b39ddb",
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stateRef.current.width = canvas.width;
      stateRef.current.height = canvas.height;
      initScene();
    } 

    function spawnParticle(nodes: Node[]) {
      if (nodes.length < 2) return null;
      const fi = Math.floor(Math.random() * nodes.length);
      let ti = Math.floor(Math.random() * nodes.length);
      while (ti === fi) ti = Math.floor(Math.random() * nodes.length);
      const from = nodes[fi];
      const to = nodes[ti];
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      if (dist > 350) return null;
      const particleColors = ["#00d4ffcc", "#7b5ea7cc", "#00ff88cc", "#4fc3f7cc"];
      return {
        x: from.x,
        y: from.y,
        tx: to.x,
        ty: to.y,
        progress: 0,
        speed: Math.random() * 0.006 + 0.003,
        fromNode: fi,
        toNode: ti,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        size: Math.random() * 2 + 1,
      } as Particle;
    }

    function drawGlowCircle(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      color: string,
      alpha: number
    ) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
      gradient.addColorStop(0, hexToRgba(color, alpha));
      gradient.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(x, y, r * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(color, alpha);
      ctx.fill();
    }

    function hexToRgba(hex: string, alpha: number) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;
      const state = stateRef.current;
      const { width, height } = state;

      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "#020b18");
      bg.addColorStop(0.4, "#040d1a");
      bg.addColorStop(0.7, "#060a1a");
      bg.addColorStop(1, "#030810");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const t = timestamp * 0.001;
      state.time = t;

      for (const stream of state.streams) {
        ctx.font = `${stream.fontSize}px monospace`;
        stream.opacity += 0.003 * stream.fadeDir;
        if (stream.opacity > 0.5) stream.fadeDir = -1;
        if (stream.opacity < 0.02) {
          stream.fadeDir = 1;
          stream.x = Math.random() * width;
          stream.y = -50;
        }

        stream.y += stream.vy;
        if (stream.y > height + 100) {
          stream.y = -50;
          stream.x = Math.random() * width;
        }

        if (timestamp - stream.lastUpdate > stream.updateInterval * 16) {
          stream.charIndex = (stream.charIndex + 1) % stream.chars.length;
          stream.chars[Math.floor(Math.random() * stream.chars.length)] =
            AI_CHARS[Math.floor(Math.random() * AI_CHARS.length)];
          stream.lastUpdate = timestamp;
        }

        for (let i = 0; i < stream.chars.length; i++) {
          const fade = 1 - i / stream.chars.length;
          ctx.fillStyle = stream.color.replace(/[\d.]+\)$/, `${(stream.opacity * fade).toFixed(2)})`);
          ctx.fillText(stream.chars[i], stream.x, stream.y - i * (stream.fontSize + 3));
        }
      }

      
      if (Math.random() < 0.08) {
        const p = spawnParticle(nodes);
        if (p) state.particles.push(p);
      }

      state.particles = state.particles.filter((p) => p.progress < 1);
      for (const p of state.particles) {
        p.progress += p.speed;
        p.x = lerp(p.x, p.tx, p.speed * 1.5);
        p.y = lerp(p.y, p.ty, p.speed * 1.5);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, p.color);
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.progress;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      for (const node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        node.pulsePhase += node.pulseSpeed;

        const pulse = Math.sin(node.pulsePhase) * 0.4 + 0.6;
        const r = node.radius * (0.8 + pulse * 0.4);

        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 8);
        glow.addColorStop(0, hexToRgba(node.color, 0.3 * pulse * node.glowIntensity));
        glow.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 8, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(node.color, 0.9 * pulse);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.6 * pulse;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const scanY = ((t * 60) % (height + 200)) - 100;
      const scanGrad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(0,212,255,0.03)");
      scanGrad.addColorStop(1, "transparent");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 60, width, 120);

      const vigGrad = ctx.createRadialGradient(width / 2, height / 2, height * 0.3, width / 2, height / 2, height);
      vigGrad.addColorStop(0, "transparent");
      vigGrad.addColorStop(1, "rgba(2,11,24,0.6)");
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, width, height);

      drawGlowCircle(ctx, width * 0.15, height * 0.2, 2, "#00d4ff", 0.08 + Math.sin(t * 0.4) * 0.04);
      drawGlowCircle(ctx, width * 0.85, height * 0.75, 2, "#7b5ea7", 0.07 + Math.sin(t * 0.35 + 1) * 0.03);
      drawGlowCircle(ctx, width * 0.5, height * 0.5, 2, "#00ff88", 0.04 + Math.sin(t * 0.3 + 2) * 0.02);

      animRef.current = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        zIndex: 0,
      }}
    />
  );
}
