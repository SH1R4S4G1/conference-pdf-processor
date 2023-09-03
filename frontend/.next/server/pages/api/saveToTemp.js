"use strict";
(() => {
var exports = {};
exports.id = 832;
exports.ids = [832];
exports.modules = {

/***/ 285:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ saveToTemp)
});

;// CONCATENATED MODULE: external "os"
const external_os_namespaceObject = require("os");
;// CONCATENATED MODULE: external "fs"
const external_fs_namespaceObject = require("fs");
;// CONCATENATED MODULE: external "path"
const external_path_namespaceObject = require("path");
;// CONCATENATED MODULE: ./src/pages/api/saveToTemp.ts



/* harmony default export */ const saveToTemp = ((req, res)=>{
    if (req.method === "POST") {
        const fileData = req.body;
        const tempDir = external_os_namespaceObject.tmpdir();
        const filePath = external_path_namespaceObject.join(tempDir, "some_unique_filename.pdf"); // TODO: ユニークなファイル名を生成
        external_fs_namespaceObject.writeFileSync(filePath, fileData);
        res.status(200).json({
            path: filePath
        });
    } else {
        res.status(405).end(); // Method Not Allowed
    }
});


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__(285));
module.exports = __webpack_exports__;

})();