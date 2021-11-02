const BFSReplace = (
  node: HTMLElement,
  matchRegexp: RegExp,
  replace: (text: string) => Node,
) => {
  Array.from(node.childNodes).forEach((childNode) => {
    // Element
    if (childNode.nodeType === 1) {
      BFSReplace(childNode as HTMLElement, matchRegexp, replace);
    }
    // Text
    if (childNode.nodeType === 3) {
      const text = childNode.textContent ?? '';
      const matchAll = text.matchAll(matchRegexp);
      if (matchAll) {
        // [start, end, isLink]
        let arr: Array<[number, number, number]> = Array.from(matchAll).map(
          (v) => [v.index!, v.index! + v[0].length, 1],
        );
        arr = arr.flatMap((v, i) => {
          const next = arr[i + 1];
          if (!next) {
            return [v];
          }
          if (v[1] < next[0]) {
            return [v, [v[1], next[0], 0]];
          }
          return [v];
        });
        if (!arr.length) {
          return;
        }
        if (arr[0][0] !== 0) {
          arr.unshift([0, arr[0][0], 0]);
        }
        if (arr[arr.length - 1][1] !== text.length) {
          arr.push([arr[arr.length - 1][1], text.length, 0]);
        }
        const newNodeList = arr.map(([start, end, flag]) => {
          const sectionText = text.substring(start, end);
          if (flag === 1) {
            return replace(sectionText);
          }
          return document.createTextNode(sectionText);
        });

        newNodeList.forEach((newNode) => {
          node.insertBefore(newNode, childNode);
        });
        node.removeChild(childNode);
      }
    }
  });
};

export default BFSReplace;
