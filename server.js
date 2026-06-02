const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      message: "Servidor simple funcionando en Azure"
    }));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Servidor simple funcionando");
});

server.listen(PORT, () => {
  console.log(`Servidor simple corriendo en puerto ${PORT}`);
});