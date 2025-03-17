#!/usr/bin/env node

/**
 * Command-line tool to validate a player spritesheet data URI
 * 
 * This script uses the node-canvas package to validate image dimensions
 * without requiring a browser environment.
 */

// Check if canvas is installed
try {
  require('canvas');
} catch (e) {
  console.error('This script requires the "canvas" package.');
  console.error('Please install it using: npm install canvas');
  process.exit(1);
}

const fs = require('fs');
const { createCanvas, Image } = require('canvas');

/**
 * Validates a data URI for a player spritesheet
 * 
 * @param {string} dataUri - The data URI to validate
 * @returns {Promise<object>} - A promise that resolves with validation results
 */
function validatePlayerSpritesheet(dataUri) {
  return new Promise((resolve, reject) => {
    // Check if it's a PNG data URI
    if (!dataUri.startsWith('data:image/png;base64,')) {
      reject(new Error('Invalid data URI format. Expected a PNG image data URI.'));
      return;
    }

    // Create an image object
    const image = new Image();
    
    // Handle load errors
    image.onerror = () => {
      reject(new Error('Failed to load the image from the data URI.'));
    };
    
    // Set up validation on image load
    image.onload = () => {
      const validationResults = {
        isValid: true,
        errors: [],
        dimensions: {
          width: image.width,
          height: image.height
        }
      };
      
      // Check dimensions
      if (image.width !== 32) {
        validationResults.isValid = false;
        validationResults.errors.push(`Invalid width: ${image.width}px (expected 32px)`);
      }
      
      if (image.height !== 128) {
        validationResults.isValid = false;
        validationResults.errors.push(`Invalid height: ${image.height}px (expected 128px)`);
      }
      
      // Create a canvas to analyze the image content
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      
      // Additional checks could be added here to verify the content
      // For example, checking if there are non-transparent pixels in each frame
      
      resolve(validationResults);
    };
    
    // Set the image source to the data URI
    image.src = dataUri;
  });
}

/**
 * Main function to run the validation
 */
async function main() {
  // Check if a data URI was provided as an argument
  const args = process.argv.slice(2);
  let dataUri;
  
  if (args.length === 0) {
    console.error('Please provide a data URI as an argument or a file path with --file option');
    console.error('Usage:');
    console.error('  node validate-spritesheet-cli.js "data:image/png;base64,..."');
    console.error('  node validate-spritesheet-cli.js --file path/to/datauri.txt');
    process.exit(1);
  }
  
  // Check if the argument is a file path
  if (args[0] === '--file' && args[1]) {
    try {
      dataUri = fs.readFileSync(args[1], 'utf8').trim();
    } catch (error) {
      console.error(`Error reading file: ${error.message}`);
      process.exit(1);
    }
  } else {
    dataUri = args[0];
  }
  
  console.log('Validating player spritesheet data URI...');
  
  try {
    const results = await validatePlayerSpritesheet(dataUri);
    
    if (results.isValid) {
      console.log('\n✅ SUCCESS: The player spritesheet is valid!');
      console.log(`   Dimensions: ${results.dimensions.width}x${results.dimensions.height} pixels`);
    } else {
      console.error('\n❌ ERROR: The player spritesheet is invalid!');
      console.error('   Validation errors:');
      results.errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ ERROR: Failed to validate the player spritesheet');
    console.error(`   ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
