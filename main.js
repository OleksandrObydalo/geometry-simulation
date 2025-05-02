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
function createGeometricBody(x, y, type = 'circle', radius = 50, width = 50, height = 50, sides = 6, futureColor = null) {
  const colors = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f',
    '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
  ];
  
  // Use futureColor if provided, otherwise use a random color
  const color = futureColor || colors[Math.floor(Math.random() * colors.length)];
  
  let shape;
  switch(type) {
    case 'circle':
      shape = Bodies.circle(x, y, radius);
      break;
    case 'ellipse':
      shape = Bodies.rectangle(x, y, width, height, {
        chamfer: { radius: 10 },
        render: {
          fillStyle: color,
          opacity: 1
        }
      });
      break;
    case 'polygon':
      shape = Bodies.polygon(x, y, sides, radius, {
        render: {
          fillStyle: color,
          opacity: 1
        }
      });
      break;
  }
  
  shape.restitution = 0.6;
  shape.friction = 0.1;
  shape.density = 0.001;
  shape.render.fillStyle = color;
  shape.render.opacity = 1;
  
  // Custom properties for individual control
  shape.customColor = color;
  shape.customOpacity = 1;
  shape.futureColor = futureColor; // Store the future color
  
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
    const futureColor = document.getElementById('colorPicker').value;
    
    let newBody;
    switch(geometryType) {
      case 'circle':
        const radius = parseFloat(document.getElementById('radiusInput').value);
        newBody = createGeometricBody(
          mousePosition.x, 
          mousePosition.y, 
          'circle', 
          radius,
          50,  // default width
          50,  // default height
          6,   // default sides
          futureColor  // pass the future color
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
          height,
          6,
          futureColor  // pass the future color
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
          sides,
          futureColor  // pass the future color
        );
        break;
    }
    
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

// Modify existing color picker event listener
document.getElementById('colorPicker').addEventListener('input', (event) => {
  const pickedColor = event.target.value;
  
  // Change color only for selected figures
  selectedFigures.forEach(selectedBody => {
    selectedBody.render.fillStyle = pickedColor;
    selectedBody.customColor = pickedColor;
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

// Modify the existing gravityInput event listener
document.getElementById('gravityInput').addEventListener('input', (event) => {
  const gravityValue = parseFloat(event.target.value);
  
  // Set the world's gravity
  engine.gravity.y = gravityValue;
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

// Add a new array to track selected figures
let selectedFigures = [];

// Add buttons for selecting and unselecting figures
const selectFigureBtn = document.createElement('button');
selectFigureBtn.textContent = 'Select Figure';
selectFigureBtn.classList.add('tool-btn');
selectFigureBtn.id = 'selectFigureBtn';

const unselectFigureBtn = document.createElement('button');
unselectFigureBtn.textContent = 'Unselect Figure';
unselectFigureBtn.classList.add('tool-btn');
unselectFigureBtn.id = 'unselectFigureBtn';

// Add the select and unselect buttons to the toolbox
const toolbox = document.getElementById('toolbox');
toolbox.appendChild(selectFigureBtn);
toolbox.appendChild(unselectFigureBtn);

// Add flags for selection modes
let selectMode = false;
let unselectMode = false;

// Event listener for select figure button
selectFigureBtn.addEventListener('click', () => {
  currentTool = null;
  selectMode = true;
  unselectMode = false;
  
  // Remove active states from other buttons
  document.getElementById('addBtn').classList.remove('active-tool');
  document.getElementById('deleteBtn').classList.remove('active-tool');
  document.getElementById('neutralBtn').classList.remove('active-tool');
  
  // Add active state to select button
  selectFigureBtn.classList.add('active-tool');
  unselectFigureBtn.classList.remove('active-tool');
});

// Event listener for unselect figure button
unselectFigureBtn.addEventListener('click', () => {
  currentTool = null;
  selectMode = false;
  unselectMode = true;
  
  // Remove active states from other buttons
  document.getElementById('addBtn').classList.remove('active-tool');
  document.getElementById('deleteBtn').classList.remove('active-tool');
  document.getElementById('neutralBtn').classList.remove('active-tool');
  
  // Add active state to unselect button
  unselectFigureBtn.classList.add('active-tool');
  selectFigureBtn.classList.remove('active-tool');
});

// Modify the mousedown event to handle figure selection
Events.on(mouseConstraint, 'mousedown', function(event) {
  const mousePosition = event.mouse.position;
  
  // If in select mode, add figures to selection
  if (selectMode) {
    const bodiesUnderMouse = Matter.Query.point(
      Composite.allBodies(world).filter(body => !body.isStatic), 
      mousePosition
    );
    
    if (bodiesUnderMouse.length > 0) {
      const bodyToSelect = bodiesUnderMouse[0];
      
      // Toggle selection (add or remove from selected figures)
      const index = selectedFigures.indexOf(bodyToSelect);
      if (index === -1) {
        selectedFigures.push(bodyToSelect);
        // Optional: Visual indication of selection
        bodyToSelect.render.strokeStyle = 'rgba(52, 152, 219, 0.7)';
        bodyToSelect.render.lineWidth = 3;
      } else {
        selectedFigures.splice(index, 1);
        // Remove visual indication
        bodyToSelect.render.strokeStyle = 'transparent';
        bodyToSelect.render.lineWidth = 0;
      }
    }
  } 
  // If in unselect mode, remove figures from selection
  else if (unselectMode) {
    const bodiesUnderMouse = Matter.Query.point(
      Composite.allBodies(world).filter(body => !body.isStatic), 
      mousePosition
    );
    
    if (bodiesUnderMouse.length > 0) {
      const bodyToUnselect = bodiesUnderMouse[0];
      
      const index = selectedFigures.indexOf(bodyToUnselect);
      if (index !== -1) {
        selectedFigures.splice(index, 1);
        // Remove visual indication
        bodyToUnselect.render.strokeStyle = 'transparent';
        bodyToUnselect.render.lineWidth = 0;
      }
    }
  }
  // Existing code for adding and deleting remains the same
  else if (currentTool === 'add') {
    const geometryType = document.getElementById('geometryTypeSelect').value;
    const futureColor = document.getElementById('colorPicker').value;
    
    let newBody;
    switch(geometryType) {
      case 'circle':
        const radius = parseFloat(document.getElementById('radiusInput').value);
        newBody = createGeometricBody(
          mousePosition.x, 
          mousePosition.y, 
          'circle', 
          radius,
          50,  // default width
          50,  // default height
          6,   // default sides
          futureColor  // pass the future color
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
          height,
          6,
          futureColor  // pass the future color
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
          sides,
          futureColor  // pass the future color
        );
        break;
    }
    
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

// Modify the neutral mode event listener to clear selections
neutralBtn.addEventListener('click', () => {
  currentTool = null;
  selectMode = false;
  unselectMode = false;
  
  // Clear selected figures and remove selection visual indicators
  selectedFigures.forEach(body => {
    body.render.strokeStyle = 'transparent';
    body.render.lineWidth = 0;
  });
  
  // Clear the selected figures array
  selectedFigures = [];
  
  // Update button states
  document.getElementById('addBtn').classList.remove('active-tool');
  document.getElementById('deleteBtn').classList.remove('active-tool');
  document.getElementById('selectFigureBtn').classList.remove('active-tool');
  document.getElementById('unselectFigureBtn').classList.remove('active-tool');
  neutralBtn.classList.add('active-tool');
});

// Add a new input for changing radius of selected circles
const radiusChangeInput = document.createElement('input');
radiusChangeInput.type = 'number';
radiusChangeInput.id = 'selectedCircleRadiusInput';
radiusChangeInput.classList.add('geometry-input');
radiusChangeInput.placeholder = 'Selected Circles Radius';
radiusChangeInput.min = '10';
radiusChangeInput.max = '200';

// Add the radius change input to the geometry controls
const geometryControls = document.getElementById('geometryControls');
geometryControls.appendChild(radiusChangeInput);

// Event listener for radius change input
radiusChangeInput.addEventListener('input', (event) => {
  const newRadius = parseFloat(event.target.value);
  
  // Filter only circle bodies from selected figures
  const selectedCircles = selectedFigures.filter(body => 
    body.circleRadius !== undefined
  );
  
  selectedCircles.forEach(circle => {
    // Remove the old body from the world
    Composite.remove(world, circle);
    
    // Create a new circle body with the updated radius
    const newCircle = Bodies.circle(
      circle.position.x, 
      circle.position.y, 
      newRadius, 
      {
        restitution: circle.restitution,
        friction: circle.friction,
        density: circle.density,
        render: {
          fillStyle: circle.render.fillStyle,
          opacity: circle.render.opacity
        }
      }
    );
    
    // Copy over any custom properties
    newCircle.customColor = circle.customColor;
    newCircle.customOpacity = circle.customOpacity;
    
    // Add the new circle to the world
    Composite.add(world, newCircle);
    
    // If this circle was selected, add it to selected figures
    const index = selectedFigures.indexOf(circle);
    if (index !== -1) {
      selectedFigures[index] = newCircle;
    }
  });
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