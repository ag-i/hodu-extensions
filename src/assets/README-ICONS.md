# Extension Icons

This directory contains the extension icons in SVG format.

## Generating PNG Icons

You need to generate PNG icons from the SVG source before building the extension.

### Using ImageMagick (Linux/Mac):

```bash
# Install ImageMagick if not already installed
# Ubuntu/Debian: sudo apt-get install imagemagick
# Mac: brew install imagemagick

# Generate PNGs
convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 128x128 icon-128.png
```

### Using Online Tool:

1. Upload `icon.svg` to https://cloudconvert.com/svg-to-png
2. Convert to 16x16, 48x48, and 128x128 sizes
3. Save as `icon-16.png`, `icon-48.png`, `icon-128.png`

### Using Inkscape (Cross-platform):

```bash
inkscape icon.svg -w 16 -h 16 -o icon-16.png
inkscape icon.svg -w 48 -h 48 -o icon-48.png
inkscape icon.svg -w 128 -h 128 -o icon-128.png
```

## Note

For development, you can use placeholder icons or the SVG directly (some browsers support it).
