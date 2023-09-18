exports.up = function(knex) {
    return knex.schema.createTable('games', function(table) {
      table.increments('id').primary();
      table.bigint('game_id').primary();
      table.bigint('global_gameId');
      table.bigint("league_id");
      table.boolean('is_live');
      table.bigint('team1_id');
      table.bigint('team2_id');
      table.string('team1_name');
      table.string('team2_name');
      table.string('sport_key');
      table.string('bookie_key');
      table.timestamp('start_time');
      table.timestamp("liveFrom");
      table.timestamp("unavailableAt");

      table.index('id');
      table.index('game_id');
      table.index('global_gameId');
      table.index('league_id');
      table.index('is_live');
      table.index('team1_id');
      table.index('team2_id');
      table.index('team1_name');
      table.index('team2_name');
      table.index('sport_key');
      table.index('bookie_key');
      table.index('start_time');
      table.index('liveFrom');
      table.index('unavailableAt');
      
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('games');
};
  