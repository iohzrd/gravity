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

function deleteEntry(index) {
  const root = config.get();
  root.cards.splice(index, 1);
  config.set(root);
  const col = document.getElementById(`col-${index}`);
  col.parentNode.removeChild(col);
  const modal = document.getElementById(`modal-${index}`);
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

function print(arg) {
  ipcRenderer.send('print', arg);
}

function saveFiles(files) {
  const arr = [];
  for (const file of files) {
    if (file.type.includes('audio/')) {
      arr.push(file.path);
    }
  }
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
const sortable = Sortable.create(cards, {
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
