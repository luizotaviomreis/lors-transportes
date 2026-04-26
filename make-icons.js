const fs = require('fs');
const zlib = require('zlib');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const cv = Buffer.allocUnsafe(4);
  cv.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  const lb = Buffer.allocUnsafe(4);
  lb.writeUInt32BE(data.length);
  return Buffer.concat([lb, tb, data, cv]);
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const row = Buffer.allocUnsafe(1 + size*3);
  row[0]=0;
  for (let i=0;i<size;i++){row[1+i*3]=r;row[2+i*3]=g;row[3+i*3]=b;}
  const raw = Buffer.concat(Array(size).fill(row));
  const comp = zlib.deflateSync(raw,{level:9});
  return Buffer.concat([sig,pngChunk('IHDR',ihdr),pngChunk('IDAT',comp),pngChunk('IEND',Buffer.alloc(0))]);
}

// #2d4a8a = 45, 74, 138
fs.writeFileSync('icon-192.png', makePNG(192, 45, 74, 138));
fs.writeFileSync('icon-512.png', makePNG(512, 45, 74, 138));
console.log('Ícones criados: icon-192.png e icon-512.png');
