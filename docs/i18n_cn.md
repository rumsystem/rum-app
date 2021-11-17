# i18n

## 例子
目录结构
```
- component.tsx
- lang/
---- index.ts
---- cn.ts
---- en.ts
```

```ts
// lang/index.ts
import { i18n } from 'store/i18n';
import * as cn from './cn';
import * as en from './en';

// cn en 在这里是一个 { Content:T } 类型的值
export const lang = i18n.createLangLoader({
  cn,
  en,
});
```

```ts
// lang/cn.ts
export const content = {
  helloWorld: '你好世界!',
  value: 1,
  paragraphs: ['一', '二', '三'],
}

// 在这里把 content 的类型导出来，让 `en.ts` 使用
export type Content = typeof content;
```

```ts
// lang/en.ts
import type { Content } from './cn' 

// 这里加上类型标注，如果缺少键值 ts 就会报错提示
export const content: Content = {
  helloWorld: 'Hello, World!',
  value: 2,
  paragraphs: ['one', 'two', 'three'],
}
```

```ts
// component.tsx
import { lang } from './lang'

const component = observer(() => (
  <div>
    {lang.helloText}
    {lang.value}
    {lang.paragraphs.join(' ')}
  </div>
))
```

或参考 `src\layouts\TitleBar\index.tsx`


## 切换语言
```ts
import { i18n } from 'store/i18n';

i18n.switchLang('en');
```

## 当前语言
```ts
console.log(i18n.state.lang)
```

## 工作原理
`i18n.createLangLoader` 接受一个 `Record<string, { Content: T }>` 作为参数。键名是语言名，如 `cn` `en`，键值则是定义的语言资源对象。这个对象需要是一个普通对象，但对象内部可以有任意的键和任意类型的值。`T` 这个类型是指 `import { Content } from './cn.ts'` 中 `Content` 的类型。有多种语言时，`cn.ts` `en.ts` 的类型需要保持一致（防止发生运行时错误）。上面的例子中 `en.ts` 使用了 `cn.ts` 的 `Content` 以类型保持类型一致。

`i18n.createLangLoader` 创建的 `lang`  是一个 `Proxy` 对象。这个对象上所有的键值访问会根据当前全局语言，代理到调用 `createLangLoader` 时提供的相应的语言资源对象上。例如说 `lang.hello` 会被代理到 `cn.Content.hello` 或 `en.Content.hello` 等。

语言切换通过改变 `i18n.state.lang` 实现，这个值是 `observable` 的。在从 `lang.abc` 获取文本填充到组件中时，内部逻辑访问到了 `i18n.state.lang` 这个值，所以所有 `observer` 的组件切换语言后都会自动重新渲染。

通常把某一个组件（或某一类资源）需要的字符串放在一个 `i18n.createLangLoader` 里面，可以让文本资源和实际组件位置靠近更好维护。
