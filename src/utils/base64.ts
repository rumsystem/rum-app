const getImageContentLength = (url: string) => new Promise((resolve) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = () => {
    resolve(xhr.response.size);
  };
  xhr.send();
});

const bytesToKb = (bytes: number, decimals = 2) => {
  const dm = decimals < 0 ? 0 : decimals;
  return parseFloat((bytes / 1024).toFixed(dm));
};

const getDataUrl = (img: any, width: number, height: number, quality?: number) => {
  const canvas: any = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
};

export default {
  getMimeType(url: string) {
    return /data:(.*)(?=;base64)/.exec(url)![1];
  },

  getUrl(data: { mediaType: string, content: string }) {
    return `data:${data.mediaType};base64,${data.content}`;
  },

  getContent(url: string) {
    return url.split(';base64,')[1];
  },

  async getImageKbSize(url: string) {
    const contentLength = await getImageContentLength(url) as number;
    return bytesToKb(contentLength);
  },

  getFromBlobUrl(blobUrl: string, options?: {
    count: number
  }) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = blobUrl;
      img.onload = async () => {
        const count = options ? options.count || 1 : 1;
        const MAX_KB = 200;
        const blobKbSize = await this.getImageKbSize(blobUrl);

        const { width, height } = img;

        if (count === 1 && blobKbSize < MAX_KB) {
          const url = getDataUrl(img, width, height);
          const kbSize = await this.getImageKbSize(url);
          resolve({
            url,
            kbSize,
          });
          return;
        }

        const MAX_WIDTH = 2000;
        const MAX_HEIGHT = 1400;
        let _height = height;
        let _width = width;
        if (width > MAX_WIDTH) {
          _width = MAX_WIDTH;
          _height = Math.round((_width * height) / width);
        }
        if (_height > MAX_HEIGHT) {
          _height = MAX_HEIGHT;
          _width = Math.round((_height * width) / height);
        }

        const qualities = [0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
        let url = getDataUrl(img, _width, _height);
        let kbSize = 0;
        let stop = false;
        while (!stop) {
          kbSize = await this.getImageKbSize(url);
          if (kbSize < (count === 1 ? MAX_KB : MAX_KB / count) || qualities.length === 0) {
            stop = true;
          } else {
            const quality = qualities.shift();
            url = getDataUrl(img, _width, _height, quality);
          }
        }

        resolve({
          url,
          kbSize,
        });
      };
      img.onerror = () => {
        resolve({
          url: '',
          kbSize: 0,
        });
      };
    });
  },
};
