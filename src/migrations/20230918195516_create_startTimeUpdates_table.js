exports.up = function(knex) {
    return knex.schema.createTable('start_time_updates', function(table) {
      table.increments('id').primary();
      table.bigint('game_id');
      table.timestamp('start_time');
      table.timestamp('time');

      table.index('id');
      table.index('game_id');
      table.index('start_time');
      table.index('time');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('start_time_updates');
};