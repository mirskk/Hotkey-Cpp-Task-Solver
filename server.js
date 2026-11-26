import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const folderPath = process.env.FOLDER_PATH || "solutions";
// Experimenting with a counter file to ensure unique filenames and prevent overwriting
const fileCounter = process.env.FILE_COUNTER || "identity_individual_number.txt";
const logFile = process.env.LOG_FILE || "logs/server_activity.log";

function logToFile(level, message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logLine, 'utf-8');
    } catch (err) {
        console.error("Failed writing to log file:", err.message);
    }
}

function getNextId(fileCounter) {
  const rawText = fs.readFileSync(fileCounter, 'utf-8').trim();

  const currentId = parseInt(rawText, 10);
  if (isNaN(currentId)) {
    throw new Error(`CRITICAL ALARM: File "${fileCounter}" contains "${rawText}", which is not a valid number. Server stopped to prevent duplicate file names.`);
  }
  const nextId = currentId + 1;
  fs.writeFileSync(fileCounter, nextId.toString(), 'utf-8');

  return nextId;
}
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.post('/receive-text', async (req, res) => {
    const receivedText = req.body.text;
    console.log(`Received text: ${receivedText}`);
    logToFile("INFO", `Incoming payload received: "${receivedText.substring(0, 30)}..."`);
    //test
    console.log("KEY EXISTS:", !!process.env.API_KEY);
    console.log("KEY LENGTH:", process.env.API_KEY?.length);
    console.log("KEY PREVIEW:", process.env.API_KEY?.slice(0, 5));
    try {
        const cloudResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                { 
    role: 'system',
    content: process.env.SYSTEM_PROMPT || "You are a helpful C++ programming assistant."
},
{ 
    role: 'user', 
    content: `You must solve the following assignment exactly as described. 
    
    [START OF ASSIGNMENT TEXT]
    ${receivedText}
    [END OF ASSIGNMENT TEXT]
    
    Extract the exact names and requirements from the block above. Remember to apply the Bulgarian transliteration rules to the classes and copy the exact text from the Output Format section.`
}
                ],
                temperature: 0.4,
                top_p: 0.15
            })
        });

        const rawResponseText = await cloudResponse.text();

        if (!cloudResponse.ok) {
            throw new Error(`Groq Server Refused Request (Status ${cloudResponse.status}): ${rawResponseText}`);
        }

        const data = JSON.parse(rawResponseText);
        if (!data.choices || !data.choices[0]){
            throw new Error(`Groq API Error: ${data.error?.message || 'Unknown response structure'}`);
        }

        const rawAiInput = data.choices[0].message.content.trim();
        console.log("RAW AI RESPONSE:");
        console.log(rawAiInput);

        const finalCodeSolution = rawAiInput;
        
        if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
            const now = new Date();
            const timestamp = now.toISOString().replace(/:/g, '-').replace(/\./g, '-');
            
            if (fs.existsSync(fileCounter)) {
                const newID = getNextId(fileCounter);
                const filename = `file_${timestamp}-${newID}.cpp`;
                const filePath = path.join(folderPath, filename);
                console.log("About to save file...");
                console.log("Generated code length:", finalCodeSolution.length);
                fs.writeFileSync(filePath, finalCodeSolution, 'utf-8');
                
                console.log(`Saved file as: ${filename}`);
                logToFile("SUCCESS", `Created and written code file: ${filename}`);
                
                res.send(`File saved successfully as ${filename}!`);
            } else {
                logToFile("ERROR", `Counter file missing at path: ${fileCounter}`);
                res.status(500).send("Counter file missing.");
            }
        } else {
            logToFile("ERROR", `Target directory path invalid: ${folderPath}`);
            res.status(500).send("Target folder path does not exist.");
        }
    } catch (error) {
        console.error("[CRITICAL ERROR]: Pipeline failed:", error.message);
        logToFile("CRITICAL", `Pipeline exception thrown: ${error.message}`);
        res.status(500).send(`Server Error: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Server successfully booted up. Reserving http://localhost:${PORT}`);
    logToFile("SYSTEM", `Server initialization successful on port ${PORT}`);
});