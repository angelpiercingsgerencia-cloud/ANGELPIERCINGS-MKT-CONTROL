const TABLES = {
  parceiros: 'PARCEIROS',
  campanhas: 'CAMPANHAS',
  atividades: 'ATIVIDADES',
  lancamentos: 'LANCAMENTOS'
};

function doGet(e) {
  const action = String((e.parameter && e.parameter.action) || 'init');
  if (action === 'init') {
    return respond_({
      ok: true,
      spreadsheetId: getDatabase_().getId(),
      data: readAll_()
    }, e.parameter && e.parameter.callback);
  }

  return respond_({ ok: false, error: 'Acao GET invalida.' }, e.parameter && e.parameter.callback);
}

function doPost(e) {
  const body = parseBody_(e);
  if (body.action === 'saveAll') {
    saveAll_(body.data || {});
    return respond_({ ok: true, spreadsheetId: getDatabase_().getId() });
  }

  return respond_({ ok: false, error: 'Acao POST invalida.' });
}

function setupDatabase() {
  const ss = getDatabase_();
  Object.keys(TABLES).forEach(function(key) {
    ensureSheet_(ss, TABLES[key]);
  });
  return ss.getUrl();
}

function getDatabase_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('SPREADSHEET_ID');
  if (savedId) return SpreadsheetApp.openById(savedId);

  const ss = SpreadsheetApp.create('ANGELPIERCINGS_MKT_CONTROL_DB');
  props.setProperty('SPREADSHEET_ID', ss.getId());
  Object.keys(TABLES).forEach(function(key) {
    ensureSheet_(ss, TABLES[key]);
  });
  return ss;
}

function readAll_() {
  const ss = getDatabase_();
  const data = {};
  Object.keys(TABLES).forEach(function(key) {
    data[key] = readTable_(ensureSheet_(ss, TABLES[key]));
  });
  return data;
}

function saveAll_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const ss = getDatabase_();
    Object.keys(TABLES).forEach(function(key) {
      const records = Array.isArray(data[key]) ? data[key] : [];
      writeTable_(ensureSheet_(ss, TABLES[key]), records);
    });
  } finally {
    lock.releaseLock();
  }
}

function ensureSheet_(ss, name) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  const headers = ['ID', 'JSON', 'ATUALIZADO_EM'];
  const current = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (current.join('|') !== headers.join('|')) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function readTable_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
  return rows.map(function(row) {
    try {
      return row[1] ? JSON.parse(row[1]) : null;
    } catch (err) {
      return null;
    }
  }).filter(Boolean);
}

function writeTable_(sheet, records) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 3).clearContent();
  if (!records.length) return;

  const now = new Date();
  const values = records.map(function(record) {
    return [
      String(record.id || Utilities.getUuid()),
      JSON.stringify(record),
      now
    ];
  });
  sheet.getRange(2, 1, values.length, 3).setValues(values);
}

function parseBody_(e) {
  const raw = e && e.postData && e.postData.contents;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

function respond_(payload, callback) {
  const json = JSON.stringify(payload);
  const cb = String(callback || '');
  if (/^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(cb)) {
    return ContentService
      .createTextOutput(cb + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}
