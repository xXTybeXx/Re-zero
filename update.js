// update.js - 장 폴더 스캔하여 chapters.json 갱신
const fs = require('fs');
const path = require('path');

const chaptersDir = './chapters';
const outputJson = './chapters.json';

function getChapterNumberFromFolder(folderName) {
  const match = folderName.match(/ch(\d+)/);
  return match ? parseInt(match[1]) : 999;
}

const folders = fs.readdirSync(chaptersDir).filter(f => {
  const fullPath = path.join(chaptersDir, f);
  return fs.statSync(fullPath).isDirectory() && f.startsWith('ch');
});

folders.sort((a, b) => {
  const numA = getChapterNumberFromFolder(a);
  const numB = getChapterNumberFromFolder(b);
  return numA - numB;
});

const chapters = [];
let globalOrder = 1;

for (const folder of folders) {
  const folderPath = path.join(chaptersDir, folder);
  const files = fs.readdirSync(folderPath)
    .filter(f => f.endsWith('.html'))
    .sort((a,b) => parseInt(a) - parseInt(b));
  
  const episodes = [];
  let orderInChapter = 1;
  
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let title = file;
    const titleMatch = content.match(/<h[12][^>]*>([^<]+)<\/h[12]>/);
    if (titleMatch) title = titleMatch[1].trim();
    
    episodes.push({
      id: `ep-${globalOrder}`,
      title: title,
      orderInChapter: orderInChapter,
      globalOrder: globalOrder,
      file: `${folder}/${file}`
    });
    orderInChapter++;
    globalOrder++;
  }
  
  let chapterTitle = folder;
  if (folder === 'ch1') chapterTitle = '제1장 노도와 같은 첫날';
  else if (folder === 'ch2') chapterTitle = '제2장 격동의 일주일';
  else if (folder === 'ch3') chapterTitle = '제3장 재래의 왕도';
  else if (folder === 'ch4') chapterTitle = '제4장 영원의 계약';
  else if (folder === 'ch5') chapterTitle = '제5장 역사를 새기는 별들';
  else if (folder === 'ch6') chapterTitle = '제6장 기억의 회랑';
  else if (folder === 'ch7') chapterTitle = '제7장 늑대의 나라';
  else if (folder === 'ch8') chapterTitle = '제8장 빈센트 볼라키아';
  else if (folder === 'ch9') chapterTitle = '제9장 이름 없는 별의 빛';
  else if (folder === 'ch10') chapterTitle = '제10장 사자왕의 나라';
  else if (folder === 'ch-extra-1') chapterTitle = '번외편 원데이';
  else if (folder === 'ch-extra-2') chapterTitle = '번외편 원데이 II';
  
  chapters.push({
    chapterId: folder,
    chapterTitle: chapterTitle,
    folder: folder,
    episodes: episodes
  });
}

fs.writeFileSync(outputJson, JSON.stringify({ chapters }, null, 2));
console.log(`✅ 갱신 완료! 총 ${globalOrder-1}화`);