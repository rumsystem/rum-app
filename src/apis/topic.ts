import request from '../request';

export default {
  fetchPopularTopics(count: number) {
    return request(`https://prs-bp-cn1.xue.cn/api/pip2001/topics?count=${count}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicsPostActivity(start: string, end: string) {
    return request(`https://prs-bp-cn1.xue.cn/api/pip2001/postactivity?start=${start}&end=${end}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicsAuthorActivity(start: string, end: string) {
    return request(`https://prs-bp-cn1.xue.cn/api/pip2001/authoractivity?start=${start}&end=${end}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
};
