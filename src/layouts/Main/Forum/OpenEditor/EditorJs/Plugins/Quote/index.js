require('./index.css').toString();

export class Quote {
  static get isReadOnlySupported() {
    return true;
  }

  static get toolbox() {
    return {
      icon: '<svg width="15" height="14" viewBox="0 0 15 14" xmlns="http://www.w3.org/2000/svg"><path d="M13.53 6.185l.027.025a1.109 1.109 0 0 1 0 1.568l-5.644 5.644a1.109 1.109 0 1 1-1.569-1.568l4.838-4.837L6.396 2.23A1.125 1.125 0 1 1 7.986.64l5.52 5.518.025.027zm-5.815 0l.026.025a1.109 1.109 0 0 1 0 1.568l-5.644 5.644a1.109 1.109 0 1 1-1.568-1.568l4.837-4.837L.58 2.23A1.125 1.125 0 0 1 2.171.64L7.69 6.158l.025.027z" /></svg>',
      title: 'Quote',
    };
  }

  static get contentless() {
    return true;
  }

  static get enableLineBreaks() {
    return true;
  }

  static get DEFAULT_QUOTE_PLACEHOLDER() {
    return 'Enter a quote';
  }

  static get conversionConfig() {
    return {
      import: 'text',
      export(quoteData) {
        return quoteData.text;
      },
    };
  }

  get CSS() {
    return {
      baseClass: this.api.styles.block,
      wrapper: 'cdx-quote',
      text: 'cdx-quote__text',
      input: this.api.styles.input,
    };
  }

  get settings() {
    return [
      {
        name: 'left',
        icon: '<svg width="16" height="11" viewBox="0 0 16 11" xmlns="http://www.w3.org/2000/svg" ><path d="M1.069 0H13.33a1.069 1.069 0 0 1 0 2.138H1.07a1.069 1.069 0 1 1 0-2.138zm0 4.275H9.03a1.069 1.069 0 1 1 0 2.137H1.07a1.069 1.069 0 1 1 0-2.137zm0 4.275h9.812a1.069 1.069 0 0 1 0 2.137H1.07a1.069 1.069 0 0 1 0-2.137z" /></svg>',
      },
      {
        name: 'center',
        icon: '<svg width="16" height="11" viewBox="0 0 16 11" xmlns="http://www.w3.org/2000/svg" ><path d="M1.069 0H13.33a1.069 1.069 0 0 1 0 2.138H1.07a1.069 1.069 0 1 1 0-2.138zm3.15 4.275h5.962a1.069 1.069 0 0 1 0 2.137H4.22a1.069 1.069 0 1 1 0-2.137zM1.069 8.55H13.33a1.069 1.069 0 0 1 0 2.137H1.07a1.069 1.069 0 0 1 0-2.137z"/></svg>',
      },
    ];
  }

  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    this.quotePlaceholder = config.quotePlaceholder || Quote.DEFAULT_QUOTE_PLACEHOLDER;

    this.data = {
      text: data.text || '',
    };
  }

  render() {
    const container = this._make('blockquote', [this.CSS.baseClass, this.CSS.wrapper]);
    const quote = this._make('div', [this.CSS.input, this.CSS.text], {
      contentEditable: !this.readOnly,
      innerHTML: this.data.text,
    });

    quote.dataset.placeholder = this.quotePlaceholder;

    container.appendChild(quote);

    return container;
  }

  save(quoteElement) {
    const text = quoteElement.querySelector(`.${this.CSS.text}`);
    const breakHTML = '<div><br></div>';
    return Object.assign(this.data, {
      text: text.innerHTML.replace(/<br>/g, breakHTML),
    });
  }

  static get sanitize() {
    return {
      text: {
        br: true,
        div: true,
      },
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
