import crypto from 'crypto';
import md5 from 'md5';

export const digestMessage = (message: string) => {
  if (process.env.IS_ELECTRON) {
    return crypto.createHash('md5').update(message).digest('hex');
  }
  return md5(message);
};
