"use strict";
(() => {
var exports = {};
exports.id = 405;
exports.ids = [405];
exports.modules = {

/***/ 441:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(997);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);

function Home() {
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        children: "Hello World"
    });
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Home); // // index.tsx
 // import React, { useState } from 'react';
 // import axios from 'axios';
 // export default function Home() {
 //   // PDFのデータとサムネイルのステート
 //   const [pdfData, setPdfData] = useState<Blob | null>(null);
 //   const [thumbnail, setThumbnail] = useState<string | null>(null);  
 //   // PDFがドラッグ&ドロップされたときのハンドラ
 //   const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
 //     event.preventDefault();
 //     // ドロップされたファイルを取得
 //     const acceptedFiles = Array.from(event.dataTransfer.files);
 //     if (acceptedFiles.length === 0) {
 //         return;
 //     }
 //     const formData = new FormData();
 //     formData.append("pdf", acceptedFiles[0]);
 //     try {
 //         const response = await axios.post('/api/process-pdf', formData, {
 //             headers: {
 //                 'Content-Type': 'multipart/form-data'
 //             }
 //         });
 //         // ステートの更新前にレスポンスデータの形式を検証
 //         if (response.data && response.data.pdf && response.data.thumbnail) {
 //             setPdfData(response.data.pdf);
 //             setThumbnail(response.data.thumbnail);
 //         } else {
 //             // 期待する形式でない場合のエラーハンドリング
 //             console.error("APIからのレスポンスが期待する形式ではありません。", response.data);
 //         }
 //     } catch (error) {
 //         // APIリクエストが失敗した場合のエラーハンドリング
 //         console.error("APIリクエスト中にエラーが発生しました。", error);
 //     }
 // };
 //   // const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
 //   //   event.preventDefault();
 //   //   // ドロップされたファイルを取得
 //   //   const pdfFile = event.dataTransfer.files[0];
 //   //   const pdfBuffer = await pdfFile.arrayBuffer();
 //   //   // ファイルのデータをFormDataとしてAPIに送信
 //   //   const formData = new FormData();
 //   //   formData.append('pdf', new Blob([pdfBuffer]));
 //   //   try {
 //   //     // APIにPOSTリクエストを送信し、加工後のPDFを取得
 //   //     const response = await axios.post('/api/process-pdf', formData, {
 //   //       responseType: 'arraybuffer',
 //   //       headers: {
 //   //         'Content-Type': 'multipart/form-data'
 //   //       }
 //   //     });
 //   //     console.log("API Response Content-Type:", response.headers['content-type']);
 //   //     console.log("API Response:", response); // 追加されたログ
 //   //     const apiResponseData = new Uint8Array(response.data);
 //   //     console.log("API Response Data (first bytes):", apiResponseData.slice(0, 10));
 //   //     setPdfData(new Blob([response.data], { type: 'application/pdf' }));
 //   //     // 実際にはサムネイルを生成するロジックが必要ですが、ダミーのサムネイルを設定
 //   //     setThumbnail('04.png');
 //   //   } catch (error) {
 //   //     console.error("Error processing the PDF:", error);
 //   //   }
 //   // };
 //   return (
 //     <div>
 //       <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} style={{ border: '1px dashed', height: '200px' }}>
 //         PDFをここにドロップ
 //       </div>
 //       {thumbnail && (
 //         <div>
 //           <img src={thumbnail} alt="サムネイル" />
 //           {/* ダウンロードリンクの修正 */}
 //           <a href={pdfData ? URL.createObjectURL(pdfData) : '#'} download="edited.pdf">ダウンロード</a>
 //         </div>
 //       )}
 //     </div>
 //   );
 // }


/***/ }),

/***/ 997:
/***/ ((module) => {

module.exports = require("react/jsx-runtime");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(441));
module.exports = __webpack_exports__;

})();