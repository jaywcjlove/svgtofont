import { Text } from 'react-native';

const icons = {"adobe":"","demo":"","git":"","left":"","stylelint":""};

export const svgtofont = ({iconName, ...rest}) => {
  return (<Text style={{fontFamily: 'svgtofont', fontSize: 16, color: '#000000', ...rest}}>
    {icons[iconName]}
  </Text>);
};
