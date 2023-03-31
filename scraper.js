const http = require('http');
const cheerio = require("cheerio");
const moment = require('moment');
moment.locale('fr');

async function scrapeAllData() {
  return new Promise((resolve, reject) => {
    http.get("http://loto.akroweb.fr/loto-historique-tirages/", function (html) {
      let dataString = '';
      html.setEncoding('utf8');
      html.on('data', function (chunk) {
        if (chunk != null && chunk != "") {
          dataString += chunk;
        }
      });
      html.on('end', function () {
        let results = [];
        const $ = cheerio.load(dataString);
        $('tr', dataString).each(function (index, element) {
          const tds = $(element).find('td');
          let tirage = {
            date: $(tds[2]).text(),
            numbers: [$(tds[4]).text(), $(tds[5]).text(), $(tds[6]).text(), $(tds[7]).text(), $(tds[8]).text()],
            chance: $(tds[9]).text()
          }
          // modifier les mois avec accent pour éviter un null
          // fevrier => février
          tirage.date = replaceMonth(tirage.date);
          // console.log(tirage.date)

          const timestamp = moment(tirage.date, 'DD MMMM YYYY').unix();
          tirage.date = timestamp;
          // console.log(tirage.date)
          results.push(tirage);
        })
        resolve({ data: results })
      });
    }).on('error', function (err) {
      console.log(err);
      reject(err);
    });
  })
}

async function scrapeLast() {
  return new Promise((resolve, reject) => {
    http.get("http://loto.akroweb.fr/loto-historique-tirages/", function (html) {
      let dataString = '';
      html.setEncoding('utf8');
      html.on('data', function (chunk) {
        if (chunk != null && chunk != "") {
          dataString += chunk;
        }
      });
      html.on('end', function () {
        const $ = cheerio.load(dataString);
        const firstElement = $('tr', dataString).first();
        const tds = firstElement.find('td');
        let tirage = {
          date: $(tds[2]).text(),
          numbers: [$(tds[4]).text(), $(tds[5]).text(), $(tds[6]).text(), $(tds[7]).text(), $(tds[8]).text()],
          chance: $(tds[9]).text()
        };
        tirage.date = replaceMonth(tirage.date);
        const timestamp = moment(tirage.date, 'DD MMMM YYYY').unix();
        tirage.date = timestamp;
        resolve({ data: tirage })
      });
    }).on('error', function (err) {
      console.log(err);
      reject(err);
    });
  })
}

function replaceMonth(date) {
  if (date.includes('fevrier') || date.includes('aout') || date.includes('decembre')) {
    if (date.includes('fevrier')) {
      return date.replace('fevrier', 'février');
    } else if (date.includes('aout')) {
      return date.replace('aout', 'août');
    } else {
      return date.replace('decembre', 'décembre');
    }
  } else {
    return date;
  }
}

module.exports = {
  scrapeAllData,
  scrapeLast
};