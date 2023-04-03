import { format } from 'date-fns';
import { lang } from 'utils/lang';

export default (blockTimeStamp: number, options: { trimmed?: boolean } = {}) => {
  if (!blockTimeStamp) {
    return '';
  }
  const timestamp = blockTimeStamp > 10 ** 14
    ? blockTimeStamp / 1000000
    : blockTimeStamp;
  const time = new Date(timestamp);
  const now = new Date().getTime();
  const past = new Date(time).getTime();
  const diffValue = now - past;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  let result = '';
  const isLastYear = new Date().getFullYear() > time.getFullYear();
  const isDiffDay = new Date().getDate() !== time.getDate();
  if (isLastYear && _week >= 15) {
    result = format(time, options.trimmed ? 'yyyy-MM-dd' : 'yyyy-MM-dd HH:mm');
  } else if (_day >= 1 || isDiffDay) {
    result = format(time, options.trimmed ? 'MM-dd' : 'MM-dd HH:mm');
  } else if (_hour >= 4) {
    result = format(time, 'HH:mm');
  } else if (_hour >= 1) {
    result = Math.floor(_hour) + lang.hoursAgo;
  } else if (_min >= 1) {
    result = Math.floor(_min) + lang.minutesAgo;
  } else {
    result = lang.justNow;
  }
  return result;
};
