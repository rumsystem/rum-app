export class Image {
  static get isReadOnlySupported() {
    return true;
  }

  static get toolbox() {
    return {
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150.242V79c0-18.778-15.222-34-34-34H79c-18.778 0-34 15.222-34 34v42.264l67.179-44.192 80.398 71.614 56.686-29.14L291 150.242zm-.345 51.622l-42.3-30.246-56.3 29.884-80.773-66.925L45 174.187V197c0 18.778 15.222 34 34 34h178c17.126 0 31.295-12.663 33.655-29.136zM79 0h178c43.63 0 79 35.37 79 79v118c0 43.63-35.37 79-79 79H79c-43.63 0-79-35.37-79-79V79C0 35.37 35.37 0 79 0z"/></svg>',
      title: 'Image',
    };
  }

  static get contentless() {
    return true;
  }

  static get enableLineBreaks() {
    return true;
  }

  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;
    this.data = {
      url: data.url || '',
    };
    this.index = api.blocks.getCurrentBlockIndex();
    this.openImgUploadModal = config.openImgUploadModal;
  }

  render() {
    const container = this._make('p');

    const img = this._make('img');

    if (this.data.url) {
      img.src = this.data.url;
    } else {
      this.openImgUploadModal({
        insertImageCallback: (url) => {
          img.src = url;
        },
        cancelCallback: () => {
          this.api.blocks.delete(this.index);
        },
      });
    }

    container.appendChild(img);

    return container;
  }

  save(container) {
    const image = container.querySelector('img');

    if (!image) {
      return this.data;
    }

    return Object.assign(this.data, {
      url: image.src,
    });
  }

  static get sanitize() {
    return {
      url: {},
    };
  }

  _make(tagName, classNames = null, attributes = {}) {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      if (Object.hasOwnProperty.call(attributes, attrName)) {
        el[attrName] = attributes[attrName];
      }
    }

    return el;
  }
}
