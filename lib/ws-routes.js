const WebSocketServer = require('websocket').server;
const _ = require('lodash');
const http = require('http');
const WSPORT = process.env.WSPORT || '5000'; 

// all http request returns 404 since we work only with ws
const server = http.createServer((req, res) => {
  res.writeHead(404);
  res.end();
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Address in use, retrying...');
    setTimeout(() => {
      server.close();
      server.listen(WSPORT);
    }, 1000);
  }
});

server.listen(WSPORT, () => {   
  console.log(`${new Date()} ws-server is listening on port ${WSPORT}`);
});

const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});


module.exports = function(execFlow, config = {}) {
  _.defaults(config, {
    isCikProtocol: true
  });

  wsServer.on('request', async (req) => {
    const {isAllowed} = await execFlow('allow_origin', {origin: req.origin});
    
    if(!isAllowed) {
      req.reject();
      console.warn(`${new Date()} Connection from origin ${req.origin} rejected.`);
      return;
    }

    let connection;
    if(config.isCikProtocol) {
      connection = req.accept('cik-flows-protocol', req.origin);
    } else {
      connection = req.accept();
    }

    connection.on('message', async message => {
      const data = JSON.parse(message.utf8Data);
      
      if(!_.isObject(data.__flows)) {
        return connection.send(JSON.stringify({error: 'message not valid'}));
      }

      const rd = JSON.stringify(await execFlow(data.__flows.flowName, data, {connection})
        .catch(e => ({__flows: {...data.__flows}, error: e.message})));
      connection.send(rd);
    });
  });
};
