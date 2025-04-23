export class CanvasRenderer {
  constructor(element, engine, Matter, options = {}) {
    this.engine = engine;
    this.Matter = Matter;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    
    this.options = {
      width: options.width || window.innerWidth,
      height: options.height || window.innerHeight,
      background: options.background || '#f0f0f0',
      pixelRatio: options.pixelRatio || window.devicePixelRatio || 1,
      optimizeShadows: options.optimizeShadows || false,
      batchDrawing: options.batchDrawing || false,
      use3D: options.use3D !== undefined ? options.use3D : true
    };
    
    element.appendChild(this.canvas);
    this.setSize();

    this.isMouseDown = false;
    this.vertexPool = new Float32Array(1000 * 2); // Pool for vertex coordinates
    this.staticBodies = new Set(); // Cache static bodies
    
    this.canvas.addEventListener('mousedown', () => this.isMouseDown = true);
    this.canvas.addEventListener('mouseup', () => this.isMouseDown = false);
    this.canvas.addEventListener('mouseleave', () => this.isMouseDown = false);
  }

  setSize() {
    const { width, height, pixelRatio } = this.options;
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.context.scale(pixelRatio, pixelRatio);

    if (this.mouseConstraint) {
      this.mouseConstraint.mouse.pixelRatio = pixelRatio;
      this.mouseConstraint.mouse.element = this.canvas;
    }
  }

  render() {
    const { context: ctx } = this;
    const bodies = this.Matter.Composite.allBodies(this.engine.world);

    // Clear canvas with background
    ctx.fillStyle = this.options.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw bodies
    bodies.forEach(body => {
      if (!body.render.visible) return;
      
      const vertices = body.vertices;
      
      // Enhanced shadows for 3D effect
      if (this.options.use3D && !body.isStatic) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 7;
        ctx.shadowOffsetY = 7;
      } else if (this.options.optimizeShadows && !body.isStatic) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      } else if (!this.options.optimizeShadows) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      // Create gradient fill for 3D effect
      if (this.options.use3D && !body.isStatic) {
        const baseColor = body.render.fillStyle || '#ffffff';
        const lightSource = { x: this.options.width * 0.3, y: this.options.height * 0.3 };
        
        // Calculate light direction from center of body to light source
        const lightDirX = lightSource.x - body.position.x;
        const lightDirY = lightSource.y - body.position.y;
        const distance = Math.sqrt(lightDirX * lightDirX + lightDirY * lightDirY);
        const normalizedDirX = lightDirX / distance;
        const normalizedDirY = lightDirY / distance;
        
        // Create gradient
        const gradientStartX = body.position.x - normalizedDirX * body.circleRadius * 0.7;
        const gradientStartY = body.position.y - normalizedDirY * body.circleRadius * 0.7;
        const gradientEndX = body.position.x + normalizedDirX * body.circleRadius * 0.7;
        const gradientEndY = body.position.y + normalizedDirY * body.circleRadius * 0.7;
        
        let gradient;
        if (body.circleRadius) {
          gradient = ctx.createRadialGradient(
            gradientStartX, gradientStartY, body.circleRadius * 0.1,
            body.position.x, body.position.y, body.circleRadius * 1.1
          );
        } else {
          gradient = ctx.createLinearGradient(
            gradientStartX, gradientStartY,
            gradientEndX, gradientEndY
          );
        }
        
        // Extract color components for highlight and shadow
        let r = 0, g = 0, b = 0;
        const hexMatch = baseColor.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
        if (hexMatch) {
          r = parseInt(hexMatch[1], 16);
          g = parseInt(hexMatch[2], 16);
          b = parseInt(hexMatch[3], 16);
        }
        
        // Create lighter and darker versions
        const highlightColor = `rgb(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)})`;
        const shadowColor = `rgb(${Math.max(r - 40, 0)}, ${Math.max(g - 40, 0)}, ${Math.max(b - 40, 0)})`;
        
        gradient.addColorStop(0, highlightColor);
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, shadowColor);
        
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = body.render.fillStyle;
      }
      
      // Draw the shape
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      for (let j = 1; j < vertices.length; j++) {
        ctx.lineTo(vertices[j].x, vertices[j].y);
      }
      ctx.lineTo(vertices[0].x, vertices[0].y);
      ctx.closePath();
      ctx.fill();
      
      // Add highlight stroke for more 3D effect
      if (this.options.use3D && !body.isStatic) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
    });

    // Enhanced mouse constraint visualization with spring effect
    if (this.mouseConstraint && this.isMouseDown && this.mouseConstraint.body) {
      const mousePosition = this.mouseConstraint.mouse.position;
      const body = this.mouseConstraint.body;
      
      // Draw spring-like line
      ctx.beginPath();
      const steps = 12;
      const dx = (body.position.x - mousePosition.x) / steps;
      const dy = (body.position.y - mousePosition.y) / steps;
      
      ctx.moveTo(mousePosition.x, mousePosition.y);
      
      for (let i = 1; i <= steps; i++) {
        const x = mousePosition.x + dx * i;
        const y = mousePosition.y + dy * i;
        const offset = Math.sin(i / steps * Math.PI * 2) * 5;
        
        ctx.lineTo(
          x + offset * Math.cos(Math.atan2(dy, dx) + Math.PI/2),
          y + offset * Math.sin(Math.atan2(dy, dx) + Math.PI/2)
        );
      }
      
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw connection points
      ctx.beginPath();
      ctx.arc(mousePosition.x, mousePosition.y, 4, 0, Math.PI * 2);
      ctx.arc(body.position.x, body.position.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
    }
  }

  setMouse(mouseConstraint) {
    this.mouseConstraint = mouseConstraint;
    if (mouseConstraint) {
      mouseConstraint.mouse.element = this.canvas;
      mouseConstraint.mouse.pixelRatio = this.options.pixelRatio;
    }
  }
}