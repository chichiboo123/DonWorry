# Google Apps Script 연동 가이드

## 1단계: 구글 스프레드시트 준비

새 구글 스프레드시트를 만들고, 첫 번째 시트(Sheet1)의 **1행에 헤더**를 입력하세요:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| id | group | category | subCategory | costType | description | budgetAmount | executedAmount | executionRate | remainingAmount | settlementFund | memo |

## 2단계: Apps Script 코드 배포

1. 스프레드시트에서 **확장 프로그램 → Apps Script** 클릭
2. 기존 코드를 모두 삭제하고, 아래 코드를 붙여넣기
3. **배포 → 새 배포** 클릭
4. 유형: **웹 앱** 선택
5. 실행 주체: **나(본인 이메일)**
6. ⚠️ **액세스 권한: 반드시 "모든 사용자(Anyone)" 선택** (❌ "조직 내 사용자"가 아닙니다!)
7. **배포** 클릭 → 생성된 URL 복사

> ⚠️ **중요**: "조직 내 사용자(Anyone within organization)"가 아닌 **"모든 사용자(Anyone)"**를 선택해야 합니다. 그렇지 않으면 CORS 오류가 발생합니다.

> ⚠️ **코드 수정 후**: 반드시 **배포 → 배포 관리 → 연필 아이콘(수정) → 버전: 새 버전 → 배포**를 해야 변경사항이 반영됩니다.

## Apps Script 코드

```javascript
const SHEET_NAME = 'Sheet1';

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'read';
  
  if (action === 'read') {
    return readData();
  }
  
  return jsonResponse({ error: 'Unknown action' });
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
  } catch(err) {
    return jsonResponse({ error: 'Invalid JSON: ' + err.message });
  }
  
  var action = body.action;
  
  switch (action) {
    case 'save':
    case 'sync':
      return saveData(body.items || []);
    case 'update':
      return updateItem(body.item);
    case 'delete':
      return deleteItem(body.id);
    default:
      return jsonResponse({ error: 'Unknown action: ' + action });
  }
}

function readData() {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return jsonResponse({ items: [] });
  }
  
  var headers = data[0];
  var items = [];
  
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var h = headers[j];
      if (['budgetAmount', 'executedAmount', 'executionRate', 'remainingAmount', 'settlementFund'].indexOf(h) >= 0) {
        obj[h] = Number(data[i][j]) || 0;
      } else {
        obj[h] = String(data[i][j] || '');
      }
    }
    items.push(obj);
  }
        obj[h] = Number(data[i][j]) || 0;
      } else {
        obj[h] = String(data[i][j] || '');
      }
    }
    items.push(obj);
  }
  
  return jsonResponse({ items: items });
}

function saveData(items) {
  var sheet = getSheet();
  var headers = ['id', 'group', 'category', 'subCategory', 'costType', 'description', 'budgetAmount', 'executedAmount', 'executionRate', 'remainingAmount', 'settlementFund', 'memo'];
  
  // 기존 데이터 삭제 (헤더 유지)
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).clearContent();
  }
  
  if (!items || items.length === 0) {
    return jsonResponse({ success: true, count: 0 });
  }
  
  var rows = items.map(function(item) {
    return headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
  });
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  
  return jsonResponse({ success: true, count: items.length });
}

function updateItem(item) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idCol = headers.indexOf('id');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(item.id)) {
      for (var j = 0; j < headers.length; j++) {
        if (item[headers[j]] !== undefined) {
          sheet.getRange(i + 1, j + 1).setValue(item[headers[j]]);
        }
      }
      return jsonResponse({ success: true });
    }
  }
  
  // 없으면 새로 추가
  var row = headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
  sheet.appendRow(row);
  return jsonResponse({ success: true, added: true });
}

function deleteItem(id) {
  var sheet = getSheet();
  var data = sheet.getDataRange().getValues();
  var idCol = data[0].indexOf('id');
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][idCol]) === String(id)) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  
  return jsonResponse({ error: 'Item not found' });
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3단계: DonWorry 앱에서 연동

1. 앱 첫 페이지에서 **온라인 모드** 탭 선택
2. **Apps Script 배포 URL** 입력 (예: `https://script.google.com/macros/s/AKfycb.../exec`)
3. 연결 버튼 클릭

## 문제 해결

### "Failed to fetch" 또는 CORS 오류가 발생할 때

1. **배포 설정 확인**: Apps Script에서 배포 → 배포 관리 → 액세스 권한이 **"모든 사용자(Anyone)"**인지 확인
2. **URL 확인**: URL이 `/exec`로 끝나는지 확인
3. **재배포**: 코드 수정 후에는 반드시 **새 버전**으로 재배포
4. **Google 계정**: 학교/회사 Google Workspace 계정이면 관리자가 외부 공유를 차단했을 수 있습니다. 개인 Gmail 계정으로 시도해보세요.

### 무료 사용 제한

- 하루 약 20,000건의 요청 가능
- 실행 시간 제한: 6분/호출
