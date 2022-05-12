interface EditorJsData {
  blocks: Block[]
  time: string
  version: string
}

interface Block {
  type: string
  data: Data
}

interface Data {
  header?: Header
  list?: List
  quote?: Quote
  image?: Image
  paragraph?: Paragraph
  delimiter?: any
  raw?: Raw
  table?: Table
}

interface Header {
  level: number
  text: string
}

interface List {
  style: string
  items: string[]
}

interface Quote {
  text: string
}

interface Image {
  url: string
}

interface Paragraph {
  alignment: string
  text: string
}

interface Raw {
  html: string
}

interface Table {
  content: string[][]
}

export const toHTML = (data: EditorJsData) => {
  const htmlParts = data.blocks.map((block) => parser[block.type](block.data));
  return htmlParts.join('');
};

export const toTextContent = (data: EditorJsData) => {
  const html = toHTML(data);
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  return tempElement.textContent;
};

const parser: any = {};

parser.header = (data: Header) => `<h${data.level}>${data.text}</h${data.level}>`;

parser.list = (data: List) => {
  const liHTML: string = data.items.map((item: any) => `<li>${item}</li>`).join('');
  if (data.style === 'ordered') {
    return `<ol>${liHTML}</ol>`;
  }
  return `<ul>${liHTML}</ul>`;
};

parser.quote = (data: Quote) => `<blockquote>${data.text}</blockquote>`;

parser.image = (data: Image) => `<p><img src="${data.url}" alt="Image" /></p>`;

parser.paragraph = (data: Paragraph) => `<p style="text-align: ${data.alignment}">${data.text}</p>`;

parser.delimiter = () => '<hr />';

parser.raw = (data: Raw) => `<p>${data.html}</p>`;

parser.table = (data: Table) => {
  const trs = data.content.map((items) => `<tr>${items.map((item) => `<td>${item}</td>`).join('')}</tr>`).join('');
  return `<table><tbody>${trs}</tbody></table>`;
};
