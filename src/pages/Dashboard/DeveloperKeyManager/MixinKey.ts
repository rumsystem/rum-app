const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').execFile);
const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

const create = async (mixin: any) => {
  const keyPath = 'mixin.key';
  await writeFile('mixin.key', mixin.private_key);
  const aesKey = await decrypt({
    keyPath,
    sessionId: mixin.session_id,
    pinToken: mixin.pin_token,
  });
  await unlink(keyPath);
  return {
    id: mixin.id,
    pinCode: mixin.pin,
    clientId: mixin.client_id,
    sessionId: mixin.session_id,
    clientSecret: mixin.client_secret,
    pinToken: mixin.pin_token,
    privateKey: mixin.private_key,
    aesKey,
    domain: 'https://mixin-www.zeromesh.net',
    authorizationURL: 'https://mixin-www.zeromesh.net/oauth/authorize',
  };
};

const decrypt = async (options: any = {}) => {
  const { keyPath, sessionId, pinToken } = options;
  const os_decrypt_file: any = {
    linux: 'decrypt/linux',
    darwin: 'decrypt/darwin',
    win32: 'decrypt/win32.exe',
  };
  const cmd = `./${os_decrypt_file[process.platform]}`;
  const args = ['-key', keyPath, '-label', sessionId, '-message', pinToken];
  const { stdout, stderr } = await exec(cmd, args);
  if (stdout) {
    const aesKey = stdout.trim();
    return aesKey;
  }
  if (stderr) {
    console.log('stderr:', stderr);
  }
  return '';
};

export default {
  create,
};
