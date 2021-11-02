import request from '../request';

export default {
  fetchPopularTopics(count: number) {
    return request(`https://prs-bp1.press.one/api/pip2001/topics?count=${count}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicsPostactivity(start: string) {
    return request(`https://prs-bp1.press.one/api/pip2001/postactivity?start=${start}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicsAuthoractivity(start: string) {
    return request(`https://prs-bp1.press.one/api/pip2001/authoractivity?start=${start}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
};
