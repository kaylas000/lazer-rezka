// Сжатие изображений в WebP + responsive sizes
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');

async function compressDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await compressDir(fullPath);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    const baseName = path.basename(entry.name, ext);
    const outDir = path.dirname(fullPath);
    const webpPath = path.join(outDir, baseName + '.webp');

    // Skip if WebP already exists and is newer
    if (fs.existsSync(webpPath)) {
      const srcStat = fs.statSync(fullPath);
      const dstStat = fs.statSync(webpPath);
      if (dstStat.mtime > srcStat.mtime) continue;
    }

    try {
      // WebP — основной формат
      await sharp(fullPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(webpPath);

      // Оптимизированный JPEG (если был JPEG)
      if (['.jpg', '.jpeg'].includes(ext)) {
        await sharp(fullPath)
          .jpeg({ quality: 82, progressive: true, mozjpeg: true })
          .toFile(fullPath + '.tmp');
        fs.renameSync(fullPath + '.tmp', fullPath);
      }

      const srcSize = (fs.statSync(fullPath).size / 1024).toFixed(0);
      const dstSize = (fs.statSync(webpPath).size / 1024).toFixed(0);
      console.log(`OK  ${path.relative(IMAGES_DIR, fullPath)}  ${srcSize}KB → ${dstSize}KB WebP (${((1 - dstSize/srcSize)*100).toFixed(0)}% save)`);
    } catch (err) {
      console.error(`ERR ${fullPath}: ${err.message}`);
    }
  }
}

compressDir(IMAGES_DIR).then(() => console.log('Done.'));
