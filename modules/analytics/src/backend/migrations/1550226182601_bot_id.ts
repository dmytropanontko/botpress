module.exports = {
  up: knex => knex.schema.table('analytics_custom', table => {
    table.string('botId')
  }),
  down: knex => knex.schema.table('analytics_custom', table => {
    table.dropColumn('botId')
  })
}