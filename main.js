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

let currentTool = null;
let deletionMode = false;

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

// Modify createGeometricBody function to support multiple shape types
function createGeometricBody(x, y, type = 'circle', radius = 50, width = 50, height = 50, sides = 6) {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
  ];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  let shape;
  switch(type) {
    case 'circle':
      shape = Bodies.circle(x, y, radius);
      break;
    case 'ellipse':
      shape = Bodies.rectangle(x, y, width, height, {
        chamfer: { radius: 10 },  // Rounded corners for softer look
        render: {
          fillStyle: color,
          opacity: 1  // Ensure full opacity
        }
      });
      break;
    case 'polygon':
      shape = Bodies.polygon(x, y, sides, radius, {
        render: {
          fillStyle: color,
          opacity: 1  // Ensure full opacity
        }
      });
      break;
  }
  
  shape.restitution = 0.6;
  shape.friction = 0.1;
  shape.density = 0.001;
  shape.render.fillStyle = color;
  shape.render.opacity = 1;  // Explicitly set opacity to 1
  
  // Add custom properties for individual control
  shape.customColor = color;
  shape.customOpacity = 1;
  
  return shape;
}

// Modify the color and opacity update functions to work individually
const colorPalettes = [
  ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'],
  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', '#6C5CE7', '#A8E6CF', '#FF8ED4', '#FAD390'],
  ['#6A11CB', '#2575FC', '#FF868E', '#8EC5FC', '#E0C3FC', '#B9FFFC', '#FFD3A5', '#FD6585']
];
let currentPaletteIndex = 0;

const opacityLevels = [1, 0.8, 0.6, 0.4, 0.2];
let currentOpacityIndex = 0;

function updateBodyColors() {
  const colors = colorPalettes[currentPaletteIndex];
  const dynamicBodies = Composite.allBodies(world)
    .filter(body => !body.isStatic);
  
  dynamicBodies.forEach((body, index) => {
    body.customColor = colors[index % colors.length];
    body.render.fillStyle = body.customColor;
  });
  
  // Cycle to next palette
  currentPaletteIndex = (currentPaletteIndex + 1) % colorPalettes.length;
}

function updateBodyOpacity() {
  const opacity = opacityLevels[currentOpacityIndex];
  const dynamicBodies = Composite.allBodies(world)
    .filter(body => !body.isStatic);
  
  dynamicBodies.forEach(body => {
    body.customOpacity = opacity;
    body.render.opacity = opacity;
  });
  
  // Cycle to next opacity level
  currentOpacityIndex = (currentOpacityIndex + 1) % opacityLevels.length;
}

// Add a function to reset the world
function resetWorld() {
  // Clear existing bodies
  Composite.clear(world, false);
  
  // Recreate static bodies
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

  const dynamicBodies = [];
  for (let i = 0; i < 15; i++) {
    const body = createGeometricBody(
      Math.random() * window.innerWidth,
      Math.random() * window.innerHeight
    );
    
    // Ensure body is not invisible
    body.render.opacity = Math.max(body.render.opacity, 0.1);
    dynamicBodies.push(body);
  }

  // Add bodies back to the world
  Composite.add(world, [...staticBodies, ...dynamicBodies]);
  
  // Reset mouse constraint
  Composite.remove(world, mouseConstraint);
  Composite.add(world, mouseConstraint);
}

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

const dynamicBodies = [];
for (let i = 0; i < 15; i++) {
  const body = createGeometricBody(
    Math.random() * window.innerWidth,
    Math.random() * window.innerHeight
  );
  
  // Ensure body is not invisible
  body.render.opacity = Math.max(body.render.opacity, 0.1);
  dynamicBodies.push(body);
}

// Add bodies in batches
Composite.add(world, [...staticBodies, ...dynamicBodies]);

// Create mouse control with spring properties
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

// Modify the existing mouse event listeners
Events.on(mouseConstraint, 'mousedown', function(event) {
  const mousePosition = event.mouse.position;
  
  if (currentTool === 'add') {
    const geometryType = document.getElementById('geometryTypeSelect').value;
    const customColor = document.getElementById('colorPicker').value;
    
    let newBody;
    switch(geometryType) {
      case 'circle':
        const radius = parseFloat(document.getElementById('radiusInput').value);
        newBody = createGeometricBody(
          mousePosition.x, 
          mousePosition.y, 
          'circle', 
          radius
        );
        break;
      case 'ellipse':
        const width = parseFloat(document.getElementById('widthInput').value);
        const height = parseFloat(document.getElementById('heightInput').value);
        newBody = createGeometricBody(
          mousePosition.x, 
          mousePosition.y, 
          'ellipse', 
          50, 
          width, 
          height
        );
        break;
      case 'polygon':
        const polygonRadius = parseFloat(document.getElementById('radiusInput').value);
        const sides = parseFloat(document.getElementById('polygonSidesInput').value);
        newBody = createGeometricBody(
          mousePosition.x, 
          mousePosition.y, 
          'polygon', 
          polygonRadius, 
          50, 
          50, 
          sides
        );
        break;
    }
    
    // Override the body's color with the selected color
    newBody.render.fillStyle = customColor;
    newBody.customColor = customColor;
    
    Composite.add(world, newBody);
  } else if (currentTool === 'delete') {
    const bodiesUnderMouse = Matter.Query.point(
      Composite.allBodies(world).filter(body => !body.isStatic), 
      mousePosition
    );
    
    if (bodiesUnderMouse.length > 0) {
      Composite.remove(world, bodiesUnderMouse[0]);
    }
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

// Modify the button event listeners to include a "neutral" state
document.getElementById('addBtn').addEventListener('click', () => {
  currentTool = 'add';
  document.getElementById('addBtn').classList.add('active-tool');
  document.getElementById('deleteBtn').classList.remove('active-tool');
});

document.getElementById('deleteBtn').addEventListener('click', () => {
  currentTool = 'delete';
  document.getElementById('deleteBtn').classList.add('active-tool');
  document.getElementById('addBtn').classList.remove('active-tool');
});

// Add a new button for neutral mode
const neutralBtn = document.createElement('button');
neutralBtn.textContent = 'Neutral Mode';
neutralBtn.classList.add('tool-btn');
neutralBtn.id = 'neutralBtn';

// Add the neutral button to the toolbox
document.getElementById('toolbox').appendChild(neutralBtn);

// Add event listener for neutral mode
neutralBtn.addEventListener('click', () => {
  currentTool = null;
  document.getElementById('addBtn').classList.remove('active-tool');
  document.getElementById('deleteBtn').classList.remove('active-tool');
  neutralBtn.classList.add('active-tool');
});

// Add event listeners for color and opacity buttons
document.getElementById('changeColorBtn').addEventListener('click', updateBodyColors);
document.getElementById('changeTransparencyBtn').addEventListener('click', updateBodyOpacity);

// Add event listeners for individual color and opacity controls
document.getElementById('colorPicker').addEventListener('input', (event) => {
  const color = event.target.value;
  const dynamicBodies = Composite.allBodies(world)
    .filter(body => !body.isStatic);
  
  dynamicBodies.forEach(body => {
    body.customColor = color;
    body.render.fillStyle = color;
  });
});

document.getElementById('opacitySlider').addEventListener('input', (event) => {
  const opacity = parseFloat(event.target.value);
  const dynamicBodies = Composite.allBodies(world)
    .filter(body => !body.isStatic);
  
  dynamicBodies.forEach(body => {
    body.customOpacity = opacity;
    body.render.opacity = opacity;
  });
});

// Modify event listener for geometry type to show/hide appropriate inputs
document.getElementById('geometryTypeSelect').addEventListener('change', (event) => {
  const type = event.target.value;
  const radiusInput = document.getElementById('radiusInput');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const polygonSidesInput = document.getElementById('polygonSidesInput');
  
  switch(type) {
    case 'circle':
      radiusInput.style.display = 'block';
      widthInput.style.display = 'none';
      heightInput.style.display = 'none';
      polygonSidesInput.style.display = 'none';
      break;
    case 'ellipse':
      radiusInput.style.display = 'none';
      widthInput.style.display = 'block';
      heightInput.style.display = 'block';
      polygonSidesInput.style.display = 'none';
      break;
    case 'polygon':
      radiusInput.style.display = 'block';
      widthInput.style.display = 'none';
      heightInput.style.display = 'block';
      polygonSidesInput.style.display = 'block';
      break;
  }
});

// Add event listener for space key to restart the simulation
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault(); // Prevent space from scrolling
    resetWorld();
  }
});

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