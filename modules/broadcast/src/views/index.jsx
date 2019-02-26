//Errors

import React from 'react'
import ReactDOM from 'react-dom'

import {
  Nav,
  NavItem,
  Navbar,
  Button,
  Glyphicon,
  Panel,
  Table,
  Modal,
  Form,
  FormGroup,
  FormControl,
  InputGroup,
  Checkbox,
  Col,
  ControlLabel,
  ListGroupItem,
  Label
} from 'react-bootstrap'

import DatePicker from 'react-bootstrap-date-picker'
import TimePicker from 'react-bootstrap-time-picker'
import moment from 'moment'
import classnames from 'classnames'

import _ from 'lodash'

import DismissableAlert from './alert'
import BroadcastForm from './modal'

import style from './style.scss'

const convertHHmmToSeconds = time => {
  const HH = Number(time.split(':')[0])
  const mm = Number(time.split(':')[1]) / 60

  const seconds = (HH + mm) * 3600

  return seconds
}

export default class BroadcastModule extends React.Component {
  constructor(props) {
    super(props)

    // window.location = '#'
  }

  state = {
    loading: true,
    showModalForm: false
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentDidMount() {
    this.fetchAllBroadcasts()
    this.props.bp.events.on('broadcast.changed', this.fetchAllBroadcasts)
  }

  componentWillUnmount() {
    this.props.bp.events.off('broadcast.changed', this.fetchAllBroadcasts)
  }

  fetchAllBroadcasts = () => {
    this.setState({ loading: true })

    return this.getAxios()
      .get('/mod/broadcast/')
      .then(res => {
        this.setState({
          loading: false,
          broadcasts: _.orderBy(res.data, ['date', 'time'])
        })
      })
      .catch(err => {
        this.setState({ loading: false })

        console.error(err)
        this.props.bp.toast("Can't fetch broadcast list from the server.")
      })
  }

  closeModal = () => {
    this.setState({ showModalForm: false, error: null })
    return Promise.resolve(true)
  }

  handleRequestError = err => {
    if (err && err.response) {
      return this.setState({
        loading: false,
        error: err.response.data.message
      })
    }

    this.setState({
      loading: false,
      error: err ? err.message : 'An unknown error occured'
    })
  }

  handleRemoveBroadcast = id => {
    this.getAxios()
      .delete('/mod/broadcast/' + id)
      .then(this.fetchAllBroadcasts)
      .catch(this.handleRequestError)
  }

  handleCloseModalForm = () => this.setState({ showModalForm: false, broadcast: {} })

  handleOpenModalForm = (broadcast, id) => {
    if (!id) {
      id = null
    }

    if (!broadcast) {
      broadcast = {
        content: '',
        date: new Date().toISOString(),
        time: 0,
        progress: 0,
        userTimezone: true,
        filteringConditions: []
      }
    }

    this.setState({
      modifyBroadcast: !id ? false : true,
      showModalForm: true,

      broadcastId: id,
      broadcast: {
        content: broadcast.content,
        userTimezone: broadcast.userTimezone,
        date: broadcast.date,
        time: _.isString(broadcast.time) ? convertHHmmToSeconds(broadcast.time) : broadcast.time,
        filteringConditions: broadcast.filteringConditions,
        progress: broadcast.progress
      }
    })
  }

  renderTableHeader() {
    return (
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Content</th>
          <th>Filters</th>
          <th>Progress</th>
          <th>Action</th>
        </tr>
      </thead>
    )
  }

  renderBroadcasts(broadcasts) {
    const getDateFormatted = (time, date, userTimezone) => {
      const calendar = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm').calendar()
      return calendar + (userTimezone ? ' (users time)' : ' (your time)')
    }

    const formatProgress = (progress, outboxed, errored) => {
      let color = '#90a9f4'
      let text = (progress * 100).toFixed(2) + '%'
      if (progress === 0) {
        text = outboxed ? 'Processing' : 'Not started'
        color = outboxed ? '#90a9f4' : '#e4e4e4'
      }
      if (progress === 1) {
        text = 'Done'
        color = '#6ee681'
      }
      if (errored) {
        text = 'Error'
        color = '#eb6f6f'
      }
      return (
        <div>
          <div className={style.dot} style={{ backgroundColor: color }} />
          {text}
        </div>
      )
    }

    const renderModificationButton = value => {
      return (
        <button
          className={classnames('bp-button', style.smallButton)}
          onClick={() => this.handleOpenModalForm(value, value.id)}
        >
          <Glyphicon glyph="file" />
        </button>
      )
    }

    const renderFilteringCondition = filters => {
      if (_.isEmpty(filters)) {
        return 'No filter'
      }

      return <Label bsStyle="primary">{filters.length + ' filters'}</Label>
    }

    return _.mapValues(broadcasts, value => {
      return (
        <tr key={value.id}>
          <td style={{ width: '5%' }}>{value.id}</td>
          <td style={{ width: '22%' }} className={style.scheduledDate}>
            {getDateFormatted(value.time, value.date, value.userTimezone)}
          </td>
          <td style={{ maxWidth: '38%' }}>{value.content}</td>
          <td style={{ width: '7%' }}>{renderFilteringCondition(value.filteringConditions)}</td>
          <td style={{ width: '12%' }} className={style.progress}>
            {formatProgress(value.progress, value.outboxed, value.errored)}
          </td>
          <td style={{ width: '12%' }}>
            {!value.outboxed ? renderModificationButton(value) : null}
            <button
              className={classnames('bp-button', style.smallButton)}
              onClick={() => this.handleOpenModalForm(value)}
            >
              <Glyphicon glyph="copy" />
            </button>
            <button
              className={classnames('bp-button', style.smallButton)}
              onClick={() => this.handleRemoveBroadcast(value.id)}
            >
              <Glyphicon glyph="trash" />
            </button>
          </td>
        </tr>
      )
    })
  }

  renderTable(broadcasts) {
    return (
      <Table striped bordered condensed hover className={style.scheduledTable}>
        {this.renderTableHeader()}
        <tbody>{_.values(this.renderBroadcasts(broadcasts))}</tbody>
      </Table>
    )
  }

  renderEmptyMessage() {
    return (
      <div className={style.emptyMessage}>
        <h5>You have no broadcasts...</h5>
      </div>
    )
  }

  renderBroadcastsPanel(title, broadcasts) {
    return (
      <Panel>
        <Panel.Heading>{title}</Panel.Heading>
        <Panel.Body>{_.isEmpty(broadcasts) ? this.renderEmptyMessage() : this.renderTable(broadcasts)}</Panel.Body>
      </Panel>
    )
  }

  renderFilteringConditionElement = filter => {
    const removeHandler = () => this.handleRemoveFromFilteringConditions(filter)

    return (
      <ListGroupItem key={filter}>
        {filter}
        <Glyphicon className="pull-right" glyph="remove" onClick={removeHandler} />
      </ListGroupItem>
    )
  }

  renderActionButton() {
    const onClickAction = this.state.modifyBroadcast ? this.handleModifyBroadcast : this.handleAddBroadcast
    const buttonName = this.state.modifyBroadcast ? 'Modify' : 'Create'

    return (
      <button className="bp-button" action="" onClick={onClickAction}>
        {buttonName}
      </button>
    )
  }

  renderNavBar() {
    return (
      <Navbar fluid collapseOnSelect className={style.navbar}>
        <Navbar.Collapse>
          <Nav pullRight>
            <NavItem>
              <button
                className={classnames('pull-right', 'bp-button', style.smallButton)}
                onClick={() => this.handleOpenModalForm()}
              >
                <Glyphicon glyph="plus" />
              </button>
            </NavItem>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }

  renderErrorBox() {
    return <DismissableAlert />
  }

  render() {
    if (this.state.loading) {
      return null
    }
    const { showModalForm, broadcastId, broadcast } = this.state

    const allBroadcasts = _.assign([], this.state.broadcasts)
    const hasSomeError = _.some(allBroadcasts, ['errored', true])

    const upcomingBroadcasts = _.remove(allBroadcasts, function(value) {
      const datetime = moment(value.date + ' ' + value.time, 'YYYY-MM-DD HH:mm')
      return datetime.isBefore(moment().add(3, 'days')) && datetime.isAfter(moment())
    })

    const pastBroadcasts = _.remove(allBroadcasts, function(value) {
      const datetime = moment(value.date + ' ' + value.time, 'YYYY-MM-DD HH:mm')
      return datetime.isBefore(moment()) && datetime.isAfter(moment().subtract(3, 'days'))
    })

    return (
      <div>
        {this.renderNavBar()}
        <Panel className={style.mainPanel}>
          {hasSomeError ? this.renderErrorBox() : null}
          {this.renderBroadcastsPanel('Upcoming (next 3 days)', upcomingBroadcasts)}
          {this.renderBroadcastsPanel('Past (last 3 days)', pastBroadcasts)}
          {this.renderBroadcastsPanel('Other broadcasts', allBroadcasts)}
        </Panel>
        <BroadcastForm
          handleCloseModalForm={handleCloseModalForm}
          showModalForm={showModalForm}
          broadcastId={broadcastId}
          broadcast={broadcast}
        />
      </div>
    )
  }
}
