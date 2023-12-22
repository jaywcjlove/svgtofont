import { TextStyle } from 'react-native';

export type svgtofontNames = 'Adobe'| 'Demo'| 'Git'| 'Left'| 'Stylelint'

export interface svgtofontProps extends Omit<TextStyle, 'fontFamily' | 'fontStyle' | 'fontWeight'> {
  name: svgtofontNames
}

export declare const svgtofont: (props: svgtofontProps) => JSX.Element;
