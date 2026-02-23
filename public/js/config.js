const _protocol = window.location.protocol;
const _wsProtocol = _protocol === 'https:' ? 'wss:' : 'ws:';
const _host = window.location.host;

const HTTP_BASE = `${_protocol}//${_host}`;
const API_BASE = `${HTTP_BASE}/chatApp`;
const WS_BASE = `${_wsProtocol}//${_host}`;
