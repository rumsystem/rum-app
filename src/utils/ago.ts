import moment from 'moment';

export default (blockTimeStamp: number) => {
  const timestamp = new Date(blockTimeStamp / 1000000).toISOString();
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diffValue = now - past;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  let result = '';
  const isLastYear = Number(moment().format('YYYY')) > Number(moment(timestamp).format('YYYY'));
  const isDiffDay = new Date().getDate() !== new Date(timestamp).getDate();
  if (isLastYear && _week >= 15) {
    result = moment(timestamp).format('YYYY-MM-DD HH:mm');
  } else if (_day >= 1 || isDiffDay) {
    result = moment(timestamp).format('MM-DD HH:mm');
  } else if (_hour >= 4) {
    result = moment(timestamp).format('HH:mm');
  } else if (_hour >= 1) {
    result = Math.floor(_hour) + '小时前';
  } else if (_min >= 1) {
    result = Math.floor(_min) + '分钟前';
  } else {
    result = '刚刚';
  }
  return result;
};
