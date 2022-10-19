export default {
  getMimeType(url: string) {
    return url.match(/(?<=data:)(.*)(?=;base64)/)![0];
  },

  getUrl(data: { mediaType: string; content: string }) {
    return `data:${data.mediaType};base64,${data.content}`;
  },

  getContent(url: string) {
    return url.split(';base64,')[1];
  },
};
