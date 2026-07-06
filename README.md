# CPPEM Concursos — Landing Page

Página única de captação. Dados do formulário vão direto para o Google Sheets.

---

## ✅ Como conectar ao Google Sheets (5 minutos)

### 1. Crie a planilha
- Acesse https://sheets.google.com e crie uma planilha nova.
- Dê o nome que quiser (ex: "Leads CPPEM").

### 2. Abra o editor de script
- No menu da planilha: **Extensões → Apps Script**
- Apague tudo que estiver no editor.
- Copie todo o conteúdo do arquivo `google-apps-script.js` (que está nesta pasta) e cole.
- Clique em **Salvar** (ícone de disquete ou Ctrl+S).

### 3. Faça o deploy como Web App
- Clique em **Implantar → Nova implantação**
- Tipo: **App da Web**
- Descrição: "CPPEM Leads"
- Executar como: **Minha conta**
- Quem tem acesso: **Qualquer pessoa** ← obrigatório
- Clique em **Implantar**
- **Copie a URL** que aparece (começa com `https://script.google.com/macros/s/...`)

### 4. Cole a URL no projeto
- Abra o arquivo `script.js`
- Linha 7 — substitua `COLE_AQUI_A_URL_DO_WEB_APP` pela URL copiada:
  ```js
  const SHEET_URL = "https://script.google.com/macros/s/SUA_URL_AQUI/exec";
  ```
- Salve o arquivo.

### 5. Teste
- Abra a página, preencha o formulário e envie.
- Volte à planilha — deve aparecer uma nova linha com: Data e Hora / Nome / E-mail / Telefone.

> **Dica:** toda vez que atualizar o `google-apps-script.js` na planilha, faça
> uma **nova implantação** (não "gerenciar existente"), senão a URL antiga fica desatualizada.

---

## Estrutura de arquivos
```
cppem-lp/
├── index.html              ← página
├── styles.css              ← estilos
├── script.js               ← validação + envio para Sheets
├── google-apps-script.js   ← código que vai no Apps Script do Google
├── vercel.json
├── .gitignore
└── public/assets/
    ├── logo-cppem.png
    ├── brasao-pmpe.png
    ├── bg-collage.jpg      ← fundo mesclado das imagens
    ├── everton-mota.jpg
    ├── tropa-pmpe.jpeg
    └── policiais-operacao.webp
```

## Fotos dos alunos
Em `index.html`, seção `.social`, cada `<figure class="photo">` recebe:
```html
<img src="/public/assets/aluno-1.jpg" alt="Aluno aprovado com o Prof. Everton Mota" />
```
A moldura tracejada some automaticamente quando a imagem entra.

## Subir no GitHub + Vercel
```bash
git init && git add . && git commit -m "CPPEM landing page"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/cppem-lp.git
git push -u origin main
```
No Vercel: Add New → Project → importe o repo → Framework Preset: **Other** → Deploy.
