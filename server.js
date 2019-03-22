const cluster = require('cluster');
const { cpus } = require('os');
const moment = require('moment');
const isMaster = cluster.isMaster;
const numWorkers = cpus().length;
const PNG = require('pngjs').PNG;
const fs = require('fs');

const xderivatives = [
  [-1, -2, -1],
  [0, 0, 0],
  [1, 2, 1]
];

const yderivatives = [
  [-1, 0, 1],
  [-2, 0, 2],
  [-1, 0, 1]
];

const timeData = {
  startRead: moment().valueOf(),
  endRead: 0,
  endProcess: 0
};

function getBump(x, y) {
  let xbump = 0;
  let ybump = 0;
  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const idx = getIndex(x + xOffset, y + yOffset);
      let colorWeights = 0;
      for (let color = 0; color <= 2; color++) {
        if (png.data[idx + color]) {
          colorWeights += png.data[idx + color]
        } else {
          return 0;
        }
      }
      const greyscale = Math.floor(colorWeights / 3);
      xbump += greyscale * xderivatives[yOffset + 1][xOffset + 1];
      ybump += greyscale * yderivatives[yOffset + 1][xOffset + 1];
    }
  }
  const bump = Math.floor(Math.sqrt(Math.pow(xbump, 2) + Math.pow(ybump, 2)) / 3);
  return bump;
}

function getIndex(x, y) {
  return (png.width * y + x) << 2;
}

function printStats() {
  const loadTime = timeData.endRead - timeData.startRead;
  const processTime = timeData.endProcess - timeData.endRead;
  console.log('Loaded in ' + loadTime + 'ms, processed in ' + processTime + 'ms (' + numberWithCommas(Math.floor((png.width * png.height) / processTime) * 1000) + ' pixels/s)');
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const png = new PNG({
  filterType: -1
});

let src, dst;

function exportPng(newData) {
  png.data = newData;
  png.pack().pipe(dst);
}

function sobel() {
  timeData.endRead = moment().valueOf();
  const newData = new Buffer.alloc(png.width * png.height * 4);

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const index = getIndex(x, y);
      const bump = getBump(x, y);
      for (let color = 0; color <= 2; color++) {
        newData[index + color] = bump;
      }
      newData[index + 3] = 255;
    }
  }
  timeData.endProcess = moment().valueOf();
  exportPng(newData);
  printStats();
}

function processImage(inputImage, outputImage) {

  try {
    if (fs.lstatSync(inputImage).isFile()) {
      src = fs.createReadStream(inputImage);
    } else {
      console.log(inputImage + 'is not a file.\n\n');
      process.exit();
    }
    png.on('parsed', sobel);
    dst = fs.createWriteStream(outputImage);
    src.pipe(png);
  } catch (err) {
    console.log(err + '\n\n');
    process.exit();
  }
  console.log('Processing image...');

  dst.on('finish', function() {
    process.exit();
  });
}


if (isMaster) {
  let processedImages = [];
  let count = 0;
  const arrInputImages = [
    './images/1.png',
    './images/2.png',
    './images/3.png',
    './images/4.png',
    './images/5.png',
    './images/6.png',
    './images/7.png',
    './images/8.png',
    './images/9.png',
    './images/10.png',
    './images/11.png',
    './images/12.png',
    './images/13.png',
    './images/14.png',
    './images/15.png'
  ];
  const arrOutputImages = [
    './build/1o.png',
    './build/2o.png',
    './build/3o.png',
    './build/4o.png',
    './build/5o.png',
    './build/6o.png',
    './build/7o.png',
    './build/8o.png',
    './build/9o.png',
    './build/10o.png',
    './build/11o.png',
    './build/12o.png',
    './build/13o.png',
    './build/14o.png',
    './build/15o.png'
  ];
  const max = arrInputImages.length;

  const express = require('express');
  const app = express();
  app.use(express.static('build'));
  app.get('/images', (req, res) => {
    res.json({images: processedImages, allImagesLength: max});
  });
  app.listen(3000);

  // --------------------------- sequentially performing -------------------------------
  // const createWorker = () => {
  //   const worker = cluster.fork();
  //   worker.send({
  //     input: arrInputImages[count],
  //     output: arrOutputImages[count]
  //   });
  //   worker.on('exit', () => {
  //     processedImages.push(arrOutputImages[count].slice(8));
  //     count++;
  //     count < max ? createWorker() : console.log('the end');
  //   });
  // };
  //
  // createWorker();

  // --------------------------- parallel performing -------------------------------
  const multipleWorkers = () => {
    let newInput = [...arrInputImages];
    let newOutput = [...arrOutputImages];
    const sendMessageToWorker = () => {
      count++;
      const worker = cluster.fork();
      worker.send({ input: newInput[0], output: newOutput[0] });
      newInput = newInput.slice(1);
      newOutput = newOutput.slice(1);
      worker.on('exit', () => {
        if(count < max) {
          processedImages.push(newOutput[0].slice(8));
          sendMessageToWorker();
        }
      })
    };
    for(let j = 0; j < numWorkers; j++) {
      const worker = cluster.fork();
      worker.send({ input: newInput[0], output: newOutput[0] });
      processedImages.push(newOutput[0].slice(8));
      count++;
      newInput = newInput.slice(1);
      newOutput = newOutput.slice(1);
      worker.on('exit', () => {
        if(count < max) {
          processedImages.push(newOutput[0].slice(8));
          sendMessageToWorker();

        }
      })
    }
  };

  multipleWorkers()
}
 else {
  process.on('message', ({ input, output }) => {
    processImage(input, output);
  });
}
