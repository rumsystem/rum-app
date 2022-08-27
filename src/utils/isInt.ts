export default (amount: string) => {
  if (!/^[0-9]+$/.test(amount)) {
    return false;
  }
  return true;
};
