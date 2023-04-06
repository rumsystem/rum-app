import { createHash, randomBytes } from 'node:crypto';

export const client_id = 'ef7ba9a7-c0ac-46a7-8ce3-717be19caf9c';

const scope = 'PROFILE:READ';

export const getVerifierAndChanllege = () => {
  const key = randomBytes(32);
  const verifier = key.toString('base64url');
  const hash = createHash('sha256');
  hash.update(key);
  const challenge = hash.digest('base64url');
  return { verifier, challenge };
};

export const getOAuthUrl = (challenge: string) => `https://mixin-www.zeromesh.net/oauth/authorize?client_id=${client_id}&scope=${scope}&response_type=code&code_challenge=${challenge}`;
