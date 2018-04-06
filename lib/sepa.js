const axios = require('axios');
const WebSocket = require('isomorphic-ws');
const utils = require('./utils');
const Observable = require('zen-observable');



class SEPA {

  constructor(parameters) {
    this.config = parameters
    this.queryURI = utils.createURI('http',parameters.host,parameters.ports.http,parameters.paths.query)
    this.updateURI = utils.createURI('http',parameters.host,parameters.ports.http,parameters.paths.update)
    this.subscribeURI = utils.createURI('ws',parameters.host,parameters.ports.ws,parameters.paths.subscribe)
  }

  query(query,config) {
    let q_uri = this.queryURI
    if ( config !== undefined){
      let temp = Object.assign(this.config,config)
      q_uri = utils.createURI('http',temp.host,temp.ports.http,temp.paths.query)
    }
    console.log(q_uri);;
    return axios.post(q_uri,query, {"headers" : {
      "Content-Type":"application/sparql-query",
    }}).then(function(response) {
       return response.data;
    })
  }

  update(update,config) {
    let up_uri = this.updateURI
    if ( config !== undefined){
      let temp = Object.assign(this.config,config)
      up_uri = utils.createURI('http',temp.host,temp.ports.http,temp.paths.update)
    }

    return axios.post(up_uri,update, {"headers" : {
      "Content-Type":"application/sparql-update",
    }}).then(function(response) {
      return {"status" : response.status,
              "statusText" : response.statusText
      };
    })
  }

  subscribe (query,observer,config) {
    let sub_uri = this.subscribeURI
    if ( config !== undefined){
      let temp = Object.assign(this.config,config)
      sub_uri = utils.createURI('ws',temp.host,temp.ports.ws,temp.paths.subscribe)
    }

    let observable = new Observable(obs => {
      const ws = new WebSocket(sub_uri);

      ws.addEventListener("open",  () => {
        var subscribe = { "subscribe" : query }
      }
        ws.send(JSON.stringify(subscribe))
      });

      var subid = ""
      var connectionClosed = false

      ws.addEventListener("message", data => {
        try{
          data = JSON.parse(data.data)
          data ["toString"] = () => { return JSON.stringify(data) }

          if(!data.error){
            if(data.subscribed){
              subid = data.subscribed.spuid
            }

            if( data.unsubscribed){
              obs.complete()
              ws.close()
            }else {
              obs.next(data)
            }
          }else{
            connectionClosed = true
            ws.close()
            obs.error(data)
          }

        }catch(e){
          connectionClosed = true
          ws.close()
          obs.error(e)
        }
      });

      ws.addEventListener("close", function () {
        connectionClosed = true
        obs.complete()
      });

      return () => {
        if (!connectionClosed) {
          let unsubscribe = { unsubscribe : { spuid : subid }}
          ws.send(JSON.stringify(unsubscribe))
        }
      };
    });
    return observable.subscribe(observer)
  }
}

module.exports = SEPA;
