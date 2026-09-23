const SHEET_NAME = 'Contributions'

function doGet(event) {
  const parameters = event && event.parameter ? event.parameter : {}
  if (parameters.action === 'add' && parameters.contribution) {
    const contribution = JSON.parse(parameters.contribution)
    const sheet = getSheet_()
    sheet.appendRow([contribution.id, contribution.amount, contribution.date, contribution.person, new Date()])
    if (parameters.goal) PropertiesService.getScriptProperties().setProperty('goal', String(parameters.goal))
    return json_({ ok: true }, parameters.callback)
  }

  if (parameters.action === 'delete' && parameters.id) {
    const sheet = getSheet_()
    const rows = sheet.getDataRange().getValues()
    for (let index = rows.length - 1; index > 0; index -= 1) {
      if (String(rows[index][0]) === String(parameters.id)) {
        sheet.deleteRow(index + 1)
        break
      }
    }
    return json_({ ok: true }, parameters.callback)
  }

  const sheet = getSheet_()
  const values = sheet.getDataRange().getValues()
  const rows = values.slice(1).filter((row) => row[0] !== '')
  const contributions = rows.map((row) => ({
    id: Number(row[0]),
    amount: Number(row[1]),
    date: formatDate_(row[2]),
    person: String(row[3]),
  }))

  return json_({
    goal: PropertiesService.getScriptProperties().getProperty('goal') || '',
    contributions,
  }, parameters.callback)
}

function doPost(event) {
  const data = JSON.parse(event.postData.contents)
  const sheet = getSheet_()

  if (data.goal) {
    PropertiesService.getScriptProperties().setProperty('goal', String(data.goal))
  }

  if (data.action === 'add' && data.contribution) {
    const contribution = data.contribution
    sheet.appendRow([
      contribution.id,
      contribution.amount,
      contribution.date,
      contribution.person,
      new Date(),
    ])
  }

  if (data.action === 'delete') {
    const rows = sheet.getDataRange().getValues()
    for (let index = rows.length - 1; index > 0; index -= 1) {
      if (String(rows[index][0]) === String(data.id)) {
        sheet.deleteRow(index + 1)
        break
      }
    }
  }

  return json_({ ok: true })
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = spreadsheet.getSheetByName(SHEET_NAME)
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'amount', 'date', 'person', 'createdAt'])
  }
  return sheet
}

function formatDate_(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  return String(value)
}

function json_(value, callback) {
  if (callback && /^[A-Za-z_$][\w$]*$/.test(callback)) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify(value)})`).setMimeType(ContentService.MimeType.JAVASCRIPT)
  }
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON)
}
