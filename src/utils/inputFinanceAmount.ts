export default (amount: string) => {
  const re = /^[0-9]+[.]?[0-9]{0,4}$/;
  if (amount === '' || re.test(amount)) {
    return amount;
  }
  return null;
};
