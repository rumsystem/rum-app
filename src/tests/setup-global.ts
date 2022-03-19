import moduleAlias from 'module-alias';
import path from 'path';
import { setDefaultOptions } from 'expect-puppeteer';

const resolve = (p: string) => path.join(__dirname, '..', p);

moduleAlias.addAlias('utils', resolve('utils'));
moduleAlias.addAlias('tests', resolve('tests'));
moduleAlias.addAlias('puppeteer', 'puppeteer-core');

setDefaultOptions({ timeout: 5000 });
