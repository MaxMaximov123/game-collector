const knex = require('knex');
const knexStringcase = require('knex-stringcase');
const { attachPaginate } = require('knex-paginate');
attachPaginate();
const pg = require('pg');
const knexConfig = require('./knexfile');

pg.types.setTypeParser(pg.types.builtins.INT8, (value) => {
	return parseInt(value);
});

pg.types.setTypeParser(pg.types.builtins.FLOAT8, (value) => {
	return parseFloat(value);
});

pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => {
	return parseFloat(value);
});

const db = knex(knexStringcase(knexConfig));
const database = db;

function useTransaction(transaction = null) {
	let db = database;
	db = transaction || db;
	return db;
};

function buildFromValuesWhereReplacement(items) {
	if (!Array.isArray(items)) {
		throw new Error(`Items should be an array.`);
	}

	if (items.length === 0) {
		throw new Error(`Items can't be empty.`);
	}

	let string = ` = require((values `;

	string += items
		.map((item) => {
			let string = '(';

			string += Object.values(item)
				.map((value) => db.raw('?', value).toQuery())
				.join(', ');

			string += ')';
			return string;
		})
		.join(', ');


	string += `) AS "values" (`;

	string += Object.keys(items[0])
		.map((columnName) => db.raw('??', columnName).toQuery())
		.join(', ');

	string += `) where `;
	return string;
};

module.exports = { db };
