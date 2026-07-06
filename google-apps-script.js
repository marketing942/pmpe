function doPost(e) {
  try {
    const dados    = JSON.parse(e.postData.contents);
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (planilha.getLastRow() === 0) {
      planilha.appendRow(["Data e Hora", "Nome", "E-mail", "Telefone"]);
      const h = planilha.getRange(1, 1, 1, 4);
      h.setFontWeight("bold");
      h.setBackground("#00E63C");
      h.setFontColor("#0A0A0A");
      planilha.setColumnWidth(1, 160);
      planilha.setColumnWidth(2, 220);
      planilha.setColumnWidth(3, 250);
      planilha.setColumnWidth(4, 180);
    }

    const agora = Utilities.formatDate(new Date(), "America/Recife", "dd/MM/yyyy HH:mm:ss");

    planilha.appendRow([agora, dados.nome || "", dados.email || "", dados.telefone || ""]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "erro", mensagem: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("CPPEM Sheets — funcionando.");
}
