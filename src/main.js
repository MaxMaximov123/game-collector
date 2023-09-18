const WebSocket = require('ws');
const cleanUpDeeply = require('./clean-up-deeply');
const merge = require('lodash/merge');
require('dotenv').config();




//_______________________ инициализация и функции бд _______________________________//

const knex = require('knex');
const config = require('./knexfile');

const db = knex(config.development);
db('pairs').select('*').then((r)=> {console.log(r)});


async function initDB(){
	const createGamesTable = async () => {
		try {
			await db.schema.createTable('games', function(table) {
			table.bigint('id').primary().unique();
			table.bigint('globalGameId');
			table.string('team1Id');
			table.string('team2Id');
			table.string('team1Name');
			table.string('team2Name');
			table.string('sportKey');
			table.string('bookieKey');
			table.bigint('startTime');
			});
			console.log('Games table created');
		} catch (error) {}
	};
		
	createGamesTable();

	const createOutcomesTable = async () => {
		try {
			await db.schema.createTable('outcomes', function(table) {
			table.bigint('id');
			table.string('path');
			table.float('odds');
			table.bigint('now');
			});
			console.log('Outcomes table created');
		} catch (error) {}
		};
		
	createOutcomesTable();

	const createScoresTable = async () => {
		try {
			await db.schema.createTable('scores', function(table) {
			table.bigint('id');
			table.string('path');
			table.integer('score');
			table.bigint('now');
			});
			console.log('Outcomes table created');
		} catch (error) {}
		};
		
	createScoresTable();

}

// initDB();

const addGame = async (data) => {
	try {
	  await db('games').insert(data);
	  console.log('game added');
	} catch (error) {
		// console.error(error);
	}
  };

const addScore = async (data) => {
	try {
		await db('scores').insert(data);
		console.log('score added');
	} catch (error) {
		// console.error(error);
	}
};

const addOucome = async (data) => {
	try {
		await db('outcomes').insert(data);
		console.log('outcome added');
	} catch (error) {
		// console.error(error);
	}
};

const updateGame = async (gameId, data) => {
	try {
		await db('games').where('id', gameId).update(data);
		console.log('update game');
	} catch (error) {
		console.error(error);
	}
};
//_________________________________________________________________//




// ---------------------------------------------------------------------- //

let globalGameList = null;
let globalGames = {};
let gameList = null;
let games = {};
// ---------------------------------------------------------------------- //

const socket = new WebSocket('wss://api.livesport.tools/v2?clientKey=mn8W5KhnuwBHdgSJNdUkZbXRC8EFPAfm');

socket.send = ((send) => {
	return function ({ id = null, type, data = null , relatedId}) {
		let message = JSON.stringify([type, data, id, relatedId]);
		// console.info(`>> ${message}`);
		return send.call(this, message);
	};
})(socket.send);

socket.on('open', () => {
	socket.nextRequestId = 1;
	console.info(`WebSocket: open.`);

	socket.send({
		id: socket.nextRequestId++,
		type: 'authorize',
		data: {
			secretKey: 'Y%7tRIA8hlgH8#nk60x&4W$CPJh^%x99',
		},
		relatedId: 1,
	});
});

socket.on('message', async (message) => {
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

		socket.send({
			id: socket.nextRequestId++,
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
				merge(game, data);
				cleanUpDeeply(game);
				if (data.startTime){
					try {
						await db('startTimeUpdates').insert({
							gameId: game.id,
							startTime: new Date(game.startTime),
							time: new Date()
						});
						console.log('update startTime');
					} catch (error) {console.error(error)}
				}
				if (data?.team1?.name || data?.team2?.name){
					try {
						await db('teamsNamesUpdates').insert({
							gameId: game.id,
							team1Name: game.team1?.name,
							team2Name: game.team2?.name,
							time: new Date()
						});
						console.log('update names');
					} catch (error) {console.error(error)}
				}
				if (data.globalGameId || data.startTime || data.liveFrom || data.liveTill || data.unavailableAt){
					await updateGame(gameId, {
						globalGameId: game.globalGameId,
						unavailableAt: game.unavailableAt,
						startTime: new Date(game.startTime).getTime(),
						liveFrom: new Date(game.liveFrom).getTime(),
						liveTill: new Date(game.liveTill).getTime(),
						lastUpdate: new Date().getTime(),
						leagueId: game?.league?.id,
					});
				}
			} else {
				game = games[gameId] = data;
				await addGame({
					id: game?.id,
					globalGameId: game?.globalGameId,
					isLive: game?.isLive,
					team1Id: game?.team1?.id,
					team2Id: game?.team2?.id,
					team1Name: game?.team1?.name,
					team2Name: game?.team2?.name,
					sportKey: game?.sport?.key,
					bookieKey: game?.bookie?.key,
					unavailableAt: game?.unavailableAt,
					startTime: new Date(game?.startTime).getTime(),
					liveFrom: new Date(game?.liveFrom).getTime(),
					liveTill: new Date(game?.liveTill).getTime(),
					lastUpdate: new Date().getTime(),
					leagueId: game?.league?.id
				});
			}
			
			if (data.outcomes?.result){
				const paths = getAllPathsOutcomes(data.outcomes.result);
				for (let path in paths){
					await addOucome({
						id: gameId,
						path: path,
						odds: paths[path],
						now: new Date().getTime(),
						isLive: game?.isLive,
					})
				}
			}

			if (data.scores?.result){
				const paths = getAllPathsOutcomes(data.scores.result, false);
				for (let path in paths){	
					await addScore({
						id: gameId,
						path: path,
						score: paths[path],
						now: new Date().getTime()
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

socket.on('error', (error) => {
	console.error(error);
});

socket.on('close', () => {
	console.info('WebSocket: closed.');
	process.exit(0);
});

// ---------------------------------------------------------------------- //

function syncGlobalGameSubscriptions() {
	for (let globalGameId of Object.keys(globalGameList || {}).map(Number)) {
		if (globalGames[globalGameId] === undefined) {
			globalGames[globalGameId] = null;

			socket.send({
				id: socket.nextRequestId++,
				type: `globalGame:${globalGameId}/subscribe`,
			});
		}
	}
}

function syncGameSubscriptions() {
	for (let gameId of Object.keys(gameList || {}).map(Number)) {
		if (games[gameId] === undefined) {
			games[gameId] = null;

			socket.send({
				id: socket.nextRequestId++,
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