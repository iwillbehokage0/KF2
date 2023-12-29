/**
 * Imports cd chokepoints generated stats file into the spreadsheet
 * 
 * @param url             ->  URL containing raw JSON with match statistics
 * @param customOrder     ->  flag to indicate whether players should be sorted alphabetically or in custom order.
 *                            @see playerOrder constant for more information and list of players
 * 
 * @param zedTypeCapital  ->  flag to indicate whether zed type text should start with capital letter
 * 
 * @customfunction
 */
function ImportChokepointsStats(url, customOrder, zedTypeCapital) {
  let rawJson = UrlFetchApp.fetch(url);
  let jsonObject = JSON.parse(rawJson.getContentText());
  return parseChokepointsStatsFile(jsonObject, customOrder, zedTypeCapital)
}

/**
 * Test function for internal testing
 */
function testImportChokepointsStats() {
  let rawJson = UrlFetchApp.fetch("https://raw.githubusercontent.com/iwillbehokage0/KF2/main/Stats%20-%20Bober%20Gang/KF-InfernalRealm%20ts-mig-v3%2064mm%20harder.json");
  let jsonObject = JSON.parse(rawJson.getContentText());
  return parseChokepointsStatsFile(jsonObject, true, true);
}

/**
 * Constants for stat names that can be found in json file
 */
const stats = {
  mapName: "mapName",
  date: "date",
  spawnCycle: "spawnCycle",
  maxMonsters: "maxMonsters",
  cohortSize: "cohortSize",
  zedsType: "zedsType",
  alias: "alias",
  perk: "perk",
  damageDealt: "damageDealt",
  accuracy: "accuracy",
  headshotAccuracy: "headshotAccuracy",
  shotsFired: "shotsFired",
  shotsHit: "shotsHit",
  headshots: "headshots",
  largeKills: "largeKills",
  fleshpounds: "fleshpounds",
  scrakes: "scrakes",
  largesFrozen: "largesFrozen",
  husks: "husks",
  huskBackpacks: "huskBackpacks",
  huskNormal: "huskNormal",
  huskBackpacksRages: "huskBackpacksRages",
  damageTaken: "damageTaken",
  healsReceived: "healsReceived",
  healsGiven: "healsGiven",
  steamId: "steamId",
  doshEarned: "doshEarned"
}

/**
 * Array that defines order of main (global) stats
 */
const mainStatsOrder = [
  stats.mapName,
  stats.date,
  stats.spawnCycle,
  stats.maxMonsters,
  stats.cohortSize,
  stats.zedsType,
]

/**
 * Array that defines order of player stats
 */
const playerStatsOrder = [
  stats.alias,
  stats.perk,

  stats.damageDealt,
  stats.accuracy,
  stats.headshotAccuracy,

  stats.shotsFired,
  stats.shotsHit,
  stats.headshots,

  stats.largeKills,
  stats.fleshpounds,
  stats.scrakes,
  stats.largesFrozen,

  stats.husks,
  stats.huskBackpacks,
  stats.huskNormal,
  stats.huskBackpacksRages,

  stats.damageTaken,
  stats.healsReceived,
  stats.healsGiven,

  stats.steamId,
  stats.doshEarned
]

/**
 * Array that defines order of players
 * 
 * This should be customized per team and filled with desired names.
 * Please note that stat files that are imported must be edited to reflect these names as well.
 * 
 * If your team had roster changes and there are more 
 * than 6 different players listed throughtout all the records,
 * you just put them in order that you want here, 
 * and only needed players will be picked
 * with the order maintained correctly.
 */
const playerOrder = [
  "Player 1",
  "Player 2",
  "Player 3",
  "Player 4",
  "Player 5",
  "Player 6"
].map((item) => item.toLowerCase())

/**
 * Function used to parse stats file generated from CD Chokepoints edition
 *
 * @param jsonObject JSON object containing game data
 * @returns [][] Two dimensional array that will contain all the stats ready for display on the spreadsheet
 */
function parseChokepointsStatsFile(input, customOrder, zedTypeCapital) {
  // 1. Create array to store all the data
  let data = [];

  // 2. Fix duplication of stats between Medic & Commando in certain cases
  let cmIndex;
  let mdIndex;

  // 2.1 Find positions of those two perks and save their indices
  input["stats"].forEach((player, playerIndex) => {
    if (player[stats.perk] === 'Commando') {
      cmIndex = playerIndex;
    } else if (player[stats.perk] === 'Field Medic') {
      mdIndex = playerIndex;
    }
  })

  // 2.2 Fix duplication of: Larges, Fleshpounds, Scrakes
  if (
    input["stats"][cmIndex][stats.largeKills] === input["stats"][mdIndex][stats.largeKills]
    && input["stats"][cmIndex][stats.fleshpounds] === input["stats"][mdIndex][stats.fleshpounds]
    && input["stats"][cmIndex][stats.scrakes] === input["stats"][mdIndex][stats.scrakes]
  ) {
    input["stats"][mdIndex][stats.largeKills] = '0';
    input["stats"][mdIndex][stats.fleshpounds] = '0';
    input["stats"][mdIndex][stats.scrakes] = '0';
  }

  // 2.3 Fix duplication of: Husks, Husk B, Husk N, Husk R
  if (
    input["stats"][cmIndex][stats.husks] === input["stats"][mdIndex][stats.husks]
    && input["stats"][cmIndex][stats.huskBackpacks] === input["stats"][mdIndex][stats.huskBackpacks]
    && input["stats"][cmIndex][stats.huskNormal] === input["stats"][mdIndex][stats.huskNormal]
    && input["stats"][cmIndex][stats.huskBackpacksRages] === input["stats"][mdIndex][stats.huskBackpacksRages]
  ) {
    input["stats"][mdIndex][stats.husks] = '0';
    input["stats"][mdIndex][stats.huskBackpacks] = '0';
    input["stats"][mdIndex][stats.huskNormal] = '0';
    input["stats"][mdIndex][stats.huskBackpacksRages] = '0';
  }

  // 3. Parse actual data
  // Iterate through all the stats
  input["stats"].forEach((player, playerIndex) => {
    // Create new row for each player
    data[playerIndex] = [];

    // iterate over each player and collect data
    playerStatsOrder.forEach((playerStatName, playerStatIndex) => {
      // account for main stats that should be inserted in the first row
      let actualIndex = playerStatIndex + mainStatsOrder.length;
      let value = '';

      if (playerStatName === stats.damageDealt || playerStatName === stats.doshEarned) {
        value = Math.round(player[playerStatName] / 1000) + "k"
      } else if (playerStatName === stats.accuracy || playerStatName === stats.headshotAccuracy) {
        value = player[playerStatName] + "%"
      } else {
        value = player[playerStatName]
      }

      data[playerIndex][actualIndex] = value.toString();
    });
  });

  // 4. Sort player objects
  //    By default, we sort alphabetically.
  //    However, if customOrder parameter is true,
  //    We will sort in order specified in playerOrder constant.

  if (customOrder === true) {
    // This logic here extracts players from stats file and puts them in correct order.
    // This is also done this way to accomodate for roster changes and some spreadsheets
    // possibly having more than 6 different players mentioned.

    let order = []
    data.forEach((playerData) => {
      let playerName = playerData[6].toLowerCase()
      let indexOfPlayerName = playerOrder.indexOf(playerName)

      if (indexOfPlayerName != -1) {
        order[playerOrder.indexOf(playerData[6].toLowerCase())] = playerData[6].toLowerCase()
      }
    })

    // Little hack to remove empty items.
    order.filter((item) => item)

    if (order.length != 6) {
      throw new Error("Your player data is incomplete or the stat file is wrong. Please double check.")
    }

    let newData = []
    data.forEach((playerData) => newData[order.indexOf(playerData[6].toLowerCase())] = playerData)
    data = newData
  } else {
    data.sort((a, b) => a[6].toLowerCase() < b[6].toLowerCase() ? -1 : (a[6].toLowerCase() > b[6].toLowerCase()) ? 1 : 0)
  }

  // 5. Get a proper date format & put date below map name
  //    No fucking library considers this date valid,
  //    so I had to create this stupidity in order
  //    to get a good looking date format.

  let date = input[stats.date];

  let year = date.substring(0, 4);
  let month = date.substring(5, 7).replaceAll('-', '');
  let day = date.substring(7, 10).replaceAll('-', '');

  day.length < 2 ? day = '0' + day : null
  month.length < 2 ? month = '0' + month : null

  // Put date below the map name
  data[1][0] = day + '-' + month + '-' + year

  // 6. Add main stats to the first row
  mainStatsOrder.forEach((name, index) => data[0][index] = input[name])

  // 7. Make ZedType spelling start with capital letter if appropriate flag is set.
  if (zedTypeCapital == true) {
    data[0][5] = data[0][5].charAt(0).toUpperCase() + data[0][5].slice(1)
  }
  
  return data;
}
