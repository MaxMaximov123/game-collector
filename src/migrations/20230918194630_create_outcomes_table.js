exports.up = function(knex) {
  return knex.schema.createTable('outcomes', function(table) {
    table.increments('id').primary();
    table.bigint('game_id');
    table.string('path');
    table.float('val');
    table.boolean('is_live');
    table.timestamp('time');

    table.index('id');
    table.index('game_id');
    table.index('path');
    table.index('val');
    table.index('is_live');
    table.index('time');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('outcomes');
};
