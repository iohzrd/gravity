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
  const col = document.createElement('div');
  col.className = 'col s2';
  col.id = `col-${object.uid}`;
  const card = document.createElement('div');
  card.className = 'card blue-grey darken-1';
  card.id = `card-${object.uid}`;
  const modalTrigger = document.createElement('a');
  modalTrigger.className = 'modal-trigger material-icons right';
  modalTrigger.href = `#modal-${object.uid}`;
  modalTrigger.id = `modal-trigger-${object.uid}`;
  modalTrigger.innerText = 'settings';
  //   modalTrigger.setAttribute('data-target', `modal-${object.uid}`);
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content white-text';
  cardContent.id = `card-content-${object.uid}`;
  const cardTitle = document.createElement('span');
  cardTitle.className = 'card-title';
  cardTitle.id = `card-title-${object.uid}`;
  cardTitle.innerText = object.name;
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.id = `progress-${object.uid}`;
  const determinate = document.createElement('div');
  determinate.id = `determinate-${object.uid}`;
  determinate.className = 'determinate';
  determinate.style.width = '0%';
  cardContent.appendChild(cardTitle);
  progress.appendChild(determinate);
  card.appendChild(modalTrigger);
  card.appendChild(cardContent);
  card.appendChild(progress);
  col.appendChild(card);

  // Modal Structure
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = `modal-${object.uid}`;
  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';
  modalContent.id = `modal-content-${object.uid}`;
  const modalHeader = document.createElement('h4');
  modalHeader.id = `modal-header-${object.uid}`;
  modalHeader.innerText = object.name;
  const modalText = document.createElement('p');
  modalText.id = `modal-text-${object.uid}`;
  modalText.innerText = object.uid;
  const modalFooter = document.createElement('div');
  modalFooter.className = 'modal-footer';
  modalFooter.id = `modal-footer-${object.uid}`;
  const modalAction = document.createElement('a');
  modalAction.className = 'modal-action modal-close waves-effect waves-green btn-flat';
  modalAction.href = '#!';
  modalAction.id = `modal-action-${object.uid}`;
  modalAction.innerText = 'Save';
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalText);
  modalFooter.appendChild(modalAction);
  modal.appendChild(modalContent);
  modal.appendChild(modalFooter);

  cardContent.audio = new Audio();
  cardContent.audio.id = `${object.uid}`;
  cardContent.audio.src = object.path;
  cardContent.setAttribute('onclick', 'playPause(this)');
  cardContent.audio.setAttribute('ontimeupdate', 'updateTime(this)');

  document.getElementById('container').appendChild(col);
  document.getElementById('container').appendChild(modal);
  M.Modal.init(modal, {});
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
