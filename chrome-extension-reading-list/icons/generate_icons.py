#!/usr/bin/env python3
"""Generate simple PNG icons for the Chrome Extension"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os

    def create_icon(size, output_path):
        """Create a simple gradient icon with a book emoji"""
        # Create image with gradient background
        img = Image.new('RGB', (size, size), color='#667eea')
        draw = ImageDraw.Draw(img)

        # Create a simple gradient effect
        for y in range(size):
            r = int(102 + (118 - 102) * y / size)
            g = int(126 + (75 - 126) * y / size)
            b = int(234 + (162 - 234) * y / size)
            draw.rectangle([0, y, size, y + 1], fill=(r, g, b))

        # Draw a simple book shape
        book_color = (255, 255, 255, 255)
        margin = int(size * 0.2)

        # Book rectangle
        draw.rectangle(
            [margin, margin, size - margin, size - margin],
            fill=book_color
        )

        # Book spine
        spine_x = size // 2
        draw.rectangle(
            [spine_x - 1, margin, spine_x + 1, size - margin],
            fill=(200, 200, 200)
        )

        img.save(output_path)
        print(f"Created {output_path}")

    # Generate icons
    script_dir = os.path.dirname(os.path.abspath(__file__))
    create_icon(16, os.path.join(script_dir, 'icon16.png'))
    create_icon(48, os.path.join(script_dir, 'icon48.png'))
    create_icon(128, os.path.join(script_dir, 'icon128.png'))

    print("\nIcons generated successfully!")

except ImportError:
    print("PIL/Pillow not installed. Install with: pip install Pillow")
    print("Or use the generate-icons.html file to create icons manually.")
