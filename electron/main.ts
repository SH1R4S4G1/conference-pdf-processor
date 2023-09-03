// main.ts
import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: Electron.BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // 環境に応じてURLをロード
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.loadFile(path.join(__dirname, '../../frontend/.next/server/pages/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
app.on('will-quit', () => {
  const tempDir = app.getPath('temp');
  const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(tempDir, file));
    } catch (err) {
      console.error("Failed to delete file:", file, err);
    }
  }
});

ipcMain.handle('save-to-temp', async (event, fileData) => {
  const tempDir = os.tmpdir();
  const uniqueFilename = Date.now() + ".pdf";  // ユニークなファイル名を生成
  const filePath = path.join(tempDir, uniqueFilename);

  fs.writeFileSync(filePath, new Buffer(fileData));

  return filePath;
});

ipcMain.handle('get-temp-files', async () => {
  const tempDir = app.getPath('temp');
  const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
  return files;
});