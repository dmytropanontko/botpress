module.exports = {
  up: function (knex) {
    console.log('up')
    return knex.schema.alterTable('srv_channel_users', function (table) {
      console.log('mig run')
      table.string('botId')
    })
  },

  down: function (knex) {
    return knex.schema.alterTable('srv_channel_users', function (table) {
      table.dropColumn('botId')
    })
  }
}
