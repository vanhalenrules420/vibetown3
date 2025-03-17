/**
 * Validates a data URI for a player spritesheet
 * 
 * This function checks if a data URI meets the following requirements:
 * - It's a PNG image
 * - It has dimensions of 32x128 pixels
 * - It contains 4 frames of 32x32 pixels arranged vertically
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
      
      // Additional checks could be added here to verify the content of each frame
      // (would require canvas to analyze pixel data)
      
      resolve(validationResults);
    };
    
    // Set the image source to the data URI
    image.src = dataUri;
  });
}

/**
 * Tests a player spritesheet data URI and logs the results
 * 
 * @param {string} dataUri - The data URI to test
 */
async function testPlayerSpritesheet(dataUri) {
  console.log('Testing player spritesheet data URI...');
  
  try {
    const results = await validatePlayerSpritesheet(dataUri);
    
    if (results.isValid) {
      console.log('✅ SUCCESS: The player spritesheet is valid!');
      console.log(`   Dimensions: ${results.dimensions.width}x${results.dimensions.height} pixels`);
    } else {
      console.error('❌ ERROR: The player spritesheet is invalid!');
      console.error('   Validation errors:');
      results.errors.forEach(error => console.error(`   - ${error}`));
    }
  } catch (error) {
    console.error('❌ ERROR: Failed to validate the player spritesheet');
    console.error(`   ${error.message}`);
  }
}

// Example usage:
// const playerSpritesheetDataUri = 'data:image/png;base64,...'; // Your data URI here
// testPlayerSpritesheet(playerSpritesheetDataUri);

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validatePlayerSpritesheet,
    testPlayerSpritesheet
  };
}
