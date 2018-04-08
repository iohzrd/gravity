const Sortable = require('sortablejs');
const dragDrop = require('drag-drop');
const Store = require('electron-config');
const {
  ipcRenderer,
  remote,
} = require('electron');

const config = new Store();

function refresh() {
  ipcRenderer.send('refresh');
}

function deleteEntry(uid) {
  if (config.has(uid)) {
    config.delete(uid);
    const col = document.getElementById(`col-${uid}`);
    col.parentNode.removeChild(col);
    const modal = document.getElementById(`modal-${uid}`);
    const instance = M.Modal.getInstance(modal);
    instance.close();
    instance.destroy();
    modal.parentNode.removeChild(modal);
    // refresh();
  }
}

function print(arg) {
  ipcRenderer.send('print', arg);
}

function saveFiles(files) {
  const arr = [];

  // object
  for (const file of files) {
    if (file.type.includes('audio/')) {
      arr.push(file.path);
    }
  }

  // array
  // files.forEach((file) => {
  //   if (file.type.includes('audio/')) {
  //     arr.push(file.path);
  //   }
  // });

  if (arr.length > 0) {
    ipcRenderer.send('saveFile', arr);
    refresh();
  }
}


function submit() {
  // const link = document.getElementById('form-link').value;
  // console.log(link);
  const files = document.getElementById('form-files').files;
  console.log(files);
  saveFiles(files);
}

dragDrop('div.contain', {
  onDrop(files, pos) {
    console.log(files);
    saveFiles(files);
  },
  onDragEnter() {
    console.log('dragDrop.onDragEnter');
    const elem = document.getElementById('modal-drag-drop');
    M.Modal.init(elem, {});
    const instance = M.Modal.getInstance(elem);
    instance.open();
  },
  onDragOver() {
    console.log('dragDrop.onDragOver');
  },
  onDragLeave() {
    console.log('dragDrop.onDragLeave');
    const elem = document.getElementById('modal-drag-drop');
    const instance = M.Modal.getInstance(elem);

    const cards = document.getElementById('cards');
    console.log(cards);

    // instance.close();
    // instance.destroy();
  },
});

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

const sortable = Sortable.create(cards, {
  animation: 100,
  handle: '.material-icons left',
  group: 'cards',
});
