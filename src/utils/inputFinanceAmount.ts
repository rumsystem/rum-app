export default (amount: string) => {
  if (!amount) {
    return '';
  }
  if (amount === '0') {
    return '';
  }
  if (isInt(amount)) {
    return `${parseInt(amount, 10)}`;
  }
  return null;
};

const isInt = (amount: string) => {
  if (!/^[0-9]+$/.test(amount)) {
    return false;
  }
  return true;
};
