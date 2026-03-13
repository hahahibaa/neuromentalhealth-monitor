import http.server
import socketserver
import urllib.parse
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            with open(os.path.join(DIRECTORY, 'index.html'), 'r', encoding='utf-8') as f:
                content = f.read()

            # Inject error tracking script right after head
            injection = """
            <script>
                window.onerror = function(msg, url, lineNo, columnNo, error) {
                    console.log('INTERCEPTED_ERROR: ' + msg + ' at line ' + lineNo);
                    fetch('http://127.0.0.1:8080/log_error', {
                        method: 'POST',
                        body: 'INTERCEPTED_ERROR: ' + msg + ' at line ' + lineNo
                    });
                    return false;
                };
            </script>
            """
            
            new_content = content.replace('<head>', '<head>' + injection)
            self.wfile.write(new_content.encode('utf-8'))
        else:
            super().do_GET()
            
    def do_POST(self):
        if self.path == '/log_error':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            print(f"\n\n================================\nBROWSER ERROR LOGGED:\n{post_data}\n================================\n\n")
            self.send_response(200)
            self.end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print("Serving at port", PORT)
    httpd.serve_forever()
