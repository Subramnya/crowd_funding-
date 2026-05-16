const creatorCodePanel = document.getElementById('creatorCodePanel');
const creatorCodeValue = document.getElementById('creatorCodeValue');

const creatorCode = sessionStorage.getItem('createdFundingCode');

if (creatorCode && creatorCodePanel && creatorCodeValue) {
  creatorCodeValue.textContent = creatorCode;
  creatorCodePanel.hidden = false;
}
