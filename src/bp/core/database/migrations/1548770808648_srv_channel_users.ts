module.exports = {
  up: function (knex) {
    return knex.schema.alterTable('srv_channel_users', function (table) {
      table.string('botId')
      table.integer('timezone')
    })
  },

  down: function (knex) {
    return knex.schema.alterTable('srv_channel_users', function (table) {
      table.dropColumn('botId')
      table.dropColumn('timezone')
    })
  }
}
