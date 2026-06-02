const sharp = require('sharp');
const iconDir = '/home/user/Stix/icons';

(async () => {
  const specs = [
    { src: 'icon.svg',          dest: 'icon-192.png',        size: 192 },
    { src: 'icon-maskable.svg', dest: 'icon-512.png',        size: 512 },
    { src: 'icon-maskable.svg', dest: 'apple-touch-icon.png',size: 180 },
    { src: 'icon.svg',          dest: 'favicon-32.png',      size: 32  },
  ];
  for (const s of specs) {
    await sharp(`${iconDir}/${s.src}`)
      .resize(s.size, s.size)
      .png()
      .toFile(`${iconDir}/${s.dest}`);
    console.log('Generated:', s.dest);
  }
  console.log('All icons generated successfully.');
})();
