export async function getContourPath(imgUrl, xOffset, yOffset, width, height, margin = 10) {
  return new Promise((resolve) => {
    const fallbackPath = `M ${xOffset} ${yOffset + height/2} Q ${xOffset} ${yOffset} ${xOffset + width/2} ${yOffset} Q ${xOffset + width} ${yOffset} ${xOffset + width} ${yOffset + height/2} Q ${xOffset + width} ${yOffset + height} ${xOffset + width/2} ${yOffset + height} Q ${xOffset} ${yOffset + height} ${xOffset} ${yOffset + height/2} Z`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Downscale slightly for performance and noise reduction
      const scale = 0.5;
      const w = Math.floor(width * scale);
      const h = Math.floor(height * scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      
      let data;
      try {
        data = ctx.getImageData(0, 0, w, h).data;
      } catch (e) {
        resolve(fallbackPath);
        return;
      }

      // Create binary mask
      const mask = new Uint8Array(w * h);
      let startX = -1, startY = -1;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
          const isWhite = (r > 240 && g > 240 && b > 240) || a < 50;
          if (!isWhite) {
            mask[y * w + x] = 1;
            if (startX === -1) { startX = x; startY = y; }
          }
        }
      }

      if (startX === -1) { resolve(fallbackPath); return; }

      // Moore Neighborhood Tracing
      const dirs = [[1,0], [1,1], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1]];
      let boundary = [];
      let cx = startX, cy = startY;
      let dir = 7; // Start looking "up-left"
      
      let iters = 0;
      do {
        boundary.push([cx, cy]);
        let found = false;
        // Search neighbors clockwise starting from (dir + 2) % 8
        for (let i = 0; i < 8; i++) {
          let ndir = (dir + 2 + i) % 8;
          let nx = cx + dirs[ndir][0];
          let ny = cy + dirs[ndir][1];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && mask[ny * w + nx]) {
            cx = nx; cy = ny;
            dir = ndir;
            found = true;
            break;
          }
        }
        if (!found) break; // Isolated pixel
        iters++;
        if (iters > 10000) break; // Safety break
      } while (cx !== startX || cy !== startY);

      if (boundary.length < 10) { resolve(fallbackPath); return; }

      // Simplify polygon (keep every Nth point to smooth and reduce jaggedness)
      const step = Math.max(2, Math.floor(boundary.length / 40));
      let simple = [];
      for (let i = 0; i < boundary.length; i += step) {
        simple.push(boundary[i]);
      }

      // Offset (Inflate) and scale back up
      const scaledMargin = margin; 
      let inflated = [];
      const n = simple.length;
      for (let i = 0; i < n; i++) {
        let pPrev = simple[(i - 1 + n) % n];
        let pCurr = simple[i];
        let pNext = simple[(i + 1) % n];
        
        let dx = pNext[0] - pPrev[0];
        let dy = pNext[1] - pPrev[1];
        let len = Math.sqrt(dx*dx + dy*dy);
        if (len === 0) continue;
        
        // Normal vector (rotate 90 deg)
        let nx = -dy / len;
        let ny = dx / len;
        
        // Scale back up to original size and apply offset
        let finalX = (pCurr[0] / scale) + nx * scaledMargin + xOffset;
        let finalY = (pCurr[1] / scale) + ny * scaledMargin + yOffset;
        inflated.push([finalX, finalY]);
      }

      // Convert to SVG Path using Catmull-Rom or simple Bezier
      // We will use simple quadratic curves between midpoints for natural rounded corners
      let path = "";
      if (inflated.length > 2) {
        // midpoints
        let mids = [];
        for (let i = 0; i < inflated.length; i++) {
          let p1 = inflated[i];
          let p2 = inflated[(i + 1) % inflated.length];
          mids.push([(p1[0]+p2[0])/2, (p1[1]+p2[1])/2]);
        }
        
        path = `M ${mids[0][0]} ${mids[0][1]}`;
        for (let i = 0; i < inflated.length; i++) {
          let pControl = inflated[(i + 1) % inflated.length];
          let pEnd = mids[(i + 1) % inflated.length];
          path += ` Q ${pControl[0]} ${pControl[1]} ${pEnd[0]} ${pEnd[1]}`;
        }
        path += ` Z`;
      } else {
        resolve(fallbackPath); return;
      }
      
      resolve(path);
    };
    img.onerror = () => resolve(fallbackPath);
    img.src = imgUrl;
  });
}
