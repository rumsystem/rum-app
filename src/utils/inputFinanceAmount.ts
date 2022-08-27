export default (amount: string) => {
  if (amount === '') {
    return '';
  }
  const re = /^[0-9]+[.]?[0-9]{0,8}$/;
  if (re.test(amount)) {
    if (amount.includes('.')) {
      const [prefix, postfix] = amount.split('.');
      return `${parseInt(prefix, 10)}.${postfix}`;
    }
    return `${parseInt(amount, 10)}`;
  }
  return null;
};
