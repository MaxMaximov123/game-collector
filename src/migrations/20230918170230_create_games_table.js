exports.up = function(knex) {
    return knex.schema.createTable('games', function(table) {
      table.increments('id').primary();
      table.bigint('game_id').primary();
      table.bigint("league_id");
      table.boolean('is_live');
      table.bigint('team1_id');
      table.bigint('team2_id');
      table.string('sport_key');
      table.string('bookie_key');
      table.timestamp("live_from");
      table.timestamp("live_till");
      table.timestamp("unavailable_at");
      table.timestamp("updated_at");

      table.index('id');
      table.index('game_id');
      table.index('league_id');
      table.index('is_live');
      table.index('team1_id');
      table.index('team2_id');
      table.index('sport_key');
      table.index('bookie_key');
      table.index('live_from');
      table.timestamp("live_till");
      table.index('unavailable_at');
      table.index("updated_at");
      
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('games');
};
  