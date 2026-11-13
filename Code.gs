// ===== Supervisi SOP HD - Backend (API) untuk Apps Script =====
// Halaman aplikasi dihosting di GitHub Pages; skrip ini hanya menyimpan/membaca data di Google Drive.
function _json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'load') {
    try { return _json({ ok: true, data: loadData() }); }
    catch (err) { return _json({ ok: false, error: String(err) }); }
  }
  return ContentService.createTextOutput('API Supervisi SOP HD aktif.');
}
function doPost(e) {
  var r;
  try {
    var b = JSON.parse(e.postData.contents);
    if (b.action === 'save') { saveData(b.data); r = { ok: true }; }
    else if (b.action === 'notify') { notifyKatim(b.subject, b.body); r = { ok: true }; }
    else r = { ok: false, error: 'aksi tidak dikenal' };
  } catch (err) { r = { ok: false, error: String(err) }; }
  return _json(r);
}
function _file() {
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('FILE_ID');
  if (id) { try { return DriveApp.getFileById(id); } catch (e) {} }
  var f = DriveApp.createFile('supervisi-hd-data.json', '', 'application/json');
  p.setProperty('FILE_ID', f.getId());
  return f;
}
function loadData() { return _file().getBlob().getDataAsString(); }
function saveData(json) {
  var l = LockService.getScriptLock();
  l.waitLock(20000);
  try { _file().setContent(json); } finally { l.releaseLock(); }
  return true;
}
function notifyKatim(subject, body) {
  var d = {};
  try { d = JSON.parse(loadData() || '{}'); } catch (e) {}
  var to = (d.users || []).filter(function (u) { return u.role == 'katim' && u.em; })
    .map(function (u) { return u.em; }).join(',');
  if (to) MailApp.sendEmail({ to: to, subject: subject, body: body.replace(/\*/g, ''), name: 'Supervisi SOP HD' });
}
function authorize() { DriveApp.getRootFolder(); MailApp.getRemainingDailyQuota(); }
