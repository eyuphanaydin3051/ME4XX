// scraper/scrape_all_departments.cjs
const fs = require('fs');
const path = require('path');

const START_HOURS = {
  '08:40': 0, '09:40': 1, '10:40': 2, '11:40': 3,
  '12:40': 4, '13:40': 5, '14:40': 6, '15:40': 7, '16:40': 8
};

const END_HOURS = {
  '09:30': 0, '10:30': 1, '11:30': 2, '12:30': 3,
  '13:30': 4, '14:30': 5, '15:30': 6, '16:30': 7, '17:30': 8
};

const DAY_MAP = {
  'Monday': 'Pazartesi',
  'Tuesday': 'Salı',
  'Wednesday': 'Çarşamba',
  'Thursday': 'Perşembe',
  'Friday': 'Cuma',
  'Saturday': 'Cumartesi',
  'Sunday': 'Pazar'
};

function parseSisTable(html, deptAbbr, progCode) {
  const tableMatch = html.match(/<table[^>]*id=["']SearchResults["'][^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) return [];
  const tableContent = tableMatch[1];
  
  const theadMatch = tableContent.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  if (!theadMatch) return [];
  const thMatches = [...theadMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)];
  const headers = thMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const colMap = {};
  headers.forEach((h, idx) => { colMap[h] = idx; });

  const tbodyMatch = tableContent.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];
  const trMatches = [...tbodyMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  const coursesDict = {};

  for (const tr of trMatches) {
    const tdMatches = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
    if (!tdMatches || tdMatches.length === 0) continue;
    const tds = tdMatches.map(m => m[1].replace(/<[^>]+>/g, '').trim());

    const getCol = (name) => {
      const idx = colMap[name];
      return idx !== undefined && idx < tds.length ? tds[idx] : '';
    };

    const code = getCol('Course Code');
    if (!code) continue;

    if (!coursesDict[code]) {
      const courseNum = String(code).slice(3).replace(/^0+/, '');
      const firstDigit = courseNum.charAt(0);
      let category = 'Diğer';
      if (firstDigit === '1') category = '1. Sınıf';
      else if (firstDigit === '2') category = '2. Sınıf';
      else if (firstDigit === '3') category = '3. Sınıf';
      else if (firstDigit === '4') category = '4. Sınıf (Teknik Seçmeli)';
      else if (['5', '6', '7', '8', '9'].includes(firstDigit)) category = 'Lisansüstü';

      coursesDict[code] = {
        code: code,
        courseNumber: courseNum,
        codeStr: `${deptAbbr} ${courseNum}`,
        name: getCol('Course Name'),
        department: deptAbbr,
        departmentCode: progCode,
        category: category,
        credits: {
          total: parseFloat(getCol('Credit').replace(',', '.')) || 0,
          ects: parseFloat(getCol('ECTS Credit').replace(',', '.')) || 0,
          lab: parseFloat(getCol('Laboratory Credit').replace(',', '.')) || 0,
          theory: parseFloat(getCol('Theory Credit').replace(',', '.')) || 0,
          application: parseFloat(getCol('Application Credit').replace(',', '.')) || 0,
        },
        sections: {}
      };
    }

    const secNum = parseInt(getCol('Course Section'), 10);
    if (isNaN(secNum)) continue;

    const courseObj = coursesDict[code];
    if (!courseObj.sections[secNum]) {
      courseObj.sections[secNum] = {
        sectionNumber: secNum,
        capacity: {
          total: parseInt(getCol('Capacity'), 10) || 0,
          exchange: parseInt(getCol('Exchange Capacity'), 10) || 0,
          exchange_used: parseInt(getCol('Exchange Used Capacity'), 10) || 0
        },
        instructors: [],
        criteria: [],
        schedule: []
      };
    }

    const secObj = courseObj.sections[secNum];

    // Instructor
    const instName = getCol('Instructor Name');
    if (instName) {
      const instTitle = getCol('Instructor Title');
      if (!secObj.instructors.some(i => i.name === instName)) {
        secObj.instructors.push({ name: instName, title: instTitle });
      }
    }

    // Schedule items
    for (let i = 1; i <= 5; i++) {
      const day = getCol(`Day${i}`);
      const startH = getCol(`Start Hour${i}`);
      const endH = getCol(`End Hour${i}`);
      if (day && startH && endH) {
        const startSlot = START_HOURS[startH];
        const endSlot = END_HOURS[endH];
        const slots = [];
        if (startSlot !== undefined && endSlot !== undefined && startSlot <= endSlot) {
          for (let s = startSlot; s <= endSlot; s++) slots.push(s);
        }

        const sched = {
          dayEn: day,
          dayTr: DAY_MAP[day] || day,
          startHour: startH,
          endHour: endH,
          slots: slots,
          classroom: getCol(`Classroom ${i}`),
          building: getCol(`Classroom Building ${i}`)
        };

        const exists = secObj.schedule.some(s => s.dayEn === sched.dayEn && s.startHour === sched.startHour);
        if (!exists) secObj.schedule.push(sched);
      }
    }

    // Criteria
    const givenDept = getCol('Given Dept Name');
    const startChar = getCol('Start Char');
    const endChar = getCol('End Char');
    if (givenDept || startChar || endChar) {
      const crit = {
        given_dept: givenDept || 'ALL',
        start_char: startChar || 'AA',
        end_char: endChar || 'ZZ',
        cgpa: {
          min: parseFloat(getCol('Min CumGPA').replace(',', '.')) || 0,
          max: parseFloat(getCol('Max CumGPA').replace(',', '.')) || 4
        },
        year: {
          min: parseInt(getCol('Min Year'), 10) || 0,
          max: parseInt(getCol('Max Year'), 10) || 99
        },
        start_grade: getCol('Start Grade'),
        end_grade: getCol('End Grade')
      };
      const critExists = secObj.criteria.some(c => c.given_dept === crit.given_dept && c.start_char === crit.start_char && c.end_char === crit.end_char);
      if (!critExists) secObj.criteria.push(crit);
    }
  }

  return Object.values(coursesDict).map(c => {
    const secList = Object.values(c.sections).map(s => ({
      ...s,
      hasSchedule: s.schedule.length > 0 && s.schedule.some(sch => sch.slots.length > 0)
    }));
    secList.sort((a,b) => a.sectionNumber - b.sectionNumber);
    return {
      ...c,
      sections: secList,
      isME4: c.codeStr.startsWith('ME 4'),
    };
  });
}

async function scrapeAll() {
  console.log('[1/4] Connecting to METU SIS...');
  const baseResp = await fetch('https://sis.metu.edu.tr/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await baseResp.text();
  const cookies = baseResp.headers.getSetCookie ? baseResp.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') : (baseResp.headers.get('set-cookie') || '');
  
  const links = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const semLinkObj = links.find(l => l[2].includes('Semester Information'));
  const semUrl = 'https://sis.metu.edu.tr/' + semLinkObj[1];
  
  const semResp = await fetch(semUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cookie': cookies
    }
  });
  const semHtml = await semResp.text();
  const stampMatch = semHtml.match(/name=["']stamp["']\s+value=["']([^"']+)["']/i) || semHtml.match(/value=["']([^"']+)["']\s+name=["']stamp["']/i);
  const stamp = stampMatch[1];

  // Latest semester
  const selectSem = semHtml.match(/<select[^>]*name=["']selectSemester["'][^>]*>([\s\S]*?)<\/select>/i);
  let latestSem = '20261';
  let semName = '2026-2027 Fall';
  if (selectSem) {
    const optMatches = [...selectSem[1].matchAll(/<option\s+value=["']?([^"'>]*)["']?[^>]*>([\s\S]*?)<\/option>/gi)];
    const valid = optMatches.filter(m => m[1] && m[1].length === 5 && !isNaN(m[1]));
    valid.sort((a,b) => parseInt(b[1], 10) - parseInt(a[1], 10));
    if (valid.length > 0) {
      latestSem = valid[0][1];
      semName = valid[0][2].trim();
    }
  }

  // Programs
  const selectProgram = semHtml.match(/<select[^>]*name=["']selectProgram["'][^>]*>([\s\S]*?)<\/select>/i);
  const programs = [];
  if (selectProgram) {
    const options = [...selectProgram[1].matchAll(/<option\s+value=["']?([^"'>]*)["']?[^>]*>([\s\S]*?)<\/option>/gi)];
    options.forEach(o => {
      const val = o[1].trim();
      const text = o[2].trim();
      if (!val) return;
      const parts = text.split('-');
      const code = val;
      const abbr = parts.length >= 2 ? parts[1].trim() : code;
      const name = parts.length >= 3 ? parts.slice(2).join('-').trim() : (parts.length === 2 ? parts[1].trim() : text);
      programs.push({ code, abbr, name, fullText: text });
    });
  }

  console.log(`[2/4] Found ${programs.length} programs in semester ${semName} (${latestSem}).`);
  console.log('[3/4] Scraping courses with concurrency 5...');

  const allCoursesMap = new Map();
  const departmentsList = [];
  const CONCURRENCY = 5;
  let finishedCount = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const prog = queue.shift();
      try {
        const body = new URLSearchParams({
          selectCourseCriteriaType: '',
          selectSemester: latestSem,
          selectProgram: prog.code,
          submitSearchForm: 'Search',
          stamp: stamp
        });

        const res = await fetch('https://sis.metu.edu.tr/main.php', {
          method: 'POST',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Referer': semUrl,
            'Cookie': cookies
          },
          body: body.toString()
        });

        const json = await res.json();
        if (json.data && json.data.length > 500) {
          const parsed = parseSisTable(json.data, prog.abbr, prog.code);
          if (parsed.length > 0) {
            parsed.forEach(c => {
              if (!allCoursesMap.has(c.code)) {
                allCoursesMap.set(c.code, c);
              }
            });
            departmentsList.push({
              code: prog.code,
              abbr: prog.abbr,
              name: prog.name,
              courseCount: parsed.length
            });
          }
        }
      } catch (err) {
        console.warn(`Error on ${prog.abbr} (${prog.code}):`, err.message);
      } finally {
        finishedCount++;
        if (finishedCount % 20 === 0 || finishedCount === programs.length) {
          console.log(`Progress: ${finishedCount}/${programs.length} programs processed (${allCoursesMap.size} courses collected)`);
        }
      }
    }
  }

  const queue = [...programs];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);

  console.log(`[4/4] Finished scraping! Total courses: ${allCoursesMap.size}, Active departments: ${departmentsList.length}`);

  // Sort departments by abbreviation
  departmentsList.sort((a,b) => a.abbr.localeCompare(b.abbr, 'tr'));

  // Sort all courses by department then course number
  const allCourses = Array.from(allCoursesMap.values()).sort((a, b) => {
    if (a.department !== b.department) return a.department.localeCompare(b.department, 'tr');
    return (parseInt(a.courseNumber, 10) || 0) - (parseInt(b.courseNumber, 10) || 0);
  });

  const output = {
    metadata: {
      university: 'Middle East Technical University (ODTÜ)',
      semesterCode: latestSem,
      semesterName: semName,
      updatedAt: new Date().toISOString(),
      totalCourses: allCourses.length,
      totalDepartments: departmentsList.length
    },
    departments: departmentsList,
    courses: allCourses
  };

  const targetDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const targetPath = path.join(targetDir, 'all_courses.json');
  fs.writeFileSync(targetPath, JSON.stringify(output), 'utf8');
  console.log(`Saved database to ${targetPath} (${(fs.statSync(targetPath).size / 1024 / 1024).toFixed(2)} MB)`);

  // Also save a lightweight departments.json for super fast dropdown / selection
  const deptPath = path.join(targetDir, 'departments.json');
  fs.writeFileSync(deptPath, JSON.stringify(departmentsList, null, 2), 'utf8');
  console.log(`Saved departments to ${deptPath}`);
}

scrapeAll().catch(err => {
  console.error('Fatal scrape error:', err);
  process.exit(1);
});
