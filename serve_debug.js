const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const FILE_PATH = path.join(__dirname, 'index.html');

http.createServer((req, res) => {
    fs.readFile(FILE_PATH, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end(`Error loading index.html: ${err}`);
        } else {
            // Inject a quick script to pipe console.error to the webpage body so we can see it
            const html = data.toString().replace('<head>', `<head>
            <script>
                window.onerror = function(message, source, lineno, colno, error) {
                    document.body.innerHTML += '<div style="color: red; padding: 20px; font-size: 20px; z-index: 9999; position: absolute; top: 0; background: black; width: 100%; border-bottom: 5px solid red;"><h1>Javascript Error Intercepted:</h1><pre>' + message + '\\n\\nLine: ' + lineno + '\\nCol: ' + colno + '\\n\\nStack: ' + (error ? error.stack : 'N/A') + '</pre></div>';
                };
            </script>
            `);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        }
    });
}).listen(PORT, '127.0.0.1', () => {
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
});
