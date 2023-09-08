// main.ts
import { app, BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import { exec } from 'child_process';
import { PDFDocument } from 'pdf-lib';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: Electron.BrowserWindow | null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // nodeIntegration: false, // これはセキュリティ上の理由で推奨されています
      nodeIntegration: true,
      contextIsolation: true,
      preload: path.join(__dirname, '..\\..\\electron\\preload.js')
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
ipcMain.handle('save-to-temp', async (event, fileData, outputFilePath) => {
  fs.writeFileSync(outputFilePath, new Buffer(fileData));
  return outputFilePath;
});

// ipcMain.handle('save-to-temp', async (event, fileData) => {

//   const tempDir = os.tmpdir();
//   const uniqueFilename = Date.now() + ".pdf";  // ユニークなファイル名を生成
//   const filePath = path.join(tempDir, uniqueFilename);

//   fs.writeFileSync(filePath, new Buffer(fileData));

//   return filePath;
// });

// ファイル一覧を取得
// ipcMain.handle('get-temp-files', async () => {
//   const tempDir = app.getPath('temp');
//   const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
//   return files;
// });
ipcMain.handle('get-temp-files', async () => {
  const tempDir = app.getPath('temp');
  const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
  return files.map(file => path.join(tempDir, file));  // フルパスを返すように修正
});

// wordをpdfに変換
ipcMain.handle('convert-word-to-pdf', async (event, filePath, outputFilePath) => {
  return new Promise((resolve, reject) => {
    console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
    const command = `powershell -command "$word = New-Object -ComObject Word.Application; $word.Visible = $false; $document = $word.Documents.Open('${filePath}'); $document.SaveAs('${outputFilePath}', 17); $document.Close(); $word.Quit()"`;
    exec(command, (error: Error | null) => {
      if (error) {
        console.error("Word to PDF conversion error:", error);
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
    console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
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
    console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
    const command = `powershell -command "$powerpoint = New-Object -ComObject PowerPoint.Application; $presentation = $powerpoint.Presentations.Open('${filePath}'); $presentation.SaveAs('${outputFilePath}', 32); $presentation.Close(); $powerpoint.Quit()"`;
    exec(command, (error: Error | null) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputFilePath);
      }
    });
  });
});

// PDFのページ数を取得
ipcMain.handle('get-pdf-page-count', async (event, filePath) => {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    return pageCount;
  } catch (error) {
    console.error("Error reading PDF:", error);
    throw error;
  }
});

// PDFに白紙のページを追加
ipcMain.handle('add-blank-page', async (event, filePath) => {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // 新しい白紙のページを追加
    pdfDoc.addPage([612, 792]); // A4のサイズ

    const newPdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, newPdfBytes);

    return true;
  } catch (error) {
    console.error("Error adding blank page:", error);
    throw error;
  }
});
