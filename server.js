const express = require('express');
const path = require('path');
const { initDB } = require('./database/db');
const pagesRouter = require('./routes/pages');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', pagesRouter);
app.use('/api', apiRouter);

initDB().then(() => {
  app.listen(PORT, () => {
    const pin = process.env.TRIP_PIN || 'japan2027';
    console.log(`\n✈  大阪京都之旅 2027`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`🔑 編輯密碼：${pin}\n`);
  });
}).catch(err => {
  console.error('DB 初始化失敗：', err);
  process.exit(1);
});
