exports.up = function(knex) {
    return knex.schema.createTable('teams_names_updates', function(table) {
      table.increments('id').primary();
      table.bigint('game_id');
      table.string('team1_name');
      table.string('team2_name');
      table.timestamp('time');

      table.index('id');
      table.index('game_id');
      table.index('team1_name');
      table.index('team2_name');
      table.index('time');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('teams_names_updates');
};