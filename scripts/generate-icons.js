const fs = require('fs');
const path = require('path');

function createSvg(size) {
  const viewBoxSize = 128;
  const rectFill = '#1890ff';
  const char = '书';
  const fontSize = size * 0.47;
  const textY = size * 0.68;
  const radius = size * 0.156;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}">
  <rect width="${viewBoxSize}" height="${viewBoxSize}" rx="${radius}" fill="${rectFill}"/>
  <text x="64" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" text-anchor="middle">${char}</text>
</svg>`;
}

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'src/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createSvg(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.svg`), svg);
});

console.log('Icons generated:', sizes.map(s => `icon-${s}.svg`).join(', '));
