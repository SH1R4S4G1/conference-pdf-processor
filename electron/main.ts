// main.ts
import { app, BrowserWindow,dialog,ipcMain,shell,Dialog } from 'electron';
import { exec, execSync } from 'child_process';
import { degrees, PDFDocument, rgb, StandardFonts, PDFName, PDFNumber, PDFDict, PDFRef, PDFString, PDFHexString, PDFPage, PDFAnnotation, PDFArray } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import regedit from 'regedit';
import Store from 'electron-store';

let mainWindow: Electron.BrowserWindow | null;
// let appTempDir = path.join(app.getPath('temp'), 'conference-pdf-processor');
let appTempDir = path.join(os.tmpdir(), 'conference-pdf-processor');

let isWordInstalled: boolean;
let isExcelInstalled: boolean;
let isPowerPointInstalled: boolean;
let isLibreOfficeInstalledFlag: boolean;

// binでなくexeを指定するとウィンドウが表示されるので注意
// let libreOfficePath: string | null;
let libreOfficeInstallDir: string | null = null; // LibreOfficeのインストールフォルダ
let libreOfficeFullExecPath: string | null = null;   // soffice.binのパス
const libreOfficeDefaultDir = process.platform === 'darwin' 
  ? "/Applications/LibreOffice.app"
  : "C:\\Program Files\\LibreOffice";  // 64-bit
const libreOfficeDefaultDirAlt = process.platform === 'darwin'
  ? "/Applications/LibreOffice.app"
  : "C:\\Program Files (x86)\\LibreOffice";  // 32-bit
  const libreOfficeDefaultExecPath = process.platform === 'darwin'
  ? "/Contents/MacOS/soffice"
  : "\\program\\soffice.bin";  // 64-bit
  
// 設定ファイルの保存場所を指定
const store = new Store();

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
  if (process.platform === 'darwin') {
    return new Promise((resolve) => {
      try {
        const result = execSync(`mdfind "kMDItemCFBundleIdentifier == '${appName}'"`).toString();
        resolve(result.trim() !== '');
      } catch (error) {
        console.error(`Error checking installation of ${appName} on MacOS:`, error);
        resolve(false);
      }
    });
  } else {
    return new Promise((resolve) => {
      const appRegPath = [`HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${appName.toUpperCase()}.EXE`];

      regedit.list(appRegPath, (err) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}


// LibreOfficeのインストール確認
function isLibreOfficeInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const libreOfficeDefaultFullExecPath = path.join(libreOfficeDefaultDir, libreOfficeDefaultExecPath);
    const libreOfficeDefaultFullExecPathAlt = path.join(libreOfficeDefaultDirAlt, libreOfficeDefaultExecPath);

    exec(`"${libreOfficeDefaultFullExecPath}" --headless --version`, (error, stdout) => {
      if (error) {
        exec(`"${libreOfficeDefaultFullExecPathAlt}" --headless --version`, (error, stdout) => {
          if (error) {
            resolve(false);
          } else {
            libreOfficeInstallDir = libreOfficeDefaultDirAlt;
            libreOfficeFullExecPath = libreOfficeDefaultFullExecPathAlt;
            resolve(true);
          }
        });
      } else {
        libreOfficeInstallDir = libreOfficeDefaultDir;
        libreOfficeFullExecPath = libreOfficeDefaultFullExecPath;
        resolve(true);
      }
    });
  });
}

async function convertToPdfUsingLibreOffice(filePath: string, outputFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
      console.log("convertToPdfUsingLibreOffice called with filePath:", filePath, "outputFilePath:", outputFilePath);

      let libreOfficeCommand;

      if (process.platform === 'darwin') {
          console.log("Detected MacOS. Using MacOS-specific LibreOffice command.");
          // MacOSの場合、指定されたlibreOfficeFullExecPathかデフォルトのパスを使用
          const macLibreOfficePath = libreOfficeFullExecPath || path.join(libreOfficeDefaultDir, libreOfficeDefaultExecPath);
          libreOfficeCommand = `${macLibreOfficePath} --convert-to pdf --outdir "${path.dirname(outputFilePath)}" "${filePath}"`;
      } else if (process.platform === 'win32') {
          console.log("Detected Windows. Using Windows-specific LibreOffice command.");
          // Windowsの場合、指定されたlibreOfficeFullExecPathかデフォルトのパスを使用
          const winLibreOfficePath = libreOfficeFullExecPath || path.join(libreOfficeDefaultDir, libreOfficeDefaultExecPath);
          libreOfficeCommand = `"${winLibreOfficePath}" --headless --convert-to pdf "${filePath}" --outdir "${path.dirname(outputFilePath)}"`;
      } else {
          console.error("Unsupported OS detected.");
          reject(new Error("Unsupported OS detected."));
          return;
      }

      exec(libreOfficeCommand, (error: Error | null) => {
          if (error) {
              console.error("Error during LibreOffice conversion:", error);
              reject(error);
          } else {
              const generatedPdfPath = path.join(path.dirname(outputFilePath), path.basename(filePath, path.extname(filePath)) + ".pdf");
              fs.rename(generatedPdfPath, outputFilePath, (err) => {
                  if (err) {
                      console.error("Error renaming file:", err);
                      reject(err);
                  } else {
                      console.log("File renaming completed.");
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
  
  if (isWordInstalled) {
    if (process.platform === 'darwin') {
      return new Promise((resolve, reject) => {
          const appleScriptCommand = `
              tell application "Microsoft Word"
                  set theDoc to open "${filePath}"
                  save as theDoc file name "${outputFilePath}" file format format PDF
                  close theDoc
              end tell
          `;
          exec(`osascript -e '${appleScriptCommand}'`, (error: Error | null) => {
              if (error) {
                  reject(error);
              } else {
                  resolve(outputFilePath);
              }
          });
      });
    } else {
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
    });}
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
  
  if (isExcelInstalled) {
    if (process.platform === 'darwin') {
      return new Promise((resolve, reject) => {
          const appleScriptCommand = `
              tell application "Microsoft PowerPoint"
                  set thePresentation to open "${filePath}"
                  save as thePresentation file name "${outputFilePath}" file format PDF format
                  close thePresentation
              end tell
          `;
          exec(`osascript -e '${appleScriptCommand}'`, (error: Error | null) => {
              if (error) {
                  reject(error);
              } else {
                  resolve(outputFilePath);
              }
          });
      });
  } else {  
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
    });}
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

  if (isPowerPointInstalled) {
    return new Promise((resolve, reject) => {
      if (process.platform === 'darwin') {
        return new Promise((resolve, reject) => {
            const appleScriptCommand = `
                tell application "Microsoft PowerPoint"
                    set thePresentation to open "${filePath}"
                    save as thePresentation file name "${outputFilePath}" file format PDF format
                    close thePresentation
                end tell
            `;
            exec(`osascript -e '${appleScriptCommand}'`, (error: Error | null) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(outputFilePath);
                }
            });
        });
    } else {
      console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
      const command = `powershell -command "$powerpoint = New-Object -ComObject PowerPoint.Application; $presentation = $powerpoint.Presentations.Open('${filePath}'); $presentation.SaveAs('${outputFilePath}', 32); $presentation.Close(); $powerpoint.Quit()"`;
      exec(command, (error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve(outputFilePath);
        }
      });
    }});
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
  const fontBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'electron', 'assets', 'fonts', 'ipaexm.ttf'));
  const font = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([600, 800]);  // 適切なサイズに調整してください

  //TODO: ファイル名の表示についてリンクかこちらのテキストか判断
  // let yOffset = 750;  // Y座標のオフセット（初期値）

  // for (const fileInfo of fileInfos) {
  //     const text = `${fileInfo.name} - 開始ページ: ${fileInfo.startPage}`;
  //     page.drawText(text, {
  //         x: 50,
  //         y: yOffset,
  //         size: 20,
  //         font: font,
  //         color: rgb(0, 0, 0),
  //     });

  //     yOffset -= 25;  // Y座標を下に移動
  // }

  // ファイルの保存
  const contentListPdfBytes = await pdfDoc.save();
  const tempDir = appTempDir;
  const outputPath = path.join(tempDir, `content-list-${Date.now()}.pdf`);
  fs.writeFileSync(outputPath, contentListPdfBytes);
  
  return outputPath;
});

ipcMain.handle('select-libreoffice-path', async (event) => {
  const defaultDirectory = libreOfficeInstallDir || os.homedir();

  const folders = dialog.showOpenDialogSync({
    properties: ['openDirectory'],
    title: 'LibreOfficeのインストールフォルダを選択',
    defaultPath: defaultDirectory,
  });

  if (folders && folders.length > 0) {
    const selectedPath = folders[0];
    let sofficePath;
    if (process.platform === 'darwin') {
        sofficePath = path.join(selectedPath, 'Contents', 'MacOS', 'soffice');
    } else {
        sofficePath = path.join(selectedPath, 'program', 'soffice.bin');
    }

    if (fs.existsSync(sofficePath)) {
      store.set('libreofficePath', sofficePath);
      return sofficePath;
    }
  }
  throw new Error('LibreOffice installation not found at the selected path.');
});

ipcMain.handle('get-libreoffice-path', (event) => {
  return libreOfficeFullExecPath;
});

ipcMain.handle('set-libreoffice-path', (event, newPath) => {
  libreOfficeFullExecPath = newPath;
  return true;
});

ipcMain.handle('create-outline', async (event, { pdfPath, outlines,indexPages }) => {
  const existingPdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  await createOutlines(pdfDoc, outlines, indexPages);
  const pdfBytes = await pdfDoc.save();

  console.log("create-outline:", pdfDoc)

  fs.writeFileSync(pdfPath, pdfBytes);
  return pdfPath;
});

// アウトラインを追加する関数
async function createOutlines(doc: PDFDocument, outlines: Array<{ title: string, page: number }>, indexPages: number) {
  const pages = doc.getPages();
  console.log("Total pages in doc:", pages.length);
  console.log("Outlines:", JSON.stringify(outlines, null, 2));

  const pageRefs = outlines.map(({ page }) => {
    const adjustedPage = page + indexPages - 1;  // 資料一覧のページ数を加算
    if (!pages[adjustedPage]) {
      console.error(`Invalid page number: ${adjustedPage}`);
    }
    return pages[adjustedPage].ref;
  });  

  const outlineRefs: PDFRef[] = [];

  // Creating individual outline items
  for (let i = 0; i < outlines.length; i++) {
      const { title, page } = outlines[i];

      const decodedTitle = decodeTitle(title);
      const outlineRef = doc.context.nextRef();
      const outlineItem = createOutlineItem(doc, decodedTitle, null, null, pageRefs[i]);

      doc.context.assign(outlineRef, outlineItem);
      outlineRefs.push(outlineRef);
  }

  // Linking the outlines together
  for (let i = 0; i < outlineRefs.length - 1; i++) {
      const currentOutline = doc.context.lookup(outlineRefs[i], PDFDict);
      currentOutline.set(PDFName.of("Next"), outlineRefs[i + 1]);
  }

  for (let i = 1; i < outlineRefs.length; i++) {
      const currentOutline = doc.context.lookup(outlineRefs[i], PDFDict);
      currentOutline.set(PDFName.of("Prev"), outlineRefs[i - 1]);
  }

  const outlinesDictRef = doc.context.nextRef();
  const outlinesDictMap = new Map();
  outlinesDictMap.set(PDFName.Type, PDFName.of("Outlines"));
  outlinesDictMap.set(PDFName.of("First"), outlineRefs[0]);
  outlinesDictMap.set(PDFName.of("Last"), outlineRefs[outlineRefs.length - 1]);
  outlinesDictMap.set(PDFName.of("Count"), PDFNumber.of(outlines.length));

  const outlinesDict = PDFDict.fromMapWithContext(outlinesDictMap, doc.context);
  doc.catalog.set(PDFName.of("Outlines"), outlinesDictRef);
  doc.context.assign(outlinesDictRef, outlinesDict);
}

function createOutlineItem(doc: PDFDocument, title: string, parentRef: PDFRef | null, nextRef: PDFRef | null, pageRef: PDFRef) {
  const dict = new Map();

  // この Uint8Array を直接 PDFHexString として使用
  const encodedTitle = PDFHexString.fromText(title);

  dict.set(PDFName.of("Title"), encodedTitle);

  if (parentRef) dict.set(PDFName.of("Parent"), parentRef);
  if (nextRef) dict.set(PDFName.of("Next"), nextRef);
  dict.set(PDFName.of("Dest"), doc.context.obj([pageRef, PDFName.of("XYZ"), null, null, null]));

  return PDFDict.fromMapWithContext(dict, doc.context);
}


function decodeTitle(encodedTitle: string): string {
  return decodeURIComponent(encodedTitle);
}

ipcMain.handle('add-links-to-content-list', async (event, { pdfPath, contentData , indexPages }) => {
  const pdfBytes = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const page = pdfDoc.getPages()[0];
  let yOffset = 750; 
  const linkHeight = 25;

  for (const entry of contentData) {
    const linkRect = {
      x: 50,
      y: yOffset - linkHeight,
      width: 500,
      height: linkHeight
    };

    // TODO:枠はいらない？
    // page.drawRectangle({
    //   ...linkRect,
    //   borderColor: rgb(0, 0, 0),
    //   borderWidth: 1,
    //   opacity: 0
    // });    

    // 外部フォントを読み込む
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync(path.join(__dirname, '..', '..', 'electron', 'assets', 'fonts', 'ipaexm.ttf'));
    const font = await pdfDoc.embedFont(fontBytes);  

    const text = `${entry.name} ───── ${entry.startPage}ページ`;
    page.drawText(text, {
      x: linkRect.x,
      y: linkRect.y,
      size: 20,
      font: font,
      color: rgb(0, 0, 1)
    });

    // Create link annotation
    const linkAnnot = createPageLinkAnnotation(pdfDoc, pdfDoc.getPages()[entry.startPage + indexPages - 1].ref, linkRect); // ここで indexPages を加算
    
    // 既存のアノテーションを取得または新しい配列を作成
    const annotations = page.node.lookup(PDFName.of('Annots'), PDFArray) || pdfDoc.context.obj([]);
    annotations.push(linkAnnot);
    page.node.set(PDFName.of('Annots'), annotations);

    yOffset -= linkHeight;

  }

  const savedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(pdfPath, savedPdfBytes);
  return pdfPath;
});

const createPageLinkAnnotation = (pdfDoc: PDFDocument, pageRef: PDFRef, linkRect: { x: number, y: number, width: number, height: number }) => {
  return pdfDoc.context.register(
    pdfDoc.context.obj({
      Type: 'Annot',
      Subtype: 'Link',
      Rect: [linkRect.x, linkRect.y, linkRect.x + linkRect.width, linkRect.y + linkRect.height], // 位置を動的に設定
      Border: [0, 0, 2],
      C: [0, 0, 1],
      Dest: [pageRef, 'XYZ', null, null, null],
    })
  );
};


