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

dragDrop('div.row', {

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
    instance.close();
    instance.destroy();
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

function updateProgress(audio) {
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


function addElement(object) {
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
  modal.appendChild(modalContent);

  const modalHeader = document.createElement('h4');
  modalHeader.id = `modal-header-${object.uid}`;
  modalHeader.innerText = object.name;
  modalContent.appendChild(modalHeader);

  const modalText = document.createElement('p');
  modalText.id = `modal-text-${object.uid}`;
  modalText.innerText = object.uid;
  modalContent.appendChild(modalText);

  const modalVolumeSlider = document.createElement('div');
  modalVolumeSlider.id = `modal-volume-slider-${object.uid}`;
  noUiSlider.create(modalVolumeSlider, {
    start: 1.00,
    step: 0.01,
    behaviour: 'drag',
    connect: [true, false],
    range: {
      min: 0.00,
      max: 1.00,
    },
  });

  modalContent.appendChild(modalVolumeSlider);

  const modalItemDelete = document.createElement('a');
  modalItemDelete.id = `modal-delete-item-${object.uid}`;
  modalItemDelete.innerText = 'Delete';
  modalItemDelete.className = 'btn blue-grey darken-1 waves-effect waves-light';
  modalContent.appendChild(modalItemDelete);

  const modalFooter = document.createElement('div');
  modalFooter.className = 'modal-footer';
  modalFooter.id = `modal-footer-${object.uid}`;
  modal.appendChild(modalFooter);

  const modalAction = document.createElement('a');
  modalAction.className = 'modal-action modal-close waves-effect waves-green btn-flat';
  modalAction.href = '#!';
  modalAction.id = `modal-action-${object.uid}`;
  modalAction.innerText = 'Save';
  modalFooter.appendChild(modalAction);


  // Audio element
  cardContent.audio = new Audio();
  cardContent.audio.id = `${object.uid}`;
  cardContent.audio.src = object.path;
  cardContent.setAttribute('onclick', 'playPause(this)');
  cardContent.audio.setAttribute('ontimeupdate', 'updateProgress(this)');

  document.getElementById('cards').appendChild(col);
  document.getElementById('modals').appendChild(modal);
  M.Modal.init(modal, {});
}

files = config.store.files;
for (const key in files) {
  const element = files[key];
  addElement(element);
}


const cards = document.getElementById('cards');
Sortable.create(cards, {
  animation: 150,
});
