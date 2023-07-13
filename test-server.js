const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="10">
      <style>
        html, body {
          height: 100%;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #007BFF;
          font-family: Arial, sans-serif;
          color: #FFFFFF;
        }
        h1 {
          font-size: 2.5em;
        }
      </style>
    </head>
    <body>
      <h1>Hello World!</h1>
    </body>
    </html>
  `);
});

server.listen(8080, '0.0.0.0', () => {
  console.log('Server running at http://0.0.0.0:8080/');
});
