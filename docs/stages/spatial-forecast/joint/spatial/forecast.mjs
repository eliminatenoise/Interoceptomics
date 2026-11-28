import {readFile} from 'node:fs/promises';
import {predictInput} from './predict.mjs';
try{
  const p=process.argv[2]??new URL('example-pair.json',import.meta.url);
  const input=JSON.parse(await readFile(p,'utf8'));
  process.stdout.write(JSON.stringify(predictInput(input))+'\n');
}catch(error){console.error(error.message);process.exitCode=1;}
