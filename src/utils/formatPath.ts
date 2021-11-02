import { isWindow } from 'utils/env';

export default (path: string, options: { truncateLength: number }) => {
  const _path = isWindow ? path.replaceAll('/', '\\') : path;
  return _path.length > options.truncateLength
    ? `...${_path.slice(-options.truncateLength)}`
    : _path;
};
