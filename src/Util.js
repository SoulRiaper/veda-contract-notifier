import options from '../conf/options.js';

export function mkPath () {
  const [y, m, d] = new Date().toISOString().split('T')[0].split('-');
  return [, y, m, d].join('/');
}

export function timeout (ms = options.timeout) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function newUri (data) {
  return [{
    "data": data,
    "type": "Uri"
  }]
}

export function newBool (data) {
  return [{
    "data": data,
    "type": "Boolean"
  }]
}

export function newString (data) {
  return [{
    "data": data,
    "type": "String"
  }]
}