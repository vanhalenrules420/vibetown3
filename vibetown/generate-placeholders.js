import fs from 'fs';
import { createCanvas } from 'canvas';

// Function to create a colored square image
function createPlaceholderImage(filename, color, size = 32) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill with background color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  
  // Add a border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, size - 4, size - 4);
  
  // Convert to PNG buffer
  const buffer = canvas.toBuffer('image/png');
  
  // Write to file
  fs.writeFileSync(filename, buffer);
  console.log(`Created ${filename}`);
}

// Create player placeholder (blue)
createPlaceholderImage('placeholder-player.png', '#3498db');

// Create other player placeholder (red)
createPlaceholderImage('placeholder-other-player.png', '#e74c3c');

console.log('Placeholder images created successfully');
