const Task = require("data.task");
const request = require("request");
const Either =require('data.either');
const token = require('./token')
// import request from 'request';

const argv = new Task((rej,res) => res(process.argv));
const name = argv.map(s => s.slice(2));
// get access code from external module
// string -> object
const options = u => {
   return{ url:u,
    headers: {
        Authorization: "Bearer "+ token
      }}
  }
// string -> task
const httpGet = (url) => 
    new Task((rej, res) => 
    request(options(url), (e,response,body) =>
    e? rej(e) : res(body)));

// array -> Either
const first = xs => Either.fromNullable(xs[0]);

//either -> task
const eitherToTask = e =>
        e.fold(Task.rejected, Task.of);

const parse = Either.try(JSON.parse);

// string -> task
const getArtistId = name => 
    httpGet(`https://api.spotify.com/v1/search?q=${name}&type=artist`)
    .map(parse)
    .chain(eitherToTask)
    .map(data => data.artists.items)
    .map(first)
    .chain(eitherToTask)
    .map(artist => artist.id)

// string -> Task
const getRelated = (id) =>
     httpGet(`https://api.spotify.com/v1/artists/${id}/related-artists`)
     .map(parse)
    .chain(eitherToTask)
     .map(result => result.artists)
     .map(data => data.map(a => a.name))

//string -> task
const main = (name1) => 
    getArtistId(name1)
    .chain(getRelated)
   

//TODO oauth
name.chain(main).fork(console.error, console.log);
