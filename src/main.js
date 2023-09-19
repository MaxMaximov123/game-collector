import WebsocketInput from 'ws';
import cleanUpDeeply from './clean-up-deeply.js';
import merge from 'lodash/merge.js';
import dotenv from 'dotenv';
dotenv.config();




//_______________________ инициализация и функции бд _______________________________//

import knex from 'knex';
import config from './knexfile.js';
import { db } from './database.js';

//_________________________________________________________________//




// ---------------------------------------------------------------------- //

let globalGameList = null;
let globalGames = {};
let gameList = null;
let games = {};

let gamesTransactions = [];
let globalGameIdTransactions = [];
let startTimeTransactions = [];
let teamsNamesTransactions = [];
let scoresTransactions = [];
let outcomesTransactions = [];

async function makeAllInserts(){
	if (gamesTransactions.length > 0){
		let gamesTransactions_ = gamesTransactions.slice();
		gamesTransactions.length = 0;
		await db.transaction(async (trx) => {
			await trx('games').insert(gamesTransactions_).onConflict().ignore();
		});
		console.log('add games', gamesTransactions_.length);
		gamesTransactions_.length = 0;
	}

	if (globalGameIdTransactions.length > 0){
		let globalGameIdTransactions_ = globalGameIdTransactions.slice();
		globalGameIdTransactions.length = 0;
		await db.transaction(async (trx) => {
			await trx('global_game_id_updates').insert(globalGameIdTransactions_).onConflict().ignore();
		});
		console.log('add globalGameIds', globalGameIdTransactions_.length);
		globalGameIdTransactions_.length = 0;
	}

	if (startTimeTransactions.length > 0){
		let startTimeTransactions_ = startTimeTransactions.slice();
		startTimeTransactions.length = 0;
		await db.transaction(async (trx) => {
			await trx('start_time_updates').insert(startTimeTransactions_).onConflict().ignore();
		});
		console.log('add startTimeUpdates', startTimeTransactions_.length);
		startTimeTransactions_.length = 0;
	}

	if (teamsNamesTransactions.length > 0){
		let teamsNamesTransactions_ = teamsNamesTransactions.slice();
		teamsNamesTransactions.length = 0;
		await db.transaction(async (trx) => {
			await trx('teams_names_updates').insert(teamsNamesTransactions_).onConflict().ignore();
		});
		console.log('add teamsNamesUpdates', teamsNamesTransactions_.length);
		teamsNamesTransactions_.length = 0;
	}

	if (scoresTransactions.length > 0){
		let scoresTransactions_ = scoresTransactions.slice();
		scoresTransactions.length = 0;
		await db.transaction(async (trx) => {
			await trx('scores').insert(scoresTransactions_).onConflict().ignore();
		});
		console.log('add scores', scoresTransactions_.length);
		scoresTransactions_.length = 0;
	}

	if (outcomesTransactions.length > 0){
		let outcomesTransactions_ = outcomesTransactions.slice();
		outcomesTransactions.length = 0;
		console.log(outcomesTransactions_);
		await db.transaction(async (trx) => {
			await trx('outcomes').insert(outcomesTransactions_).onConflict().ignore();
		});
		console.log('add outcomes', outcomesTransactions_.length);
		outcomesTransactions_.length = 0;
	}
}

setInterval(makeAllInserts, 1000);
// ---------------------------------------------------------------------- //

const socketInput = new WebsocketInput('wss://api.livesport.tools/v2?clientKey=mn8W5KhnuwBHdgSJNdUkZbXRC8EFPAfm');

socketInput.send = ((send) => {
	return function ({ id = null, type, data = null , relatedId}) {
		let message = JSON.stringify([type, data, id, relatedId]);
		// console.info(`>> ${message}`);
		return send.call(this, message);
	};
})(socketInput.send);

socketInput.on('open', () => {
	socketInput.nextRequestId = 1;
	console.info(`WebsocketInput: open.`);

	socketInput.send({
		id: socketInput.nextRequestId++,
		type: 'authorize',
		data: {
			secretKey: 'Y%7tRIA8hlgH8#nk60x&4W$CPJh^%x99',
		},
		relatedId: 1,
	});
});

socketInput.on('message', async (message) => {
	message = message.toString();
	// console.info(`<<`, JSON.parse(message));
	let type, data, id, relatedId, error;

	try {
		[type, data, id, relatedId, error] = JSON.parse(message);
	} catch (error) {
		console.error(error);
		return;
	}

	if (error) {
		console.error(error);
		return;
	}

	let typeMatch = null;

	if (type === 'authorized') {
		// Subscribing to GameList
		socketInput.send({
			id: socketInput.nextRequestId++,
			type: 'gameList/subscribe',
			data: {},
		});
		return;
	}

	// GameList
	// ----------------------------------------------------------------------

	if (type === 'gameList/subscribed') {
		// console.info(`Subscribed to GameList.`);
		return;
	}

	if (typeMatch = type.match(/^gameList\/(created|updated|deleted)$/)) {
		if (data === '\x00') {
			gameList = null;
		} else {
			if (gameList) {
				merge(gameList, data);
				cleanUpDeeply(gameList);
			} else {
				gameList = data;
			}
		}

		syncGameSubscriptions();
		return;
	}

	if (typeMatch = type.match(/^game:([0-9]+)\/(created|updated|deleted)/)) {
		let gameId = Number(typeMatch[1]);

		if (data === '\x00') {
			delete games[gameId];
		} else {
			let game = games[gameId] || null;

			if (game) {
				// Game already exist
				// merge(game, data);
				// cleanUpDeeply(game);
				// if (data.startTime){
				// 	try {
				// 		await db('startTimeUpdates').insert({
				// 			gameId: game.id,
				// 			startTime: new Date(game.startTime),
				// 			time: new Date()
				// 		});
				// 		console.log('update startTime');
				// 	} catch (error) {console.error(error)}
				// }
				// if (data?.team1?.name || data?.team2?.name){
				// 	try {
				// 		await db('teamsNamesUpdates').insert({
				// 			gameId: game.id,
				// 			team1Name: game.team1?.name,
				// 			team2Name: game.team2?.name,
				// 			time: new Date()
				// 		});
				// 		console.log('update names');
				// 	} catch (error) {console.error(error)}
				// }
				// if (data.globalGameId || data.startTime || data.liveFrom || data.liveTill || data.unavailableAt){
				// 	await updateGame(gameId, {
				// 		globalGameId: game.globalGameId,
				// 		unavailableAt: game.unavailableAt,
				// 		startTime: new Date(game.startTime).getTime(),
				// 		liveFrom: new Date(game.liveFrom).getTime(),
				// 		liveTill: new Date(game.liveTill).getTime(),
				// 		lastUpdate: new Date().getTime(),
				// 		leagueId: game?.league?.id,
				// 	});
				// }
			} else {
				game = games[gameId] = data;
				gamesTransactions.push({
					gameId: game?.id,
					leagueId: game?.league?.id,
					isLive: game?.isLive,
					team1Id: game?.team1?.id,
					team2Id: game?.team2?.id,
					sportKey: game?.sport?.key,
					bookieKey: game?.bookie?.key,
					unavailableAt: game?.unavailableAt,
					liveFrom: new Date(game?.liveFrom),
					liveTill: new Date(game?.liveTill),
					updated_at: new Date(),
					
				});
			}
			
			if (data.outcomes?.result){
				const paths = getAllPathsOutcomes(data.outcomes.result);
				for (let path in paths){
					outcomesTransactions.push({
						gameId: gameId,
						path: path,
						val: paths[path],
						time: new Date(),
						isLive: game?.isLive,
					})
				}
			}

			if (data.scores?.result){
				const paths = getAllPathsOutcomes(data.scores.result, false);
				for (let path in paths){	
					scoresTransactions.push({
						gameId: gameId,
						path: path,
						val: paths[path],
						time: new Date()
					})
				}
			}
		}
	}

	// GlobalGameList
	// ----------------------------------------------------------------------

	if (type === 'globalGameList/subscribed') {
		console.info(`Successfuly subscribed to GlobalGameList.`);
		return;
	}

	if (typeMatch = type.match(/^globalGameList\/(created|updated|deleted)$/)) {
		if (data === '\x00') {
			globalGameList = null;
		} else {
			if (globalGameList) {
				merge(globalGameList, data);
				cleanUpDeeply(globalGameList);
			} else {
				globalGameList = data;
			}
		}

		syncGlobalGameSubscriptions();
		return;
	}

	if (typeMatch = type.match(/^globalGame:([0-9]+)\/(created|updated|deleted)/)) {
		let globalGameId = Number(typeMatch[1]);

		if (data === '\x00') {
			delete globalGames[globalGameId];
		} else {
			let globalGame = globalGames[globalGameId] || null;

			if (globalGame) {
				merge(globalGame, data);
				cleanUpDeeply(globalGame);
			} else {
				globalGame = globalGames[globalGameId] = data;
			}
		}
	}
});

socketInput.on('error', (error) => {
	console.error(error);
});

socketInput.on('close', () => {
	console.info('WebsocketInput: closed.');
	process.exit(0);
});

// ---------------------------------------------------------------------- //

function syncGlobalGameSubscriptions() {
	for (let globalGameId of Object.keys(globalGameList || {}).map(Number)) {
		if (globalGames[globalGameId] === undefined) {
			globalGames[globalGameId] = null;

			socketInput.send({
				id: socketInput.nextRequestId++,
				type: `globalGame:${globalGameId}/subscribe`,
			});
		}
	}
}

function syncGameSubscriptions() {
	for (let gameId of Object.keys(gameList || {}).map(Number)) {
		if (games[gameId] === undefined) {
			games[gameId] = null;

			socketInput.send({
				id: socketInput.nextRequestId++,
				type: `game:${gameId}/subscribe`,
			});
		}
	}
}


function getAllPathsOutcomes(outcomes, type=true){
	const results = {}

	function traverseObject(currentPath, object) {
		for (const key in object) {
			const newPath = currentPath ? `${currentPath};${key}` : key;
			if (typeof object[key] === 'object' && key !== 'odds') {
				traverseObject(newPath, object[key]);
			} else {
				if (type){
					if (newPath.includes('odds') && object[key] !== '\x00') results[newPath.slice(0, newPath.length - 5)] = object[key];
				} else {
					results[newPath] = object[key] === '\x00' ? null : object[key];
				}
				
			}
		}
	}

	traverseObject('', outcomes);
	return results;
}