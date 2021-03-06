const { Url } = require('url');
const util = require('util');


module.exports.createURI = function (protocol,base,port,path) {
  if (path !== undefined && !path.startsWith("/")) {
    throw "path must starts with /"
  }

  if (protocol === undefined || base === undefined ) {
    throw "prtocol and base must be specified"
  }

  format = ["%s://","%s",":%d","%s"]
  sformat = ""
  farguments = []
  for (i = 0; i < arguments.length; i++) {
        if (arguments[i] !== undefined) {
          sformat += format[i]
          farguments.push(arguments[i])
        }
  }

  url = util.format(sformat,...farguments)
  //check valid uri
  new Url(url)
  return url
};
