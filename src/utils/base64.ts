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

  getFromBlobUrl(blobUrl: string) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = blobUrl;
      img.onload = () => {
        const canvas: any = document.createElement('canvas');
        const { width, height } = img;
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        resolve('');
      };
    });
  },
};
