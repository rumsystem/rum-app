export default {
  getMimeType(url: string) {
    return /(?<=data:)(.*)(?=;base64)/.exec(url)![0];
  },

  getUrl(data: { mediaType: string, content: string }) {
    return `data:${data.mediaType};base64,${data.content}`;
  },

  getContent(url: string) {
    return url.split(';base64,')[1];
  },
};
