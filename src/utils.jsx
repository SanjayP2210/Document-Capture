

export const enhanceImage = (dataUrl) => {
    return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
 
    img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
 
      const ctx = canvas.getContext("2d");
 
      /* ⭐ Draw base */
        ctx.drawImage(img, 0, 0);
 
      /* ⭐ Get pixels */
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
 
      /* ⭐ Enhancement pipeline */
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];
 
        /* grayscale */
          const gray = 0.3 * r + 0.59 * g + 0.11 * b;
 
        /* contrast boost */
          const contrast = 1.4;
          const brightness = 10;
 
        const val = gray * contrast + brightness;
 
        data[i] = data[i + 1] = data[i + 2] = val;
        }
 
      ctx.putImageData(imageData, 0, 0);
 
      resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
    });

};
 

const enhanceCroppedCanvas = (canvas) => {
  const ctx = canvas.getContext("2d");
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  // ⭐ Calculate average brightness
  let avg = 0;
  for (let i = 0; i < data.length; i += 4) {
    avg += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  avg /= (data.length / 4);
  // ⭐ Adaptive parameters
  let alpha = 1.05; // contrast
  let beta = 5;     // brightness
  if (avg < 90) {
    alpha = 1.15;
    beta = 15;
  } else if (avg < 120) {
    alpha = 1.1;
    beta = 10;
  } else if (avg > 180) {
    alpha = 1.02;
    beta = 0;
  }
  // ⭐ Apply safely (prevent over exposure)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(240, data[i] * alpha + beta);
    data[i + 1] = Math.min(240, data[i + 1] * alpha + beta);
    data[i + 2] = Math.min(240, data[i + 2] * alpha + beta);
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
};
 

export const distance = (p1, p2) =>
    Math.hypot(p2.x - p1.x, p2.y - p1.y);

export const perspectiveCrop = (imageSrc, pts) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload =async () => {
      const [tl, tr, br, bl] = pts;
      // Output size calculations
      const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
      const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
      const maxWidth = Math.max(widthTop, widthBottom);
      const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
      const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);
      const maxHeight = Math.max(heightLeft, heightRight);
      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      const ctx = canvas.getContext("2d");
      /* ⭐ Helper to draw triangle without dashed lines */
      const drawTriangle = (sx0, sy0, sx1, sy1, sx2, sy2, dx0, dy0, dx1, dy1, dx2, dy2) => {
        ctx.save();
        // Just draw the triangle without clipping
        ctx.beginPath();
        ctx.moveTo(dx0, dy0);
        ctx.lineTo(dx1, dy1);
        ctx.lineTo(dx2, dy2);
        ctx.closePath();
        ctx.fillStyle = 'white'; // Or any other background color if needed
        ctx.fill();
        // Perform perspective transformation with these points
        const denom =
          sx0 * (sy1 - sy2) +
          sx1 * (sy2 - sy0) +
          sx2 * (sy0 - sy1);
        const m11 =
          (dx0 * (sy1 - sy2) +
            dx1 * (sy2 - sy0) +
            dx2 * (sy0 - sy1)) /
          denom;
        const m12 =
          (dx0 * (sx2 - sx1) +
            dx1 * (sx0 - sx2) +
            dx2 * (sx1 - sx0)) /
          denom;
        const m21 =
          (dy0 * (sy1 - sy2) +
            dy1 * (sy2 - sy0) +
            dy2 * (sy0 - sy1)) /
          denom;
        const m22 =
          (dy0 * (sx2 - sx1) +
            dy1 * (sx0 - sx2) +
            dy2 * (sx1 - sx0)) /
          denom;
        const dx =
          (dx0 * (sx1 * sy2 - sx2 * sy1) +
            dx1 * (sx2 * sy0 - sx0 * sy2) +
            dx2 * (sx0 * sy1 - sx1 * sy0)) /
          denom;
        const dy =
          (dy0 * (sx1 * sy2 - sx2 * sy1) +
            dy1 * (sx2 * sy0 - sx0 * sy2) +
            dy2 * (sx0 * sy1 - sx1 * sy0)) /
          denom;
        ctx.setTransform(m11, m21, m12, m22, dx, dy);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      };
      // ⭐ Triangle 1 (without the dashed line)
      drawTriangle(
        tl.x,
        tl.y,
        tr.x,
        tr.y,
        br.x,
        br.y,
        0,
        0,
        maxWidth,
        0,
        maxWidth,
        maxHeight
      );
      // ⭐ Triangle 2 (without the dashed line)
      drawTriangle(
        tl.x,
        tl.y,
        br.x,
        br.y,
        bl.x,
        bl.y,
        0,
        0,
        maxWidth,
        maxHeight,
        0,
        maxHeight
      );
      const result =await enhanceCroppedCanvas(canvas);
      resolve(result.toDataURL("image/jpeg", 0.95));
    };
  });
};
 
 