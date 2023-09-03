"use strict";
(() => {
var exports = {};
exports.id = 432;
exports.ids = [432];
exports.modules = {

/***/ 161:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "config": () => (/* binding */ config),
  "default": () => (/* binding */ process_pdf)
});

;// CONCATENATED MODULE: external "pdf-lib"
const external_pdf_lib_namespaceObject = require("pdf-lib");
;// CONCATENATED MODULE: external "multer"
const external_multer_namespaceObject = require("multer");
var external_multer_default = /*#__PURE__*/__webpack_require__.n(external_multer_namespaceObject);
;// CONCATENATED MODULE: ./src/pages/api/process-pdf.ts
// process-pdf.ts


// multerの設定
const storage = external_multer_default().memoryStorage();
const upload = external_multer_default()({
    storage: storage
});
const config = {
    api: {
        bodyParser: false
    }
};
/* harmony default export */ const process_pdf = (async (req, res)=>{
    upload.single("pdf")(req, res, async (err)=>{
        if (err) {
            console.error("Multer error:", err);
            return res.status(500).json({
                error: "Error processing file upload"
            });
        }
        try {
            console.log("Starting PDF processing...");
            // ステップ1: PDFデータをバッファとして取得
            console.log("Loading PDF data from request...");
            const multerReq = req;
            const pdfBytes = multerReq.file.buffer;
            console.log("Original PDF data:", pdfBytes); // 加工前のログ      
            console.log("Loaded PDF data successfully");
            // ステップ2: PDFを読み込む
            console.log("Loading the PDF document...");
            const firstBytes = Array.from(pdfBytes.slice(0, 5));
            console.log("First bytes of received data:", String.fromCharCode(...firstBytes));
            const pdfDoc = await external_pdf_lib_namespaceObject.PDFDocument.load(pdfBytes);
            console.log("Loaded the PDF document successfully");
            // ステップ3: フォントをロードする
            console.log("Embedding font...");
            const font = await pdfDoc.embedFont(external_pdf_lib_namespaceObject.StandardFonts.Helvetica);
            console.log("Font embedded successfully");
            // ステップ4: 各ページにページ番号を追加する
            console.log("Adding page numbers...");
            const pages = pdfDoc.getPages();
            for(let i = 0; i < pages.length; i++){
                const page = pages[i];
                const { width  } = page.getSize();
                page.drawText(String(i + 1), {
                    x: width - 50,
                    y: 30,
                    size: 30,
                    font: font,
                    color: (0,external_pdf_lib_namespaceObject.rgb)(0, 0, 0)
                });
            }
            console.log("Added page numbers successfully");
            // ステップ5: PDFをシリアライズしてUint8Arrayとして取得
            console.log("Serializing modified PDF...");
            const modifiedPdfBytes = await pdfDoc.save();
            console.log("Modified PDF data:", modifiedPdfBytes); // 加工後のログ
            console.log("Serialized modified PDF successfully");
            // ステップ6: 変更されたPDFをレスポンスとして返す
            console.log("Setting response headers...");
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=processed.pdf");
            console.log("Sending success response with modified PDF");
            res.status(200).send(Buffer.from(modifiedPdfBytes));
        } catch (error) {
            console.error("Error processing PDF:", error);
            console.error("Error stack trace:", error.stack); // スタックトレースの追加
            res.status(500).json({
                error: "Internal Server Error",
                details: error.message
            });
        }
    });
}); // import { NextApiRequest, NextApiResponse } from 'next';
 // import init, { add_page_numbers_to_pdf } from '../../wasm/pkg/wasm.js'; 
 // //TODO: Wasmのパスを環境変数にした方がいいかも
 // // Wasmのためにフェッチを追加
 // import fetch, { RequestInfo, RequestInit, Response } from 'node-fetch';
 // (globalThis.fetch as unknown) = fetch;
 // export default async (req: NextApiRequest, res: NextApiResponse) => {
 //   // Wasmモジュールの初期化
 //   await init();
 //   if (req.method === 'POST') {
 //     try {
 //       const pdfBuffer = Buffer.from(req.body.pdf);
 //       const processedPdfData = add_page_numbers_to_pdf(pdfBuffer);
 //       res.status(200).send(processedPdfData);
 //     } catch (error) {
 //       res.status(500).send({ error: 'Failed to process the PDF.' });
 //     }
 //   } else {
 //     res.status(405).send({ error: 'Only POST requests are accepted.' });
 //   }
 // };


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(161));
module.exports = __webpack_exports__;

})();