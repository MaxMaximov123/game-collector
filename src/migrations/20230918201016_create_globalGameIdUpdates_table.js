exports.up = function(knex) {
    return knex.schema.createTable('global_game_id_updates', function(table) {
      table.increments('id').primary();
      table.bigint('game_id');
      table.bigint('global_game_id');
      table.timestamp('time');

      table.index('id');
      table.index('game_id');
      table.index('global_game_id');
      table.index('time');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('global_game_id_updates');
};