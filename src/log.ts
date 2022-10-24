export class Log {
  _disabled?:boolean;
  constructor(disabled?: boolean) {
    this.disabled = disabled || false
  }
  get disabled () {
    return this._disabled;
  }
  set disabled(val: boolean) {
    this._disabled = val;
  }
  log = (message?: any, ...optionalParams: any[]) => {
    if (this.disabled) return () => {}
    return console.log(message, ...optionalParams)
  }
  error = (message?: any, ...optionalParams: any[]) => {
    if (this.disabled) return () => {}
    return console.error(message, ...optionalParams)
  }
}

export const log = new Log();