const Config = require('electron-config');
const fs = require('fs');
const path = require('path');
const uuid = require('uuid/v4');
const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require('electron');
require('electron-debug')();

let mainWindow;
const config = new Config();
const configPath = path.dirname(config.path);
const audioPath = `${configPath}/Audio`;
if (!fs.existsSync(audioPath)) {
  fs.mkdirSync(audioPath);
}

function saveFile(source) {
  if (source && source.length > 0) {
    source.forEach(singlePath => new Promise((() => {
      const uid = uuid();
      const fileName = path.basename(singlePath);
      const rd = fs.createReadStream(singlePath);
      const wr = fs.createWriteStream(`${audioPath}/${uid}-${fileName}`);
      rd.pipe(wr);
    })));
  }
}

function selectFile() {
  return dialog.showOpenDialog({
    filters: [{
      name: 'Audio',
      extensions: ['mp3', 'wav', 'flac', 'aif', 'ogg'],
    }],
    properties: ['openFile', 'multiSelections'],
  });
}

ipcMain.on('importFile', (event, arg) => {
  const filePath = selectFile();
  saveFile(filePath);
});


app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('quit', () => {
  app.quit();
});
