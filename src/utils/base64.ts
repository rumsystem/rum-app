const getImageContentLength = (url: string) => new Promise((resolve) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.onload = () => {
    resolve(xhr.response.size);
  };
  xhr.send();
});

const uriToDataUrl = (url: string) => new Promise<string>((resolve) => {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'blob';
  xhr.addEventListener('load', () => {
    const reader = new FileReader();
    reader.readAsDataURL(xhr.response as Blob);
    reader.addEventListener('load', () => {
      resolve(reader.result as string);
    });
    reader.addEventListener('err', () => {
      resolve('');
    });
  });
  xhr.addEventListener('err', () => {
    resolve('');
  });
  xhr.send();
});

const bytesToKb = (bytes: number, decimals = 2) => {
  const dm = decimals < 0 ? 0 : decimals;
  return parseFloat((bytes / 1024).toFixed(dm));
};

const imgToDataUrl = (img: HTMLImageElement, width: number, height: number, quality?: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
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

  async compressImage(url: string, option?: { count: number } | { maxSizeInKb: number }) {
    // base64 encoding is about 1.37 larger
    const dataUrl = url.startsWith('data:')
      ? url
      : await uriToDataUrl(url);
    if (!dataUrl) { return { url, kbSize: url.length }; }
    const MAX_SIZE = 250;
    const maxSizeInKb = !option
      ? MAX_SIZE
      : 'count' in option
        ? MAX_SIZE / option.count
        : option.maxSizeInKb;

    return new Promise<{ url: string, kbSize: number }>((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.addEventListener('error', () => resolve({ url: '', kbSize: 0 }));
      img.addEventListener('load', () => {
        const { width, height } = img;
        const strategies = [
          { quality: 1, resize: false },
          // { quality: 0.95, resize: false },
          // { quality: 0.92, resize: false },
          { quality: 0.9, resize: false },
          // { quality: 0.85, resize: false },
          { quality: 0.8, resize: false },
          { quality: 0.9, resize: [1920, 1080] },
          // { quality: 0.85, resize: [1920, 1080] },
          { quality: 0.8, resize: [1920, 1080] },
          { quality: 0.7, resize: [1920, 1080] },
          { quality: 0.9, resize: [1280, 720] },
          // { quality: 0.85, resize: [1280, 720] },
          { quality: 0.8, resize: [1280, 720] },
          { quality: 0.7, resize: [1280, 720] },
          { quality: 0.6, resize: [1280, 720] },
          { quality: 0.8, resize: [1024, 576] },
          { quality: 0.7, resize: [1024, 576] },
          { quality: 0.6, resize: [1024, 576] },
          { quality: 0.8, resize: [768, 432] },
          { quality: 0.7, resize: [768, 432] },
          { quality: 0.6, resize: [768, 432] },
          { quality: 0.5, resize: [768, 432] },
          { quality: 0.5, resize: [768, 432] },
          { quality: 0.6, resize: [512, 360] },
          { quality: 0.5, resize: [512, 360] },
          { quality: 0.4, resize: [512, 360] },
          { quality: 0.3, resize: [512, 360] },
        ] as const;

        for (const strategy of strategies) {
          let newWidth = width;
          let newHeight = height;
          if (strategy.resize && (newWidth > strategy.resize[0] || newHeight > strategy.resize[1])) {
            const ratio = width / height;
            const resizeRatio = strategy.resize[0] / strategy.resize[1];
            newWidth = ratio > resizeRatio ? strategy.resize[0] : strategy.resize[1] * ratio;
            newHeight = ratio < resizeRatio ? strategy.resize[1] : strategy.resize[0] / ratio;
          }
          const newUrl = strategy.quality === 1
            ? img.src
            : imgToDataUrl(img, newWidth, newHeight, strategy.quality);
          // use base64 encoded size (about 1.37x larger)
          const sizeInbyte = newUrl.length;
          const sizeInKb = sizeInbyte / 1024;
          console.log(strategy, sizeInKb);

          if (sizeInKb < maxSizeInKb || strategies.indexOf(strategy) === strategies.length - 1) {
            resolve({ url: newUrl, kbSize: sizeInKb });
            return;
          }
        }
        resolve({ url: '', kbSize: 0 });
      });
    });
  },
};
