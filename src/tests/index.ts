import './setup-global';
import path from 'path';
import fs from 'fs/promises';

const testMain = async () => {
  const names = process.argv.slice(2);
  try {
    const testBasePath = path.join(__dirname, 'tests');
    const tests = await fs.readdir(testBasePath);
    const filteredTests = tests.filter((v) => {
      if (!/\.tsx?$/.test(v)) { return false; }
      if (!names.length) { return true; }
      return names.some((n) => v.includes(n));
    });
    for (const file of filteredTests) {
      const testName = file.replace(/\.tsx?$/, '');
      const filePath = path.join(testBasePath, file);
      const test = (await import(filePath)).default;
      console.log(`\nrunning test: ${testName}`);
      await test();
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

testMain();
