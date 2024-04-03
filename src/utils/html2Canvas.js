import html2canvas from "html2canvas";

export const captureScreenshot = async () => {
  const canvasElement = document.querySelectorAll(".mapView")[0];
  return html2canvas(canvasElement, {
    useCORS: true,
    allowTaint: true,
  }).then(function (canvas) {
    // Convert the canvas to an image URL
    // resize
    const resizedCanvas = document.createElement("canvas");
    const resizedContext = resizedCanvas.getContext("2d");
    const scale = 1; // Resize scale (0.5 = 50% of the original size)
    resizedCanvas.width = canvas.width * scale;
    resizedCanvas.height = canvas.height * scale;
    resizedContext.drawImage(
      canvas,
      0,
      0,
      resizedCanvas.width,
      resizedCanvas.height
    );
    // crop
    const croppedCanvas = document.createElement("canvas");
    const croppedContext = croppedCanvas.getContext("2d");
    const cropX = canvas.width * (1 - scale) // 0 //100; // Crop starting X position
    const cropY = 0 //100; // Crop starting Y position
    const cropWidth = resizedCanvas.width; // 250; // Crop width
    const cropHeight = resizedCanvas.height; // 250; // Crop height
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    croppedContext.drawImage(
      canvas,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    const imgURL = croppedCanvas.toDataURL();
    return imgURL;
  });
};
