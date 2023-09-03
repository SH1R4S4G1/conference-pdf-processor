// function Home() {
//   return <div>Hello World</div>;
// }

// export default Home;


// index.tsx
import React, { useState } from 'react';
import axios from 'axios';

export default function Home() {
  // PDFのデータとサムネイルのステート
  const [pdfData, setPdfData] = useState<Blob | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);  

  // PDFがドラッグ&ドロップされたときのハンドラ
  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    // ドロップされたファイルを取得
    const pdfFile = event.dataTransfer.files[0];
    const pdfBuffer = await pdfFile.arrayBuffer();

    // ファイルのデータをFormDataとしてAPIに送信
    const formData = new FormData();
    formData.append('pdf', new Blob([pdfBuffer]));

    try {
      // APIにPOSTリクエストを送信し、加工後のPDFを取得
      const response = await axios.post('/api/process-pdf', formData, {
        responseType: 'arraybuffer',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("API Response Content-Type:", response.headers['content-type']);

      console.log("API Response:", response); // 追加されたログ
      const apiResponseData = new Uint8Array(response.data);
      console.log("API Response Data (first bytes):", apiResponseData.slice(0, 10));

      setPdfData(new Blob([response.data], { type: 'application/pdf' }));
      // 実際にはサムネイルを生成するロジックが必要ですが、ダミーのサムネイルを設定
      setThumbnail('04.png');
    } catch (error) {
      console.error("Error processing the PDF:", error);
    }
  };

  return (
    <div>
      <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} style={{ border: '1px dashed', height: '200px' }}>
        PDFをここにドロップ
      </div>

      {thumbnail && (
        <div>
          <img src={thumbnail} alt="サムネイル" />
          {/* ダウンロードリンクの修正 */}
          <a href={pdfData ? URL.createObjectURL(pdfData) : '#'} download="edited.pdf">ダウンロード</a>
        </div>
      )}
    </div>
  );
}

