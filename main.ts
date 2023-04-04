const video = document.getElementById('video') as HTMLVideoElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d', {
  willReadFrequently: true
}) as CanvasRenderingContext2D;

function random(range: number) {
  return Math.floor(Math.random() * range);
}

class Color {
  r: number;
  g: number;
  b: number;
  constructor(r: number, g: number, b: number) {
    this.r = r;
    this.g = g;
    this.b = b;
  }
}

const maxWiggleAmount = 5;
const drawing = true;
// const drawing = false;
const highlightColor = !drawing ? new Color(255, 0, 0) : new Color(255, 255, 255);

navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    console.log('Error accessing webcam:', err);
  });

let prev = new Uint8ClampedArray();

function inRangeOf(val: number, target: number, range: number) {
  return target <= val + range && target >= val - range;
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null;

  return function debounced(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    clearTimeout(timeout || undefined);
    timeout = setTimeout(later, wait);
  };
}

let moving = false;

function setNotMoving() {
  const el = document.getElementById('moving');
  if (el) {
    el.classList.remove('moving');
    el.classList.add('not-moving');
  }
  moving = false;
}

const debounceMoving = debounce(setNotMoving, 600);

function mutateData(pixels: Uint8ClampedArray) {
  const diffRange = 20;
  const copy = new Uint8ClampedArray(pixels);
  let moving = false;
  for (let i = 0; i < pixels.length; i += 4) {
    if (
      !inRangeOf(pixels[i], prev[i], diffRange) ||
      !inRangeOf(pixels[i + 1], prev[i + 1], diffRange) ||
      !inRangeOf(pixels[i + 2], prev[i + 2], diffRange)
    ) {
      if (!moving) {
        const el = document.getElementById('moving');
        if (el) {
          el.classList.remove('not-moving');
          el.classList.add('moving');
        }
        debounceMoving();
      } else {
      }
      moving = true;
      pixels[i] = 255 - (i / pixels.length) * 255;
      pixels[i + 1] = (i / pixels.length) * 255;
      pixels[i + 2] = (i / pixels.length) * 255;
    } else {
      if (drawing) {
        pixels[i] = 0;
        pixels[i + 1] = 0;
        pixels[i + 2] = 0;
      }
    }
    // const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
    // pixels[i] = avg;
    // pixels[i + 1] = avg;
    // pixels[i + 2] = avg;
  }
  prev = copy;

  return new ImageData(pixels, canvas.width, canvas.height);
}

function getFrame() {
  canvas.width = video.width;
  canvas.height = video.height;

  if (drawing) {
    ctx.drawImage(
      video,
      -random(maxWiggleAmount / 2) - maxWiggleAmount,
      -random(maxWiggleAmount / 2) - maxWiggleAmount,
      canvas.width + maxWiggleAmount * 2,
      canvas.height + maxWiggleAmount * 2
    );
  } else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  if (drawing) {
    const prevData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    prev = new Uint8ClampedArray(prevData.data);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const newData = mutateData(imageData.data);

  ctx.putImageData(newData, 0, 0);

  window.requestAnimationFrame(getFrame);
}

video.addEventListener('canplay', () => {
  // canvas.width = video.width * devicePixelRatio;
  // canvas.height = video.height * devicePixelRatio;
  // canvas.style.width = video.width + 'px';
  // canvas.style.height = video.height + 'px';
  window.requestAnimationFrame(getFrame);
});
