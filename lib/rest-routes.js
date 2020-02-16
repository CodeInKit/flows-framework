const path = require('path');
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const RESTPORT = process.env.RESTPORT || '8080'; 
const _ = require('lodash');
var cors = require('cors')

module.exports = (exec, data) => {
  const restPath = path.join(data.routesPath, './rest');
  const restRoutes = require(restPath);
  
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(cors());

  console.log(`load REST API from ${restPath}`);

  _.each(restRoutes, (flowName, routeName) => {
    const [method, url] = routeName.split(' ');

    app[method](url, async (req, res) => {
      const response = await exec(flowName, {headers: req.headers, body: req.body, params: req.params, query: req.query});
      if(response.file) {
        return res.sendFile(response.file);
      } 
      
      res.send(response);
    });
  });

  app.listen(RESTPORT, () => {
    console.log(`${new Date()} rest server is listening on port ${RESTPORT}`);
  });
}