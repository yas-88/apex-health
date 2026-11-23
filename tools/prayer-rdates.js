/* Prints Google Calendar RDATE lines for the five daily prayers, same method as Tareeq's Prayer tab:
   ISNA (Fajr and Isha at 15 degrees), standard Asr (shadow = 1x), Dhuhr = solar noon + 1 min.
   Usage: TZ=America/Los_Angeles node tools/prayer-rdates.js 2026-12-23 31
   Needs: npm i astronomy-engine (in any folder on NODE_PATH or locally). */
const A = require('astronomy-engine');
const [start = new Date().toISOString().slice(0, 10), nDays = '31', lat = '45.6387', lon = '-122.6615'] = process.argv.slice(2);
const o = new A.Observer(+lat, +lon, 50), S = A.Body.Sun, p = n => String(n).padStart(2, '0');
const fmt = d => `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}00`;
const out = { fajr: [], dhuhr: [], asr: [], maghrib: [], isha: [] };
const [y, m, dd] = start.split('-').map(Number);
for (let i = 0; i < +nDays; i++) {
  const d0 = new Date(y, m - 1, dd + i);
  const noon = A.SearchHourAngle(S, o, 0, d0).time.date;
  const sr = A.SearchRiseSet(S, o, +1, d0, 1).date, ss = A.SearchRiseSet(S, o, -1, noon, 1).date;
  let fajr = A.SearchAltitude(S, o, +1, d0, 1, -15), isha = A.SearchAltitude(S, o, -1, noon, 1, -15);
  const night = sr.getTime() + 864e5 - ss.getTime();
  fajr = fajr ? fajr.date : new Date(sr.getTime() - night / 7); isha = isha ? isha.date : new Date(ss.getTime() + night / 7);
  const dec = A.Equator(S, noon, o, true, true).dec;
  const altAsr = Math.atan(1 / (1 + Math.tan(Math.abs(+lat - dec) * Math.PI / 180))) * 180 / Math.PI;
  const asr = A.SearchAltitude(S, o, -1, noon, 1, altAsr).date;
  const t = { fajr, dhuhr: new Date(noon.getTime() + 60000), asr, maghrib: ss, isha };
  for (const k in out) out[k].push(fmt(t[k]));
}
for (const k in out) console.log(k, out[k][0], 'RDATE;TZID=America/Los_Angeles:' + out[k].slice(1).join(','));
