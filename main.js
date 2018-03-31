const Config = require('electron-config');
const fileType = require('file-type');
const fs = require('fs');
const path = require('path');
const readChunk = require('read-chunk');
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

function getFileType(file) {
  const buffer = readChunk.sync(file, 0, 262);
  return fileType(buffer);
}

function isAudio(file) {
  try {
    return getFileType(file).mime.match(/^audio\//);
  } catch (e) {
    return false;
  }
}

function saveFile(source) {
  return new Promise((() => {
    const fileName = path.basename(source);
    const rd = fs.createReadStream(source);
    const wr = fs.createWriteStream(`${audioPath}/${fileName}`);
    rd.pipe(wr);
  }));
}

ipcMain.on('importFile', (event, arg) => {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
  });
  // saveFile();
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
