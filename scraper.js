const http = require('http');
const cheerio = require("cheerio");
const moment = require('moment');

async function scrapeAllData() {
    return new Promise ( (resolve, reject) => {
        http.get("http://loto.akroweb.fr/loto-historique-tirages/", function(html) {
            let dataString = '';
            html.setEncoding('utf8');
            html.on('data', function (chunk) {
              if(chunk != null && chunk != "") {
                  dataString += chunk;
              } 
            });
            html.on('end', function () {
              let results = [];
              const $ = cheerio.load(dataString);
              $('tr', dataString).each(function(index, element) {
                const tds = $(element).find('td');
                let tirage = {
                  date :  $(tds[2]).text(),
                  numbers : [$(tds[4]).text() , $(tds[5]).text(), $(tds[6]).text(), $(tds[7]).text(), $(tds[8]).text()],
                  chance : $(tds[9]).text()
                }
                const timestamp = moment(tirage.date, 'DD MMM YYYY').unix();
                tirage.date = timestamp;
                results.push(tirage);
              })
              resolve({data: results})
            });
          }).on('error', function(err) {
              console.log(err);
              reject(err);
          });
    })
}

async function scrapeLast() {
    return new Promise ( (resolve, reject) => {
        http.get("http://loto.akroweb.fr/loto-historique-tirages/", function(html) {
            let dataString = '';
            html.setEncoding('utf8');
            html.on('data', function (chunk) {
              if(chunk != null && chunk != "") {
                  dataString += chunk;
              } 
            });
            html.on('end', function () {
              const $ = cheerio.load(dataString);
              const firstElement = $('tr', dataString).first();
              const tds = firstElement.find('td');
              let tirage = {
                date :  $(tds[2]).text(),
                numbers : [$(tds[4]).text() , $(tds[5]).text(), $(tds[6]).text(), $(tds[7]).text(), $(tds[8]).text()],
                chance : $(tds[9]).text()
              };
              const timestamp = moment(tirage.date, 'DD MMM YYYY').unix();
              tirage.date = timestamp;
              resolve({data: tirage})
            });
          }).on('error', function(err) {
              console.log(err);
              reject(err);
          });
    })
}

module.exports = {
    scrapeAllData,
    scrapeLast
};