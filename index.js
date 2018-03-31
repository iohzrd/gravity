const {
  ipcRenderer,
  remote,
} = require('electron');

function importFile() {
  ipcRenderer.send('importFile');
}

function quit() {
  ipcRenderer.send('quit');
}


function play(element) {
  if (element.player.paused) {
    element.player.play();
  }
}


const button1 = document.createElement('button');
button1.id = 'button-1';
button1.innerText = 'horse';
button1.className = 'waves-effect waves-light btn-large';
button1.player = new Audio();
button1.player.src = '/home/iohzrd/.config/Gravity/Audio/horse.mp3';
button1.setAttribute('onclick', 'play(this)');
document.getElementById('buttons').appendChild(button1);

const button2 = document.createElement('button');
button2.id = 'button-2';
button2.innerText = 'marbles';
button2.className = 'waves-effect waves-light btn-large';
button2.player = new Audio();
button2.player.src = '/home/iohzrd/.config/Gravity/Audio/marbles.wav';
button2.setAttribute('onclick', 'play(this)');
document.getElementById('buttons').appendChild(button2);


// function importFile(label, name, path) {
//   copyFile(path, `./audio/${name}`);

//   config[id] = {};
//   config[id].label = label;
//   config[id].name = name;
//   config[id].path = `./audio/${name}`;
//   console.log(config);

//   const file = document.createElement('AUDIO');
//   file.id = `file-${config[id]}`;
//   file.setAttribute('preload', 'auto');
//   file.setAttribute('type', 'audio/mpeg');
//   file.setAttribute('src', config[id].path);
//   document.getElementById('audioFiles').appendChild(file);

//   const button = document.createElement('button');
//   button.id = `button-${id}`;
//   button.innerText = config[id].label;
//   button.player = new Audio();
//   button.className = 'waves-effect waves-light btn-large';
//   button.setAttribute('onclick', `playSound('${config[id].path}')`);
//   button.setAttribute('oncontextmenu', 'console.log("oncontextmenu")');
//   document.getElementById('audioButtons').appendChild(button);

//   id += 1;
// }
