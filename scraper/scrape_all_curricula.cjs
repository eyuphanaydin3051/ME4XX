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
    
    // Parse table row with credits:
    // <tr><td class="short_course"><a href="course.php?prog=569&course_code=5690400">ME400</a></td>
    // <td class="course">SUMMER PRACTICE II </td>
    // <td align="center">0</td>
    // <td align="center">0</td>
    // <td align="center">0</td>
    // <td align="center">5.0</td>
    // </tr>
    const regex = /course\.php\?[^"']*course_code=(\d+)["'][^>]*>([^<]+)<\/a>[\s\S]*?<td class="course">([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>/gi;
    const courses = [];
    let match;
    while ((match = regex.exec(semHtml)) !== null) {
      const code = parseInt(match[1], 10);
      const abbr = match[2].trim();
      const courseName = match[3].trim().replace(/\s+/g, ' ').replace(/&amp;/g, '&');
      const credit = parseFloat(match[4].trim()) || 0;
      const contact = parseFloat(match[5].trim()) || 0;
      const lab = parseFloat(match[6].trim()) || 0;
      const ects = parseFloat(match[7].trim()) || 0;

      const isNonCredit = credit === 0 && contact === 0;

      courses.push({
        code,
        abbr,
        name: courseName,
        credit,
        contact,
        lab,
        ects,
        isNonCredit
      });
      totalMusts++;
    }
    
    result[sem] = courses;
  }
  
  return { semesters: result, totalMusts };
}

async function scrapeAll() {
  console.log(`Starting enhanced curriculum scraper for ${depts.length} departments...`);
  
  const output = {
    departments: {},
    abbrIndex: {},
    metadata: {
      scraped_at: new Date().toISOString(),
      departments_count: 0,
      total_courses: 0
    }
  };

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
        console.log(`[+] ${res.dept.abbr} (${res.dept.code}) - ${Object.keys(res.semesters).length} semesters, ${res.totalMusts} courses`);
      }
    }
  }

  const outPath = path.join(__dirname, '../src/data/curricula.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nSuccessfully saved updated curricula to ${outPath}`);
}

scrapeAll();
