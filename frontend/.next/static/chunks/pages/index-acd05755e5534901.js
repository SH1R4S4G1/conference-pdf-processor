(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{8312:function(e,n,t){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return t(3806)}])},3806:function(e,n,t){"use strict";function r(e,n,t,r,o,a,i){try{var c=e[a](i),l=c.value}catch(s){return void t(s)}c.done?n(l):Promise.resolve(l).then(r,o)}function o(e){return function(){var n=this,t=arguments;return new Promise((function(o,a){var i=e.apply(n,t);function c(e){r(i,o,a,c,l,"next",e)}function l(e){r(i,o,a,c,l,"throw",e)}c(void 0)}))}}function a(e,n){(null==n||n>e.length)&&(n=e.length);for(var t=0,r=new Array(n);t<n;t++)r[t]=e[t];return r}function i(e){return function(e){if(Array.isArray(e))return a(e)}(e)||function(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}(e)||function(e,n){if(e){if("string"===typeof e)return a(e,n);var t=Object.prototype.toString.call(e).slice(8,-1);return"Object"===t&&e.constructor&&(t=e.constructor.name),"Map"===t||"Set"===t?Array.from(t):"Arguments"===t||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t)?a(e,n):void 0}}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}t.r(n),t.d(n,{default:function(){return f}});var c=t(7582),l=t(5893),s=t(7294),u=t(1864);function f(){var e=(0,s.useState)(null),n=e[0],t=(e[1],(0,s.useState)(null)),r=t[0],a=(t[1],(0,s.useState)([])),f=a[0],h=a[1],d=(0,s.useState)([]),p=d[0],v=d[1],g=(0,s.useState)(!1),b=g[0],m=g[1],x=(0,s.useState)([]),w=x[0],y=x[1];(0,s.useEffect)((function(){console.log("fileList has changed:",f)}),[f]),(0,s.useEffect)((function(){console.log("oddPageFiles has changed:",p)}),[p]);var k=function(){var e=o((function(){var e;return(0,c.__generator)(this,(function(n){switch(n.label){case 0:return[4,window.electron.invoke("get-temp-files")];case 1:return e=n.sent(),h(e),[2]}}))}));return function(){return e.apply(this,arguments)}}();(0,s.useEffect)((function(){k()}),[]);var A=function(){var e=o((function(e){var n,t,r;return(0,c.__generator)(this,(function(o){switch(o.label){case 0:n=function(e){var n,r,o,a,l,s,f,h;return(0,c.__generator)(this,(function(c){switch(c.label){case 0:return r=t[e],o=null===(n=r.name.split(".").pop())||void 0===n?void 0:n.toLowerCase(),"application/pdf"===r.type||["doc","docx","xls","xlsx","ppt","pptx"].includes(o||"")?[4,r.arrayBuffer()]:[3,11];case 1:return a=c.sent(),l="C:\\Users\\devuser\\AppData\\Local\\Temp",console.log("Temp Directory:",l),s=Date.now()+".pdf",f=u.join(l,s).replace(/\//g,"\\"),u.basename(f),console.log(o,r.type,r.path,f),["doc","docx"].includes(o||"")?(console.log(f),[4,window.electron.invoke("convert-word-to-pdf",r.path,f)]):[3,3];case 2:return c.sent(),[3,9];case 3:return["xls","xlsx"].includes(o||"")?[4,window.electron.invoke("convert-excel-to-pdf",r.path,f)]:[3,5];case 4:return c.sent(),[3,9];case 5:return["ppt","pptx"].includes(o||"")?[4,window.electron.invoke("convert-ppt-to-pdf",r.path,f)]:[3,7];case 6:return c.sent(),[3,9];case 7:return"application/pdf"!==r.type?[3,9]:[4,window.electron.invoke("save-to-temp",new Uint8Array(a),f)];case 8:c.sent(),c.label=9;case 9:return[4,window.electron.invoke("get-pdf-page-count",f)];case 10:return h=c.sent(),console.log(h),h%2!==0&&(console.log("\u30da\u30fc\u30b8\u6570\u304c\u5947\u6570\u3067\u3059\u3002"),v((function(e){return i(e).concat([f])}))),[3,12];case 11:alert("".concat(r.name," is not a supported file type.")),c.label=12;case 12:return[2]}}))},e.preventDefault(),t=e.dataTransfer.files,r=0,o.label=1;case 1:return r<t.length?[5,(0,c.__values)(n(r))]:[3,4];case 2:o.sent(),o.label=3;case 3:return r++,[3,1];case 4:return k(),[2]}}))}));return function(n){return e.apply(this,arguments)}}(),C=function(){var e=o((function(){var e,n,t,r,o,a,l;return(0,c.__generator)(this,(function(s){switch(s.label){case 0:e=!0,n=!1,t=void 0,s.label=1;case 1:s.trys.push([1,6,7,8]),r=function(){var e,n,t;return(0,c.__generator)(this,(function(r){switch(r.label){case 0:e=a.value,r.label=1;case 1:return r.trys.push([1,3,,4]),[4,window.electron.invoke("add-blank-page",e)];case 2:return n=r.sent(),h((function(e){return i(e).concat([n])})),[3,4];case 3:return t=r.sent(),console.error("Error adding blank page to ".concat(e,":"),t),[3,4];case 4:return[2]}}))},o=w[Symbol.iterator](),s.label=2;case 2:return(e=(a=o.next()).done)?[3,5]:[5,(0,c.__values)(r())];case 3:s.sent(),s.label=4;case 4:return e=!0,[3,2];case 5:return[3,8];case 6:return l=s.sent(),n=!0,t=l,[3,8];case 7:try{e||null==o.return||o.return()}finally{if(n)throw t}return[7];case 8:return console.log("\u767d\u7d19\u5dee\u3057\u8fbc\u307f\u5b8c\u4e86"),k(),[2]}}))}));return function(){return e.apply(this,arguments)}}(),_=function(){var e=o((function(){var e,n;return(0,c.__generator)(this,(function(t){switch(t.label){case 0:console.log(f),t.label=1;case 1:return t.trys.push([1,4,,5]),[4,window.electron.invoke("combine-pdfs",{files:f,addPageNumbers:b})];case 2:return e=t.sent(),[4,window.electron.invoke("open-file",e)];case 3:return t.sent(),[3,5];case 4:return n=t.sent(),console.error("Error combining PDFs:",n),[3,5];case 5:return[2]}}))}));return function(){return e.apply(this,arguments)}}();return(0,l.jsxs)("div",{children:[(0,l.jsx)("div",{onDrop:A,onDragOver:function(e){return e.preventDefault()},style:{border:"1px dashed",height:"200px"},children:"PDF\u3092\u3053\u3053\u306b\u30c9\u30ed\u30c3\u30d7"}),r&&(0,l.jsxs)("div",{children:[(0,l.jsx)("img",{src:r,alt:"\u30b5\u30e0\u30cd\u30a4\u30eb"}),(0,l.jsx)("a",{href:n?URL.createObjectURL(n):"#",download:"edited.pdf",children:"\u30c0\u30a6\u30f3\u30ed\u30fc\u30c9"})]}),(0,l.jsxs)("div",{children:[(0,l.jsx)("h2",{children:"Uploaded Files"}),(0,l.jsx)("ul",{children:f.map((function(e){return console.log("Checking file:",e,p.includes(e)),(0,l.jsxs)("li",{children:[e,p.includes(e)&&(0,l.jsxs)("div",{children:[(0,l.jsx)("input",{type:"checkbox",id:"insert-blank-".concat(u.basename(e)),onChange:function(n){return t=e,r=n.target.checked,void y(r?function(e){return i(e).concat([t])}:function(e){return e.filter((function(e){return e!==t}))});var t,r}}),(0,l.jsx)("label",{htmlFor:"insert-blank-".concat(u.basename(e)),children:"\u767d\u7d19\u3092\u5dee\u3057\u8fbc\u3080"}),(0,l.jsx)("button",{onClick:C,children:"\u767d\u7d19\u5dee\u3057\u8fbc\u307f\u3092\u5b9f\u884c"})]})]},e)}))}),(0,l.jsx)("div",{className:"mt-4",children:(0,l.jsxs)("label",{children:[(0,l.jsx)("input",{type:"checkbox",checked:b,onChange:function(e){return m(e.target.checked)}}),"\u30da\u30fc\u30b8\u6570\u3092\u4ed8\u4e0e\u3059\u308b"]})}),(0,l.jsx)("div",{className:"mt-4",children:(0,l.jsx)("button",{onClick:_,children:"\u30d5\u30a1\u30a4\u30eb\u3092\u7d71\u5408\u3059\u308b"})})]})]})}},1864:function(e){!function(){"use strict";var n={114:function(e){function n(e){if("string"!==typeof e)throw new TypeError("Path must be a string. Received "+JSON.stringify(e))}function t(e,n){for(var t,r="",o=0,a=-1,i=0,c=0;c<=e.length;++c){if(c<e.length)t=e.charCodeAt(c);else{if(47===t)break;t=47}if(47===t){if(a===c-1||1===i);else if(a!==c-1&&2===i){if(r.length<2||2!==o||46!==r.charCodeAt(r.length-1)||46!==r.charCodeAt(r.length-2))if(r.length>2){var l=r.lastIndexOf("/");if(l!==r.length-1){-1===l?(r="",o=0):o=(r=r.slice(0,l)).length-1-r.lastIndexOf("/"),a=c,i=0;continue}}else if(2===r.length||1===r.length){r="",o=0,a=c,i=0;continue}n&&(r.length>0?r+="/..":r="..",o=2)}else r.length>0?r+="/"+e.slice(a+1,c):r=e.slice(a+1,c),o=c-a-1;a=c,i=0}else 46===t&&-1!==i?++i:i=-1}return r}var r={resolve:function(){for(var e,r="",o=!1,a=arguments.length-1;a>=-1&&!o;a--){var i;a>=0?i=arguments[a]:(void 0===e&&(e=""),i=e),n(i),0!==i.length&&(r=i+"/"+r,o=47===i.charCodeAt(0))}return r=t(r,!o),o?r.length>0?"/"+r:"/":r.length>0?r:"."},normalize:function(e){if(n(e),0===e.length)return".";var r=47===e.charCodeAt(0),o=47===e.charCodeAt(e.length-1);return 0!==(e=t(e,!r)).length||r||(e="."),e.length>0&&o&&(e+="/"),r?"/"+e:e},isAbsolute:function(e){return n(e),e.length>0&&47===e.charCodeAt(0)},join:function(){if(0===arguments.length)return".";for(var e,t=0;t<arguments.length;++t){var o=arguments[t];n(o),o.length>0&&(void 0===e?e=o:e+="/"+o)}return void 0===e?".":r.normalize(e)},relative:function(e,t){if(n(e),n(t),e===t)return"";if((e=r.resolve(e))===(t=r.resolve(t)))return"";for(var o=1;o<e.length&&47===e.charCodeAt(o);++o);for(var a=e.length,i=a-o,c=1;c<t.length&&47===t.charCodeAt(c);++c);for(var l=t.length-c,s=i<l?i:l,u=-1,f=0;f<=s;++f){if(f===s){if(l>s){if(47===t.charCodeAt(c+f))return t.slice(c+f+1);if(0===f)return t.slice(c+f)}else i>s&&(47===e.charCodeAt(o+f)?u=f:0===f&&(u=0));break}var h=e.charCodeAt(o+f);if(h!==t.charCodeAt(c+f))break;47===h&&(u=f)}var d="";for(f=o+u+1;f<=a;++f)f!==a&&47!==e.charCodeAt(f)||(0===d.length?d+="..":d+="/..");return d.length>0?d+t.slice(c+u):(c+=u,47===t.charCodeAt(c)&&++c,t.slice(c))},_makeLong:function(e){return e},dirname:function(e){if(n(e),0===e.length)return".";for(var t=e.charCodeAt(0),r=47===t,o=-1,a=!0,i=e.length-1;i>=1;--i)if(47===(t=e.charCodeAt(i))){if(!a){o=i;break}}else a=!1;return-1===o?r?"/":".":r&&1===o?"//":e.slice(0,o)},basename:function(e,t){if(void 0!==t&&"string"!==typeof t)throw new TypeError('"ext" argument must be a string');n(e);var r,o=0,a=-1,i=!0;if(void 0!==t&&t.length>0&&t.length<=e.length){if(t.length===e.length&&t===e)return"";var c=t.length-1,l=-1;for(r=e.length-1;r>=0;--r){var s=e.charCodeAt(r);if(47===s){if(!i){o=r+1;break}}else-1===l&&(i=!1,l=r+1),c>=0&&(s===t.charCodeAt(c)?-1===--c&&(a=r):(c=-1,a=l))}return o===a?a=l:-1===a&&(a=e.length),e.slice(o,a)}for(r=e.length-1;r>=0;--r)if(47===e.charCodeAt(r)){if(!i){o=r+1;break}}else-1===a&&(i=!1,a=r+1);return-1===a?"":e.slice(o,a)},extname:function(e){n(e);for(var t=-1,r=0,o=-1,a=!0,i=0,c=e.length-1;c>=0;--c){var l=e.charCodeAt(c);if(47!==l)-1===o&&(a=!1,o=c+1),46===l?-1===t?t=c:1!==i&&(i=1):-1!==t&&(i=-1);else if(!a){r=c+1;break}}return-1===t||-1===o||0===i||1===i&&t===o-1&&t===r+1?"":e.slice(t,o)},format:function(e){if(null===e||"object"!==typeof e)throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof e);return function(e,n){var t=n.dir||n.root,r=n.base||(n.name||"")+(n.ext||"");return t?t===n.root?t+r:t+e+r:r}("/",e)},parse:function(e){n(e);var t={root:"",dir:"",base:"",ext:"",name:""};if(0===e.length)return t;var r,o=e.charCodeAt(0),a=47===o;a?(t.root="/",r=1):r=0;for(var i=-1,c=0,l=-1,s=!0,u=e.length-1,f=0;u>=r;--u)if(47!==(o=e.charCodeAt(u)))-1===l&&(s=!1,l=u+1),46===o?-1===i?i=u:1!==f&&(f=1):-1!==i&&(f=-1);else if(!s){c=u+1;break}return-1===i||-1===l||0===f||1===f&&i===l-1&&i===c+1?-1!==l&&(t.base=t.name=0===c&&a?e.slice(1,l):e.slice(c,l)):(0===c&&a?(t.name=e.slice(1,i),t.base=e.slice(1,l)):(t.name=e.slice(c,i),t.base=e.slice(c,l)),t.ext=e.slice(i,l)),c>0?t.dir=e.slice(0,c-1):a&&(t.dir="/"),t},sep:"/",delimiter:":",win32:null,posix:null};r.posix=r,e.exports=r}},t={};function r(e){var o=t[e];if(void 0!==o)return o.exports;var a=t[e]={exports:{}},i=!0;try{n[e](a,a.exports,r),i=!1}finally{i&&delete t[e]}return a.exports}r.ab="//";var o=r(114);e.exports=o}()}},function(e){e.O(0,[774,888,179],(function(){return n=8312,e(e.s=n);var n}));var n=e.O();_N_E=n}]);