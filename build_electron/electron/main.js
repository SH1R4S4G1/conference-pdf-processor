"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// main.ts
const electron_1 = require("electron");
const electron_2 = require("electron");
const child_process_1 = require("child_process");
const pdf_lib_1 = require("pdf-lib");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let mainWindow;
const createWindow = () => {
    mainWindow = new electron_1.BrowserWindow({
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
    }
    else {
        mainWindow.loadURL('http://localhost:3000');
        // mainWindow.loadFile(path.join(__dirname, '../../frontend/.next/server/pages/index.html'));
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
electron_1.app.on('will-quit', () => {
    const tempDir = electron_1.app.getPath('temp');
    const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
    for (const file of files) {
        try {
            fs.unlinkSync(path.join(tempDir, file));
        }
        catch (err) {
            console.error("Failed to delete file:", file, err);
        }
    }
});
// ファイルを一時フォルダに保存
electron_2.ipcMain.handle('save-to-temp', async (event, fileData, outputFilePath) => {
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
electron_2.ipcMain.handle('get-temp-files', async () => {
    const tempDir = electron_1.app.getPath('temp');
    const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
    return files;
});
// wordをpdfに変換
electron_2.ipcMain.handle('convert-word-to-pdf', async (event, filePath, outputFilePath) => {
    return new Promise((resolve, reject) => {
        console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
        const command = `powershell -command "$word = New-Object -ComObject Word.Application; $word.Visible = $false; $document = $word.Documents.Open('${filePath}'); $document.SaveAs('${outputFilePath}', 17); $document.Close(); $word.Quit()"`;
        (0, child_process_1.exec)(command, (error) => {
            if (error) {
                console.error("Word to PDF conversion error:", error);
                reject(error);
            }
            else {
                resolve(outputFilePath);
            }
        });
    });
});
// Excelをpdfに変換
electron_2.ipcMain.handle('convert-excel-to-pdf', async (event, filePath, outputFilePath) => {
    return new Promise((resolve, reject) => {
        console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
        const command = `powershell -command "$excel = New-Object -ComObject Excel.Application; $excel.Visible = $false; $workbook = $excel.Workbooks.Open('${filePath}'); $workbook.ExportAsFixedFormat(0, '${outputFilePath}'); $workbook.Close(); $excel.Quit()"`;
        (0, child_process_1.exec)(command, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(outputFilePath);
            }
        });
    });
});
// PowerPointをpdfに変換
electron_2.ipcMain.handle('convert-ppt-to-pdf', async (event, filePath, outputFilePath) => {
    return new Promise((resolve, reject) => {
        console.log("outputFilePath:", outputFilePath, "filePath:", filePath);
        const command = `powershell -command "$powerpoint = New-Object -ComObject PowerPoint.Application; $presentation = $powerpoint.Presentations.Open('${filePath}'); $presentation.SaveAs('${outputFilePath}', 32); $presentation.Close(); $powerpoint.Quit()"`;
        (0, child_process_1.exec)(command, (error) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(outputFilePath);
            }
        });
    });
});
// PDFのページ数を取得
electron_2.ipcMain.handle('get-pdf-page-count', async (event, filePath) => {
    try {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
        const pageCount = pdfDoc.getPageCount();
        return pageCount;
    }
    catch (error) {
        console.error("Error reading PDF:", error);
        throw error;
    }
});
