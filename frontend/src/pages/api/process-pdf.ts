// process-pdf.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import multer from 'multer';

// multerの設定
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

export const config = {
  api: {
    bodyParser: false,
  },
};

interface MulterRequest extends NextApiRequest {
  file: any;
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  upload.single('pdf')(req as any, res as any, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: 'Error processing file upload' });
    }


    try {
        console.log("Starting PDF processing...");

        // ステップ1: PDFデータをバッファとして取得
        console.log("Loading PDF data from request...");
        const multerReq = req as MulterRequest;
        const pdfBytes = multerReq.file.buffer;  
        console.log("Original PDF data:", pdfBytes); // 加工前のログ      
        console.log("Loaded PDF data successfully");

        // ステップ2: PDFを読み込む
        console.log("Loading the PDF document...");
        const firstBytes = Array.from(pdfBytes.slice(0, 5)) as number[];
        console.log("First bytes of received data:", String.fromCharCode(...firstBytes));
                const pdfDoc = await PDFDocument.load(pdfBytes);
        console.log("Loaded the PDF document successfully");

        // ステップ3: フォントをロードする
        console.log("Embedding font...");
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        console.log("Font embedded successfully");

        // ステップ4: 各ページにページ番号を追加する
        console.log("Adding page numbers...");
        const pages = pdfDoc.getPages();
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            const { width } = page.getSize();
            page.drawText(String(i + 1), {
                x: width - 50,
                y: 30,
                size: 30,
                font: font,
                color: rgb(0, 0, 0),
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
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=processed.pdf');
        
        console.log("Sending success response with modified PDF");
        res.status(200).send(Buffer.from(modifiedPdfBytes));
      }
        catch (error) {
          console.error('Error processing PDF:', error);
          console.error('Error stack trace:', (error as Error).stack);  // スタックトレースの追加
          res.status(500).json({ error: 'Internal Server Error', details: (error as Error).message });
      }      
})};




// import { NextApiRequest, NextApiResponse } from 'next';
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
