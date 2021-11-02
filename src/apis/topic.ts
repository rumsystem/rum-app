import request from '../request';

export default {
  fetchPopularTopics(count: number) {
    return request(`https://prs-bp1.press.one/api/pip2001/topics?count=${count}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicsPostactivity(update_at: string) {
    return request(`https://prs-bp1.press.one/api/pip2001/fc5ab58ba5cfaca5734409887e35f39462a5aef0/postactivity?update_at=${update_at}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
  fetchTopicsAuthoractivity(update_at: string) {
    return request(`https://prs-bp1.press.one/api/pip2001/fc5ab58ba5cfaca5734409887e35f39462a5aef0/authoractivity?update_at=${update_at}`, {
      method: 'GET',
      minPendingDuration: 300
    });
  },
};
