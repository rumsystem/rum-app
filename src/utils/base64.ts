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
        let _height = height;
        let _width = width;
        const MAX_WIDTH = 660;
        const MAX_HEIGHT = 660;
        if (width > MAX_WIDTH) {
          _width = MAX_WIDTH;
          _height = Math.round((_width * height) / width);
        }
        if (_height > MAX_HEIGHT) {
          _height = MAX_HEIGHT;
          _width = Math.round((_height * width) / height);
        }
        canvas.width = _width;
        canvas.height = _height;
        canvas.getContext('2d').drawImage(img, 0, 0, _width, _height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        resolve('');
      };
    });
  },
};
