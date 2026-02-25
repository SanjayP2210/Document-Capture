// getCroppedImg.js

export default function getCroppedImg(imageSrc, pixelCrop, rotation = 0) {
  const image = new Image();
  image.setAttribute("crossOrigin", "anonymous");
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const radians = (rotation * Math.PI) / 180;

      // Set canvas size
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.save();

      if (rotation !== 0) {
        // Move to center
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(radians);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      ctx.restore();

      resolve(canvas.toDataURL("image/jpeg", 0.95));
    };

    image.onerror = (err) => reject(err);
  });
}