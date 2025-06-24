// File: app.js

const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db'); // make sure this file exists and exports the correct pool config

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/ussd', async (req, res) => {
    const { sessionId, serviceCode, phoneNumber, text } = req.body;
    const inputs = text.split('*');

    let response = '';

    // Level 1 - Language selection
    if (text === '') {
        response = `CON Welcome to BMI Calculator. Please choose your language:\nMurakaza neza kuri BMI Calculator. Hitamo ururimi:\n1. English\n2. Kinyarwanda`;
    }

    // English Flow
    else if (inputs[0] === '1') {
        if (inputs.length === 1) {
            response = 'CON Enter your age:\n0. Back';
        } else if (inputs[1] === '0') {
            response = `CON Welcome to BMI Calculator. Please choose your language:\nMurakaza neza kuri BMI Calculator. Hitamo ururimi:\n1. English\n2. Kinyarwanda`;
        } else if (inputs.length === 2) {
            response = 'CON Enter your weight in KG:\n0. Back';
        } else if (inputs[2] === '0') {
            response = 'CON Enter your age:\n0. Back';
        } else if (inputs.length === 3) {
            response = 'CON Enter your height in CM:\n0. Back';
        } else if (inputs[3] === '0') {
            response = 'CON Enter your weight in KG:\n0. Back';
        } else if (inputs.length === 4) {
            const age = parseInt(inputs[1]);
            const weight = parseFloat(inputs[2]);
            const height = parseFloat(inputs[3]);
            const height_m = height / 100;
            const bmi = weight / (height_m * height_m);
            const bmiFormatted = bmi.toFixed(1);

            let category = '';
            if (bmi < 18.5) category = 'Underweight';
            else if (bmi < 25) category = 'Normal weight';
            else if (bmi < 30) category = 'Overweight';
            else category = 'Obese';

            try {
                await pool.query(
                    `INSERT INTO sessions (session_id, phone_number, language)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (session_id) DO NOTHING`,
                    [sessionId, phoneNumber, 'English']
                );

                await pool.query(
                    `INSERT INTO user_inputs (session_id, age, weight, height, bmi, category)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [sessionId, age, weight, height, bmiFormatted, category]
                );
            } catch (error) {
                console.error('DB Error:', error);
                response = 'END There was an error saving your data. Please try again.';
                res.set('Content-Type', 'text/plain');
                return res.send(response);
            }

            response = `CON Your BMI is ${bmiFormatted} (${category}).\nDo you want health tips?\n1. Yes\n2. No\n0. Back`;
        } else if (inputs.length === 5) {
            if (inputs[4] === '1') {
                response = 'END Tip: Eat balanced meals and stay active daily!';
            } else if (inputs[4] === '2') {
                response = 'END Thank you for using our BMI service!';
            } else if (inputs[4] === '0') {
                response = `CON Your BMI result:\nDo you want health tips?\n1. Yes\n2. No\n0. Back`;
            }
        }
    }

    // Kinyarwanda Flow
    else if (inputs[0] === '2') {
        if (inputs.length === 1) {
            response = 'CON Andika imyaka yawe:\n0. Gusubira inyuma';
        } else if (inputs[1] === '0') {
            response = `CON Murakaza neza kuri BMI Calculator. Hitamo ururimi:\n1. English\n2. Kinyarwanda`;
        } else if (inputs.length === 2) {
            response = 'CON Andika ibiro byawe (KG):\n0. Gusubira inyuma';
        } else if (inputs[2] === '0') {
            response = 'CON Andika imyaka yawe:\n0. Gusubira inyuma';
        } else if (inputs.length === 3) {
            response = 'CON Andika uburebure bwawe (CM):\n0. Gusubira inyuma';
        } else if (inputs[3] === '0') {
            response = 'CON Andika ibiro byawe (KG):\n0. Gusubira inyuma';
        } else if (inputs.length === 4) {
            const age = parseInt(inputs[1]);
            const weight = parseFloat(inputs[2]);
            const height = parseFloat(inputs[3]);
            const height_m = height / 100;
            const bmi = weight / (height_m * height_m);
            const bmiFormatted = bmi.toFixed(1);

            let category = '';
            if (bmi < 18.5) category = 'Ufite ibiro bikeya';
            else if (bmi < 25) category = 'Ibiro bisanzwe';
            else if (bmi < 30) category = 'Ibiro byinshi';
            else category = 'Ufite umubyibuho ukabije';

            try {
                await pool.query(
                    `INSERT INTO sessions (session_id, phone_number, language)
                     VALUES ($1, $2, $3)
                     ON CONFLICT (session_id) DO NOTHING`,
                    [sessionId, phoneNumber, 'Kinyarwanda']
                );

                await pool.query(
                    `INSERT INTO user_inputs (session_id, age, weight, height, bmi, category)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [sessionId, age, weight, height, bmiFormatted, category]
                );
            } catch (error) {
                console.error('DB Error:', error);
                response = 'END Habaye ikosa. Ongera ugerageze.';
                res.set('Content-Type', 'text/plain');
                return res.send(response);
            }

            response = `CON BMI yawe ni ${bmiFormatted} (${category}).\nWifuza inama z’ubuzima?\n1. Yego\n2. Oya\n0. Gusubira inyuma`;
        } else if (inputs.length === 5) {
            if (inputs[4] === '1') {
                response = 'END Inama: Fata indyo yuzuye kandi ukore siporo buri munsi!';
            } else if (inputs[4] === '2') {
                response = 'END Murakoze gukoresha serivisi yacu ya BMI.';
            } else if (inputs[4] === '0') {
                response = `CON BMI yawe ni...\nWifuza inama z’ubuzima?\n1. Yego\n2. Oya\n0. Gusubira inyuma`;
            }
        }
    }

    // Fallback for any other input
    else {
        response = 'END Invalid input. Please try again.';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ USSD BMI app running on port ${PORT}`);
});
