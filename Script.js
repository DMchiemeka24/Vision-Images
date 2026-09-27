const uploadInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const formatSelect = document.getElementById('formatSelect');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockAspect = document.getElementById('lockAspect');
const processBtn = document.getElementById('processBtn');
const downloadBtn = document.getElementById('downloadBtn');
const beforeImage = document.getElementById('beforeImage');
const afterImage = document.getElementById('afterImage');
const afterLayer = document.getElementById('afterLayer');
const compareSlider = document.getElementById('compareSlider');
const compareHandle = document.getElementById('compareHandle');
const statusBadge = document.getElementById('statusBadge');
const originalInfo = document.getElementById('originalInfo');
const outputInfo = document.getElementById('outputInfo');
const dimensionInfo = document.getElementById('dimensionInfo');

let sourceImage = null;
let originalFile = null;
let lastUrl = null;

qualityRange.addEventListener('input', () => {
  qualityValue.textContent = `${qualityRange.value}%`;
});

uploadInput.addEventListener('change', (event) => handleFileSelection(event.target.files[0]));
processBtn.addEventListener('click', processImage);
compareSlider.addEventListener('input', updateComparisonView);

widthInput.addEventListener('input', () => {
  if (!sourceImage || !lockAspect.checked) return;
  const ratio = sourceImage.height / sourceImage.width;
  heightInput.value = Math.round(Number(widthInput.value) * ratio);
});

heightInput.addEventListener('input', () => {
  if (!sourceImage || !lockAspect.checked) return;
  const ratio = sourceImage.width / sourceImage.height;
  widthInput.value = Math.round(Number(heightInput.value) * ratio);
});

['dragenter', 'dragover'].forEach((type) => {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((type) => {
  dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
  });
});

dropZone.addEventListener('drop', (event) => {
  const file = event.dataTransfer.files[0];
  handleFileSelection(file);
});

function handleFileSelection(file) {
  if (!file || !file.type.startsWith('image/')) {
    statusBadge.textContent = 'Invalid image';
    statusBadge.className = 'status-badge neutral';
    return;
  }

  originalFile = file;
  const reader = new FileReader();

  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      beforeImage.src = reader.result;
      afterImage.src = reader.result;
      widthInput.value = img.width;
      heightInput.value = img.height;
      originalInfo.textContent = `${formatFileSize(file.size)} • ${img.width}×${img.height}`;
      outputInfo.textContent = 'Ready';
      dimensionInfo.textContent = `${img.width}×${img.height}`;
      statusBadge.textContent = 'Image loaded';
      statusBadge.className = 'status-badge success';
      compareSlider.value = 50;
      updateComparisonView();
    };

    img.src = reader.result;
  };

  reader.readAsDataURL(file);
}

function updateComparisonView() {
  const value = Number(compareSlider.value);
  afterLayer.style.width = `${value}%`;
  compareHandle.style.left = `${value}%`;
}

function processImage() {
  if (!sourceImage || !originalFile) {
    statusBadge.textContent = 'Choose an image first';
    statusBadge.className = 'status-badge neutral';
    return;
  }

  const desiredWidth = Math.max(1, Number(widthInput.value) || sourceImage.width);
  const desiredHeight = Math.max(1, Number(heightInput.value) || sourceImage.height);
  const quality = Number(qualityRange.value) / 100;
  const mimeType = formatSelect.value;

  const canvas = document.createElement('canvas');
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;

  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);

  if (mimeType === 'image/png') {
    canvas.toBlob((result) => finishProcessing(result), 'image/png');
    return;
  }

  canvas.toBlob((result) => finishProcessing(result), mimeType, quality);
}

function finishProcessing(blob) {
  if (!blob) {
    statusBadge.textContent = 'Processing failed';
    statusBadge.className = 'status-badge neutral';
    return;
  }

  if (lastUrl) {
    URL.revokeObjectURL(lastUrl);
  }

  lastUrl = URL.createObjectURL(blob);
  afterImage.src = lastUrl;

  const extension = formatSelect.value === 'image/jpeg' ? 'jpg' : formatSelect.value === 'image/webp' ? 'webp' : 'png';
  const fileName = (originalFile.name.split('.')[0] || 'compressed-image') + `-optimized.${extension}`;

  outputInfo.textContent = `${formatFileSize(blob.size)} • ${extension.toUpperCase()}`;
  dimensionInfo.textContent = `${widthInput.value}×${heightInput.value}`;
  downloadBtn.href = lastUrl;
  downloadBtn.download = fileName;
  downloadBtn.hidden = false;
  statusBadge.textContent = 'Image processed';
  statusBadge.className = 'status-badge success';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

updateComparisonView();
