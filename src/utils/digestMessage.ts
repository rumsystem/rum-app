import crypto from 'crypto';

export const digestMessage = (message: string) => crypto.createHash('md5').update(message).digest('hex');
