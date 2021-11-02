import forge from 'node-forge';

export const client_id = 'ef7ba9a7-c0ac-46a7-8ce3-717be19caf9c';

const scope = 'PROFILE:READ';

const base64RawURLEncode = (buffer: string) => {
    return forge.util.encode64(buffer).replace(/\=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

export const getVerifierAndChanllege = () => {
    let key = forge.random.getBytesSync(32);
    let verifier = base64RawURLEncode(key);
    let md = forge.md.sha256.create();
    md.update(key);
    let challenge = base64RawURLEncode(md.digest().getBytes());
    return {verifier, challenge};
}

export const getOAuthUrl = (challenge: string) => `https://mixin-www.zeromesh.net/oauth/authorize?client_id=${client_id}&scope=${scope}&response_type=code&code_challenge=${challenge}`;
