import { lang } from 'utils/lang';

export const checkAmount = (amount: string) => {
  if (!amount) {
    return {
      message: lang.require(lang.tokenAmount),
      type: 'error',
    };
  }
  return {
    ok: true,
  };
};
