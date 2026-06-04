// convert.js (장별 폴더 버전)
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const inputFile = '리제로 소설 뷰어.html';
const chaptersBaseDir = './chapters';
const jsonFile = './chapters.json';

// chapters 기본 폴더 생성
if (!fs.existsSync(chaptersBaseDir)) fs.mkdirSync(chaptersBaseDir);

const html = fs.readFileSync(inputFile, 'utf8');
const $ = cheerio.load(html);

// 1. 모든 chapter-xxx 페이지에서 장 정보와 화 ID 목록 수집
const chapterMap = new Map(); // key: chapterId, value: { title, episodeIds[], folderName }

$('[id^="chapter-"]').each((i, elem) => {
  const chapterId = $(elem).attr('id');
  if (!chapterId) return;
  const chapterTitle = $(elem).find('h2').first().text().trim();
  if (!chapterTitle) return;
  
  // 폴더명: ch1, ch2, ... (chapter-1 → ch1, chapter-extra-1 → ch-extra-1 등)
  let folderName = chapterId;
  if (chapterId.startsWith('chapter-')) {
    folderName = 'ch' + chapterId.replace('chapter-', '');
  } else {
    folderName = chapterId; // 그대로 사용 (예: chapter-extra-1)
  }
  
  const episodeIds = [];
  $(elem).find('a.btn').each((j, link) => {
    const onclick = $(link).attr('onclick');
    if (onclick) {
      const match = onclick.match(/showPage\('([^']+)'\)/);
      if (match && match[1].startsWith('ep-')) {
        episodeIds.push(match[1]);
      }
    }
  });
  
  chapterMap.set(chapterId, {
    title: chapterTitle,
    episodeIds: episodeIds,
    folderName: folderName
  });
});

// 2. 모든 ep-xxx 페이지에서 본문 추출 및 장별 폴더에 저장
const chaptersData = []; // 최종 chapters.json에 들어갈 데이터
let globalOrder = 1; // 전체 화 순서 (이전/다음 버튼용)

// 장별로 episodes 배열을 먼저 준비
for (let [chId, chData] of chapterMap.entries()) {
  const folderPath = path.join(chaptersBaseDir, chData.folderName);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  
  const episodesInChapter = [];
  let episodeOrderInChapter = 1;
  
  for (let epId of chData.episodeIds) {
    const epElem = $(`#${epId}`);
    if (!epElem.length) continue;
    
    // 제목 추출
    let title = epElem.find('h2').first().text().trim();
    if (!title) title = epElem.find('h1').first().text().trim();
    if (!title) title = epId;
    
    // 본문 HTML
    const contentHtml = epElem.find('.novel-content').html();
    if (!contentHtml) {
      console.warn(`⚠️ ${epId} 내용 없음`);
      continue;
    }
    
    // 파일명: 001.html, 002.html (장 내부 순서)
    const fileNum = String(episodeOrderInChapter).padStart(3, '0');
    const fileName = `${fileNum}.html`;
    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, contentHtml, 'utf8');
    
    episodesInChapter.push({
      id: epId,
      title: title,
      orderInChapter: episodeOrderInChapter,
      globalOrder: globalOrder,
      file: `${chData.folderName}/${fileName}`  // 상대 경로 (ch1/001.html)
    });
    
    episodeOrderInChapter++;
    globalOrder++;
  }
  
  chaptersData.push({
    chapterId: chId,
    chapterTitle: chData.title,
    folder: chData.folderName,
    episodes: episodesInChapter
  });
}

// chapters.json 저장
fs.writeFileSync(jsonFile, JSON.stringify({ chapters: chaptersData }, null, 2), 'utf8');
console.log(`✅ 변환 완료! 총 ${globalOrder-1}개의 화, ${chaptersData.length}개의 장을 저장했습니다.`);