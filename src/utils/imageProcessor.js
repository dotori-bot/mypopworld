export async function getContourPath(imgUrl, xOffset, yOffset, width, height, margin = 10) {
  return new Promise((resolve) => {
    const fallbackPath = `M ${xOffset} ${yOffset + height/2} Q ${xOffset} ${yOffset} ${xOffset + width/2} ${yOffset} Q ${xOffset + width} ${yOffset} ${xOffset + width} ${yOffset + height/2} Q ${xOffset + width} ${yOffset + height} ${xOffset + width/2} ${yOffset + height} Q ${xOffset} ${yOffset + height} ${xOffset} ${yOffset + height/2} Z`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      let data;
      try {
        data = ctx.getImageData(0, 0, width, height).data;
      } catch (e) {
        // CORS error fallback
        resolve(fallbackPath);
        return;
      }

      // Find extremities of non-white pixels
      let minX = width, maxX = 0, minY = height, maxY = 0;
      // Also diagonals: x+y and x-y
      let minSum = width+height, maxSum = 0;
      let minDiff = width, maxDiff = -height;
      
      let p_minSum = [0,0], p_maxSum = [0,0], p_minDiff = [0,0], p_maxDiff = [0,0];
      let p_minX = [0,0], p_maxX = [0,0], p_minY = [0,0], p_maxY = [0,0];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx+1];
          const b = data[idx+2];
          const a = data[idx+3];
          
          // Consider pixel empty if it's transparent or very close to white
          const isWhite = (r > 240 && g > 240 && b > 240) || a < 50;
          
          if (!isWhite) {
            if (x < minX) { minX = x; p_minX = [x,y]; }
            if (x > maxX) { maxX = x; p_maxX = [x,y]; }
            if (y < minY) { minY = y; p_minY = [x,y]; }
            if (y > maxY) { maxY = y; p_maxY = [x,y]; }
            
            if (x+y < minSum) { minSum = x+y; p_minSum = [x,y]; }
            if (x+y > maxSum) { maxSum = x+y; p_maxSum = [x,y]; }
            
            if (x-y < minDiff) { minDiff = x-y; p_minDiff = [x,y]; }
            if (x-y > maxDiff) { maxDiff = x-y; p_maxDiff = [x,y]; }
          }
        }
      }

      if (minX === width) { // Image is blank/all white
        resolve(fallbackPath);
        return;
      }

      // Create 8-point polygon based on the extremes, ordered clockwise starting from Top-Left
      // p_minSum (TL), p_minY (Top), p_maxDiff (TR), p_maxX (Right), 
      // p_maxSum (BR), p_maxY (Bottom), p_minDiff (BL), p_minX (Left)
      
      // To create margin, we expand outward from the center
      const centerX = width / 2;
      const centerY = height / 2;
      
      const expand = (pt) => {
        let dx = pt[0] - centerX;
        let dy = pt[1] - centerY;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if(dist === 0) return [pt[0] + xOffset, pt[1] + yOffset];
        // Normalize and scale by margin
        let nx = dx / dist;
        let ny = dy / dist;
        return [pt[0] + nx * margin + xOffset, pt[1] + ny * margin + yOffset];
      };

      const pts = [
        expand(p_minSum),
        expand(p_minY),
        expand(p_maxDiff),
        expand(p_maxX),
        expand(p_maxSum),
        expand(p_maxY),
        expand(p_minDiff),
        expand(p_minX)
      ];

      // Draw SVG smooth path (Catmull-Rom or simple quadratic bezier connecting midpoints)
      let path = `M ${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
         path += ` L ${pts[i][0]} ${pts[i][1]}`;
      }
      path += ` Z`;
      
      resolve(path);
    };
    img.onerror = () => resolve(fallbackPath);
    img.src = imgUrl;
  });
}
