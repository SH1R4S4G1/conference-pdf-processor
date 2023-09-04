// main.ts
import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
const { exec } = require('child_process');
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

// ファイルを一時フォルダに保存
ipcMain.handle('save-to-temp', async (event, fileData) => {
  const tempDir = os.tmpdir();
  const uniqueFilename = Date.now() + ".pdf";  // ユニークなファイル名を生成
  const filePath = path.join(tempDir, uniqueFilename);

  fs.writeFileSync(filePath, new Buffer(fileData));

  return filePath;
});

// ファイル一覧を取得
ipcMain.handle('get-temp-files', async () => {
  const tempDir = app.getPath('temp');
  const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
  return files;
});

// wordをpdfに変換
ipcMain.handle('convert-word-to-pdf', async (event, filePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
    const command = `powershell -command "$word = New-Object -ComObject Word.Application; $word.Visible = $false; $document = $word.Documents.Open('${filePath}'); $document.SaveAs('${outputFilePath}', 17); $document.Close(); $word.Quit()"`;
    exec(command, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputFilePath);
      }
    });
  });
});

// Excelをpdfに変換
ipcMain.handle('convert-excel-to-pdf', async (event, filePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
    const command = `powershell -command "$excel = New-Object -ComObject Excel.Application; $excel.Visible = $false; $workbook = $excel.Workbooks.Open('${filePath}'); $workbook.ExportAsFixedFormat(0, '${outputFilePath}'); $workbook.Close(); $excel.Quit()"`;
    exec(command, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputFilePath);
      }
    });
  });
});

// PowerPointをpdfに変換
ipcMain.handle('convert-ppt-to-pdf', async (event, filePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
    const command = `powershell -command "$powerpoint = New-Object -ComObject PowerPoint.Application; $presentation = $powerpoint.Presentations.Open('${filePath}'); $presentation.ExportAsFixedFormat('${outputFilePath}', 2); $presentation.Close(); $powerpoint.Quit()"`;
    exec(command, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputFilePath);
      }
    });
  });
});

