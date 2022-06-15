import fs from 'fs-extra';
import path from 'path';

export default async (folder: string, address: string) => {
  const ret = await fs.readdir(path.join(folder, 'keystore'));
  const signFilenames = ret.filter((item) => item.startsWith('sign_') && item !== 'sign_default');
  let keyName = '';
  for (const filename of signFilenames) {
    const content = await fs.readFile(path.join(folder, 'keystore', filename), 'utf8');
    if (content.includes(address.toLocaleLowerCase().replace('0x', ''))) {
      keyName = filename.replace('sign_', '');
    }
  }
  return keyName;
};
