import { TextStyle } from 'react-native';

export type svgtofontIconNames = 'adobe' | 'git' | 'stylelint'

export interface svgtofontProps extends Omit<TextStyle, 'fontFamily' | 'fontStyle' | 'fontWeight'> {
  iconName: svgtofontIconNames
}

export declare const svgtofont: (props: svgtofontProps) => JSX.Element;
