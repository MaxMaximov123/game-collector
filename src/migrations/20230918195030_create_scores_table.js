exports.up = function(knex) {
  return knex.schema.createTable('scores', function(table) {
    table.increments('id').primary();
    table.bigint('game_id');
    table.string('path');
    table.float('val');
    table.timestamp('time');

    table.index('id');
    table.index('game_id');
    table.index('path');
    table.index('val');
    table.index('time');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scores');
};
