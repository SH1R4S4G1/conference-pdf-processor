// main.ts
import { app, BrowserWindow,ipcMain,shell } from 'electron';
import { exec } from 'child_process';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

let mainWindow: Electron.BrowserWindow | null;
let appTempDir = path.join(app.getPath('temp'), 'conference-pdf-processor');

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false, // これはセキュリティ上の理由で推奨されています
      contextIsolation: true,
      preload: path.join(__dirname, '..\\..\\electron\\preload.js')
    },
  });

  // 環境に応じてURLをロード
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    //静的エクスポートされたファイルをロード
    mainWindow.loadFile(path.join(__dirname, '..\\..\\frontend\\out\\index.html'));
  }

  if (!fs.existsSync(appTempDir)) {
    fs.mkdirSync(appTempDir);
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
  const tempDir = appTempDir;
  const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
  for (const file of files) {
    try {
      fs.unlinkSync(path.join(tempDir, file));
    } catch (err) {
      console.error("Failed to delete file:", file, err);
    }
  }
});


// OSの一時フォルダを取得
ipcMain.handle('get-os-tmpdir', () => {
  return appTempDir;
});

// ファイルを一時フォルダに保存
ipcMain.handle('save-to-temp', async (event, fileData, outputFilePath) => {
  fs.writeFileSync(outputFilePath, Buffer.from(fileData));
  return outputFilePath;
});

// ファイル一覧を取得
ipcMain.handle('get-temp-files', async () => {
  const tempDir = appTempDir;
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
    
    // processedを接尾語として追加
    const processedFilePath = filePath.replace('.pdf', '-add-Blank.pdf');
    fs.writeFileSync(processedFilePath, newPdfBytes);

    return processedFilePath;
  } catch (error) {
    console.error("Error adding blank page:", error);
    throw error;
  }
});

// PDFを結合する
ipcMain.handle('combine-pdfs', async (event, data: { files: string[], addPageNumbers: boolean, position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right', size: number }) => {
  console.log("Received files for combining:", data.files);
  const mergedPdfDoc = await PDFDocument.create();
  let totalPages = 0;  // 追加: 連番のための変数

  for (const filePath of data.files) {
      console.log("Reading file:", filePath);
      const pdfBytes = fs.readFileSync(filePath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
      for (const page of pages) {
          mergedPdfDoc.addPage(page);
      }
      console.log(`File ${filePath} has ${pdfDoc.getPageCount()} pages.`);
  }

  if (data.addPageNumbers) {  // ページ数を追加する場合のみ
    const font = await mergedPdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = mergedPdfDoc.getPages();

    // ページの位置とサイズに基づいて座標を計算する関数
    const computeCoordinates = (width: number, height: number) => {
        switch (data.position) {
            case 'top-left': return { x: 50, y: height - 30 };
            case 'top-center': return { x: (width / 2) - (data.size / 2 * 2.5), y: height - 30 };  // サイズに応じて中央揃え
            case 'top-right': return { x: width - 50, y: height - 30 };
            case 'bottom-left': return { x: 50, y: 30 };
            case 'bottom-center': return { x: (width / 2) - (data.size / 2 * 2.5), y: 30 };  // サイズに応じて中央揃え
            case 'bottom-right': return { x: width - 50, y: 30 };
        }
    };

    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        const coordinates = computeCoordinates(width, height);
        page.drawText(String(totalPages + i + 1), {
            x: coordinates.x,
            y: coordinates.y,
            size: data.size,
            font: font,
            color: rgb(0, 0, 0),
        });
    }
    totalPages += pages.length;  // 連番の更新
  }

  console.log(`Combined PDF has ${mergedPdfDoc.getPageCount()} pages.`);

  const mergedPdfBytes = await mergedPdfDoc.save();
  const tempDir = appTempDir;
  const outputPath = path.join(tempDir, `merged-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, mergedPdfBytes);

  return outputPath;
});


// ページ番号を追加する
// ipcMain.handle('add-page-numbers', async (event, { filePath, position, size }) => {
//   try {
//     const pdfBytes = fs.readFileSync(filePath);
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//     const pages = pdfDoc.getPages();

//     pages.forEach((page, i) => {
//       const { width, height } = page.getSize();
//       let x, y;
      
//       switch (position) {
//         case 'top-left':
//           x = 50;
//           y = height - 30;
//           break;
//         case 'top-center':
//           x = (width / 2) - (size / 2);
//           y = height - 30;
//           break;
//         case 'top-right':
//           x = width - 50;
//           y = height - 30;
//           break;
//         case 'bottom-left':
//           x = 50;
//           y = 30;
//           break;
//         case 'bottom-center':
//           x = (width / 2) - (size / 2);
//           y = 30;
//           break;
//         case 'bottom-right':
//         default:
//           x = width - 50;
//           y = 30;
//           break;
//       }

//       page.drawText(String(i + 1), {
//         x,
//         y,
//         size: Number(size),
//         font: font,
//         color: rgb(0, 0, 0),
//       });
//     });

//     const modifiedPdfBytes = await pdfDoc.save();
//     const tempDir = appTempDir;
//     const outputPath = path.join(tempDir, `numbered-${Date.now()}.pdf`);
//     fs.writeFileSync(outputPath, modifiedPdfBytes);
//     return outputPath;
//   } catch (error) {
//     console.error("Error adding page numbers:", error);
//     throw error;
//   }
// });

// PDFを保存するためにダイアログを開く
ipcMain.handle('open-file', async (event, filePath: string) => {
  try {
    await shell.openPath(filePath);
  } catch (error) {
    console.error("Error opening file:", error);
    throw error;
  }
});