const express = require('express');
const app = express();

// Middleware to parse incoming form data
app.use(express.urlencoded({ extended: true }));

app.post('/ussd', (req, res) => {
    let { sessionId, phoneNumber, text } = req.body;

    let response = '';
    let inputs = text === '' ? [] : text.split('*');

    console.log(`Session: ${sessionId}, Phone: ${phoneNumber}, Text: ${text}, Inputs:`, inputs);

    // Handle Back option: if last input is '0', remove it and go one step back
    if (inputs.length > 0 && inputs[inputs.length - 1] === '0') {
        inputs.pop(); // remove the '0'
        text = inputs.join('*');
    }

    // Use updated inputs length after handling back
    const step = inputs.length;

    if (step === 0) {
        // Step 1: Language selection
        response = `CON Welcome to Health BMI App
1. English
2. Kinyarwanda`;
    } else if (step === 1) {
        // Step 2: Ask for weight
        const lang = inputs[0];
        response = lang === '2'
            ? 'CON Andika ibiro byawe (KG):\n0. Subira inyuma'
            : 'CON Enter your weight in KG:\n0. Back';
    } else if (step === 2) {
        // Step 3: Ask for height
        const lang = inputs[0];
        response = lang === '2'
            ? 'CON Andika uburebure bwawe (CM):\n0. Subira inyuma'
            : 'CON Enter your height in CM:\n0. Back';
    } else if (step === 3) {
        // Step 4: Calculate BMI and ask for tips
        const lang = inputs[0];
        const weight = parseFloat(inputs[1]);
        const height = parseFloat(inputs[2]);

        if (isNaN(weight) || isNaN(height)) {
            response = lang === '2'
                ? 'END Ibyinjijwe si byo. Andika imibare nyayo.'
                : 'END Invalid weight or height. Please enter valid numbers.';
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
2. Oya
0. Subira inyuma`
                : `CON Your BMI is ${bmi.toFixed(1)} (${status})
Would you like health tips?
1. Yes
2. No
0. Back`;
        }
    } else if (step === 4) {
        // Step 5: Show tips or end
        const lang = inputs[0];
        const weight = parseFloat(inputs[1]);
        const height = parseFloat(inputs[2]);
        const wantTips = inputs[3];

        const bmi = weight / ((height / 100) ** 2);
        let tip = '';

        if (bmi < 18.5) {
            tip = lang === '2'
                ? 'Fata ibiryo birimo intungamubiri nyinshi. Ganira na muganga.'
                : 'Eat more calories and protein. Consult a doctor.';
        } else if (bmi < 25) {
            tip = lang === '2'
                ? 'Uri muzima. Kurikiza indyo yuzuye.'
                : 'You are healthy. Maintain balanced meals.';
        } else if (bmi < 30) {
            tip = lang === '2'
                ? 'Jya ukora imyitozo kandi wirinde ibiryo bibi.'
                : 'Exercise often and avoid junk food.';
        } else {
            tip = lang === '2'
                ? 'Ganira na muganga. Kurikiza indyo ikomeye.'
                : 'See a doctor. Follow a strict diet.';
        }

        if (wantTips === '1') {
            response = `END ${tip}`;
        } else if (wantTips === '2') {
            response = lang === '2'
                ? 'END Murakoze gukoresha serivisi yacu.'
                : 'END Thank you for using our service.';
        } else {
            response = lang === '2'
                ? 'END Amahitamo si yo. Ongera ugerageze.'
                : 'END Invalid option. Please try again.';
        }
    } else {
        // Invalid or extra input
        response = 'END Invalid input. Please restart and follow the instructions.';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// Start server
const PORT = 443;
app.listen(PORT, () => {
    console.log(`✅ USSD app running at http://localhost:${PORT}/ussd`);
});
