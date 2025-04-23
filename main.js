import Matter from 'https://cdn.skypack.dev/matter-js';
import { CanvasRenderer } from './renderer.js';

// Module aliases
const Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Mouse = Matter.Mouse,
  MouseConstraint = Matter.MouseConstraint,
  Grid = Matter.Grid,
  Events = Matter.Events;

// Create engine and world
const engine = Engine.create({
  positionIterations: 4, 
  velocityIterations: 3, 
  constraintIterations: 1,
  enableSleeping: true, 
});

const world = engine.world;

// Configure grid-based broad-phase collision detection
world.grid = Grid.create({
  bucketWidth: 100,
  bucketHeight: 100
});

// Configure engine
engine.gravity.y = 1;

// Create custom renderer with optimization flags
const renderer = new CanvasRenderer(document.body, engine, Matter, {
  width: window.innerWidth,
  height: window.innerHeight,
  background: '#f0f0f0',
  pixelRatio: window.devicePixelRatio,
  optimizeShadows: true,
  batchDrawing: true,
  use3D: true
});

// Create static bodies
const staticBodies = [
  Bodies.rectangle(window.innerWidth/2, window.innerHeight + 30, window.innerWidth, 60, { 
    isStatic: true,
    friction: 0.3,
    render: {
      fillStyle: '#2c3e50'
    }
  }),
  Bodies.rectangle(-30, window.innerHeight/2, 60, window.innerHeight, { 
    isStatic: true,
    friction: 0.3,
    render: {
      fillStyle: '#2c3e50'
    }
  }),
  Bodies.rectangle(window.innerWidth + 30, window.innerHeight/2, 60, window.innerHeight, { 
    isStatic: true,
    friction: 0.3,
    render: {
      fillStyle: '#2c3e50'
    }
  }),
  Bodies.rectangle(window.innerWidth/2, -30, window.innerWidth, 60, { 
    isStatic: true,
    friction: 0.3,
    render: {
      fillStyle: '#2c3e50'
    }
  })
];

const colors = [
  '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
  '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
];

// Create fewer, larger dynamic bodies
const dynamicBodies = [];
for (let i = 0; i < 15; i++) {
  const radius = Math.random() * 60 + 30; 
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const shape = Math.random() > 0.5 
    ? Bodies.circle(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        radius,
        {
          restitution: 0.6,
          friction: 0.1,
          density: 0.001,
          render: {
            fillStyle: color
          }
        }
      )
    : Bodies.polygon(
        Math.random() * window.innerWidth,
        Math.random() * window.innerHeight,
        Math.floor(Math.random() * 3) + 3, 
        radius,
        {
          restitution: 0.6,
          friction: 0.1,
          density: 0.001,
          render: {
            fillStyle: color
          }
        }
      );
  
  dynamicBodies.push(shape);
}

// Add bodies in batches
Composite.add(world, [...staticBodies, ...dynamicBodies]);

// Add mouse control with spring properties
const mouse = Mouse.create(renderer.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
  mouse: mouse,
  constraint: {
    stiffness: 0.1, // Reduced stiffness for springier feel
    damping: 0.1,   // Damping to prevent excessive oscillation
    length: 0.1,    // Short constraint length for responsive control
    render: {
      visible: true,
      lineWidth: 2,
      strokeStyle: 'rgba(0,0,0,0.2)',
      type: 'spring' // Enable spring visualization
    }
  }
});

// Add spring effect to mouse movement
Events.on(mouseConstraint, 'mousedown', function(event) {
  const mousePosition = event.mouse.position;
  const bodies = Matter.Query.point(dynamicBodies, mousePosition);
  
  if (bodies.length > 0) {
    const clickedBody = bodies[0];
    // Apply a slight impulse on click for feedback
    Matter.Body.applyForce(clickedBody, mousePosition, {
      x: (Math.random() - 0.5) * 0.001,
      y: (Math.random() - 0.5) * 0.001
    });
  }
});

Events.on(mouseConstraint, 'mousemove', function(event) {
  if (mouseConstraint.body) {
    const body = mouseConstraint.body;
    const mousePosition = event.mouse.position;
    
    // Add spring-like oscillation during drag
    const force = {
      x: (mousePosition.x - body.position.x) * 0.000015,
      y: (mousePosition.y - body.position.y) * 0.000015
    };
    
    Matter.Body.applyForce(body, body.position, force);
  }
});

renderer.setMouse(mouseConstraint);
Composite.add(world, mouseConstraint);

// Throttled resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    renderer.options.width = window.innerWidth;
    renderer.options.height = window.innerHeight;
    renderer.setSize();
    
    // Update static bodies positions
    staticBodies.forEach(body => {
      if (body.position.y > window.innerHeight) {
        Matter.Body.setPosition(body, { 
          x: window.innerWidth/2, 
          y: window.innerHeight + 30 
        });
      } else if (body.position.x < 0) {
        Matter.Body.setPosition(body, { 
          x: -30, 
          y: window.innerHeight/2 
        });
      } else if (body.position.x > window.innerWidth) {
        Matter.Body.setPosition(body, { 
          x: window.innerWidth + 30, 
          y: window.innerHeight/2 
        });
      } else {
        Matter.Body.setPosition(body, { 
          x: window.innerWidth/2, 
          y: -30 
        });
      }
    });
  }, 100);
});

// Create runner with fixed time step
const runner = Runner.create({
  isFixed: true,
  delta: 1000 / 60
});

// RAF with frame limiting
let lastTime = 0;
const frameInterval = 1000 / 60; 

function animate(currentTime) {
  requestAnimationFrame(animate);
  
  const deltaTime = currentTime - lastTime;
  
  if (deltaTime > frameInterval) {
    lastTime = currentTime - (deltaTime % frameInterval);
    renderer.render();
  }
}

// Run the engine
Runner.run(runner, engine);

// Start animation loop
animate(0);