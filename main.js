const fs = require('fs-extra');
const path = require('path');
const url = require('url');
const ElectronConfig = require('electron-config');

const config = new ElectronConfig();
const root = config.get();
if (root.cards === undefined) {
  root.cards = [];
  config.set(root);
}


const pug = require('electron-pug')({
  pretty: true,
}, {
  config,
});

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
} = require('electron');

let mainWindow;
const configPath = path.dirname(config.path);
const audioPath = `${configPath}/Audio`;
if (!fs.existsSync(audioPath)) {
  fs.mkdirSync(audioPath);
}


function uuid(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

function saveFile(source) {
  if (source && source.length > 0) {
    source.forEach(singlePath => new Promise((() => {
      const uid = uuid(8);
      const fileName = path.basename(singlePath);
      const ext = path.extname(singlePath);
      const fileNameNoExt = fileName.substring(0, fileName.lastIndexOf('.'));
      const newPath = `${audioPath}/${uid}${ext}`;
      const rd = fs.createReadStream(singlePath);
      const wr = fs.createWriteStream(newPath);
      const element = {
        name: fileNameNoExt,
        path: newPath,
        rate: 1.00,
        uid,
        volume: 1.00,
      };
      root.cards.push(element);
      if (rd.pipe(wr)) {
        config.set(root);
      }
    })));
  }
}

function selectFile() {
  return dialog.showOpenDialog({
    filters: [{
      name: 'Audio',
      extensions: ['aif', 'flac', 'm4a', 'mp3', 'ogg', 'wav'],
    }],
    properties: ['openFile', 'multiSelections'],
  });
}


ipcMain.on('refresh', () => {
  mainWindow.webContents.reloadIgnoringCache();
});

ipcMain.on('saveFile', (event, arg) => {
  saveFile(arg);
});

ipcMain.on('importFile', () => {
  const filePath = selectFile();
  saveFile(filePath);
});

ipcMain.on('quit', () => {
  app.quit();
});

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: false,
  });
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.pug'),
    protocol: 'file:',
    slashes: true,
  }));
  mainWindow.webContents.openDevTools();
});

app.on('window-all-closed', () => {
  app.quit();
});
