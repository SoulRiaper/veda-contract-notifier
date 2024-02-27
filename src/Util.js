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