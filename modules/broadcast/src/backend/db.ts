import moment from 'moment'
import _ from 'lodash'

import { SDK } from '.'

function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number
}

export default class BroadcastDb {
  knex: any
  botId: string

  constructor(private bp: SDK, botId: string) {
    this.knex = bp.database
    this.botId = botId
  }

  initialize() {
    if (!this.knex) {
      throw new Error('you must initialize the database before')
    }

    return this.knex
      .createTableIfNotExists('broadcast_schedules', function (table) {
        table.increments('id').primary()
        table.string('botId')
        table.string('date_time')
        table.timestamp('ts')
        table.string('text')
        table.string('type')
        table.boolean('outboxed')
        table.boolean('errored')
        table.integer('total_count')
        table.integer('sent_count')
        table.timestamp('created_on')
        table.string('filters')
      })
      .then(() => {
        return this.knex.createTableIfNotExists('broadcast_outbox', function (table) {
          table
            .integer('scheduleId')
            .references('broadcast_schedules.id')
            .onDelete('CASCADE')
          table.string('userId').references('srv_channel_users.user_id')
          table.primary(['scheduleId', 'userId'])
          table.timestamp('ts')
        })
      })
  }

  addSchedule({ date, time, timezone, content, type, filters }) {
    const dateTime = date + ' ' + time
    let ts = undefined

    if (timezone) {
      ts = moment(new Date(dateTime + ' ' + timezone)).toDate()
    }

    const row = {
      botId: this.botId,
      date_time: dateTime,
      ts: ts ? this.knex.date.format(ts) : undefined,
      text: content,
      type: type,
      outboxed: false,
      errored: false,
      total_count: 0,
      sent_count: 0,
      created_on: this.knex.date.now(),
      filters: JSON.stringify(filters)
    }

    return this.knex('broadcast_schedules')
      .insert(row, 'id')
      .then()
      .get(0)
  }

  updateSchedule({ id, date, time, timezone, content, type, filters }) {
    const dateTime = date + ' ' + time
    let ts = undefined
    if (timezone) {
      ts = moment(new Date(dateTime + ' ' + timezone)).toDate()
    }

    const row = {
      date_time: dateTime,
      ts: ts ? this.knex.date.format(ts) : undefined,
      text: content,
      type: type,
      filters: JSON.stringify(filters)
    }

    return this.knex('broadcast_schedules')
      .where({
        id,
        outboxed: this.knex.bool.false()
      })
      .update(row)
      .then()
  }

  deleteSchedule(id) {
    return this.knex('broadcast_schedules')
      .where({ id })
      .delete()
      .then(() => {
        return this.knex('broadcast_outbox')
          .where({ scheduleId: id })
          .del()
          .then(() => true)
      })
  }

  listSchedules() {
    return this.knex('broadcast_schedules')
      .where({ botId: this.botId })
      .then()
  }

  getBroadcastSchedulesByTime(upcomingFixedTime, upcomingVariableTime) {
    return this.knex('broadcast_schedules')
      .where({
        botId: this.botId,
        outboxed: this.knex.bool.false()
      })
      .andWhere(function () {
        this.where(function () {
          this.whereNotNull('ts').andWhere(upcomingFixedTime)
        }).orWhere(function () {
          this.whereNull('ts').andWhere(upcomingVariableTime)
        })
      })
  }

  async getUsersTimezone() {
    // TODO: need add "timezone" to users
    const attrs = await this.knex('srv_channel_users')
      .select('attributes')

    const timezones = attrs.map(({ attributes: { timezone } }) => ({ timezone }))

    return timezones
  }

  setBroadcastOutbox(schedule, tz) {
    const initialTz = tz
    const sign = Number(tz) >= 0 ? '+' : '-'
    tz = padDigits(Math.abs(Number(tz)), 2)
    const relTime = moment(`${schedule['date_time']}${sign}${tz}`, 'YYYY-MM-DD HH:mmZ').toDate()
    const adjustedTime = this.knex.date.format(schedule['ts'] ? schedule['ts'] : relTime)

    const whereClause = _.isNil(initialTz) ? "where attributes -> 'timezone' IS NULL" : "where attributes -> 'timezone' = :initialTz"

    const sql = `insert into broadcast_outbox ("userId", "scheduleId", "ts")
      select userId, :scheduleId, :adjustedTime
      from (
        select user_id as userId
        from srv_channel_users
        ${whereClause}
      ) as q1`

    return this.knex
      .raw(sql, {
        scheduleId: schedule['id'],
        adjustedTime,
        initialTz
      })
      .then()
  }

  // TODO: check naming
  getOutboxCount(schedule) {
    // this.bp.users.get
    return this.knex('broadcast_outbox')
      .where({ scheduleId: schedule['id'] })
      .select(this.knex.raw('count(*) as count'))
      .then()
      .get(0)
  }

  updateTotalCount(schedule, count) {
    return this.knex('broadcast_schedules')
      .where({ id: schedule['id'] })
      .update({
        outboxed: this.knex.bool.true(),
        total_count: count
      })
  }

  getBroadcastOutbox(isPast) {
    return this.knex('broadcast_outbox')
      .where(isPast)
      .join('srv_channel_users', 'srv_channel_users.user_id', 'broadcast_outbox.userId')
      .join('broadcast_schedules', 'scheduleId', 'broadcast_schedules.id')
      .limit(1000)
      .select([
        'srv_channel_users.user_id as userId',
        'srv_channel_users.channel as platform',
        'broadcast_schedules.text as text',
        'broadcast_schedules.type as type',
        'broadcast_schedules.id as scheduleId',
        'broadcast_schedules.filters as filters',
        'broadcast_outbox.ts as sendTime',
        'broadcast_outbox.userId as scheduleUser'
      ])
  }

  deleteBroadcastOutbox(userId, scheduleId) {
    return this.knex('broadcast_outbox')
      .where({ userId, scheduleId })
      .delete()
  }

  deleteBroadcastOutboxById(scheduleId) {
    return this.knex('broadcast_outbox')
      .where({ scheduleId })
      .delete()
  }

  increaseBroadcastSentCount(id) {
    return this.knex('broadcast_schedules')
      .where({ id })
      .update({ sent_count: this.knex.raw('sent_count + 1') })
  }
}