const Sortable = require('sortablejs');
const dragDrop = require('drag-drop');
const Config = require('electron-config');
const {
  ipcRenderer,
  remote,
} = require('electron');

const config = new Config();


function dragDropFiles(files) {
  ipcRenderer.send('dragDropFiles', files);
}

dragDrop('body', {
  onDrop(files, pos) {
    console.log(files);
    const arr = [];
    files.forEach((file) => {
      if (file.type.includes('audio/')) {
        arr.push(file.path);
      }
    });
    if (arr.length > 0) {
      dragDropFiles(arr);
    }
  },
  onDragEnter() {
    console.log('dragDrop.onDragEnter');
  },
  onDragOver() {
    console.log('dragDrop.onDragOver');
  },
  onDragLeave() {
    console.log('dragDrop.onDragLeave');
  },
});

function playPause(element) {
  console.log(element.childNodes.audio);
  if (element.audio.paused) {
    element.audio.play();
  } else {
    element.audio.pause();
  }
}

function updateTime(audio) {
  console.log(audio);
  const uid = audio.id;
  const percent = Math.floor((audio.currentTime / audio.duration) * 100);
  const determinate = document.getElementById(`determinate-${uid}`);
  if (percent === 100) {
    determinate.style.width = '0%';
  } else {
    determinate.style.width = `${percent}%`;
  }
}


function importConfig(object) {
  // Card Structure
  const column = document.createElement('div');
  column.className = 'col s2';
  const card = document.createElement('div');
  card.className = 'card blue-grey darken-1';
  const modalTrigger = document.createElement('i');
  modalTrigger.className = 'modal-trigger material-icons right';
  modalTrigger.innerText = 'settings';
  modalTrigger.setAttribute('data-target', 'modal1');
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content white-text';
  const cardTitle = document.createElement('span');
  cardTitle.className = 'card-title';
  cardTitle.innerText = 'Title';
  const progress = document.createElement('div');
  progress.className = 'progress';
  const determinate = document.createElement('div');

  determinate.id = `determinate-${object.uid}`;

  determinate.className = 'determinate';
  determinate.style.width = '0%';
  cardContent.appendChild(cardTitle);
  progress.appendChild(determinate);
  card.appendChild(modalTrigger);
  card.appendChild(cardContent);
  card.appendChild(progress);
  column.appendChild(card);

  // Modal Structure
  const modal = document.createElement('div');
  modal.id = 'modal1';
  modal.className = 'modal';
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  const modalHeader = document.createElement('h4');
  modalHeader.innerText = 'Modal Header';
  const modalText = document.createElement('p');
  modalText.innerText = 'A bunch of text';
  const modalFooter = document.createElement('div');
  modalFooter.className = 'modal-footer';
  const modalAction = document.createElement('a');
  modalAction.href = '#!';
  modalAction.className = 'modal-action modal-close waves-effect waves-green btn-flat';
  modalAction.innerText = 'Save';
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalText);
  modalFooter.appendChild(modalAction);
  modal.appendChild(modalContent);
  modal.appendChild(modalFooter);

  card.audio = new Audio();
  card.audio.id = object.uid;
  card.audio.src = object.path;
  card.setAttribute('onclick', 'playPause(this)');
  card.audio.setAttribute('ontimeupdate', 'updateTime(this)');

  document.getElementById('container').appendChild(column);
  document.getElementById('container').appendChild(modal);
}

files = config.store.files;
for (const key in files) {
  const element = files[key];
  importConfig(element);
}


const container = document.getElementById('container');
const sortable = Sortable.create(container, {
  animation: 150,
});
console.log(sortable);
