const fs = require('fs');
const path = require('path');

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = Icon
  header.writeUInt16LE(images.length, 4); // Number of images

  const entries = [];
  let offset = 6 + (images.length * 16);

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset in file
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

const assetsDir = path.resolve(__dirname, '../assets');
const publicDir = path.resolve(__dirname, '../public');

const img310 = fs.readFileSync(path.join(assetsDir, 'Square310x310Logo.png'));
const img150 = fs.readFileSync(path.join(assetsDir, 'Square150x150Logo.png'));
const img44 = fs.readFileSync(path.join(assetsDir, 'Square44x44Logo.png'));
const imgStore = fs.readFileSync(path.join(assetsDir, 'StoreLogo.png'));

const images = [
  { width: 256, height: 256, buffer: img310 },
  { width: 128, height: 128, buffer: img150 },
  { width: 48, height: 48, buffer: imgStore },
  { width: 32, height: 32, buffer: img44 },
];

const icoBuffer = createIco(images);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuffer);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);

console.log(`Created icon.ico (${icoBuffer.length} bytes) successfully!`);
