const https = require('https');
const fs = require('fs');
const path = require('path');

const depts = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/departments.json'), 'utf8'));

const SEMESTER_NAMES = [
  { name: 'First Semester', sem: 1 },
  { name: 'Second Semester', sem: 2 },
  { name: 'Third Semester', sem: 3 },
  { name: 'Fourth Semester', sem: 4 },
  { name: 'Fifth Semester', sem: 5 },
  { name: 'Sixth Semester', sem: 6 },
  { name: 'Seventh Semester', sem: 7 },
  { name: 'Eighth Semester', sem: 8 }
];

function fetchHtml(code) {
  return new Promise((resolve) => {
    const url = `https://catalog.metu.edu.tr/program.php?fac_prog=${code}`;
    const req = https.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        resolve('');
        return;
      }
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => resolve(html));
    });
    req.on('error', () => resolve(''));
    req.on('timeout', () => { req.destroy(); resolve(''); });
  });
}

function parseCurriculum(html) {
  const result = {};
  let totalMusts = 0;

  for (let i = 0; i < SEMESTER_NAMES.length; i++) {
    const { name, sem } = SEMESTER_NAMES[i];
    const nextName = i < SEMESTER_NAMES.length - 1 ? SEMESTER_NAMES[i + 1].name : null;
    
    const startIdx = html.indexOf(name);
    if (startIdx === -1) continue;
    
    let endIdx = nextName ? html.indexOf(nextName, startIdx) : -1;
    if (endIdx === -1) {
      endIdx = html.indexOf('Total METU Credit', startIdx);
      if (endIdx === -1) endIdx = html.length;
    }
    
    const semHtml = html.substring(startIdx, endIdx);
    
    const regex = /course\.php\?[^"']*course_code=(\d+)["'][^>]*>([^<]+)<\/a>[\s\S]*?<td class="course">([^<]+)<\/td>/gi;
    const courses = [];
    let match;
    while ((match = regex.exec(semHtml)) !== null) {
      courses.push({
        code: parseInt(match[1], 10),
        abbr: match[2].trim(),
        name: match[3].trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&')
      });
      totalMusts++;
    }
    
    result[sem] = courses;
  }
  
  return { semesters: result, totalMusts };
}

async function scrapeAll() {
  console.log(`Starting curriculum scraper for ${depts.length} departments...`);
  
  const output = {
    departments: {},
    abbrIndex: {},
    metadata: {
      scraped_at: new Date().toISOString(),
      departments_count: 0,
      total_courses: 0
    }
  };

  // We can process in chunks of 5
  for (let i = 0; i < depts.length; i += 5) {
    const chunk = depts.slice(i, i + 5);
    const results = await Promise.all(chunk.map(async (dept) => {
      const html = await fetchHtml(dept.code);
      if (!html || !html.includes('First Semester')) return null;
      const { semesters, totalMusts } = parseCurriculum(html);
      if (Object.keys(semesters).length === 0) return null;
      return { dept, semesters, totalMusts };
    }));

    for (const res of results) {
      if (res) {
        output.departments[res.dept.code] = {
          code: res.dept.code,
          abbr: res.dept.abbr,
          name: res.dept.name,
          semesters: res.semesters
        };
        output.abbrIndex[res.dept.abbr] = res.dept.code;
        output.metadata.departments_count++;
        output.metadata.total_courses += res.totalMusts;
        console.log(`[+] ${res.dept.abbr} (${res.dept.code}) - ${Object.keys(res.semesters).length} semesters, ${res.totalMusts} must courses`);
      }
    }
  }

  const outPath = path.join(__dirname, '../src/data/curricula.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nSuccessfully saved curricula to ${outPath}`);
  console.log(`Total departments: ${output.metadata.departments_count}, Total must courses across semesters: ${output.metadata.total_courses}`);
}

scrapeAll();
