#!/bin/bash
# Generate placeholder PNG icons from SVG

if command -v convert &> /dev/null; then
    echo "Generating icons with ImageMagick..."
    convert -background none icon.svg -resize 16x16 icon-16.png
    convert -background none icon.svg -resize 48x48 icon-48.png
    convert -background none icon.svg -resize 128x128 icon-128.png
    echo "Icons generated successfully!"
elif command -v inkscape &> /dev/null; then
    echo "Generating icons with Inkscape..."
    inkscape icon.svg -w 16 -h 16 -o icon-16.png
    inkscape icon.svg -w 48 -h 48 -o icon-48.png
    inkscape icon.svg -w 128 -h 128 -o icon-128.png
    echo "Icons generated successfully!"
else
    echo "Neither ImageMagick nor Inkscape found."
    echo "Creating placeholder icons..."
    # Create simple placeholder files (will be replaced with actual icons)
    for size in 16 48 128; do
        echo "Please generate icon-${size}.png from icon.svg" > icon-${size}.png.txt
    done
    echo "Please install ImageMagick or Inkscape to generate proper icons."
fi
