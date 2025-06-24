const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

app.post('/ussd', async (req, res) => {
  let { sessionId, phoneNumber, text } = req.body;

  let response = '';
  let inputs = text === '' ? [] : text.split('*');
  const step = inputs.length;

  await pool.query(
    `INSERT INTO session (session_id, phone_number, status)
     VALUES ($1, $2, 'active')
     ON CONFLICT (session_id) DO NOTHING`,
    [sessionId, phoneNumber]
  );

  const lang = inputs[0];

  if (step === 0) {
    response = `CON Welcome to Health BMI App
1. English
2. Kinyarwanda`;

  } else if (step === 1) {
    response = lang === '2'
      ? 'CON Andika ibiro byawe (KG):\n0. Subira inyuma'
      : 'CON Enter your weight in KG:\n0. Back';

  } else if (step === 2) {
    response = lang === '2'
      ? 'CON Andika uburebure bwawe (CM):\n0. Subira inyuma'
      : 'CON Enter your height in CM:\n0. Back';

  } else if (step === 3) {
    response = lang === '2'
      ? 'CON Andika imyaka yawe:\n0. Subira inyuma'
      : 'CON Enter your age:\n0. Back';

  } else if (step === 4) {
    const weight = parseFloat(inputs[1]);
    const height = parseFloat(inputs[2]);
    const age = parseInt(inputs[3]);

    if (isNaN(weight) || isNaN(height) || isNaN(age)) {
      response = lang === '2'
        ? 'END Ibyinjijwe si byo. Andika imibare nyayo.'
        : 'END Invalid input. Please enter valid numbers.';
    } else {
      const bmi = weight / ((height / 100) ** 2);

      let status = '';
      if (bmi < 18.5) status = lang === '2' ? 'Ufite ibiro biri hasi' : 'Underweight';
      else if (bmi < 25) status = lang === '2' ? 'Ibiro bisanzwe' : 'Normal';
      else if (bmi < 30) status = lang === '2' ? 'Ufite ibiro byinshi' : 'Overweight';
      else status = lang === '2' ? 'Ufite ibiro byinshi cyane' : 'Obese';

      response = lang === '2'
        ? `CON BMI yawe ni ${bmi.toFixed(1)} (${status})
Ukeneye inama z’ubuzima?
1. Yego
2. Oya`
        : `CON Your BMI is ${bmi.toFixed(1)} (${status})
Would you like health tips?
1. Yes
2. No`;

      const language = lang === '2' ? 'Kinyarwanda' : 'English';

      await pool.query(
        `INSERT INTO measurement (session_id, phone_number, language, weight, height, bmi, status, age)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [sessionId, phoneNumber, language, weight, height, bmi, status, age]
      );
    }

  } else if (step === 5) {
    const tips = inputs[4];

    const result = await pool.query(
      `UPDATE measurement SET tips_requested = $1 WHERE session_id = $2 RETURNING status, bmi`,
      [tips === '1', sessionId]
    );

    if (result.rowCount === 0) {
      response = lang === '2'
        ? 'END Ntibishobotse kubika amakuru.'
        : 'END Unable to save your data.';
    } else {
      const { status, bmi } = result.rows[0];
      let tip = '';

      if (tips === '1') {
        switch (status) {
          case 'Underweight':
          case 'Ufite ibiro biri hasi':
            tip = lang === '2'
              ? 'Fata ibiryo birimo intungamubiri nyinshi. Ganira na muganga.'
              : 'Eat more calories and protein. Consult a doctor.';
            break;
          case 'Normal':
          case 'Ibiro bisanzwe':
            tip = lang === '2'
              ? 'Uri muzima. Kurikiza indyo yuzuye.'
              : 'You are healthy. Maintain balanced meals.';
            break;
          case 'Overweight':
          case 'Ufite ibiro byinshi':
            tip = lang === '2'
              ? 'Jya ukora imyitozo kandi wirinde ibiryo bibi.'
              : 'Exercise often and avoid junk food.';
            break;
          case 'Obese':
          case 'Ufite ibiro byinshi cyane':
            tip = lang === '2'
              ? 'Ganira na muganga. Kurikiza indyo ikomeye.'
              : 'See a doctor. Follow a strict diet.';
            break;
        }
        response = `END ${tip}`;
      } else {
        response = lang === '2'
          ? 'END Murakoze gukoresha serivisi yacu.'
          : 'END Thank you for using our service.';
      }
    }
  } else {
    response = 'END Invalid input. Please start again.';
  }

  res.set('Content-Type', 'text/plain');
  res.send(response);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ USSD BMI app running at http://localhost:${PORT}/ussd`);
});
