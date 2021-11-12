const fs = require('fs');
const path = require('path');
const { notarize } = require('electron-notarize');
const { build } = require('../../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const APPLE_ID = (process.env.APPLE_ID ?? '').trim();
  const APPLE_ID_PASS = (process.env.APPLE_ID_PASS ?? '').trim();
  const API_KEY_ID = (process.env.API_KEY_ID ?? '').trim();
  const API_KEY_ISSUER_ID = (process.env.API_KEY_ISSUER_ID ?? '').trim();

  let params = {}

  if (APPLE_ID && APPLE_ID_PASS) {
    params = {
      appleId: APPLE_ID,
      appleIdPassword: APPLE_ID_PASS,
    };
    console.log('Notarizing using APPLE_ID');
  } else if (API_KEY_ID && API_KEY_ISSUER_ID) {
    const apiKey = fs.readFileSync(path.join(process.env.GITHUB_WORKSPACE, `./private_keys/AuthKey_${API_KEY_ID}.p8`)).toString();
    params = {
      appleApiKey: apiKey,
      appleApiKeyId: API_KEY_ID,
      appleApiIssuer: API_KEY_ISSUER_ID,
    };
    console.log('Notarizing using API_KEY');
  } else {
    console.warn('Skipping notarizing step. No Key for notarization was detected.');
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  try {
    console.log(`notarizing ${build.appId}`);
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      ...params,
    });
  } catch (err) {
    console.log(err.message);
  }

  console.log(`Done notarizing ${build.appId}`);
};
