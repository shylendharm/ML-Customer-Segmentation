const express = require("express");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(require("cors")());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Root route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "index.html"));
});

// Run ML model
app.get("/run-model", (req, res) => {
    const modelPath = path.join(__dirname, "..", "ml", "model.py");
    
    exec(`python "${modelPath}"`, { cwd: __dirname }, (err, stdout, stderr) => {
        if (err) return res.status(500).json({ error: err.message });

        const dataPath = path.join(__dirname, "data.json");
        const data = fs.readFileSync(dataPath, "utf-8");
        res.json(JSON.parse(data));
    });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));