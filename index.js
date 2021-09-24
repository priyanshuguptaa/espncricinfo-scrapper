const cheerio = require("cheerio");
const request = require("request-promise");
const xlsx = require("xlsx");
const chalk = require("chalk");

const base_URL = "https://www.espncricinfo.com";
const id = "ipl-2020-21-1210595";
const URL = `${base_URL}/series/${id}/match-results`;

const newWb = xlsx.utils.book_new();

console.log();
console.log(chalk.blue("Scraping data for IPL...."));
console.log(chalk.yellow("It may take few minutes "));
console.log();

/*****************Scrapping all links for the match************************************ */

(async () => {
  const response = await request(URL);

  const $ = cheerio.load(response);
  let links = $("a[data-hover=Scorecard]");
  links = [...links];
  let scorecardLinks = [];
  for (let i = 0; i < links.length; i++) {
    scorecardLinks.push($(links[i]).attr("href"));
  }

  /*******************************Scrapping from scorecardLinks Array***************************************/

  for (let i = 0; i < scorecardLinks.length; i++) {
    await scrapeScoreCard(scorecardLinks[i]);
  }

  console.log(chalk.green("Scraping completed!!"));
})();

/********** For Testing ****************************************************** */

// (async () => {
//   await scrapeScoreCard(
//     "/series/ipl-2020-21-1210595/delhi-capitals-vs-mumbai-indians-final-1237181/full-scorecard"
//   );
// })();

/******************************************************************************* */

async function scrapeScoreCard(scrLink) {
  const scrURL = `${base_URL}${scrLink}`;
  const scrResponse = await request(scrURL);

  let matchid = scrLink.split("/")[3].split("-");
  matchid = matchid[matchid.length - 1];

  await scrapeBatsman(scrResponse, matchid);
  await scrapeBowler(scrResponse, matchid);
}

/********************Scraping Batsman Data ************************************* */

async function scrapeBatsman(scrResponse, matchid) {
  let $ = cheerio.load(scrResponse);

  let batsman = $(".table.batsman");

  for (let i = 0; i < batsman.length; i++) {
    $ = cheerio.load(batsman[i]);

    let trow = $("tr");
    trow = [...trow];

    let data = [];

    trow.forEach((tr) => {
      let alltd = $(tr).find("td");
      let isvalid = $(alltd[0]).hasClass("batsman-cell");
      if (isvalid) {
        let btname = $(alltd[0]).text();
        let text = $(alltd[1]).text();
        let r = $(alltd[2]).text();
        let b = $(alltd[3]).text();
        let four = $(alltd[5]).text();
        let six = $(alltd[6]).text();
        let sr = $(alltd[7]).text();

        data.push({
          Batting: btname,
          "": text,
          R: r,
          B: b,
          "4s": four,
          "6s": six,
          SR: sr,
        });
      }
    });

    // Scraping Extras Rows

    let extras = $(".extras");
    let extrastd = $(extras).find("td");

    data.push({
      Batting: "Extras",
      "": $(extrastd[1]).text(),
      R: $(extrastd[2]).text(),
      B: "",
      "4s": "",
      "6s": "",
      SR: "",
    });

    // Scrapping Total Rows

    let total = $(".total");
    let totaltd = $(total).find("td");

    data.push({
      Batting: "TOTAL",
      "": $(totaltd[1]).text(),
      R: $(totaltd[2]).text(),
      B: "",
      "4s": "",
      "6s": "",
      SR: "",
    });

    // console.table(data);

    /*******************Inserting Data into Excel sheet ****************************************/

    let newWs = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(newWb, newWs, `${matchid}-${i + 1}-Batsman`);
    xlsx.writeFile(newWb, "IPL.xlsx");
  }
}

/*********************************************************************************************** */

/***************Scrapping Bowler Data *************************************************************/

async function scrapeBowler(scrResponse, matchid) {
  let $ = cheerio.load(scrResponse);
  let bowler = $(".table.bowler");

  for (let i = 0; i < bowler.length; i++) {
    $ = cheerio.load(bowler[i]);

    let trow = $("tr");
    trow = [...trow];

    let data = [];

    trow.forEach((tr) => {
      let alltd = $(tr).find("td");
      let isvalid = alltd.length > 1 ? true : false;

      if (isvalid) {
        let bwlname = $(alltd[0]).text();
        let o = $(alltd[1]).text();
        let m = $(alltd[2]).text();
        let r = $(alltd[3]).text();
        let w = $(alltd[4]).text();
        let econ = $(alltd[5]).text();
        let zeros = $(alltd[6]).text();
        let fours = $(alltd[7]).text();
        let sixs = $(alltd[8]).text();
        let wd = $(alltd[9]).text();
        let nb = $(alltd[10]).text();

        data.push({
          Bowling: bwlname,
          O: o,
          M: m,
          R: r,
          W: w,
          ECON: econ,
          "0s": zeros,
          "4s": fours,
          "6s": sixs,
          WD: wd,
          NB: nb,
        });
      }
    });

    // console.table(data);

    /*******************Inserting Data into Excel sheet ****************************************/
    let newWs = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(newWb, newWs, `${matchid}-${i + 1}-Bowler`);
    xlsx.writeFile(newWb, "IPL.xlsx");
  }
}
