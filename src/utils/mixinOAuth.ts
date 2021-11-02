import forge from 'node-forge';

export const client_id = 'ef7ba9a7-c0ac-46a7-8ce3-717be19caf9c';

const scope = 'PROFILE:READ';

const base64RawURLEncode = (buffer: string) => forge.util.encode64(buffer).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

export const getVerifierAndChanllege = () => {
  const key = forge.random.getBytesSync(32);
  const verifier = base64RawURLEncode(key);
  const md = forge.md.sha256.create();
  md.update(key);
  const challenge = base64RawURLEncode(md.digest().getBytes());
  return { verifier, challenge };
};

export const getOAuthUrl = (challenge: string) => `https://mixin-www.zeromesh.net/oauth/authorize?client_id=${client_id}&scope=${scope}&response_type=code&code_challenge=${challenge}`;
