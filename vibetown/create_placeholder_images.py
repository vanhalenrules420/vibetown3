from PIL import Image, ImageDraw
import os

def create_colored_square(filename, color, size=(32, 32)):
    """Create a colored square image and save it to the specified filename."""
    img = Image.new('RGB', size, color=color)
    draw = ImageDraw.Draw(img)
    
    # Draw a border
    border_color = 'black'
    draw.rectangle([(0, 0), (size[0]-1, size[1]-1)], outline=border_color)
    
    # Save the image
    img.save(filename)
    print(f"Created {filename}")

# Create player image (blue square)
create_colored_square('public/placeholder-player.png', 'blue')

# Create other player image (red square)
create_colored_square('public/placeholder-other-player.png', 'red')

print("Placeholder images created successfully!")
