// main.ts
import { app, BrowserWindow,ipcMain,shell } from 'electron';
import { exec, execSync } from 'child_process';
import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as path from 'path';
import regedit from 'regedit';

let mainWindow: Electron.BrowserWindow | null;
let appTempDir = path.join(app.getPath('temp'), 'conference-pdf-processor');

let isWordInstalled: boolean;
let isExcelInstalled: boolean;
let isPowerPointInstalled: boolean;
let isLibreOfficeInstalledFlag: boolean;

// binでなくexeを指定するとウィンドウが表示されるので注意
let libreOfficePath: string | null;
const libreOfficeDefaultPath = "C:\\Program Files\\LibreOffice\\program\\soffice.bin";  // 64-bit
const libreOfficeDefaultPathAlt = "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.bin";  // 32-bit

// TODO: ウィンドウサイズを変更できないようにする
// TODO: メニューバーを非表示にする
// TODO: 起動時に前のファイルが残っている場合は削除する
const createWindow = async () => {
    // アプリケーションの起動時に一度だけMicrosoft OfficeやLibreOfficeのインストール確認
    isWordInstalled = await isAppInstalled('winword');
    isExcelInstalled = await isAppInstalled('excel');
    isPowerPointInstalled = await isAppInstalled('powerpnt');
    isLibreOfficeInstalledFlag = await isLibreOfficeInstalled();
    console.log("Word installed:", isWordInstalled);
    console.log("Excel installed:", isExcelInstalled);
    console.log("PowerPoint installed:", isPowerPointInstalled);
    console.log("LibreOffice installed:", isLibreOfficeInstalledFlag);
  
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, // セキュリティ上の理由で推奨
      contextIsolation: true,
      preload: path.join(__dirname, '..', '..', 'electron', 'preload.js')
    },
  });

  // Set the title of the window
  mainWindow.setTitle('kaigiPDF');

  // Set the referrer and user agent options to prevent injection attacks
  const options = {
    httpReferrer: 'http://localhost:3000',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
  };

  // 環境に応じてURLをロード(optionを渡す)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.loadURL('http://localhost:3000', options);
  } else {
    //静的エクスポートされたファイルをロード
    mainWindow.loadFile(path.join(__dirname, '..', '..', 'frontend', 'out', 'index.html'));
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

// Officeアプリケーションのインストール確認
function isAppInstalled(appName: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const appRegPath = [`HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${appName.toUpperCase()}.EXE`];

      regedit.list(appRegPath, (err, result) => {
          if (err) {
              resolve(false);
          } else {
              resolve(true);
          }
      });
  });
}

// LibreOfficeのインストール確認
function isLibreOfficeInstalled(): Promise<boolean> {
  return new Promise((resolve) => {

    exec(`"${libreOfficeDefaultPath}" --headless --version`, (error, stdout) => {
      if (error) {
        exec(`"${libreOfficeDefaultPathAlt}" --headless --version`, (error, stdout) => {
          if (error) {
            resolve(false);
          } else {
            libreOfficePath = libreOfficeDefaultPathAlt;
            resolve(true);
          }
        });
      } else {
        libreOfficePath = libreOfficeDefaultPath;
        resolve(true);
      }
    });
  });
}

// LibreOfficeを使用して任意のファイルをPDFに変換する関数
async function convertToPdfUsingLibreOffice(filePath: string, outputFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`"${libreOfficePath}" --headless --convert-to pdf "${filePath}" --outdir "${path.dirname(outputFilePath)}"`, (error) => {
      if (error) {
        console.error("LibreOffice conversion error:", error);
        reject(error);
      } else {
        const generatedPdfPath = path.join(path.dirname(outputFilePath), path.basename(filePath, path.extname(filePath)) + ".pdf");
        fs.rename(generatedPdfPath, outputFilePath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(outputFilePath);
          }
        });
      }
    });
  });
}

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
  
  // if (isWordInstalled) {
    if (false) {
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
  } else if (isLibreOfficeInstalledFlag) {
    console.log("LibreOffice is installed, using it for conversion.");
    return await convertToPdfUsingLibreOffice(filePath, outputFilePath);
  } else {
    // Neither Microsoft Word nor LibreOffice are installed
    throw new Error("No suitable application found for conversion.");
  }
});

// Excelをpdfに変換
ipcMain.handle('convert-excel-to-pdf', async (event, filePath, outputFilePath) => {
  const isExcelInstalled = await isAppInstalled('excel');
  const isLibreOfficeInstalledFlag = await isLibreOfficeInstalled();
  
  // if (isExcelInstalled) {
    if (false) {
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
  } else if (isLibreOfficeInstalledFlag) {
    return await convertToPdfUsingLibreOffice(filePath, outputFilePath);
  } else {
    // Neither Microsoft Word nor LibreOffice are installed
    throw new Error("No suitable application found for conversion.");
  }
});

// PowerPointをpdfに変換
ipcMain.handle('convert-ppt-to-pdf', async (event, filePath, outputFilePath) => {
  const isPowerPointInstalled = await isAppInstalled('powerpnt');
  const isLibreOfficeInstalledFlag = await isLibreOfficeInstalled();

  if (false) {
    // if (isPowerPointInstalled) {
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
  } else if (isLibreOfficeInstalledFlag) {
    return await convertToPdfUsingLibreOffice(filePath, outputFilePath);
  } else {
    // Neither Microsoft Word nor LibreOffice are installed
    throw new Error("No suitable application found for conversion.");
  }
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
ipcMain.handle('combine-pdfs', async (event, data: { files: string[], addPageNumbers: boolean, alignOrientation: boolean, position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right', size: number }) => {
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

  // 横長のPDFを縦長に回転する。ページ数を付与する前に実行する必要がある
  if (data.alignOrientation) {
    const pages = mergedPdfDoc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      if (width > height) {
          page.setRotation(degrees(270));
      }
    }
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

// PDFを保存するためにダイアログを開く
ipcMain.handle('open-file', async (event, filePath: string) => {
  try {
    await shell.openPath(filePath);
  } catch (error) {
    console.error("Error opening file:", error);
    throw error;
  }
});

ipcMain.handle('create-content-list', async (event, fileInfos: Array<{ name: string, pageCount: number, startPage: number }>) => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 外部フォントを読み込む
  const fontBytes = fs.readFileSync(path.join(__dirname, '..\\..\\electron\\assets\\fonts\\ipaexm.ttf'));
  const font = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([600, 800]);  // 適切なサイズに調整してください

  let yOffset = 750;  // Y座標のオフセット（初期値）

  for (const fileInfo of fileInfos) {
      const text = `${fileInfo.name} - 開始ページ: ${fileInfo.startPage}`;
      page.drawText(text, {
          x: 50,
          y: yOffset,
          size: 20,
          font: font,
          color: rgb(0, 0, 0),
      });
      yOffset -= 25;  // Y座標を下に移動
  }

  const contentListPdfBytes = await pdfDoc.save();
  const tempDir = appTempDir;
  const outputPath = path.join(tempDir, `content-list-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, contentListPdfBytes);

  return outputPath;
});
