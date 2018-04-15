const dragDrop = require('drag-drop');
const electronConfig = require('electron-config');
const ffmpeg = require('ffmpeg-binaries');
const fileType = require('file-type');
const fluent = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const readChunk = require('read-chunk');
const sanitize = require('sanitize-filename');
const sortableJs = require('sortablejs');
const ytdl = require('ytdl-core');
const {
  ipcRenderer,
  remote,
} = require('electron');

const config = new electronConfig();
const configPath = path.dirname(config.path);
const tempPath = `${configPath}/Temp`;
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath);
}


function refresh() {
  ipcRenderer.send('refresh');
}

function deleteEntry(uid) {
  const root = config.get();
  for (let i = 0; i < root.cards.length; i++) {
    const card = root.cards[i];
    if (card.uid === uid) {
      fs.unlinkSync(card.path);
      root.cards.splice(i, 1);
    }
  }
  config.set(root);
  const col = document.getElementById(`col-${uid}`);
  col.parentNode.removeChild(col);
  const modal = document.getElementById(`modal-${uid}`);
  const instance = M.Modal.getInstance(modal);
  instance.close();
  instance.destroy();
  modal.parentNode.removeChild(modal);
  refresh();
}


function saveEntry(uid) {
  console.log(uid);
  const modalName = document.getElementById(`modal-name-${uid}`);
  const modalRate = document.getElementById(`modal-rate-value-${uid}`);
  const modalVolume = document.getElementById(`modal-volume-value-${uid}`);
  const cardTitle = document.getElementById(`card-title-${uid}`);
  const root = config.get();
  root.cards.forEach((element) => {
    if (element.uid === uid) {
      const index = root.cards.indexOf(element);
      cardTitle.innerText = modalName.value;
      root.cards[index].name = modalName.value;
      root.cards[index].rate = Number(modalRate.innerText);
      root.cards[index].volume = Number(modalVolume.innerText);
    }
  });
  config.set(root);
}

function saveFiles(files) {
  const arr = [];
  files.forEach((file) => {
    const buffer = fileType(readChunk.sync(file, 0, 4100));
    console.log(buffer);
    if (buffer.mime.includes('audio/')) {
      if (file.path) {
        arr.push(file.path);
      } else {
        arr.push(file);
      }
    }
  });
  if (arr.length > 0) {
    ipcRenderer.send('saveFile', arr);
    refresh();
  }
}

async function updateTimeSlider(input) {
  try {
    const videoMeta = await ytdl.getInfo(input.value);
    const slider = document.getElementById('form-link-slider');
    noUiSlider.create(slider, {
      start: [0, videoMeta.length_seconds],
      connect: true,
      step: 1,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      range: {
        min: 0,
        max: Number(videoMeta.length_seconds),
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function startDownload(id) {
  const progressBar = document.getElementById('form-link-progress');

  try {
    const info = await ytdl.getInfo(id);
    console.log(info);
    const paths = await new Promise((resolve, reject) => {
      const fullPath = path.join(tempPath, 'tmp.mp4');
      const videoObject = ytdl(id, {
        // filter: 'audioonly',
      });
      videoObject
        .on('progress', (chunkLength, downloaded, total) => {
          progressBar.style = `width: ${Math.floor((downloaded / total) * 49)}%`;
        });

      videoObject
        .pipe(fs.createWriteStream(fullPath))
        .on('finish', () => {
          progressBar.style = 'width: 50%';
          setTimeout(() => {
            resolve({
              filePath: fullPath,
              folderPath: tempPath,
              fileTitle: `${info.title}.mp3`,
            });
          }, 1000);
        });
    });

    await new Promise((resolve, reject) => {
      fluent(paths.filePath)
        .setFfmpegPath(ffmpeg.ffmpegPath())
        .format('mp3')
        .audioBitrate(192)
        .on('progress', (progress) => {
          progressBar.style = `width: ${50 + Math.floor(progress.percent / 2)}%`;
        })
        .output(fs.createWriteStream(path.join(paths.folderPath, sanitize(paths.fileTitle))))
        .on('end', () => {
          progressBar.style = 'width: 100%';
          resolve();
        })
        .run();
    });

    saveFiles([path.join(paths.folderPath, paths.fileTitle)]);
    fs.unlinkSync(paths.filePath);
    fs.unlinkSync(path.join(paths.folderPath, paths.fileTitle));
  } catch (e) {
    console.error(e);
  }
}


function submit() {
  if (document.getElementById('form-link').disabled) {
    saveFiles(document.getElementById('form-files').files);
  } else {
    startDownload(document.getElementById('form-link').value);
  }
  // const modal = document.getElementById('modal-select-input-type');
  // const instance = M.Modal.getInstance(modal);
  //   instance.close();
}


function playPause(uid) {
  const element = document.getElementById(`audio-${uid}`);
  if (element.paused) {
    element.play();
  } else {
    element.pause();
  }
}

function updateProgress(audio) {
  const uid = audio.id.replace('audio-', '');
  const percent = Math.floor((audio.currentTime / audio.duration) * 100);
  const determinate = document.getElementById(`determinate-${uid}`);
  if (percent === 100) {
    determinate.style.width = '0%';
  } else {
    determinate.style.width = `${percent}%`;
  }
}


const cards = document.getElementById('cards');
const sortable = sortableJs.create(cards, {
  animation: 100,
  handle: '.material-icons left',
  group: 'cards',
  onEnd(evt) {
    const root = config.get();
    const z = root.cards[evt.oldIndex];
    root.cards.splice(evt.oldIndex, 1);
    root.cards.splice(evt.newIndex, 0, z);
    config.set(root);
  },
});


dragDrop('body', {
  onDrop(files, pos) {
    console.log(files);
    saveFiles(files);
  },
  // onDragEnter() {
  //   console.log('dragDrop.onDragEnter');
  //   const elem = document.getElementById('modal-drag-drop');
  //   M.Modal.init(elem, {});
  //   const instance = M.Modal.getInstance(elem);
  //   instance.open();
  // },
  // onDragOver() {
  //   console.log('dragDrop.onDragOver');
  // },
  // onDragLeave() {
  //   console.log('dragDrop.onDragLeave');
  //   const elem = document.getElementById('modal-drag-drop');
  //   const instance = M.Modal.getInstance(elem);

  //   const cards = document.getElementById('cards');
  //   console.log(cards);

  //   // instance.close();
  //   // instance.destroy();
  // },
});
