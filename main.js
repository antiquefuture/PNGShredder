function loadImage(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
      reject(new Error('Invalid input, expected a File object.'));
      return;
    }

    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = URL.createObjectURL(file);
  });
}


async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    const img = await loadImage(event.target.result);
    createThumbnail(img, `thumbnail${input.id.slice(-1)}`);
    document.querySelector(`label[for="${input.id}"]`).textContent = file.name.substring(0, 25);
  };
  reader.readAsDataURL(file);
}

function createThumbnail(image, thumbnailId) {
  const thumbnail = document.getElementById(thumbnailId);
  thumbnail.width = 100;
  thumbnail.height = 100 * (image.height / image.width);
  const ctx = thumbnail.getContext('2d');
  ctx.drawImage(image, 0, 0, thumbnail.width, thumbnail.height);
}

function setRandomValues() {
  const gridSliders = document.querySelectorAll('.grid-slider');
  const weightSliders = document.querySelectorAll('.weight-slider');

  gridSliders.forEach((slider) => {
    const randomValue = Math.floor(Math.random() * (slider.max - slider.min + 1)) + parseInt(slider.min);
    slider.value = randomValue;
    const valueSpan = document.getElementById(`${slider.id}Value`);
    valueSpan.textContent = randomValue;
  });

  weightSliders.forEach((slider) => {
    const randomValue = Math.floor(Math.random() * (slider.max - slider.min + 1)) + parseInt(slider.min);
    slider.value = randomValue;
    const valueSpan = document.getElementById(`${slider.id}Value`);
    valueSpan.textContent = randomValue;
  });
}

function combineImages(images, gridSizes, weights) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxWidth = Math.max(...images.map((image) => image.width));
  const maxHeight = Math.max(...images.map((image) => image.height));

  canvas.width = maxWidth;
  canvas.height = maxHeight;

  const rects = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const gridSize = gridSizes[i];

    const tileWidth = Math.floor(img.width / gridSize);
    const tileHeight = Math.floor(img.height / gridSize);

    for (let x = 0; x < img.width; x += tileWidth) {
      for (let y = 0; y < img.height; y += tileHeight) {
        rects.push({ img, x, y, tileWidth, tileHeight, weight: weights[i] });
      }
    }
  }

  rects.sort(() => Math.random() - 0.5);

  let index = 0;
  for (let x = 0; x < maxWidth; x += rects[index].tileWidth) {
    for (let y = 0; y < maxHeight; y += rects[index].tileHeight) {
      if (index >= rects.length) break;

      const { img, x: tileX, y: tileY, tileWidth, tileHeight } = rects[index];
      ctx.drawImage(img, tileX, tileY, tileWidth, tileHeight, x, y, tileWidth, tileHeight);
      index++;
    }
  }

  return new Promise((resolve) => {
    const finalImage = new Image();
    finalImage.onload = () => {
      resolve(finalImage);
    };
    finalImage.src = canvas.toDataURL('image/png');
  });
}

function blendBezierImage(outputImage, bezierImage) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = outputImage.width;
  canvas.height = outputImage.height;

  ctx.drawImage(outputImage, 0, 0);

  ctx.globalCompositeOperation = 'source-atop';

  const numShapes = 30;

  for (let i = 0; i < numShapes; i++) {

    ctx.beginPath();
    ctx.moveTo(Math.random() * outputImage.width, Math.random() * outputImage.height);
    ctx.bezierCurveTo(
      Math.random() * outputImage.width,
      Math.random() * outputImage.height,
      Math.random() * outputImage.width,
      Math.random() * outputImage.height,
      Math.random() * outputImage.width,
      Math.random() * outputImage.height
    );
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(bezierImage, 0, 0, outputImage.width, outputImage.height);

    ctx.restore();
    ctx.save();
  }

  return new Promise((resolve) => {
    const blendedImage = new Image();
    blendedImage.onload = () => {
      resolve(blendedImage);
    };
    blendedImage.src = canvas.toDataURL('image/png');
  });
}

function drawFinalImage(image) {
  const canvas = document.getElementById('finalImage');
  const ctx = canvas.getContext('2d');
  canvas.width = image.width;
  canvas.height = image.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

document.getElementById('generate').addEventListener('click', async () => {
  const imageFiles = [
    document.getElementById('image1').files[0],
    document.getElementById('image2').files[0],
    document.getElementById('image3').files[0],
    document.getElementById('image4').files[0],
  ];

  const gridSizes = [
    parseInt(document.getElementById('gridSize1').value),
    parseInt(document.getElementById('gridSize2').value),
    parseInt(document.getElementById('gridSize3').value),
  ];

  const weights = [
    parseInt(document.getElementById('weight1').value),
    parseInt(document.getElementById('weight2').value),
    parseInt(document.getElementById('weight3').value),
  ];

  const images = await Promise.all(imageFiles.map(loadImage));

  const combinedImages = images.slice(0, 3);
  const bezierImage = images[3];
  const outputImage = await combineImages(combinedImages, gridSizes, weights);
  const blendedImage = await blendBezierImage(outputImage, bezierImage);

  drawFinalImage(blendedImage);
});

const gridSizeSliders = document.querySelectorAll('.grid-slider');
const weightSliders = document.querySelectorAll('.weight-slider');

gridSizeSliders.forEach((slider, index) => {
  slider.addEventListener('input', () => {
    document.getElementById(`gridSizeValue${index + 1}`).textContent = slider.value;
  });
});

weightSliders.forEach((slider, index) => {
  slider.addEventListener('input', () => {
    document.getElementById(`weightValue${index + 1}`).textContent = slider.value;
  });
});

document.getElementById('setRandomValues').addEventListener('click', setRandomValues);

const imageInputs = document.querySelectorAll('input[type="file"]');
imageInputs.forEach((input) => {
  input.addEventListener('change', () => handleImageUpload(input));
});
