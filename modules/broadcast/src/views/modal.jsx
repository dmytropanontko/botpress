import { Component } from 'react'
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

import style from './style.scss'

export default class BroadcastForm extends Component {
  state = {
    broadcast: {}
  }

  shouldComponentUpdate(nextProps) {
    if (!nextProps.showModalForm) {
      return false
    }

    return true
  }

  componentDidMount() {
    console.log('componentDidMount modal')
  }

  getAxios() {
    return this.props.bp.axios
  }

  handleContentChange = element => {
    const newBroadcast = this.state.broadcast
    newBroadcast.content = element.id
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleDateChange = value => {
    const newBroadcast = this.state.broadcast
    newBroadcast.date = value
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleTimeChange = value => {
    const newBroadcast = this.state.broadcast
    newBroadcast.time = value

    this.setState({
      broadcast: newBroadcast
    })
  }

  handleUserTimezoneChange = () => {
    const newBroadcast = this.state.broadcast
    newBroadcast.userTimezone = !newBroadcast.userTimezone
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleAddToFilteringConditions = () => {
    const input = ReactDOM.findDOMNode(this.filterInput)
    if (input && input.value !== '') {
      const newBroadcast = this.state.broadcast
      newBroadcast.filteringConditions = _.concat(newBroadcast.filteringConditions, input.value)

      this.setState({
        broadcast: newBroadcast
      })
      input.value = ''
    }
  }

  handleRemoveFromFilteringConditions = filter => {
    const newBroadcast = this.state.broadcast
    newBroadcast.filteringConditions = _.without(newBroadcast.filteringConditions, filter)

    this.setState({
      broadcast: newBroadcast
    })
  }

  renderFormContent() {
    const pickContent = () => window.botpress.pickContent({}, this.handleContentChange)

    return (
      <FormGroup controlId="formContent">
        <Col componentClass={ControlLabel} sm={2}>
          Content
        </Col>
        <Col sm={10}>
          <InputGroup>
            <InputGroup.Button>
              <Button onClick={pickContent}>Pick Content</Button>
            </InputGroup.Button>
            <FormControl type="text" readOnly value={this.state.broadcast.content} /> {/* TODO */}
          </InputGroup>
        </Col>
      </FormGroup>
    )
  }

  renderFormDate() {
    const getISODate = date => {
      if (date) {
        return new Date(date).toISOString()
      }
      return new Date().toISOString()
    }

    return (
      <FormGroup controlId="formDate">
        <Col componentClass={ControlLabel} sm={2}>
          Date
        </Col>
        <Col sm={10}>
          <DatePicker value={getISODate(this.state.broadcast.date)} onChange={this.handleDateChange} />
          {/* TODO: state and func */}
        </Col>
      </FormGroup>
    )
  }

  renderFormTime() {
    return (
      <FormGroup controlId="formTime">
        <Col componentClass={ControlLabel} sm={2}>
          Time
        </Col>
        <Col sm={10}>
          {/* TODO: state */}
          <TimePicker step={15} onChange={this.handleTimeChange} value={this.state.broadcast.time} />
        </Col>
      </FormGroup>
    )
  }

  renderFormUserTimezone() {
    return (
      <FormGroup controlId="formUserTimezone">
        <Col componentClass={ControlLabel} sm={2}>
          User time zone
        </Col>
        <Col sm={10}>
          <Checkbox
            name="userTimezone"
            checked={this.state.broadcast.userTimezone}
            onChange={this.handleUserTimezoneChange}
          />
        </Col>
      </FormGroup>
    )
  }

  renderForm() {
    return (
      <Form horizontal>
        {this.renderFormContent()}
        {this.renderFormDate()}
        {this.renderFormTime()}
        {this.renderFormUserTimezone()}
        {this.renderFiltering()}
      </Form>
    )
  }

  renderFiltering() {
    let filteringConditionElements = <ControlLabel>No filtering condition</ControlLabel>

    const filters = this.state.broadcast.filteringConditions
    if (filters && !_.isEmpty(filters)) {
      filteringConditionElements = this.state.broadcast.filteringConditions.map(this.renderFilteringConditionElement)
    }

    return (
      <div>
        <FormGroup controlId="filtering">
          <Col componentClass={ControlLabel} sm={2}>
            Filtering conditions
          </Col>
          <Col sm={10}>{filteringConditionElements}</Col>
        </FormGroup>
        <FormGroup>
          <Col smOffset={2} sm={10}>
            <ControlLabel>Add a new filter:</ControlLabel>
            <FormControl ref={input => (this.filterInput = input)} type="text" />
            <Button className="bp-button" onClick={() => this.handleAddToFilteringConditions()}>
              Add
            </Button>
          </Col>
        </FormGroup>
      </div>
    )
  }

  extractBroadcastFromModal() {
    const { content, date, userTimezone, time, filteringConditions } = this.state.broadcast

    if (!content) {
      this.props.bp.toast.error('Content field is required.')

      return
    }

    return {
      date: moment(date).format('YYYY-MM-DD'),
      time: moment()
        .startOf('day')
        .add(time, 'seconds')
        .format('HH:mm'),
      content: content,
      timezone: userTimezone ? null : moment().format('Z'),
      filters: filteringConditions
    }
  }

  handleModifyBroadcast = () => {
    const broadcast = this.extractBroadcastFromModal()
    const { broadcastId: id } = this.state

    if (!broadcast) {
      return
    }

    this.getAxios()
      .post('/mod/broadcast/', { id, ...broadcast })
      .then(this.fetchAllBroadcasts)
      .then(this.closeModal)
      .catch(this.handleRequestError)
  }

  handleAddBroadcast = () => {
    const broadcast = this.extractBroadcastFromModal()

    if (!broadcast) {
      return
    }

    this.getAxios()
      .put(`/mod/broadcast/`, broadcast)
      .then(this.fetchAllBroadcasts)
      .then(this.closeModal)
      .catch(this.handleRequestError)
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

  render() {
    return (
      <Modal
        container={document.getElementById('app')}
        show={this.props.showModalForm}
        onHide={this.props.handleCloseModalForm}
      >
        <Modal.Header closeButton>
          <Modal.Title>{this.state.modifyBroadcast ? 'Modify broadcast...' : 'Create new broadcast...'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{this.renderForm()}</Modal.Body>
        <Modal.Footer>
          {this.renderActionButton()}
          <button className="bp-button bp-button-danger" onClick={this.handleCloseModalForm}>
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    )
  }
}
