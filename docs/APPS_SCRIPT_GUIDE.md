# Google Apps Script 연동 가이드

## 1단계: 구글 스프레드시트 준비

새 구글 스프레드시트를 만들고, 첫 번째 시트(Sheet1)의 **1행에 헤더**를 입력하세요:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| id | group | category | subCategory | costType | description | budgetAmount | executedAmount | executionRate | remainingAmount | settlementFund |

## 2단계: Apps Script 코드 배포

1. 스프레드시트에서 **확장 프로그램 → Apps Script** 클릭
2. 기존 코드를 모두 삭제하고, 아래 코드를 붙여넣기
3. **배포 → 새 배포** 클릭
4. 유형: **웹 앱** 선택
5. 실행 주체: **나** / 액세스 권한: **모든 사용자**
6. **배포** 클릭 → 생성된 URL 복사

## Apps Script 코드

```javascript
const SHEET_NAME = 'Sheet1';

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function doGet(e) {
  const action = e.parameter.action || 'read';
  
  if (action === 'read') {
    return readData();
  }
  
  return jsonResponse({ error: 'Unknown action' }, 400);
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  
  switch (action) {
    case 'save':
      return saveData(body.items);
    case 'update':
      return updateItem(body.item);
    case 'delete':
      return deleteItem(body.id);
    case 'sync':
      return saveData(body.items);
    default:
      return jsonResponse({ error: 'Unknown action' }, 400);
  }
}

function readData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return jsonResponse({ items: [] });
  }
  
  const headers = data[0];
  const items = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (['budgetAmount', 'executedAmount', 'executionRate', 'remainingAmount', 'settlementFund'].includes(h)) {
        obj[h] = Number(row[i]) || 0;
      } else {
        obj[h] = String(row[i] || '');
      }
    });
    return obj;
  });
  
  return jsonResponse({ items });
}

function saveData(items) {
  const sheet = getSheet();
  const headers = ['id', 'group', 'category', 'subCategory', 'costType', 'description', 'budgetAmount', 'executedAmount', 'executionRate', 'remainingAmount', 'settlementFund'];
  
  // 기존 데이터 삭제 (헤더 유지)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }
  
  if (items.length === 0) {
    return jsonResponse({ success: true, count: 0 });
  }
  
  const rows = items.map(item => headers.map(h => item[h] ?? ''));
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  return jsonResponse({ success: true, count: items.length });
}

function updateItem(item) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idCol = headers.indexOf('id');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idCol] === item.id) {
      headers.forEach((h, col) => {
        if (item[h] !== undefined) {
          sheet.getRange(i + 1, col + 1).setValue(item[h]);
        }
      });
      return jsonResponse({ success: true });
    }
  }
  
  // 없으면 새로 추가
  const row = headers.map(h => item[h] ?? '');
  sheet.appendRow(row);
  return jsonResponse({ success: true, added: true });
}

function deleteItem(id) {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('id');
  
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  
  return jsonResponse({ error: 'Item not found' }, 404);
}

function jsonResponse(data, status) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3단계: DonWorry 앱에서 연동

1. 앱의 첫 페이지(Setup)에서 **"구글 스프레드시트 링크"** 대신 **Apps Script 배포 URL**을 입력
2. 온라인 모드가 활성화되면 데이터가 스프레드시트와 동기화됩니다

## 주의사항

- Apps Script 웹 앱은 **배포할 때마다 새 URL**이 생성됩니다
- 코드 수정 후에는 반드시 **새 배포**를 해야 변경사항이 반영됩니다
- 무료 계정 기준 하루 약 20,000건의 요청이 가능합니다
