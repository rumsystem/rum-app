import { i18n } from 'store/i18n';

export const lang = i18n.createLangLoader({
  cn: { content: {
    'recent': '最近使用',
    'people': '人物/表情',
    'nature': '动物/自然',
    'foods': '食物/饮料',
    'activity': '活动',
    'places': '旅游/地点',
    'objects': '物体',
    'symbols': '符号',
    'flags': '旗帜',
  } },
  en: { content: {
    'recent': 'Frequently Used',
    'people': 'Smileys & People',
    'nature': 'Animals & Nature',
    'foods': 'Food & Drink',
    'activity': 'Activities',
    'places': 'Travel & Places',
    'objects': 'Objects',
    'symbols': 'Symbols',
    'flags': 'Flags',
  } },
});
