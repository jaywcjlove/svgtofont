import React from 'react';
export const Demo = props => (
  <svg viewBox="0 0 20 20" width="12px" height="12px" {...props} className={`svgtofont ${props.className ? props.className : ''}`}><path d="M2 6C2 4.89543 2.89543 4 4 4H20C21.1046 4 22 4.89543 22 6V18C22 19.1046 21.1046 20 20 20H4C2.89543 20 2 19.1046 2 18V6ZM4 6H6V8H4V6ZM14 6H8V8H14V6ZM4 10H10V12H4V10ZM20 6H16V8H20V6Z" fillRule="evenodd" /></svg>
);
