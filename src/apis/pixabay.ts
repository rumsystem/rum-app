import request from '../request';
import qs from 'query-string';

export default {
  search(options: any = {}) {
    return request(
      `/api/?key=13927481-1de5dcccace42d9447c90346f&safesearch=true&image_type=photo&${qs.stringify(
        options
      )}`,
      {
        base: `https://pixabay.com`,
        minPendingDuration: 300,
      }
    );
  },
};
