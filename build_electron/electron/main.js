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
const child_process_1 = require("child_process");
const pdf_lib_1 = require("pdf-lib");
const os = __importStar(require("os"));
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
// OSの一時フォルダを取得
electron_1.ipcMain.handle('get-os-tmpdir', () => {
    return os.tmpdir();
});
// ファイルを一時フォルダに保存
electron_1.ipcMain.handle('save-to-temp', async (event, fileData, outputFilePath) => {
    fs.writeFileSync(outputFilePath, new Buffer(fileData));
    return outputFilePath;
});
// ファイル一覧を取得
electron_1.ipcMain.handle('get-temp-files', async () => {
    const tempDir = electron_1.app.getPath('temp');
    const files = fs.readdirSync(tempDir).filter(file => path.extname(file) === '.pdf');
    return files.map(file => path.join(tempDir, file)); // フルパスを返すように修正
});
// wordをpdfに変換
electron_1.ipcMain.handle('convert-word-to-pdf', async (event, filePath, outputFilePath) => {
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
electron_1.ipcMain.handle('convert-excel-to-pdf', async (event, filePath, outputFilePath) => {
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
electron_1.ipcMain.handle('convert-ppt-to-pdf', async (event, filePath, outputFilePath) => {
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
electron_1.ipcMain.handle('get-pdf-page-count', async (event, filePath) => {
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
// PDFに白紙のページを追加
electron_1.ipcMain.handle('add-blank-page', async (event, filePath) => {
    try {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
        // 新しい白紙のページを追加
        pdfDoc.addPage([612, 792]); // A4のサイズ
        const newPdfBytes = await pdfDoc.save();
        // processedを接尾語として追加
        const processedFilePath = filePath.replace('.pdf', '-add-Blank.pdf');
        fs.writeFileSync(processedFilePath, newPdfBytes);
        return processedFilePath;
    }
    catch (error) {
        console.error("Error adding blank page:", error);
        throw error;
    }
});
// PDFを結合する
electron_1.ipcMain.handle('combine-pdfs', async (event, data) => {
    console.log("Received files for combining:", data.files);
    const mergedPdfDoc = await pdf_lib_1.PDFDocument.create();
    let totalPages = 0; // 追加: 連番のための変数
    for (const filePath of data.files) {
        console.log("Reading file:", filePath);
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
        const pages = await mergedPdfDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        for (const page of pages) {
            mergedPdfDoc.addPage(page);
        }
        console.log(`File ${filePath} has ${pdfDoc.getPageCount()} pages.`);
    }
    if (data.addPageNumbers) { // ページ数を追加する場合のみ
        const font = await mergedPdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const pages = mergedPdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { width } = page.getSize();
            page.drawText(String(totalPages + i + 1), {
                x: width - 50,
                y: 30,
                size: 30,
                font: font,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
        }
        totalPages += pages.length; // 連番の更新
    }
    console.log(`Combined PDF has ${mergedPdfDoc.getPageCount()} pages.`);
    const mergedPdfBytes = await mergedPdfDoc.save();
    const tempDir = electron_1.app.getPath('temp');
    const outputPath = path.join(tempDir, `merged-${Date.now()}.pdf`);
    fs.writeFileSync(outputPath, mergedPdfBytes);
    return outputPath;
});
// ページ番号を追加する
electron_1.ipcMain.handle('add-page-numbers', async (event, filePath) => {
    try {
        const pdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBytes);
        const font = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { width } = page.getSize();
            page.drawText(String(i + 1), {
                x: width - 50,
                y: 30,
                size: 30,
                font: font,
                color: (0, pdf_lib_1.rgb)(0, 0, 0),
            });
        }
        const modifiedPdfBytes = await pdfDoc.save();
        const tempDir = electron_1.app.getPath('temp');
        const outputPath = path.join(tempDir, `numbered-${Date.now()}.pdf`);
        fs.writeFileSync(outputPath, modifiedPdfBytes);
        return outputPath;
    }
    catch (error) {
        console.error("Error adding page numbers:", error);
        throw error;
    }
});
// PDFを保存するためにダイアログを開く
electron_1.ipcMain.handle('open-file', async (event, filePath) => {
    try {
        await electron_1.shell.openPath(filePath);
    }
    catch (error) {
        console.error("Error opening file:", error);
        throw error;
    }
});
