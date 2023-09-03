import { NextApiRequest, NextApiResponse } from 'next';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export default (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    const fileData = req.body;
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, 'some_unique_filename.pdf');  // TODO: ユニークなファイル名を生成

    fs.writeFileSync(filePath, fileData);

    res.status(200).json({ path: filePath });
  } else {
    res.status(405).end();  // Method Not Allowed
  }
};
