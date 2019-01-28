import moment from 'moment'
import Promise from 'bluebird'
import retry from 'bluebird-retry'
import _ from 'lodash'

let schedulingLock = false
let sendingLock = false

const INTERVAL_BASE = 10 * 1000
const SCHEDULE_TO_OUTBOX_INTERVAL = INTERVAL_BASE * 1
const SEND_BROADCAST_INTERVAL = INTERVAL_BASE * 1

function _padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number
}

export default (bp, db) => {
  function scheduleToOutbox () {
    if (schedulingLock) {
      return
    }

    const inFiveMinutes = moment()
      .add(5, 'minutes')
      .toDate()
    const endOfDay = moment(inFiveMinutes)
      .add(14, 'hours')
      .toDate()

    const upcomingFixedTime = db.knex.date.isAfter(inFiveMinutes, 'ts')
    const upcomingVariableTime = db.knex.date.isAfter(endOfDay, 'date_time')

    schedulingLock = true

    db.getAllSchedules(upcomingFixedTime, upcomingVariableTime)
      .then(schedules => Promise.map(schedules, schedule => {
          
        })
      )
  }
  function sendBroadcasts () {}

  setInterval(scheduleToOutbox, SCHEDULE_TO_OUTBOX_INTERVAL)
  setInterval(sendBroadcasts, SEND_BROADCAST_INTERVAL)
}
