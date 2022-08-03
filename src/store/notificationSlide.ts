interface ShowOptions {
  message?: string
  duration?: number
  type?: 'pending' | 'success' | 'failed'
  link?: {
    text: string
    url: string
  }
}

let timer: NodeJS.Timer;

export function createNotificationSlideStore() {
  return {
    open: false,
    message: '',
    type: 'success',
    link: {
      text: '',
      url: '',
    },
    show(options?: ShowOptions) {
      clearTimeout(timer);
      const { message, duration = 3000, link, type = 'success' } = options ?? {};
      this.message = message ?? '';
      this.type = type ?? 'success';
      this.open = true;
      if (link) {
        this.link = link;
      }
      if (type === 'success') {
        timer = setTimeout(() => {
          this.close();
        }, duration);
      }
    },
    close() {
      this.open = false;
    },
  };
}
